import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { ProductMatchingService } from './product-matching.service';

@Injectable()
export class SkinAnalysisService {
  private readonly logger = new Logger(SkinAnalysisService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private productMatchingService: ProductMatchingService,
  ) {}

  async processScan(userId: string, base64Image: string): Promise<any> {
    this.logger.log(`Processing skin scan for user ${userId}`);
    
    // Call AI Service
    const analysis = await this.aiService.analyzeSkinImage(base64Image);

    // Parse scores to integers to ensure database compatibility, as AI might return strings
    const parsedOverallScore = parseInt(String(analysis.overallScore), 10) || 0;
    const parsedMetrics = (analysis.metrics || []).map((m: any) => ({
      ...m,
      score: parseInt(String(m.score), 10) || 0,
    }));

    // Save to DB
    const scan = await this.prisma.skinScan.create({
      data: {
        userId,
        overallScore: parsedOverallScore,
        summary: analysis.summary || null,
        metrics: parsedMetrics,
        actives: analysis.actives || [],
        concerns: analysis.concerns || null,
      },
    });

    return scan;
  }

  async getHistory(userId: string): Promise<any> {
    return this.prisma.skinScan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLatestRecommendations(userId: string): Promise<any> {
    const latestScan = await this.prisma.skinScan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        recommendations: true
      }
    });

    if (!latestScan) {
      throw new NotFoundException('No skin scan found for user');
    }

    return latestScan.recommendations;
  }

  async generateRecommendations(userId: string): Promise<any> {
    const latestScan = await this.prisma.skinScan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestScan) {
      throw new NotFoundException('No skin scan found to generate recommendations for');
    }

    const userProfile = await this.prisma.userProfile.findUnique({
      where: { userId }
    });

    // 1. Ask AI for recommendations based on skin scan & user profile
    const aiRecommendations = await this.aiService.generateSkinRecommendations({
      profile: userProfile,
      skinAnalysis: latestScan
    });

    // 2. Clear out old recommendations for this scan
    await this.prisma.skinRecommendation.deleteMany({
      where: { skinAnalysisId: latestScan.id }
    });

    const createdRecommendations = [];

    // Save Skincare recommendations
    const skincareList = aiRecommendations.recommendations || aiRecommendations.skincare || aiRecommendations.products || [];
    if (Array.isArray(skincareList)) {
      for (const rec of skincareList) {
        const title = rec.name || rec.title || rec.category || 'Product Recommendation';
        const created = await this.prisma.skinRecommendation.create({
          data: {
            skinAnalysisId: latestScan.id,
            category: 'SKINCARE',
            recommendationType: rec.category || rec.type || 'PRODUCT',
            title: title,
            description: rec.description || rec.name || title,
            reason: rec.reason || 'Recommended based on your skin profile',
            priority: rec.priority || 'NORMAL',
            instructions: JSON.stringify({
              name: title,
              brand: rec.brand || 'Veyra Recommendation',
              currency: '',
              price: rec.price || 'N/A',
              imageUrl: (() => {
                const typeUpper = (rec.category || rec.type || title || '').toUpperCase();
                if (typeUpper.includes('EYE') || typeUpper.includes('UNDEREYE')) return '/products/eye_cream.jpg';
                if (typeUpper.includes('CLEANSER') || typeUpper.includes('WASH')) return '/products/cleanser.jpg';
                if (typeUpper.includes('SERUM')) return '/products/serum.jpg';
                if (typeUpper.includes('MOISTURIZER') || typeUpper.includes('LOTION') || (typeUpper.includes('CREAM') && !typeUpper.includes('EYE'))) return '/products/moisturizer.jpg';
                if (typeUpper.includes('SUNSCREEN') || typeUpper.includes('SPF') || typeUpper.includes('BLOCK')) return '/products/sunscreen.jpg';
                if (typeUpper.includes('TONER')) return '/products/toner.jpg';
                if (typeUpper.includes('TREATMENT') || typeUpper.includes('MASK') || typeUpper.includes('EXFOLIANT') || typeUpper.includes('PEEL')) return '/products/treatment.jpg';
                return '/products/moisturizer.jpg';
              })()
            })
          }
        });
        createdRecommendations.push(created);
      }
    }

    // Helper to safely extract string values from either string or object
    const extractFields = (rec: any, defaultTitle: string) => {
      if (typeof rec === 'string') return { title: defaultTitle, description: rec, reason: 'General wellness recommendation based on your skin profile.' };
      return {
        title: rec.title || rec.name || defaultTitle,
        description: rec.description || rec.title || rec.name || JSON.stringify(rec),
        reason: rec.reason || 'General wellness recommendation based on your skin profile.'
      };
    };

    // Save Home Care
    const homeCareList = aiRecommendations.homeCare || aiRecommendations.homeRemedies || [];
    if (Array.isArray(homeCareList)) {
      for (const rec of homeCareList) {
        const fields = extractFields(rec, 'Home Care Advice');
        const created = await this.prisma.skinRecommendation.create({
          data: {
            skinAnalysisId: latestScan.id,
            category: 'HOMEREMEDIES',
            recommendationType: rec.type || 'DIY',
            title: fields.title,
            description: fields.description,
            reason: fields.reason,
            priority: rec.priority || 'NORMAL',
          }
        });
        createdRecommendations.push(created);
      }
    }

    // Save Lifestyle
    const lifestyleList = aiRecommendations.lifestyle || [];
    if (Array.isArray(lifestyleList)) {
      for (const rec of lifestyleList) {
        const fields = extractFields(rec, 'Lifestyle Advice');
        const created = await this.prisma.skinRecommendation.create({
          data: {
            skinAnalysisId: latestScan.id,
            category: 'LIFESTYLE',
            recommendationType: rec.type || 'HABIT',
            title: fields.title,
            description: fields.description,
            reason: fields.reason,
            priority: rec.priority || 'NORMAL',
          }
        });
        createdRecommendations.push(created);
      }
    }

    // Save Diet
    const dietList = aiRecommendations.diet || [];
    if (Array.isArray(dietList)) {
      for (const rec of dietList) {
        const fields = extractFields(rec, 'Dietary Advice');
        const created = await this.prisma.skinRecommendation.create({
          data: {
            skinAnalysisId: latestScan.id,
            category: 'DIET',
            recommendationType: rec.type || 'NUTRITION',
            title: fields.title,
            description: fields.description,
            reason: fields.reason,
            priority: rec.priority || 'NORMAL',
          }
        });
        createdRecommendations.push(created);
      }
    }

    return createdRecommendations;
  }
}
