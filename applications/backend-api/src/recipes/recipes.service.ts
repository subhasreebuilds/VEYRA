import { Injectable, Logger, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NutritionCalculator } from '../nutrition/nutrition.calculator';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private calculator: NutritionCalculator,
  ) {}

  async getSavedRecipes(userId: string): Promise<any[]> {
    // @ts-ignore
    return this.prisma.smartRecipe.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateSmartRecipes(userId: string): Promise<any[]> {
    // 1. Get User Profile
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found. Please complete onboarding first.');
    }

    if (!profile.age || !profile.weight || !profile.height) {
      throw new BadRequestException('Profile is missing required health metrics (age, weight, height).');
    }

    // 2. Calculate Targets
    const targets = this.calculator.calculateAll(
      profile.age,
      profile.weight,
      profile.height,
      profile.gender || 'PREFER_NOT_TO_SAY',
      profile.activityLevel || 'SEDENTARY',
      profile.goal || 'MAINTENANCE',
    );

    // 3. Prepare AI Context
    const aiContext = {
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
      dietaryPreference: profile.dietaryPreference,
      allergies: profile.allergies,
      dislikes: profile.dislikes,
      budget: profile.budget,
      cookingTime: profile.cookingTime,
      calculatedNutrition: targets,
    };

    // 3. Delete old recipes for this user
    await this.prisma.smartRecipe.deleteMany({
      where: { userId },
    });

    // 4. Request AI Recipes
    this.logger.log(`Generating AI smart recipes for user ${userId}...`);
    const aiRecipesData = await this.aiService.generateSmartRecipes(aiContext);

    // 5. Save the Recipes & Hotlink Images
    const savedRecipes: any[] = [];
    
    if (!aiRecipesData || !Array.isArray(aiRecipesData.recipes)) {
      throw new InternalServerErrorException('AI returned an invalid recipe format.');
    }

    // Run DB saving concurrently
    const promises = aiRecipesData.recipes.map(async (recipe: any, index: number) => {
      if (!recipe || typeof recipe !== 'object') return; // Skip malformed recipes

      // Ensure recipe has a unique ID instead of static placeholder string
      if (!recipe.id || recipe.id === 'will_be_generated_by_db') {
        recipe.id = `recipe_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
      }

      // Preserve AI image URL if provided by AI service, otherwise assign fallback
      if (!recipe.image || typeof recipe.image !== 'string' || !recipe.image.startsWith('http')) {
        const imageIndex = (index % 7) + 1;
        recipe.image = `/recipe-${imageIndex}.jpg`;
      }

      try {
        // @ts-ignore
        const saved = await this.prisma.smartRecipe.create({
          data: {
            userId,
            recipeData: recipe,
          },
        });
        savedRecipes.push(saved);
      } catch (dbErr: any) {
        this.logger.error(`Failed to save recipe to DB: ${dbErr.message}`);
      }
    });

    await Promise.all(promises);

    return savedRecipes;
  }
}
