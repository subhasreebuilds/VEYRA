import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class GroomingService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async getRoutine(userId: string, date: string): Promise<any> {
    let routine = await this.prisma.groomingRoutine.findUnique({
      where: { userId },
    });

    let progress = await this.prisma.routineProgress.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });

    if (!progress) {
      progress = await this.prisma.routineProgress.create({
        data: {
          userId,
          date,
          completedSteps: [],
        },
      });
    }

    // Always keep synced: auto-generate if not created yet OR if a newer skin scan exists
    const latestScan = await this.prisma.skinScan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!routine || (latestScan && routine.updatedAt < latestScan.createdAt)) {
      try {
        const generated = await this.generateRoutine(userId);
        routine = { routineData: generated.routine } as any;
      } catch (e) {
        // user may not have scan or profile yet
      }
    }

    return {
      routine: routine ? routine.routineData : null,
      progress: progress.completedSteps,
    };
  }

  async generateRoutine(userId: string): Promise<any> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new BadRequestException('User profile not found. Complete onboarding first.');
    }

    const latestScan = await this.prisma.skinScan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestScan) {
      throw new BadRequestException('No skin scan found. Please complete a skin scan first.');
    }

    let skincareRecs = await this.prisma.skinRecommendation.findMany({
      where: { skinAnalysisId: latestScan.id, category: 'SKINCARE' }
    });

    let homeRemedyRecs = await this.prisma.skinRecommendation.findMany({
      where: { 
        skinAnalysisId: latestScan.id, 
        category: { in: ['HOMEREMEDIES', 'HOME_CARE', 'HOME_REMEDY'] } 
      }
    });

    // If no recommendations exist yet, generate them from AI and save them
    if (skincareRecs.length === 0) {
      const aiRecommendations = await this.aiService.generateSkinRecommendations({
        profile,
        skinAnalysis: latestScan
      });

      const skincareList = aiRecommendations.recommendations || aiRecommendations.skincare || aiRecommendations.products || [];
      if (Array.isArray(skincareList)) {
        for (const rec of skincareList) {
          const title = rec.name || rec.title || rec.category || 'Product Recommendation';
          const typeUpper = (rec.category || rec.type || title || '').toUpperCase();
          const img = (() => {
            if (typeUpper.includes('PATCH') || typeUpper.includes('UNDEREYE_PATCH')) return '/products/eye_patches.jpg';
            if (typeUpper.includes('EYE') || typeUpper.includes('UNDEREYE')) return '/products/eye_cream.jpg';
            if (typeUpper.includes('CLEANSER') || typeUpper.includes('WASH')) return '/products/cleanser.jpg';
            if (typeUpper.includes('SERUM')) return '/products/serum.jpg';
            if (typeUpper.includes('MOISTURIZER') || typeUpper.includes('LOTION') || (typeUpper.includes('CREAM') && !typeUpper.includes('EYE'))) return '/products/moisturizer.jpg';
            if (typeUpper.includes('SUNSCREEN') || typeUpper.includes('SPF') || typeUpper.includes('BLOCK')) return '/products/sunscreen.jpg';
            if (typeUpper.includes('TONER')) return '/products/toner.jpg';
            if (typeUpper.includes('TREATMENT') || typeUpper.includes('MASK') || typeUpper.includes('EXFOLIANT') || typeUpper.includes('PEEL')) return '/products/treatment.jpg';
            return '/products/moisturizer.jpg';
          })();

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
                imageUrl: img
              })
            }
          });
          skincareRecs.push(created);
        }
      }

      const homeCareList = aiRecommendations.homeCare || aiRecommendations.homeRemedies || [];
      if (Array.isArray(homeCareList)) {
        for (const rec of homeCareList) {
          const title = typeof rec === 'string' ? 'Home Care Advice' : (rec.title || rec.name || 'Home Care Advice');
          const description = typeof rec === 'string' ? rec : (rec.description || rec.reason || title);
          const reason = typeof rec === 'string' ? rec : (rec.reason || 'Natural remedy based on your skin condition.');
          const img = (() => {
            const t = title.toUpperCase();
            if (t.includes('HONEY') || t.includes('OAT') || t.includes('MASK')) return '/products/honey.jpg';
            if (t.includes('TEA') || t.includes('MIST') || t.includes('COMPRESS')) return '/products/tea.jpg';
            if (t.includes('CUCUMBER') || t.includes('ROSE')) return '/products/cucumber.jpg';
            if (t.includes('EYE') || t.includes('PATCH')) return '/products/eye_patches.jpg';
            return '/products/treatment.jpg';
          })();

          const created = await this.prisma.skinRecommendation.create({
            data: {
              skinAnalysisId: latestScan.id,
              category: 'HOMEREMEDIES',
              recommendationType: rec.type || 'DIY',
              title,
              description,
              reason,
              priority: rec.priority || 'NORMAL',
              instructions: JSON.stringify({
                name: title,
                brand: 'Natural Home Remedy',
                currency: '',
                price: 'Home Crafted',
                imageUrl: img
              })
            }
          });
          homeRemedyRecs.push(created);
        }
      }
    }

    // If home remedies are still empty, create default curated home remedies
    if (homeRemedyRecs.length === 0) {
      const defaultRemedies = [
        {
          title: 'Honey & Oatmeal Soothing Mask',
          type: 'DIY MASK',
          description: 'Mix 1 tbsp raw honey with 1 tbsp finely ground oatmeal. Apply to clean face for 15 minutes, then rinse gently with lukewarm water.',
          reason: 'Calms superficial redness, replenishes moisture, and gently soothes inflamed pores.',
          img: '/products/honey.jpg'
        },
        {
          title: 'Green Tea & Botanical Soothing Compress',
          type: 'COMPRESS',
          description: 'Dip clean cotton pads into chilled organic green tea and place over cheeks and forehead for 10 minutes.',
          reason: 'Rich in botanical antioxidants (EGCG) to reduce redness and regulate daytime sebum.',
          img: '/products/tea.jpg'
        },
        {
          title: 'Chilled Cucumber & Rose Water Under-Eye Therapy',
          type: 'EYE CARE',
          description: 'Rest chilled cucumber rounds dipped in pure rose water over eyelids for 10 minutes to drain lymphatic fluid.',
          reason: 'De-puffs tired eyes, drains lymphatic fluid, and cools delicate skin.',
          img: '/products/cucumber.jpg'
        }
      ];

      for (const d of defaultRemedies) {
        const created = await this.prisma.skinRecommendation.create({
          data: {
            skinAnalysisId: latestScan.id,
            category: 'HOMEREMEDIES',
            recommendationType: d.type,
            title: d.title,
            description: d.description,
            reason: d.reason,
            instructions: JSON.stringify({
              name: d.title,
              brand: 'Natural Home Remedy',
              currency: '',
              price: 'Home Crafted',
              imageUrl: d.img
            })
          }
        });
        homeRemedyRecs.push(created);
      }
    }

    // Helper to extract parsed instructions
    const parseInstructions = (rec: any) => {
      try {
        return JSON.parse(rec.instructions || '{}');
      } catch (e) {
        return {};
      }
    };

    // Helper to find a matching product by category keywords
    const findProduct = (types: string[]) => {
      for (const t of types) {
        const match = skincareRecs.find(r => {
          const recType = (r.recommendationType || '').toUpperCase();
          const recTitle = (r.title || '').toUpperCase();
          return recType.includes(t.toUpperCase()) || recTitle.includes(t.toUpperCase());
        });
        if (match) return match;
      }
      return null;
    };

    // Helper to format a timeline step
    const makeStep = (
      rec: any,
      idSuffix: string,
      stepNumber: string,
      time: string,
      defaultTitle: string,
      defaultCategory: string,
      defaultDescription: string,
      defaultDuration: string,
      defaultImage: string
    ) => {
      const instr = rec ? parseInstructions(rec) : {};
      return {
        id: rec ? `${rec.id}-${idSuffix}` : `step-${idSuffix}-${stepNumber}`,
        stepNumber,
        time,
        title: rec ? (rec.title || defaultTitle) : defaultTitle,
        category: rec ? (rec.recommendationType || defaultCategory) : defaultCategory,
        description: defaultDescription,
        duration: defaultDuration,
        actives: [],
        productName: instr.name || rec?.title || defaultTitle,
        productBrand: instr.brand || 'Veyra Recommendation',
        productImage: instr.imageUrl || defaultImage,
        productPrice: instr.price || '',
        productType: rec?.recommendationType || defaultCategory,
        reason: rec?.reason || rec?.description || 'Personalized for your skin barrier and daily glow.',
      };
    };

    // 1. MORNING SECTION (Timeline Todo)
    const mCleanser = findProduct(['CLEANSER', 'WASH']);
    const mToner = findProduct(['TONER', 'ASTRINGENT']);
    const mSerum = findProduct(['SERUM']);
    const mMoisturizer = findProduct(['MOISTURIZER', 'LOTION', 'CREAM']);
    const mSunscreen = findProduct(['SUNSCREEN', 'SPF', 'BLOCK']);

    const morningSteps = [
      makeStep(
        mCleanser,
        'm',
        '01',
        '07:00 AM',
        'Gentle Morning Cleanse',
        'CLEANSER',
        'Wash face with lukewarm water using soft circular motions for 60 seconds to clear overnight sebum.',
        '60 sec',
        '/products/cleanser.jpg'
      ),
      makeStep(
        mToner,
        'm',
        '02',
        '07:05 AM',
        'Pore Refining & pH Prep',
        'TONER',
        'Gently pat into skin using palms or a soft cotton pad to restore pH balance and refine pores.',
        '30 sec',
        '/products/toner.jpg'
      ),
      makeStep(
        mSerum,
        'm',
        '03',
        '07:10 AM',
        'Antioxidant Daily Shield Serum',
        'SERUM',
        'Dispense 3-4 drops across face and neck. Press in gently to defend against daily oxidation.',
        '60 sec',
        '/products/serum.jpg'
      ),
      makeStep(
        mMoisturizer,
        'm',
        '04',
        '07:15 AM',
        'Barrier Moisture Lock',
        'MOISTURIZER',
        'Smooth evenly over face and neck to seal in hydration and reinforce epidermal barrier function.',
        '60 sec',
        '/products/moisturizer.jpg'
      ),
      makeStep(
        mSunscreen,
        'm',
        '05',
        '07:20 AM',
        'Broad-Spectrum UV Defense',
        'SUNSCREEN',
        'Apply two generous finger-lengths over face, neck, and ears 15 minutes before sun exposure.',
        '60 sec',
        '/products/sunscreen.jpg'
      )
    ];

    // 2. NIGHT SECTION (Timeline Todo)
    const nCleanser = findProduct(['CLEANSER', 'WASH']);
    const nToner = findProduct(['TONER', 'ASTRINGENT']);
    const nSerum = findProduct(['SERUM', 'TREATMENT', 'RETINOL']);
    const nEyeCream = findProduct(['EYE', 'ORBITAL']);
    const nMoisturizer = findProduct(['MOISTURIZER', 'CREAM', 'LOTION']);

    const nightSteps = [
      makeStep(
        nCleanser,
        'n',
        '01',
        '09:00 PM',
        'Evening Deep Purifying Cleanse',
        'CLEANSER',
        'Double cleanse to thoroughly eliminate sunscreen residue, airborne grime, and daily impurities.',
        '60 sec',
        '/products/cleanser.jpg'
      ),
      makeStep(
        nToner,
        'n',
        '02',
        '09:05 PM',
        'Balancing Night Prep Toner',
        'TONER',
        'Sweep gently over face to clear residual buildup and prime skin for nighttime cellular repair.',
        '30 sec',
        '/products/toner.jpg'
      ),
      makeStep(
        nSerum,
        'n',
        '03',
        '09:10 PM',
        'Cellular Regeneration Serum',
        'SERUM',
        'Apply 3-4 drops to target concerns, balance sebum, and boost overnight epidermal renewal.',
        '60 sec',
        '/products/serum.jpg'
      ),
      makeStep(
        nEyeCream,
        'n',
        '04',
        '09:15 PM',
        'Under-Eye Night Recovery',
        'EYE CREAM',
        'Delicately tap a small amount along orbital bones to hydrate and reduce dark circles while resting.',
        '60 sec',
        '/products/eye_cream.jpg'
      ),
      makeStep(
        nMoisturizer,
        'n',
        '05',
        '09:20 PM',
        'Overnight Barrier Restoration Crème',
        'MOISTURIZER',
        'Massage a nourishing layer over face to lock in actives and prevent transepidermal water loss.',
        '60 sec',
        '/products/moisturizer.jpg'
      )
    ];

    // 3. HOME REMEDIES SECTION (Timeline Todo)
    const homeRemediesSteps = homeRemedyRecs.map((rec, idx) => {
      const instr = parseInstructions(rec);
      const stepNum = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
      const defaultTimes = ['08:00 PM', '08:20 PM', '08:40 PM', '09:00 PM'];
      const time = defaultTimes[idx] || '08:00 PM';
      const defaultDurations = ['15 min', '10 min', '10 min', '15 min'];
      const duration = defaultDurations[idx] || '15 min';

      const img = instr.imageUrl || (() => {
        const t = (rec.title || '').toUpperCase();
        if (t.includes('HONEY') || t.includes('OAT') || t.includes('MASK')) return '/products/honey.jpg';
        if (t.includes('TEA') || t.includes('MIST') || t.includes('COMPRESS')) return '/products/tea.jpg';
        if (t.includes('CUCUMBER') || t.includes('ROSE')) return '/products/cucumber.jpg';
        if (t.includes('EYE') || t.includes('PATCH')) return '/products/eye_patches.jpg';
        return '/products/treatment.jpg';
      })();

      return {
        id: `${rec.id}-hr`,
        stepNumber: stepNum,
        time,
        title: rec.title,
        category: rec.recommendationType || 'HOME REMEDY',
        description: rec.description || 'Natural botanical therapy to soothe and nurture your skin barrier.',
        duration,
        actives: [],
        productName: instr.name || rec.title,
        productBrand: instr.brand || 'Natural Home Remedy',
        productImage: img,
        productPrice: instr.price || 'Home Crafted',
        productType: 'Natural Remedy',
        reason: rec.reason || 'Calms superficial redness and supports skin radiance.',
      };
    });

    const routineData = {
      morning: morningSteps,
      night: nightSteps,
      homeRemedies: homeRemediesSteps,
      // Backward compatibility aliases
      evening: nightSteps,
      weekly: homeRemediesSteps,
    };

    const routine = await this.prisma.groomingRoutine.upsert({
      where: { userId },
      update: { routineData },
      create: {
        userId,
        routineData,
      },
    });

    return {
      routine: routine.routineData,
    };
  }

  async toggleProgress(userId: string, date: string, stepId: string): Promise<any> {
    let progress = await this.prisma.routineProgress.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });

    if (!progress) {
      progress = await this.prisma.routineProgress.create({
        data: {
          userId,
          date,
          completedSteps: [stepId],
        },
      });
      return { completedSteps: progress.completedSteps };
    }

    let updatedSteps = [...progress.completedSteps];
    if (updatedSteps.includes(stepId)) {
      updatedSteps = updatedSteps.filter((id) => id !== stepId);
    } else {
      updatedSteps.push(stepId);
    }

    const updated = await this.prisma.routineProgress.update({
      where: { id: progress.id },
      data: { completedSteps: updatedSteps },
    });

    return { completedSteps: updated.completedSteps };
  }
}
