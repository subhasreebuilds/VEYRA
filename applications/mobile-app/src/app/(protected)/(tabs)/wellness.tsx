import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G } from 'react-native-svg';
import { fetchApi } from '../../../lib/api';

const { width } = Dimensions.get('window');

// Color Palette matching reference UI images exactly
const COLORS = {
  bg: '#FBF9F5',
  cardBg: '#FFFFFF',
  cardSecondary: '#FAF7F2',
  innerBoxBg: '#FAF8F5',
  pillBg: '#EAE6DF',
  primary: '#2D3F33',
  primaryDark: '#1E2D23',
  textDark: '#1F2922',
  textMuted: '#657367',
  textLight: '#94A196',
  labelMuted: '#A09289',
  heroBg: '#A1AF9C',
  border: '#F0ECE4',
  tagBg: '#ECE7DF',
  badgeGreen: '#E8EFE6',
  badgeGreenText: '#2D452F',
  hydrationBg: '#EBF3F5',
  calorieGreenLabel: '#43A047',
};

type ScreenType =
  | 'HUB'
  | 'NUTRITION'
  | 'RECIPES'
  | 'RECIPE_DETAIL_OATS'
  | 'RECIPE_DETAIL_PANEER'
  | 'GROOMING'
  | 'GROOMING_DETAIL'
  | 'LIFESTYLE'
  | 'NUTRITION_PLAN'
  | 'LIFESTYLE_TIPS';

const DEFAULT_NUTRITION_PLAN = {
  targetCalories: 1496,
  proteinGrams: 120,
  carbsGrams: 161,
  fatGrams: 42,
  bmi: '26.7',
  bmr: 1247,
  tdee: 1496,
  goal: 'Wellness Goal',
  planData: {
    summary:
      'Clinical maintenance protocol tailored for a sedentary vegetarian profile. The macro strategy prioritizes high protein distribution across all meals to support lean muscle mass maintenance, moderate complex carbohydrates for sustained glucose control, and controlled dietary fats.',
    meals: [
      {
        name: 'Meal 1 (Morning Protocol)',
        target:
          'Consume a lean vegetarian protein source paired with complex, low-glycemic carbohydrates and a minimal amount of healthy fats to initiate protein synthesis.',
        approxCalories: 350,
        protein: 30,
        carbs: 40,
        fat: 10,
      },
      {
        name: 'Meal 2 (Midday Protocol)',
        target:
          'Mid-day anabolic maintenance window. Combine complete vegetarian protein fractions with fiber-rich complex carbohydrates and unsaturated lipids for stabilized blood glucose.',
        approxCalories: 450,
        protein: 35,
        carbs: 50,
        fat: 12,
      },
      {
        name: 'Meal 3 (Metabolic Refuel Window)',
        target:
          'Focused nitrogen balance retention snack. Combine low-fat protein options with moderate carbohydrates to prevent catabolic breakdown prior to the evening window.',
        approxCalories: 200,
        protein: 20,
        carbs: 20,
        fat: 5,
      },
      {
        name: 'Meal 4 (Evening Protocol)',
        target:
          'Sustained-release protein phase. Utilize slow-digesting protein sources combined with fibrous carbohydrate structures and essential fats to aid overnight tissue maintenance.',
        approxCalories: 496,
        protein: 35,
        carbs: 51,
        fat: 15,
      },
    ],
    hydration: {
      suggestion: 'Target a baseline fluid intake of 2.2 to 2.5 liters of water daily.',
      note: 'Maintain consistent fluid distribution throughout the day to optimize nutrient transport and cellular hydration.',
    },
    tips: [
      'Space protein intake evenly across all four timing blocks to maximize muscle protein synthesis efficiency.',
      'Select fiber-dense carbohydrate sources to optimize satiety and digestive health on a maintenance calorie level.',
      'Monitor portion sizes precisely using digital food scales to adhere strictly to prescribed macronutrient targets.',
    ],
  },
};

// Leaf branch SVG component for top-right botanical accent
function BotanicalLeafAccent() {
  return (
    <Svg width="150" height="150" viewBox="0 0 100 100" style={styles.botanicalSvg}>
      <G fill="none" stroke="#B1C0AA" strokeWidth="1.8" strokeLinecap="round">
        <Path d="M 85 0 C 70 30, 45 60, 20 85" />
        <Path d="M 75 10 C 60 5, 55 15, 75 10 Z" fill="#B1C0AA" opacity="0.35" />
        <Path d="M 80 18 C 95 20, 90 35, 80 18 Z" fill="#B1C0AA" opacity="0.4" />
        <Path d="M 58 32 C 42 25, 38 40, 58 32 Z" fill="#B1C0AA" opacity="0.35" />
        <Path d="M 62 38 C 78 40, 72 55, 62 38 Z" fill="#B1C0AA" opacity="0.4" />
        <Path d="M 40 55 C 24 50, 20 62, 40 55 Z" fill="#B1C0AA" opacity="0.35" />
        <Path d="M 44 60 C 58 62, 52 75, 44 60 Z" fill="#B1C0AA" opacity="0.4" />
      </G>
    </Svg>
  );
}

export default function WellnessScreen() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('HUB');
  const [nutritionTab, setNutritionTab] = useState<'YOUR_PLAN' | 'MEAL_IDEAS' | 'TIPS'>('YOUR_PLAN');
  const [recipeCategory, setRecipeCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedRecipes, setSavedRecipes] = useState<Record<string, boolean>>({ oats: true, paneer: true });
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [groomingCategory, setGroomingCategory] = useState('Skincare');
  const [lifestyleCategory, setLifestyleCategory] = useState('All');
  const [planType, setPlanType] = useState<'WEEKLY' | 'CUSTOM'>('WEEKLY');

  // Dynamic Nutrition Plan State
  const [nutritionPlan, setNutritionPlan] = useState<any>(DEFAULT_NUTRITION_PLAN);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Dynamic AI Recipes State & Logic (matching Web App API)
  const [apiRecipes, setApiRecipes] = useState<any[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  const resolveImageUri = (img: string | undefined, title: string = '', category: string = '', index: number = 0) => {
    const map: Record<string, string> = {
      '/recipe-1.jpg': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800&q=80',
      '/recipe-2.jpg': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
      '/recipe-3.jpg': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&q=80',
      '/recipe-4.jpg': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      '/recipe-5.jpg': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
      '/recipe-6.jpg': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
      '/recipe-7.jpg': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&q=80',
    };

    if (img && typeof img === 'string' && img.trim().length > 0) {
      if (img.startsWith('http')) {
        if (img.includes('unsplash.com')) {
          const photoMatch = img.match(/photo-[\w-]+/);
          if (photoMatch) {
            return `https://images.unsplash.com/${photoMatch[0]}?w=800&q=80`;
          }
        }
        return img;
      }
      if (map[img]) return map[img];
    }

    const t = (title + ' ' + category).toLowerCase();
    if (t.includes('oat') || t.includes('porridge') || t.includes('pancake') || t.includes('berry')) return map['/recipe-1.jpg'];
    if (t.includes('salad') || t.includes('green') || t.includes('avocado')) return map['/recipe-2.jpg'];
    if (t.includes('chicken') || t.includes('poultry') || t.includes('meat') || t.includes('quinoa')) return map['/recipe-3.jpg'];
    if (t.includes('paneer') || t.includes('curry') || t.includes('tofu') || t.includes('stir')) return map['/recipe-4.jpg'];
    if (t.includes('soup') || t.includes('stew') || t.includes('broth') || t.includes('tomato')) return map['/recipe-5.jpg'];
    if (t.includes('fish') || t.includes('salmon') || t.includes('seafood')) return map['/recipe-6.jpg'];
    if (t.includes('smoothie') || t.includes('shake') || t.includes('drink')) return map['/recipe-7.jpg'];

    const defaults = Object.values(map);
    return defaults[index % defaults.length];
  };

  const staticRecipes = [
    {
      id: 'oats',
      title: 'Masala Berry Oats Porridge',
      time: '15 mins',
      cal: '350 kcal',
      img: '/recipe-1.jpg',
      cat: 'Breakfast',
      tags: ['Breakfast', 'Indian', 'High Protein'],
      prep: '15 mins',
      cook: '0 mins',
      servings: '1 serving',
      macros: { protein: '22g', carbs: '45g', fat: '8g' },
      benefits: 'Rich in soluble fiber and antioxidants to stabilize morning glucose levels.',
      ingredients: [
        '1/2 cup rolled oats',
        '1 cup almond milk',
        '1/4 tsp cardamom powder',
        '1/4 cup mixed berries',
        '1 tbsp chia seeds',
      ],
      instructions: [
        '1. Cook oats in almond milk with cardamom for 5 minutes.',
        '2. Remove from heat and stir well.',
        '3. Top with fresh berries and chia seeds before serving warm.',
      ],
      screen: 'RECIPE_DETAIL',
    },
    {
      id: 'salad',
      title: 'Indian Kachumber Salad',
      time: '15 mins',
      cal: '320 kcal',
      img: '/recipe-2.jpg',
      cat: 'Lunch',
      tags: ['Lunch', 'Low Carb', 'Indian'],
      prep: '15 mins',
      cook: '0 mins',
      servings: '1 serving',
      macros: { protein: '14g', carbs: '22g', fat: '18g' },
      benefits: 'Promotes digestive hydration and skin radiance.',
      ingredients: [
        '2 cups mixed greens',
        '1 diced cucumber',
        '1/2 cup cherry tomatoes',
        '1/2 avocado',
        '1 tbsp lemon juice & chaat masala',
      ],
      instructions: [
        '1. Chop cucumber, tomatoes, and greens.',
        '2. Toss with diced avocado in a serving bowl.',
        '3. Drizzle with lemon juice and chaat masala.',
      ],
      screen: 'RECIPE_DETAIL',
    },
    {
      id: 'quinoa_chicken',
      title: 'Chicken Quinoa Khichdi',
      time: '25 mins',
      cal: '420 kcal',
      img: '/recipe-3.jpg',
      cat: 'Lunch',
      tags: ['Lunch', 'High Protein', 'Indian'],
      prep: '20 mins',
      cook: '10 mins',
      servings: '1 serving',
      macros: { protein: '38g', carbs: '42g', fat: '10g' },
      benefits: 'Complete amino acid profile supporting lean muscle mass and digestive comfort.',
      ingredients: [
        '150g boneless chicken breast',
        '1/2 cup quinoa',
        '1/4 cup moong dal',
        '1/2 tsp turmeric & ginger-garlic paste',
        '1 tsp cow ghee',
      ],
      instructions: [
        '1. Sauté ginger-garlic and turmeric in ghee.',
        '2. Add diced chicken, quinoa, moong dal, and 2 cups water.',
        '3. Simmer for 20 minutes until creamy.',
      ],
      screen: 'RECIPE_DETAIL',
    },
    {
      id: 'paneer',
      title: 'Paneer & Broccoli Kadhai Stir-Fry',
      time: '20 mins',
      cal: '450 kcal',
      img: '/recipe-4.jpg',
      cat: 'Dinner',
      tags: ['Dinner', 'High Protein', 'Vegetarian'],
      prep: '15 mins',
      cook: '10 mins',
      servings: '2 servings',
      macros: { protein: '32g', carbs: '18g', fat: '22g' },
      benefits: 'Abundant in calcium, zinc, and dietary fiber.',
      ingredients: [
        '140g fresh paneer cubes',
        '1.5 cups broccoli florets',
        '1/2 bell pepper',
        '1/2 tsp cumin & garam masala',
        '1 tsp mustard oil',
      ],
      instructions: [
        '1. Sauté cumin, broccoli, and bell pepper in mustard oil for 4 minutes.',
        '2. Add paneer cubes and mild kadhai spices.',
        '3. Toss for 4 minutes until golden brown and serve hot.',
      ],
      screen: 'RECIPE_DETAIL',
    },
    {
      id: 'soup',
      title: 'Roasted Tomato Moong Dal Soup',
      time: '15 mins',
      cal: '240 kcal',
      img: '/recipe-5.jpg',
      cat: 'Snacks',
      tags: ['Snacks', 'Low Calorie', 'Indian'],
      prep: '10 mins',
      cook: '15 mins',
      servings: '2 servings',
      macros: { protein: '12g', carbs: '28g', fat: '6g' },
      benefits: 'High in lycopene and hydration to boost immune wellness.',
      ingredients: [
        '4 ripe tomatoes',
        '1/4 cup yellow moong dal',
        '2 garlic cloves',
        '1/2 tsp roasted cumin powder',
        '1 tsp ghee',
      ],
      instructions: [
        '1. Roast tomatoes and boil moong dal until soft.',
        '2. Blend together into a velvety soup.',
        '3. Temper with ghee and cumin powder before serving.',
      ],
      screen: 'RECIPE_DETAIL',
    },
    {
      id: 'salmon',
      title: 'Tawa Pan-Seared Fish Tikka',
      time: '20 mins',
      cal: '440 kcal',
      img: '/recipe-6.jpg',
      cat: 'Dinner',
      tags: ['Dinner', 'High Protein', 'Indian'],
      prep: '10 mins',
      cook: '10 mins',
      servings: '1 serving',
      macros: { protein: '40g', carbs: '10g', fat: '24g' },
      benefits: 'Packed with essential Omega-3 fatty acids for heart and skin health.',
      ingredients: [
        '160g fish fillet',
        '2 tbsp hung curd',
        '1 tsp kasuri methi & tikka masala',
        '1 tbsp olive oil',
        'Lemon wedges',
      ],
      instructions: [
        '1. Marinate fish in hung curd, lemon, and tikka masala for 10 minutes.',
        '2. Heat oil on a tawa or pan and sear fish for 4 minutes per side.',
        '3. Garnish with lemon and serve hot.',
      ],
      screen: 'RECIPE_DETAIL',
    },
    {
      id: 'smoothie',
      title: 'Mango Berry Protein Lassi',
      time: '10 mins',
      cal: '260 kcal',
      img: '/recipe-7.jpg',
      cat: 'Snacks',
      tags: ['Snacks', 'Indian', 'Post Workout'],
      prep: '5 mins',
      cook: '0 mins',
      servings: '1 serving',
      macros: { protein: '24g', carbs: '30g', fat: '5g' },
      benefits: 'Probiotic gut support and rapid post-workout recovery.',
      ingredients: [
        '1 cup fresh curd',
        '1 scoop vanilla protein powder',
        '1/2 cup mixed berries',
        'Pinch of cardamom powder',
      ],
      instructions: [
        '1. Add curd, protein powder, berries, and cardamom to blender.',
        '2. Blend until creamy and smooth.',
        '3. Pour into a chilled glass and serve.',
      ],
      screen: 'RECIPE_DETAIL',
    },
  ];

  useEffect(() => {
    loadNutritionPlan();
    loadRecipes();
  }, []);

  const loadNutritionPlan = async () => {
    try {
      const data = await fetchApi('/nutrition');
      if (data && data.targetCalories) {
        setNutritionPlan(data);
      }
    } catch (err) {
      // Keep default plan as fallback
    }
  };

  const generatePlan = async () => {
    try {
      setIsGeneratingPlan(true);
      const data = await fetchApi('/nutrition/generate', { method: 'POST' });
      if (data && data.targetCalories) {
        setNutritionPlan(data);
      }
    } catch (err) {
      setTimeout(() => {
        setNutritionPlan(prev => ({ ...prev }));
      }, 800);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const loadRecipes = async () => {
    try {
      setIsLoadingRecipes(true);
      const data = await fetchApi('/recipes');
      if (data && Array.isArray(data) && data.length > 0) {
        setApiRecipes(data.map((item: any) => item.recipeData || item));
      }
    } catch (err) {
      // Fallback to static recipes
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  const generateRecipes = async () => {
    try {
      setIsGeneratingRecipes(true);
      const data = await fetchApi('/recipes/generate', { method: 'POST' });
      if (data && Array.isArray(data)) {
        await loadRecipes();
      }
    } catch (err) {
      setTimeout(() => {
        setApiRecipes(prev => [...prev]);
      }, 800);
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  const toggleSaveRecipe = (id: string) => {
    setSavedRecipes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderHeader = (title: string, showBack = true, rightIcon?: string, onRightPress?: () => void) => (
    <View style={styles.headerRow}>
      {showBack ? (
        <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentScreen('HUB')}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 36 }} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {rightIcon ? (
        <TouchableOpacity style={styles.rightIconBtn} onPress={onRightPress}>
          <Ionicons name={rightIcon as any} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 36 }} />
      )}
    </View>
  );

  // ==========================================
  // SCREEN 1: WELLNESS MAIN HUB
  // ==========================================
  if (currentScreen === 'HUB') {
    return (
      <View style={styles.container}>
        <BotanicalLeafAccent />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hubHeaderContainer}>
            <Text style={styles.hubTitle}>Wellness</Text>
            <Text style={styles.hubSubtitle}>Better food. Better habits. A healthier you.</Text>
          </View>

          <View style={styles.categoryPillsRow}>
            {[
              { id: 'NUTRITION', label: 'Nutrition', icon: 'nutrition-outline' },
              { id: 'RECIPES', label: 'Recipes', icon: 'restaurant-outline' },
              { id: 'GROOMING', label: 'Grooming', icon: 'sparkles-outline' },
              { id: 'LIFESTYLE', label: 'Lifestyle', icon: 'leaf-outline' },
            ].map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryPillItem}
                onPress={() => setCurrentScreen(cat.id as ScreenType)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconCircle}>
                  <Ionicons name={cat.icon as any} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.categoryPillText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.heroCardExact}>
            <View style={styles.heroFoodImageWrap}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400&auto=format&fit=crop' }}
                style={styles.heroFoodImage}
              />
            </View>

            <View style={styles.heroContentRight}>
              <Text style={styles.heroTitleExact}>Today's Nutrition Plan</Text>
              <Text style={styles.heroSubtextExact}>Balanced meals for your goals</Text>
              <TouchableOpacity
                style={styles.heroPillBtn}
                onPress={() => setCurrentScreen('NUTRITION')}
                activeOpacity={0.8}
              >
                <Text style={styles.heroPillBtnText}>View Plan</Text>
                <Ionicons name="arrow-forward" size={13} color="#FFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitleExact}>Quick Actions</Text>
          </View>

          <View style={styles.quickActionsList}>
            {[
              {
                icon: 'cut-outline',
                title: 'Generate Meal Plan',
                subtitle: 'AI-powered nutrition plan',
                screen: 'NUTRITION',
              },
              {
                icon: 'restaurant-outline',
                title: 'Browse Recipes',
                subtitle: 'Healthy & easy recipes',
                screen: 'RECIPES',
              },
              {
                icon: 'sparkles-outline',
                title: 'Grooming Guide',
                subtitle: 'Skincare, hair & body care',
                screen: 'GROOMING',
              },
              {
                icon: 'bulb-outline',
                title: 'Lifestyle Tips',
                subtitle: 'Habits for a better you',
                screen: 'LIFESTYLE_TIPS',
              },
            ].map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.actionCardExact}
                onPress={() => setCurrentScreen(action.screen as ScreenType)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconCircle}>
                  <Ionicons name={action.icon as any} size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.actionTitleExact}>{action.title}</Text>
                  <Text style={styles.actionSubExact}>{action.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#A8B4AA" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SCREEN 2: NUTRITION SCREEN (EXACT IMAGE UI MATCH)
  // ==========================================
  if (currentScreen === 'NUTRITION') {
    const plan = nutritionPlan;
    const mealsList = plan?.planData?.meals || DEFAULT_NUTRITION_PLAN.planData.meals;
    const tipsList = plan?.planData?.tips || DEFAULT_NUTRITION_PLAN.planData.tips;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Breadcrumb Back Link */}
          <TouchableOpacity style={styles.breadcrumbLink} onPress={() => setCurrentScreen('HUB')}>
            <Ionicons name="chevron-back" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.breadcrumbText}>Nutrition</Text>
          </TouchableOpacity>

          {/* Main Serif Page Title */}
          <Text style={styles.pageTitleSerif}>Your Nutrition Plan</Text>

          {/* Oval REGENERATE PLAN Button */}
          <TouchableOpacity
            style={styles.ovalRegenBtn}
            onPress={generatePlan}
            disabled={isGeneratingPlan}
            activeOpacity={0.8}
          >
            {isGeneratingPlan ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.ovalRegenBtnText}>REGENERATE PLAN ↻</Text>
            )}
          </TouchableOpacity>

          {/* 2x2 Macro Cards Grid (Exact UI) */}
          <View style={styles.macroGrid2x2}>
            {/* Calories Card (Dark Olive Card) */}
            <View style={styles.darkMacroCard}>
              <Text style={styles.caloriesLabelText}>CALORIES</Text>
              <Text style={styles.caloriesValueSerif}>{plan?.targetCalories || 1496}</Text>
              <Text style={styles.caloriesUnitSub}>kcal</Text>
            </View>

            {/* Protein Card (White Rounded Card) */}
            <View style={styles.whiteMacroCard}>
              <Text style={styles.whiteMacroLabelText}>PROTEIN</Text>
              <Text style={styles.whiteMacroValueSerif}>
                {plan?.proteinGrams || 120} <Text style={styles.whiteMacroUnit}>g</Text>
              </Text>
            </View>

            {/* Carbs Card */}
            <View style={styles.whiteMacroCard}>
              <Text style={styles.whiteMacroLabelText}>CARBS</Text>
              <Text style={styles.whiteMacroValueSerif}>
                {plan?.carbsGrams || 161} <Text style={styles.whiteMacroUnit}>g</Text>
              </Text>
            </View>

            {/* Fat Card */}
            <View style={styles.whiteMacroCard}>
              <Text style={styles.whiteMacroLabelText}>FAT</Text>
              <Text style={styles.whiteMacroValueSerif}>
                {plan?.fatGrams || 42} <Text style={styles.whiteMacroUnit}>g</Text>
              </Text>
            </View>
          </View>

          {/* AI Clinical Summary Banner (Yellow Sparkle ✨) */}
          <View style={styles.aiSummaryBoxExact}>
            <Text style={styles.sparkleIconExact}>✨</Text>
            <Text style={styles.aiSummaryQuoteText}>
              "{plan?.planData?.summary || DEFAULT_NUTRITION_PLAN.planData.summary}"
            </Text>
          </View>

          {/* Section: Your Personalized Plan */}
          <Text style={styles.personalizedPlanTitleSerif}>Your personalized plan</Text>

          {/* Meals List Cards */}
          <View style={{ gap: 16, marginTop: 12 }}>
            {mealsList.map((m: any, idx: number) => {
              const sug = m.suggestions?.[0] || m;
              return (
                <View key={idx} style={styles.mealCardContainerExact}>
                  {/* Meal Header */}
                  <View style={styles.mealHeaderRowExact}>
                    <Text style={styles.crescentMoonIcon}>🌙</Text>
                    <Text style={styles.mealTitleTextSerif}>{m.name || sug.meal || `Meal ${idx + 1}`}</Text>
                  </View>

                  {/* Inner Box */}
                  <View style={styles.mealInnerBoxExact}>
                    <Text style={styles.macroTargetHeading}>Macro-Nutrient Target</Text>
                    <Text style={styles.macroTargetBodyText}>
                      {m.target || sug.description || 'Consume a lean vegetarian protein source paired with complex, low-glycemic carbohydrates and a minimal amount of healthy fats to initiate protein synthesis.'}
                    </Text>

                    {/* Macro Badges Row */}
                    <View style={styles.macroPillsRowExact}>
                      <View style={styles.whitePillBadge}>
                        <Text style={styles.whitePillText}>~{sug.approxCalories || m.approxCalories || 350} kcal</Text>
                      </View>
                      <View style={styles.greenPillBadge}>
                        <Text style={styles.greenPillText}>P: {sug.protein || m.protein || 30}g</Text>
                      </View>
                      <View style={styles.whitePillBadge}>
                        <Text style={styles.whitePillText}>C: {sug.carbs || m.carbs || 40}g</Text>
                      </View>
                      <View style={styles.whitePillBadge}>
                        <Text style={styles.whitePillText}>F: {sug.fat || m.fat || 10}g</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Hydration Focus Card (Soft Light Blue/Grey) */}
          <View style={styles.hydrationCardExact}>
            <Text style={styles.hydrationTitleTextBold}>
              {plan?.planData?.hydration?.suggestion || 'Target a baseline fluid intake of 2.2 to 2.5 liters of water daily.'}
            </Text>
            <Text style={styles.hydrationSubtextBody}>
              {plan?.planData?.hydration?.note ||
                'Maintain consistent fluid distribution throughout the day to optimize nutrient transport and cellular hydration.'}
            </Text>
          </View>

          {/* Wellness Tips Card (Bulb 💡) */}
          <View style={styles.wellnessTipsCardExact}>
            <View style={styles.wellnessTipsHeaderRow}>
              <Text style={styles.bulbIconExact}>💡</Text>
              <Text style={styles.wellnessTipsTitleSerif}>Wellness Tips</Text>
            </View>

            {tipsList.map((tip: string, tIdx: number) => (
              <View key={tIdx} style={styles.tipDiamondRow}>
                <Text style={styles.diamondStarIcon}>✦</Text>
                <Text style={styles.tipItemBodyText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Your Nutrition Snapshot Card (1:1 Image Match) */}
          <View style={styles.snapshotCardExact}>
            <Text style={styles.snapshotHeadingSerif}>Your Nutrition Snapshot</Text>

            <View style={styles.snapshotGrid2x2}>
              <View style={styles.snapshotInnerBox}>
                <Text style={styles.snapshotLabelText}>CALCULATED{'\n'}BMI</Text>
                <Text style={styles.snapshotValueSerif}>{plan?.bmi || '26.7'}</Text>
                <Text style={styles.snapshotSubLabel}>GENERAL{'\n'}SCREENING{'\n'}METRIC</Text>
              </View>

              <View style={styles.snapshotInnerBox}>
                <Text style={styles.snapshotLabelText}>BMR (BASAL)</Text>
                <Text style={styles.snapshotValueSerif}>
                  {plan?.bmr || 1247} <Text style={styles.unitTextSmall}>kcal</Text>
                </Text>
                <View />
              </View>

              <View style={styles.snapshotInnerBox}>
                <Text style={styles.snapshotLabelText}>TDEE (TOTAL)</Text>
                <Text style={styles.snapshotValueSerif}>
                  {plan?.tdee || 1496} <Text style={styles.unitTextSmall}>kcal</Text>
                </Text>
                <View />
              </View>

              <View style={styles.snapshotInnerBox}>
                <Text style={styles.snapshotLabelText}>PRIMARY{'\n'}GOAL</Text>
                <Text style={[styles.snapshotValueSerif, { fontSize: 18, color: COLORS.primary }]}>
                  Wellness{'\n'}Goal
                </Text>
                <View />
              </View>
            </View>

            <Text style={styles.disclaimerBodyText}>
              <Text style={{ fontWeight: '700', color: '#8D8880' }}>Disclaimer:</Text> Veyra provides general nutrition and wellness guidance, not medical advice. If you have a medical condition, are pregnant, have a history of eating disorders, or need therapeutic nutrition, consult a qualified healthcare professional. Do not use this tool to create extreme calorie restrictions.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SCREEN 3: RECIPES SCREEN
  // ==========================================
  if (currentScreen === 'RECIPES') {
    const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];

    const recipesList = apiRecipes.length > 0
      ? apiRecipes.map((r: any, idx: number) => {
          const rec = r.recipeData || r;
          const rawId = r.id || rec.id;
          const validId = rawId && rawId !== 'will_be_generated_by_db' ? rawId : `api_recipe_${idx}`;
          const title = rec.title || 'Curated Meal';
          let cat = rec.category || 'Lunch';

          // Normalize generic categories like "High Protein" to meal types based on dish title
          const titleLower = title.toLowerCase();
          if (cat === 'High Protein' || cat === 'Low Carb' || cat === 'Healthy' || !['Breakfast', 'Lunch', 'Dinner', 'Snacks'].includes(cat)) {
            if (titleLower.includes('oat') || titleLower.includes('pancake') || titleLower.includes('berry') || titleLower.includes('egg')) {
              cat = 'Breakfast';
            } else if (titleLower.includes('chicken') || titleLower.includes('salad') || titleLower.includes('wrap') || titleLower.includes('quinoa')) {
              cat = 'Lunch';
            } else if (titleLower.includes('paneer') || titleLower.includes('soup') || titleLower.includes('curry') || titleLower.includes('salmon')) {
              cat = 'Dinner';
            } else {
              cat = idx % 2 === 0 ? 'Lunch' : 'Dinner';
            }
          }

          const img = resolveImageUri(rec.image, title, cat, idx);
          
          return {
            id: validId,
            title: title,
            time: rec.time || '20 mins',
            cal: rec.calories ? (typeof rec.calories === 'string' ? rec.calories : `${rec.calories} kcal`) : '350 kcal',
            img: img,
            cat: cat,
            tags: Array.isArray(rec.tags) && rec.tags.length > 0 ? rec.tags : [cat, 'High Protein'],
            prep: rec.prep || '10 mins',
            cook: rec.cook || '15 mins',
            servings: rec.servings || '1 serving',
            benefits: rec.benefits || rec.description,
            ingredients: rec.ingredients || [],
            instructions: rec.instructions || [],
            macros: rec.macros,
            screen: 'RECIPE_DETAIL',
          };
        })
      : staticRecipes;

    const filtered = recipesList.filter((r: any) => {
      // 1. Category Matching
      let matchCat = true;
      if (recipeCategory !== 'All') {
        const targetCat = recipeCategory.toLowerCase();
        const itemCat = (r.cat || '').toLowerCase();
        const itemTags = Array.isArray(r.tags) ? r.tags.map((t: string) => t.toLowerCase()) : [];

        matchCat =
          itemCat.includes(targetCat) ||
          targetCat.includes(itemCat) ||
          itemTags.some((t: string) => t.includes(targetCat) || targetCat.includes(t));

        // Keyword fallbacks for Breakfast/Lunch/Dinner/Snacks
        if (!matchCat) {
          const titleLower = r.title.toLowerCase();
          if (targetCat === 'breakfast') {
            matchCat = titleLower.includes('oat') || titleLower.includes('pancake') || titleLower.includes('berry') || titleLower.includes('egg');
          } else if (targetCat === 'lunch') {
            matchCat = titleLower.includes('salad') || titleLower.includes('bowl') || titleLower.includes('chicken') || titleLower.includes('wrap');
          } else if (targetCat === 'dinner') {
            matchCat = titleLower.includes('paneer') || titleLower.includes('soup') || titleLower.includes('quinoa') || titleLower.includes('curry') || titleLower.includes('salmon');
          } else if (targetCat === 'snacks') {
            matchCat = titleLower.includes('tea') || titleLower.includes('fruit') || titleLower.includes('snack') || titleLower.includes('nut');
          }
        }
      }

      // 2. Search Query Matching across title, category, and tags
      let matchQuery = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = r.title.toLowerCase().includes(q);
        const catMatch = (r.cat || '').toLowerCase().includes(q);
        const tagMatch = Array.isArray(r.tags) && r.tags.some((t: string) => t.toLowerCase().includes(q));
        const ingMatch = Array.isArray(r.ingredients) && r.ingredients.some((i: string) => i.toLowerCase().includes(q));
        
        matchQuery = titleMatch || catMatch || tagMatch || ingMatch;
      }

      return matchCat && matchQuery;
    });

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.breadcrumbLink} onPress={() => setCurrentScreen('HUB')}>
            <Ionicons name="chevron-back" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.breadcrumbText}>Recipes</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitleSerif}>Healthy Recipes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterPill, recipeCategory === cat && styles.filterPillActive]}
                  onPress={() => setRecipeCategory(cat)}
                >
                  <Text style={[styles.filterPillText, recipeCategory === cat && styles.filterPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Search Row with Filter Button (Exact UI Match) */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search recipes..."
                placeholderTextColor={COLORS.textMuted}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterIconBtn} activeOpacity={0.7}>
              <Ionicons name="options-outline" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          {/* Generate AI Recipes Button (Web AI Integration) */}
          <TouchableOpacity
            style={styles.generateAiRecipesBtn}
            onPress={generateRecipes}
            disabled={isGeneratingRecipes}
            activeOpacity={0.8}
          >
            {isGeneratingRecipes ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.generateAiRecipesBtnText}>✨ AI IS COOKING...</Text>
              </View>
            ) : (
              <Text style={styles.generateAiRecipesBtnText}>✨ GENERATE AI RECIPES ↻</Text>
            )}
          </TouchableOpacity>

          {/* 2x2 Recipe Cards Grid (Exact UI Match) */}
          <View style={styles.recipeGrid}>
            {filtered.map((item, idx) => (
              <TouchableOpacity
                key={item.id && item.id !== 'will_be_generated_by_db' ? `${item.id}_${idx}` : `recipe_card_${idx}`}
                style={styles.recipeGridCard}
                onPress={() => {
                  setSelectedRecipe(item);
                  setCurrentScreen('RECIPE_DETAIL' as ScreenType);
                }}
                activeOpacity={0.85}
              >
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: item.img }} style={styles.recipeGridImg} />
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => toggleSaveRecipe(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={savedRecipes[item.id] ? 'heart' : 'heart-outline'}
                      size={18}
                      color={savedRecipes[item.id] ? '#D9534F' : COLORS.textDark}
                    />
                  </TouchableOpacity>
                </View>
                <View style={{ padding: 12 }}>
                  <Text style={styles.recipeGridTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.recipeGridMeta}>
                    {item.time}  •  {item.cal}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SCREEN 4: RECIPE DETAIL (OVERNIGHT OATS)
  // ==========================================
  if (currentScreen === 'RECIPE_DETAIL_OATS') {
    const isSaved = savedRecipes['oats'];
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.breadcrumbLink} onPress={() => setCurrentScreen('RECIPES')}>
            <Ionicons name="chevron-back" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.breadcrumbText}>Recipes</Text>
          </TouchableOpacity>
          <View style={styles.detailHeroContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=800&auto=format&fit=crop' }}
              style={styles.detailHeroImg}
            />
            <TouchableOpacity style={styles.detailBackBtn} onPress={() => setCurrentScreen('RECIPES')}>
              <Ionicons name="chevron-back" size={20} color={COLORS.textDark} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailBookmarkBtn} onPress={() => toggleSaveRecipe('oats')}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.detailBodyContainer}>
            <Text style={styles.detailTitle}>Overnight Oats</Text>

            <View style={styles.tagsRow}>
              {['Breakfast', 'High Protein', 'Easy'].map((t, idx) => (
                <View key={idx} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                <Text style={styles.statVal}>15 mins</Text>
                <Text style={styles.statLbl}>Prep time</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flame-outline" size={16} color={COLORS.primary} />
                <Text style={styles.statVal}>0 mins</Text>
                <Text style={styles.statLbl}>Cook time</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color={COLORS.primary} />
                <Text style={styles.statVal}>2 servings</Text>
                <Text style={styles.statLbl}>Serves</Text>
              </View>
            </View>

            <Text style={styles.detailSectionTitle}>Ingredients</Text>
            <View style={styles.listContainer}>
              {[
                '1/2 cup rolled oats',
                '1/2 cup milk (or almond milk)',
                '1 tbsp chia seeds',
                '1/2 banana',
                '1 tsp honey (optional)',
                'Toppings: berries, nuts',
              ].map((ing, idx) => (
                <View key={idx} style={styles.listItemRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.listText}>{ing}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.detailSectionTitle}>Instructions</Text>
            <View style={styles.listContainer}>
              {[
                '1. In a jar, add oats, chia seeds and milk.',
                '2. Mix well and refrigerate overnight.',
                '3. Top with banana, berries and nuts before serving.',
              ].map((inst, idx) => (
                <Text key={idx} style={styles.instructionText}>{inst}</Text>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.stickyBottomBar}>
          <TouchableOpacity style={styles.saveRecipeBtn} onPress={() => toggleSaveRecipe('oats')}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveRecipeBtnText}>{isSaved ? 'Saved Recipe' : 'Save Recipe'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ==========================================
  // SCREEN 5: GROOMING SCREEN
  // ==========================================
  if (currentScreen === 'GROOMING') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.breadcrumbLink} onPress={() => setCurrentScreen('HUB')}>
            <Ionicons name="chevron-back" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.breadcrumbText}>Grooming</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitleSerif}>Grooming Guide</Text>
          <View style={styles.tabPillRow}>
            {['Skincare', 'Hair Care', 'Body Care'].map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.tabPill, groomingCategory === cat && styles.tabPillActive]}
                onPress={() => setGroomingCategory(cat)}
              >
                <Text style={[styles.tabPillText, groomingCategory === cat && styles.tabPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.groomingBannerCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop' }}
              style={styles.groomingBannerImg}
            />
            <View style={styles.groomingBannerOverlay}>
              <Text style={styles.groomingBannerTitle}>Your Skincare Routine</Text>
              <Text style={styles.groomingBannerSub}>Simple. Effective. For your skin type.</Text>
            </View>
          </View>

          <View style={{ gap: 10, marginTop: 12 }}>
            {[
              {
                icon: 'flask',
                title: 'Cleanser',
                sub: 'Keep your skin fresh and clean',
                screen: 'GROOMING_DETAIL',
              },
              {
                icon: 'water',
                title: 'Toner',
                sub: 'Balances pH and refreshes',
                screen: 'GROOMING_DETAIL',
              },
              {
                icon: 'sparkles',
                title: 'Moisturizer',
                sub: 'Locks in hydration',
                screen: 'GROOMING_DETAIL',
              },
              {
                icon: 'sunny',
                title: 'Sunscreen',
                sub: 'Protects from UV damage',
                screen: 'GROOMING_DETAIL',
              },
              {
                icon: 'cut',
                title: 'Weekly Care',
                sub: 'Exfoliation & face masks',
                screen: 'GROOMING_DETAIL',
              },
            ].map((step, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.routineStepCard}
                onPress={() => setCurrentScreen(step.screen as ScreenType)}
              >
                <View style={styles.routineIconCircle}>
                  <Ionicons name={step.icon as any} size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.routineTitle}>{step.title}</Text>
                  <Text style={styles.routineSub}>{step.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SCREEN 6: LIFESTYLE SCREEN
  // ==========================================
  if (currentScreen === 'LIFESTYLE') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.breadcrumbLink} onPress={() => setCurrentScreen('HUB')}>
            <Ionicons name="chevron-back" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.breadcrumbText}>Lifestyle</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitleSerif}>Lifestyle Guide</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['All', 'Habits', 'Stress', 'Sleep', 'Mindset'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterPill, lifestyleCategory === cat && styles.filterPillActive]}
                  onPress={() => setLifestyleCategory(cat)}
                >
                  <Text style={[styles.filterPillText, lifestyleCategory === cat && styles.filterPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.lifestyleBannerCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop' }}
              style={styles.lifestyleBannerImg}
            />
            <View style={styles.lifestyleBannerOverlay}>
              <Text style={styles.lifestyleBannerTitle}>Small habits. Big changes.</Text>
              <Text style={styles.lifestyleBannerSub}>Your daily guide to a healthier, happier you.</Text>
            </View>
          </View>

          <View style={{ gap: 10, marginTop: 12 }}>
            {[
              {
                icon: 'walk',
                title: 'Daily Habits',
                sub: 'Build routines that stick',
                screen: 'LIFESTYLE_TIPS',
              },
              {
                icon: 'fitness',
                title: 'Stress Management',
                sub: 'Stay calm, stay balanced',
                screen: 'LIFESTYLE_TIPS',
              },
              {
                icon: 'moon',
                title: 'Better Sleep',
                sub: 'Rest for a healthier you',
                screen: 'LIFESTYLE_TIPS',
              },
              {
                icon: 'flower',
                title: 'Mindful Living',
                sub: 'Be present, be happier',
                screen: 'LIFESTYLE_TIPS',
              },
            ].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.routineStepCard}
                onPress={() => setCurrentScreen(item.screen as ScreenType)}
              >
                <View style={styles.routineIconCircle}>
                  <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.routineTitle}>{item.title}</Text>
                  <Text style={styles.routineSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SCREEN 7: NUTRITION PLAN SCREEN
  // ==========================================
  if (currentScreen === 'NUTRITION_PLAN') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.breadcrumbLink} onPress={() => setCurrentScreen('HUB')}>
            <Ionicons name="chevron-back" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.breadcrumbText}>Nutrition</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitleSerif}>Nutrition Plan</Text>
          <View style={styles.tabPillRow}>
            {[
              { id: 'WEEKLY', label: 'Weekly Plan' },
              { id: 'CUSTOM', label: 'Custom Plan' },
            ].map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.tabPill, planType === p.id && styles.tabPillActive]}
                onPress={() => setPlanType(p.id as any)}
              >
                <Text style={[styles.tabPillText, planType === p.id && styles.tabPillTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 8, marginBottom: 12 }}>
            <Text style={styles.screenSectionTitle}>Your Personalized Plan</Text>
            <Text style={styles.screenSectionSub}>Based on your goals, body data and preferences.</Text>
          </View>

          <View style={styles.daysBar}>
            {days.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.dayPill, selectedDay === d && styles.dayPillActive]}
                onPress={() => setSelectedDay(d)}
              >
                <Text style={[styles.dayPillText, selectedDay === d && styles.dayPillTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ gap: 10, marginTop: 14 }}>
            {[
              {
                meal: 'Breakfast',
                item: 'Oats + banana + chia seeds',
                cal: '~ 420 kcal',
                img: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=150&auto=format&fit=crop',
                screen: 'RECIPE_DETAIL_OATS',
              },
              {
                meal: 'Mid-Morning Snack',
                item: 'Green tea + nuts',
                cal: '~ 180 kcal',
                img: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?q=80&w=150&auto=format&fit=crop',
                screen: 'RECIPE_DETAIL_OATS',
              },
              {
                meal: 'Lunch',
                item: 'Paneer & mixed veg bowl',
                cal: '~ 550 kcal',
                img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=150&auto=format&fit=crop',
                screen: 'RECIPE_DETAIL_PANEER',
              },
              {
                meal: 'Evening Snack',
                item: 'Fruit bowl',
                cal: '~ 150 kcal',
                img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=150&auto=format&fit=crop',
                screen: 'RECIPE_DETAIL_OATS',
              },
              {
                meal: 'Dinner',
                item: 'Veg soup + quinoa',
                cal: '~ 530 kcal',
                img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=150&auto=format&fit=crop',
                screen: 'RECIPE_DETAIL_PANEER',
              },
            ].map((m, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.planMealCard}
                onPress={() => setCurrentScreen(m.screen as ScreenType)}
              >
                <Image source={{ uri: m.img }} style={styles.planMealThumb} />
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.planMealTitle}>{m.meal}</Text>
                  <Text style={styles.planMealDesc}>{m.item}</Text>
                  <Text style={styles.planMealCal}>{m.cal}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SCREEN 8: DYNAMIC RECIPE DETAIL SCREEN
  // ==========================================
  if (currentScreen === 'RECIPE_DETAIL' || currentScreen === 'RECIPE_DETAIL_OATS' || currentScreen === 'RECIPE_DETAIL_PANEER') {
    const defaultItem = currentScreen === 'RECIPE_DETAIL_OATS'
      ? {
          id: 'oats',
          title: 'High-Protein Berry Oats',
          time: '15 mins',
          cal: '350 kcal',
          img: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=800&auto=format&fit=crop',
          cat: 'Breakfast',
          tags: ['Breakfast', 'High Protein', 'Gluten-Free'],
          prep: '10 mins',
          cook: '5 mins',
          servings: '1 serving',
          benefits: 'Rich in antioxidants and complex carbohydrates to support morning focus and skin radiance.',
          ingredients: [
            '1/2 cup rolled oats',
            '1 scoop vanilla whey/plant protein powder',
            '1 cup unsweetened almond milk',
            '1/2 cup fresh mixed berries',
            '1 tbsp chia seeds & sliced almonds'
          ],
          instructions: [
            '1. Combine oats, almond milk, and chia seeds in a small saucepan over medium heat for 5 minutes.',
            '2. Remove from heat and stir in the protein powder until smooth.',
            '3. Top with fresh berries and almonds before serving warm.'
          ]
        }
      : {
          id: 'paneer',
          title: 'Paneer & Mixed Veg Bowl',
          time: '25 mins',
          cal: '550 kcal',
          img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
          cat: 'Lunch',
          tags: ['Lunch', 'High Protein', 'Vegetarian'],
          prep: '15 mins',
          cook: '10 mins',
          servings: '2 servings',
          benefits: 'High protein content supports muscle recovery while fiber-rich vegetables optimize gut digestion.',
          ingredients: [
            '100 g fresh paneer cubes',
            '1/2 cup mixed vegetables (beans, carrot, capsicum)',
            '1 tsp extra virgin olive oil',
            '1/2 onion & 1 diced tomato',
            'Himalayan sea salt, black pepper, & herbs'
          ],
          instructions: [
            '1. Heat olive oil in a pan and sauté diced onions and mixed vegetables for 3-5 minutes.',
            '2. Add fresh paneer cubes and season generously with sea salt, pepper, and herbs.',
            '3. Toss gently over medium heat for 5-7 minutes until lightly golden and serve warm.'
          ]
        };

    const item = selectedRecipe || defaultItem;
    const isSaved = savedRecipes[item.id] || false;
    const heroImg = resolveImageUri(item.img || item.image, item.title, item.cat);
    const recipeTags = item.tags || [item.cat || 'Nutritious', 'AI Prescribed'];
    const ingredientsList = Array.isArray(item.ingredients) && item.ingredients.length > 0 ? item.ingredients : [
      '1 cup whole food grains or oats',
      '150g lean protein source (tofu, paneer, or chicken)',
      '1 cup fresh greens or vegetables',
      '1 tbsp cold-pressed olive oil or seeds',
      'Pinch of sea salt & fresh herbs'
    ];
    const instructionsList = Array.isArray(item.instructions) && item.instructions.length > 0 ? item.instructions : [
      '1. Prepare all fresh produce and measure ingredients according to calculated targets.',
      '2. Sauté or cook protein source over medium heat with healthy oil until lightly golden.',
      '3. Assemble in a serving bowl with seasoned vegetables and enjoy fresh.'
    ];

    return (
      <View style={[styles.container, { backgroundColor: '#FBF9F5' }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {/* Edge-to-Edge Hero Image with Circular Header Action Buttons */}
          <View style={styles.detailHeroContainer}>
            <Image
              source={{ uri: heroImg }}
              style={styles.detailHeroImg}
            />
            <TouchableOpacity style={styles.detailBackBtn} onPress={() => setCurrentScreen('RECIPES')} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={20} color="#2D3F33" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailBookmarkBtn} onPress={() => toggleSaveRecipe(item.id)} activeOpacity={0.8}>
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={20}
                color={isSaved ? '#D9534F' : '#2D3F33'}
              />
            </TouchableOpacity>
          </View>

          {/* Main Recipe Card Detail Content */}
          <View style={styles.detailBodyContainer}>
            <Text style={styles.detailTitle}>{item.title}</Text>

            <View style={styles.tagsRow}>
              {recipeTags.map((t: string, idx: number) => (
                <View key={idx} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>

            {/* 3-Column Stats Row with Dividers */}
            <View style={styles.statsRow}>
              <View style={styles.statItemCol}>
                <Ionicons name="time-outline" size={20} color="#2D3F33" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.statVal}>{item.prep || item.time || '15 mins'}</Text>
                  <Text style={styles.statLbl}>Prep time</Text>
                </View>
              </View>

              <View style={styles.statDividerVertical} />

              <View style={styles.statItemCol}>
                <Ionicons name="stopwatch-outline" size={20} color="#2D3F33" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.statVal}>{item.cook || '0 mins'}</Text>
                  <Text style={styles.statLbl}>Cook time</Text>
                </View>
              </View>

              <View style={styles.statDividerVertical} />

              <View style={styles.statItemCol}>
                <Ionicons name="people-outline" size={20} color="#2D3F33" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.statVal}>{item.servings || '2 servings'}</Text>
                  <Text style={styles.statLbl}>Serves</Text>
                </View>
              </View>
            </View>

            {/* Clinical Benefit / Summary Callout Box */}
            {item.benefits && (
              <View style={{ backgroundColor: '#F4F0E6', padding: 14, borderRadius: 16, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#2D3F33' }}>
                <Text style={{ fontSize: 13, color: '#2D3F33', lineHeight: 19 }}>
                  ✨ <Text style={{ fontWeight: '700' }}>Clinical Benefit:</Text> {item.benefits}
                </Text>
              </View>
            )}

            {/* Ingredients Section */}
            <Text style={styles.detailSectionTitle}>Ingredients</Text>
            <View style={{ marginBottom: 24 }}>
              {ingredientsList.map((ing: string, idx: number) => {
                const cleanIng = ing.replace(/^[•\-\*]\s*/, '');
                return (
                  <View key={idx} style={styles.ingredientRow}>
                    <Text style={styles.bulletDotStyle}>•</Text>
                    <Text style={styles.ingredientTextStyle}>{cleanIng}</Text>
                  </View>
                );
              })}
            </View>

            {/* Instructions Section */}
            <Text style={styles.detailSectionTitle}>Instructions</Text>
            <View style={{ marginBottom: 28 }}>
              {instructionsList.map((inst: string, idx: number) => {
                const stepNum = idx + 1;
                const cleanInst = inst.replace(/^\d+[\.\)]\s*/, '');
                return (
                  <View key={idx} style={styles.instructionRow}>
                    <Text style={styles.instructionNumStyle}>{stepNum}.</Text>
                    <Text style={styles.instructionTextStyle}>{cleanInst}</Text>
                  </View>
                );
              })}
            </View>

            {/* Bottom Full-Width Save Recipe Pill Button */}
            <TouchableOpacity style={styles.saveRecipePillBtn} onPress={() => toggleSaveRecipe(item.id)} activeOpacity={0.85}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveRecipePillBtnText}>{isSaved ? 'Saved Recipe' : 'Save Recipe'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SCREEN 9: GROOMING DETAIL SCREEN
  // ==========================================
  if (currentScreen === 'GROOMING_DETAIL') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.breadcrumbLink} onPress={() => setCurrentScreen('GROOMING')}>
            <Ionicons name="chevron-back" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.breadcrumbText}>Grooming</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitleSerif}>Grooming Detail</Text>
          <View style={styles.productCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400&auto=format&fit=crop' }}
              style={styles.productImg}
            />
            <View style={{ flex: 1, paddingLeft: 14 }}>
              <Text style={styles.productTitle}>Hydrating Face Moisturizer</Text>
              <Text style={styles.productSub}>Lightweight • Non-greasy • For all skin types</Text>
            </View>
          </View>

          <Text style={styles.detailSectionTitle}>Benefits</Text>
          <View style={styles.benefitsCard}>
            {[
              'Provides long-lasting hydration',
              'Keeps skin soft and smooth',
              'Helps maintain skin barrier',
            ].map((b, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.detailSectionTitle}>How to use</Text>
          <View style={styles.howToCard}>
            {[
              '1. Cleanse your face.',
              '2. Apply a small amount.',
              '3. Massage gently until absorbed.',
            ].map((step, idx) => (
              <Text key={idx} style={styles.instructionText}>{step}</Text>
            ))}
          </View>

          <View style={styles.proTipCard}>
            <Text style={styles.proTipText}>
              💡 <Text style={{ fontWeight: 'bold' }}>Pro tip:</Text> Use it twice daily for best results.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // SCREEN 10: LIFESTYLE TIPS DETAIL SCREEN
  // ==========================================
  if (currentScreen === 'LIFESTYLE_TIPS') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.breadcrumbLink} onPress={() => setCurrentScreen('LIFESTYLE')}>
            <Ionicons name="chevron-back" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.breadcrumbText}>Lifestyle</Text>
          </TouchableOpacity>
          <View style={styles.tipsBannerCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop' }}
              style={styles.tipsBannerImg}
            />
          </View>

          <Text style={styles.tipsTitle}>Manage Stress Naturally</Text>
          <Text style={styles.tipsIntro}>
            A calm mind leads to healthy skin and better well-being. Try these simple tips:
          </Text>

          <View style={{ gap: 10, marginTop: 12 }}>
            {[
              {
                icon: 'leaf-outline',
                title: 'Practice deep breathing',
                sub: '5 mins a day',
              },
              {
                icon: 'tree-outline',
                title: 'Spend time in nature',
                sub: "Even if it's just 30 mins",
              },
              {
                icon: 'phone-portrait-outline',
                title: 'Limit screen time',
                sub: 'Especially before bed',
              },
              {
                icon: 'people-outline',
                title: 'Stay connected',
                sub: 'Talk to people you trust',
              },
            ].map((tip, idx) => (
              <TouchableOpacity key={idx} style={styles.tipCardItem}>
                <View style={styles.tipIconCircle}>
                  <Ionicons name={tip.icon as any} size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.tipCardTitle}>{tip.title}</Text>
                  <Text style={styles.tipCardSub}>{tip.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}

// ==========================================
// STYLESHEET - EXACT MATCHING REFERENCE IMAGES
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    position: 'relative',
  },
  botanicalSvg: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 0,
    pointerEvents: 'none',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    zIndex: 1,
  },

  // HUB & CATEGORY STYLES
  hubHeaderContainer: {
    marginBottom: 20,
    marginTop: 4,
  },
  hubTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.5,
  },
  hubSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryPillItem: {
    alignItems: 'center',
    width: (width - 64) / 4,
  },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
  },

  // HERO CARD
  heroCardExact: {
    backgroundColor: COLORS.heroBg,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroFoodImageWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  heroFoodImage: {
    width: '100%',
    height: '100%',
  },
  heroContentRight: {
    flex: 1,
  },
  heroTitleExact: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  heroSubtextExact: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  heroPillBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // QUICK ACTIONS
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitleExact: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  quickActionsList: {
    gap: 12,
    marginBottom: 20,
  },
  actionCardExact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitleExact: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  actionSubExact: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // TAB PILLS & SECTION HEADINGS
  tabPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  screenSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  screenSectionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // BREADCRUMB & TITLES
  breadcrumbLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  breadcrumbText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  pageTitleSerif: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  ovalRegenBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  ovalRegenBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // 2x2 MACRO CARDS GRID
  macroGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  darkMacroCard: {
    width: '48%',
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    minHeight: 125,
    shadowColor: '#2D3F33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  caloriesLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.calorieGreenLabel,
    letterSpacing: 0.8,
  },
  caloriesValueSerif: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  caloriesUnitSub: {
    fontSize: 12,
    color: '#E2EFE5',
    fontWeight: '500',
  },
  whiteMacroCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
    minHeight: 125,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  whiteMacroLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.labelMuted,
    letterSpacing: 0.8,
  },
  whiteMacroValueSerif: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  whiteMacroUnit: {
    fontSize: 13,
    fontWeight: 'normal',
    color: COLORS.labelMuted,
  },

  // AI CLINICAL SUMMARY BOX
  aiSummaryBoxExact: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  sparkleIconExact: {
    fontSize: 20,
  },
  aiSummaryQuoteText: {
    fontSize: 13,
    color: '#4A5A4D',
    lineHeight: 20,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    flex: 1,
  },

  // PERSONALIZED PLAN SECTION
  personalizedPlanTitleSerif: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  mealCardContainerExact: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealHeaderRowExact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  crescentMoonIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  mealTitleTextSerif: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    flex: 1,
  },
  mealInnerBoxExact: {
    backgroundColor: COLORS.innerBoxBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  macroTargetHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  macroTargetBodyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  macroPillsRowExact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  whitePillBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  whitePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  greenPillBadge: {
    backgroundColor: COLORS.badgeGreen,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(45, 69, 47, 0.2)',
  },
  greenPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.badgeGreenText,
  },

  // HYDRATION CARD
  hydrationCardExact: {
    backgroundColor: COLORS.hydrationBg,
    borderRadius: 24,
    padding: 20,
    marginTop: 18,
    marginBottom: 16,
  },
  hydrationTitleTextBold: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 20,
    marginBottom: 6,
  },
  hydrationSubtextBody: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  // WELLNESS TIPS CARD
  wellnessTipsCardExact: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  wellnessTipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bulbIconExact: {
    fontSize: 22,
    marginRight: 10,
  },
  wellnessTipsTitleSerif: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  tipDiamondRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  diamondStarIcon: {
    fontSize: 10,
    color: COLORS.labelMuted,
    marginRight: 10,
    marginTop: 4,
  },
  tipItemBodyText: {
    fontSize: 12,
    color: COLORS.textDark,
    lineHeight: 18,
    flex: 1,
  },

  // NUTRITION SNAPSHOT (1:1 Image Match)
  snapshotCardExact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  snapshotHeadingSerif: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 20,
  },
  snapshotGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  snapshotInnerBox: {
    width: '48%',
    backgroundColor: '#FAF7F2',
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 125,
  },
  snapshotLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.labelMuted,
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  snapshotValueSerif: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 30,
  },
  snapshotSubLabel: {
    fontSize: 8.5,
    color: COLORS.textLight,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 11,
    textTransform: 'uppercase',
  },
  unitTextSmall: {
    fontSize: 13,
    fontWeight: 'normal',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  disclaimerBodyText: {
    fontSize: 11,
    color: '#8D8880',
    lineHeight: 16.5,
    marginTop: 4,
  },

  // HEADER & COMMON
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rightIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // RECIPES & GROOMING STYLES
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  filterPillTextActive: {
    color: '#FFF',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
  },
  filterIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  generateAiRecipesBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#2D3F33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  generateAiRecipesBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  recipeGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  recipeGridImg: {
    width: '100%',
    height: 135,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeGridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  recipeGridMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  detailHeroContainer: {
    position: 'relative',
    height: 250,
    width: '100%',
  },
  detailHeroImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailBackBtn: {
    position: 'absolute',
    top: 40,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  detailBookmarkBtn: {
    position: 'absolute',
    top: 40,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  detailBodyContainer: {
    paddingHorizontal: 22,
    paddingTop: 22,
    backgroundColor: '#FBF9F5',
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2D3F33',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
  },
  tagBadge: {
    backgroundColor: '#EFECE6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3F33',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#FBF9F5',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EAE6DD',
    marginBottom: 24,
  },
  statItemCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statDividerVertical: {
    width: 1,
    height: 32,
    backgroundColor: '#EAE6DD',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D3F33',
  },
  statLbl: {
    fontSize: 11,
    color: '#8C8880',
    marginTop: 1,
  },
  detailSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3F33',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 8,
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletDotStyle: {
    fontSize: 16,
    color: '#2D3F33',
    marginRight: 10,
    lineHeight: 22,
  },
  ingredientTextStyle: {
    fontSize: 14,
    color: '#2D3F33',
    lineHeight: 22,
    flex: 1,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumStyle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3F33',
    marginRight: 8,
    lineHeight: 22,
  },
  instructionTextStyle: {
    fontSize: 14,
    color: '#2D3F33',
    lineHeight: 22,
    flex: 1,
  },
  saveRecipePillBtn: {
    backgroundColor: '#354B3C',
    borderRadius: 28,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  saveRecipePillBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveRecipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 14,
  },
  saveRecipeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },

  groomingBannerCard: {
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  groomingBannerImg: {
    ...StyleSheet.absoluteFill,
  },
  groomingBannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(31, 41, 34, 0.4)',
    padding: 14,
    justifyContent: 'center',
  },
  groomingBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  groomingBannerSub: {
    fontSize: 11,
    color: '#E7EBE8',
    marginTop: 2,
  },

  routineStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  routineIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  routineSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  lifestyleBannerCard: {
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  lifestyleBannerImg: {
    ...StyleSheet.absoluteFill,
  },
  lifestyleBannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(31, 41, 34, 0.45)',
    padding: 14,
    justifyContent: 'center',
  },
  lifestyleBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  lifestyleBannerSub: {
    fontSize: 11,
    color: '#E7EBE8',
    marginTop: 2,
  },

  daysBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  dayPillTextActive: {
    color: '#FFF',
  },

  planMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planMealThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  planMealTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  planMealDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  planMealCal: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  productImg: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  productSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 13,
    color: COLORS.textDark,
  },
  howToCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  proTipCard: {
    backgroundColor: '#E7EBE8',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  proTipText: {
    fontSize: 12,
    color: COLORS.textDark,
    lineHeight: 18,
  },

  tipsBannerCard: {
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  tipsBannerImg: {
    width: '100%',
    height: '100%',
  },
  tipsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  tipsIntro: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 18,
  },
  tipCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  tipCardSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
