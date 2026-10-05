'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../../lib/api';

type TabType = 'HUB' | 'NUTRITION' | 'RECIPES' | 'GROOMING' | 'LIFESTYLE' | 'PLAN';

interface RecipeModalData {
  title: string;
  tags: string[];
  prep: string;
  cook: string;
  servings: string;
  img: string;
  ingredients: string[];
  instructions: string[];
}

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

export default function WellnessPage() {
  const [activeTab, setActiveTab] = useState<TabType>('HUB');
  const [recipeCategory, setRecipeCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedRecipes, setSavedRecipes] = useState<Record<string, boolean>>({ oats: true, paneer: true });
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [selectedRecipeModal, setSelectedRecipeModal] = useState<RecipeModalData | null>(null);

  // Dynamic API state
  const [nutritionPlan, setNutritionPlan] = useState<any>(DEFAULT_NUTRITION_PLAN);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const data = await fetchApi('/nutrition');
      if (data && data.targetCalories) {
        setNutritionPlan(data);
      }
    } catch (err) {
      // Keep default plan
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

  const toggleSave = (id: string) => {
    setSavedRecipes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const recipes = [
    {
      id: 'oats',
      title: 'Overnight Oats',
      tags: ['Breakfast', 'High Protein', 'Easy'],
      prep: '15 mins',
      cook: '0 mins',
      servings: '2 servings',
      cal: '320 kcal',
      cat: 'Breakfast',
      img: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=600&auto=format&fit=crop',
      ingredients: [
        '1/2 cup rolled oats',
        '1/2 cup milk (or almond milk)',
        '1 tbsp chia seeds',
        '1/2 banana',
        '1 tsp honey (optional)',
        'Toppings: berries, nuts',
      ],
      instructions: [
        '1. In a jar, add oats, chia seeds and milk.',
        '2. Mix well and refrigerate overnight.',
        '3. Top with banana, berries and nuts before serving.',
      ],
    },
    {
      id: 'paneer',
      title: 'Paneer & Mixed Veg Bowl',
      tags: ['Lunch', 'High Protein', 'Vegetarian'],
      prep: '25 mins',
      cook: '15 mins',
      servings: '2 servings',
      cal: '420 kcal',
      cat: 'Lunch',
      img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
      ingredients: [
        '100 g paneer',
        '1/2 cup mixed vegetables (beans, carrot, capsicum)',
        '1 tsp olive oil',
        '1/2 onion, 1 tomato',
        'Salt, pepper, herbs',
      ],
      instructions: [
        '1. Heat olive oil in a pan, sauté onions and vegetables.',
        '2. Add paneer cubes and season with salt, pepper, and herbs.',
        '3. Toss for 5-7 minutes until lightly golden and serve warm.',
      ],
    },
    {
      id: 'quinoa',
      title: 'Veg Quinoa Bowl',
      tags: ['Dinner', 'Fiber Rich'],
      prep: '20 mins',
      cook: '15 mins',
      servings: '2 servings',
      cal: '380 kcal',
      cat: 'Dinner',
      img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop',
      ingredients: ['1 cup cooked quinoa', '1/2 cup roasted chickpeas', '1/2 avocado', 'Lemon dressing'],
      instructions: ['Assemble cooked quinoa in a bowl, top with chickpeas & avocado. Drizzle lemon dressing.'],
    },
    {
      id: 'soup',
      title: 'Tomato Soup',
      tags: ['Snacks', 'Low Calorie'],
      prep: '15 mins',
      cook: '10 mins',
      servings: '2 servings',
      cal: '250 kcal',
      cat: 'Snacks',
      img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=600&auto=format&fit=crop',
      ingredients: ['4 ripe tomatoes', '2 cloves garlic', 'Olive oil', 'Fresh basil'],
      instructions: ['Roast tomatoes and garlic, blend smooth, simmer with basil for 10 minutes.'],
    },
  ];

  const filteredRecipes = recipes.filter(r => {
    const matchCat = recipeCategory === 'All' || r.cat === recipeCategory;
    const matchQuery = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const plan = nutritionPlan;
  const mealsList = plan?.planData?.meals || DEFAULT_NUTRITION_PLAN.planData.meals;
  const tipsList = plan?.planData?.tips || DEFAULT_NUTRITION_PLAN.planData.tips;

  return (
    <div className="space-y-8 pb-16 text-[#283B2E] max-w-6xl mx-auto">
      {/* 1. TOP HEADER WITH BOTANICAL ARTWORK */}
      <section className="bg-[#F5F2EA] rounded-[32px] border border-[#ECE7DF] p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <svg
          className="absolute -top-4 -right-4 w-44 h-44 text-[#B1C0AA] pointer-events-none opacity-40"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M 85 0 C 70 30, 45 60, 20 85" strokeLinecap="round" />
          <path d="M 75 10 C 60 5, 55 15, 75 10 Z" fill="currentColor" />
          <path d="M 80 18 C 95 20, 90 35, 80 18 Z" fill="currentColor" />
          <path d="M 58 32 C 42 25, 38 40, 58 32 Z" fill="currentColor" />
          <path d="M 62 38 C 78 40, 72 55, 62 38 Z" fill="currentColor" />
        </svg>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight text-[#283B2E]">
              Wellness
            </h1>
            <p className="text-sm text-[#657367] mt-1.5 font-medium">
              Better food. Better habits. A healthier you.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-[#EAE6DF] p-2 rounded-2xl border border-[#ECE7DF]">
            {[
              { id: 'HUB', label: 'Overview', icon: '✨' },
              { id: 'NUTRITION', label: 'Nutrition', icon: '🍎' },
              { id: 'RECIPES', label: 'Recipes', icon: '🍲' },
              { id: 'GROOMING', label: 'Grooming', icon: '🧴' },
              { id: 'LIFESTYLE', label: 'Lifestyle', icon: '🌿' },
              { id: 'PLAN', label: 'Custom Plan', icon: '📅' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#283B2E] text-white shadow-sm'
                    : 'text-[#657367] hover:bg-[#FAF8F3] hover:text-[#283B2E]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. OVERVIEW */}
      {activeTab === 'HUB' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'NUTRITION', label: 'Nutrition', icon: '🍎' },
              { id: 'RECIPES', label: 'Recipes', icon: '🍲' },
              { id: 'GROOMING', label: 'Grooming', icon: '🧴' },
              { id: 'LIFESTYLE', label: 'Lifestyle', icon: '🌿' },
            ].map(cat => (
              <div
                key={cat.id}
                onClick={() => setActiveTab(cat.id as TabType)}
                className="bg-[#FAF8F3] border border-[#ECE7DF] hover:border-[#283B2E] p-5 rounded-[24px] cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="w-16 h-16 rounded-full bg-[#EAE6DF] flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                  {cat.icon}
                </div>
                <span className="font-bold text-sm text-[#283B2E]">{cat.label}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#A1AF9C] rounded-[28px] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm relative overflow-hidden">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white/40 shrink-0 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400&auto=format&fit=crop"
                alt="Today's Nutrition Plan"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Today's Nutrition Plan</h2>
              <p className="text-xs sm:text-sm text-white/90">Balanced meals for your goals</p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('NUTRITION')}
                  className="px-6 py-2.5 bg-[#283B2E] hover:bg-[#1E2D23] text-white text-xs font-semibold rounded-full shadow transition-all inline-flex items-center gap-2"
                >
                  <span>View Plan</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif font-bold text-xl text-[#283B2E]">Quick Actions</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: '✂️',
                  title: 'Generate Meal Plan',
                  desc: 'AI-powered nutrition plan',
                  action: () => setActiveTab('NUTRITION'),
                },
                {
                  icon: '🍲',
                  title: 'Browse Recipes',
                  desc: 'Healthy & easy recipes',
                  action: () => setActiveTab('RECIPES'),
                },
                {
                  icon: '🧴',
                  title: 'Grooming Guide',
                  desc: 'Skincare, hair & body care',
                  action: () => setActiveTab('GROOMING'),
                },
                {
                  icon: '🌿',
                  title: 'Lifestyle Tips',
                  desc: 'Habits for a better you',
                  action: () => setActiveTab('LIFESTYLE'),
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={item.action}
                  className="bg-white border border-[#ECE7DF] hover:border-[#283B2E] rounded-[20px] p-5 cursor-pointer transition-all hover:shadow-sm flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#EAE6DF] flex items-center justify-center text-xl shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[#283B2E] group-hover:text-[#1E2D23]">{item.title}</h4>
                      <p className="text-xs text-[#657367]">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 group-hover:translate-x-1 transition-transform">›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. NUTRITION TAB (EXACT CLINICAL GENERATOR) */}
      {activeTab === 'NUTRITION' && (
        <div className="space-y-8">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-3xl font-serif font-bold text-[#283B2E]">Your Nutrition Plan</h2>
            <button
              onClick={generatePlan}
              disabled={isGeneratingPlan}
              className="px-5 py-2.5 bg-white border border-[#ECE7DF] text-[#283B2E] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#FAF8F3] transition-colors shadow-xs flex items-center gap-2"
            >
              {isGeneratingPlan ? (
                <>
                  <span className="w-3 h-3 border-2 border-[#283B2E] border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating Plan...</span>
                </>
              ) : (
                <span>Regenerate Plan ↻</span>
              )}
            </button>
          </div>

          {/* Top 4 Macro Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#283B2E] text-white p-6 rounded-[24px] shadow-sm flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#BDE3C4] mb-1">Calories</span>
              <span className="text-3xl font-serif font-bold">{plan?.targetCalories || 1496} <span className="text-sm font-sans font-normal text-emerald-100">kcal</span></span>
            </div>
            <div className="bg-white border border-[#ECE7DF] p-6 rounded-[24px] shadow-sm flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#657367] mb-1">Protein</span>
              <span className="text-3xl font-serif font-bold text-[#283B2E]">{plan?.proteinGrams || 120} <span className="text-sm font-sans font-normal text-[#657367]">g</span></span>
            </div>
            <div className="bg-white border border-[#ECE7DF] p-6 rounded-[24px] shadow-sm flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#657367] mb-1">Carbs</span>
              <span className="text-3xl font-serif font-bold text-[#283B2E]">{plan?.carbsGrams || 161} <span className="text-sm font-sans font-normal text-[#657367]">g</span></span>
            </div>
            <div className="bg-white border border-[#ECE7DF] p-6 rounded-[24px] shadow-sm flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#657367] mb-1">Fat</span>
              <span className="text-3xl font-serif font-bold text-[#283B2E]">{plan?.fatGrams || 42} <span className="text-sm font-sans font-normal text-[#657367]">g</span></span>
            </div>
          </div>

          {/* AI Clinical Summary Banner */}
          <div className="bg-[#FAF8F3] p-6 rounded-2xl border border-[#ECE7DF] flex items-start gap-4 shadow-xs">
            <span className="text-2xl mt-0.5">✨</span>
            <p className="text-xs sm:text-sm text-[#283B2E] font-medium leading-relaxed italic">
              "{plan?.planData?.summary || DEFAULT_NUTRITION_PLAN.planData.summary}"
            </p>
          </div>

          {/* Meals Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold text-[#283B2E]">Your personalized plan</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mealsList.map((m: any, idx: number) => {
                const sug = m.suggestions?.[0] || m;
                return (
                  <div key={idx} className="bg-white rounded-[28px] border border-[#ECE7DF] p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-4 border-b border-[#ECE7DF] pb-3">
                        <span className="text-xl">🌙</span>
                        <h4 className="font-serif font-bold text-base sm:text-lg text-[#283B2E]">{m.name || sug.meal || `Meal ${idx + 1}`}</h4>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#283B2E] block">Macro-Nutrient Distribution Target</span>
                        <p className="text-xs text-[#657367] leading-relaxed">
                          {m.target || sug.description || 'Balanced nutritional distribution for sustained metabolic output and optimal recovery.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-[#ECE7DF]">
                      <span className="text-[11px] font-bold px-3 py-1 bg-white rounded-lg border border-[#ECE7DF] text-[#283B2E]">
                        ~{sug.approxCalories || m.approxCalories || 350} kcal
                      </span>
                      <span className="text-[11px] font-bold px-3 py-1 bg-[#E8EFE6] rounded-lg border border-[#2D452F]/20 text-[#2D452F]">
                        P: {sug.protein || m.protein || 30}g
                      </span>
                      <span className="text-[11px] font-bold px-3 py-1 bg-white rounded-lg border border-[#ECE7DF] text-[#283B2E]">
                        C: {sug.carbs || m.carbs || 40}g
                      </span>
                      <span className="text-[11px] font-bold px-3 py-1 bg-white rounded-lg border border-[#ECE7DF] text-[#283B2E]">
                        F: {sug.fat || m.fat || 10}g
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hydration & Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#E8F0F2] rounded-[28px] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💧</span>
                <h4 className="font-serif font-bold text-lg text-[#283B2E]">Hydration Focus</h4>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#283B2E] mb-2">
                {plan?.planData?.hydration?.suggestion || 'Target 2.2 to 2.5 Liters of baseline total fluid daily.'}
              </p>
              <p className="text-xs text-[#657367] leading-relaxed">
                {plan?.planData?.hydration?.note ||
                  'Consume 500ml upon waking. Maintain fluid intake primarily between feeding windows to prevent dilution of digestive enzymes.'}
              </p>
            </div>

            <div className="bg-[#FAF8F3] rounded-[28px] p-6 sm:p-8 border border-[#ECE7DF] shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💡</span>
                <h4 className="font-serif font-bold text-lg text-[#283B2E]">Wellness Tips</h4>
              </div>
              <ul className="space-y-2.5 text-xs text-[#657367]">
                {tipsList.map((t: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#A8B4AA] text-[10px] mt-0.5">✦</span>
                    <span className="leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Health Snapshot */}
          <div className="bg-white rounded-[32px] border border-[#ECE7DF] p-6 sm:p-8 shadow-xs space-y-6">
            <h4 className="font-serif font-bold text-2xl text-[#283B2E]">Your Nutrition Snapshot</h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-[#FAF7F2] rounded-[22px] flex flex-col justify-between min-h-[125px]">
                <span className="block text-[10px] uppercase font-bold text-[#8D7B68] leading-tight">CALCULATED<br />BMI</span>
                <span className="text-2xl font-serif font-bold text-[#1F2922]">{plan?.bmi || '26.7'}</span>
                <span className="block text-[8.5px] font-bold text-[#A09289] uppercase tracking-wider leading-tight">GENERAL<br />SCREENING<br />METRIC</span>
              </div>
              <div className="p-5 bg-[#FAF7F2] rounded-[22px] flex flex-col justify-between min-h-[125px]">
                <span className="block text-[10px] uppercase font-bold text-[#8D7B68]">BMR (BASAL)</span>
                <span className="text-2xl font-serif font-bold text-[#1F2922]">{plan?.bmr || 1247} <span className="text-sm font-sans font-normal text-[#1F2922]">kcal</span></span>
                <div></div>
              </div>
              <div className="p-5 bg-[#FAF7F2] rounded-[22px] flex flex-col justify-between min-h-[125px]">
                <span className="block text-[10px] uppercase font-bold text-[#8D7B68]">TDEE (TOTAL)</span>
                <span className="text-2xl font-serif font-bold text-[#1F2922]">{plan?.tdee || 1496} <span className="text-sm font-sans font-normal text-[#1F2922]">kcal</span></span>
                <div></div>
              </div>
              <div className="p-5 bg-[#FAF7F2] rounded-[22px] flex flex-col justify-between min-h-[125px]">
                <span className="block text-[10px] uppercase font-bold text-[#8D7B68] leading-tight">PRIMARY<br />GOAL</span>
                <span className="text-lg font-serif font-bold text-[#2D3F33] leading-tight">Wellness<br />Goal</span>
                <div></div>
              </div>
            </div>

            <div className="text-[11px] text-[#8D8880] leading-relaxed pt-2">
              <strong className="text-[#8D8880]">Disclaimer:</strong> Veyra provides general nutrition and wellness guidance, not medical advice. If you have a medical condition, are pregnant, have a history of eating disorders, or need therapeutic nutrition, consult a qualified healthcare professional. Do not use this tool to create extreme calorie restrictions.
            </div>
          </div>
        </div>
      )}

      {/* 4. RECIPES TAB */}
      {(activeTab === 'RECIPES' || activeTab === 'HUB') && activeTab === 'RECIPES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setRecipeCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    recipeCategory === cat
                      ? 'bg-[#283B2E] text-white'
                      : 'bg-[#FAF8F3] border border-[#ECE7DF] text-[#283B2E] hover:bg-[#EAE6DF]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#ECE7DF] rounded-full px-4 py-2 text-xs text-[#283B2E] focus:outline-none focus:border-[#283B2E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRecipes.map(r => (
              <div
                key={r.id}
                className="bg-white border border-[#ECE7DF] rounded-[24px] overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={r.img}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => toggleSave(r.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-sm shadow hover:bg-white"
                    >
                      {savedRecipes[r.id] ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#283B2E] bg-[#EAE6DF] px-2.5 py-0.5 rounded-full">
                      {r.cat}
                    </span>
                    <h3 className="font-serif font-bold text-lg text-[#283B2E] mt-2">{r.title}</h3>
                    <p className="text-xs text-[#657367] mt-1">
                      ⏱️ {r.prep}  •  🔥 {r.cal}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => setSelectedRecipeModal(r)}
                    className="w-full py-2.5 bg-[#283B2E] hover:bg-[#1E2D23] text-white text-xs font-semibold rounded-full transition-colors flex items-center justify-center gap-2"
                  >
                    <span>View Recipe Details</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. GROOMING TAB */}
      {activeTab === 'GROOMING' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#ECE7DF] rounded-[32px] p-6 sm:p-8">
            <h2 className="font-serif font-bold text-2xl text-[#283B2E] mb-2">Essential Skincare & Grooming Guide</h2>
            <p className="text-xs text-[#657367] mb-6">Simple, science-backed steps for radiant skin and hair care.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Cleanser',
                  desc: 'Removes impurities and excess oil without stripping natural moisture.',
                  tip: 'Use morning and evening.',
                  icon: '🧴',
                },
                {
                  title: 'Hydrating Face Moisturizer',
                  desc: 'Locks in deep hydration, restores skin barrier, and soft texture.',
                  tip: 'Lightweight & non-greasy.',
                  icon: '✨',
                },
                {
                  title: 'Sunscreen (SPF 50)',
                  desc: 'Shields skin against UVA/UVB photo-aging and dark spots.',
                  tip: 'Apply daily before sunlight.',
                  icon: '☀️',
                },
              ].map((g, idx) => (
                <div key={idx} className="bg-[#FAF8F3] p-6 rounded-2xl border border-[#ECE7DF] space-y-3">
                  <div className="text-3xl">{g.icon}</div>
                  <h3 className="font-serif font-bold text-lg text-[#283B2E]">{g.title}</h3>
                  <p className="text-xs text-[#657367] leading-relaxed">{g.desc}</p>
                  <div className="bg-[#EAE6DF] text-[#283B2E] text-[11px] font-semibold px-3 py-1.5 rounded-lg inline-block">
                    💡 {g.tip}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. LIFESTYLE TAB */}
      {activeTab === 'LIFESTYLE' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#ECE7DF] rounded-[32px] p-6 sm:p-8">
            <h2 className="font-serif font-bold text-2xl text-[#283B2E] mb-2">Manage Stress & Mindful Living</h2>
            <p className="text-xs text-[#657367] mb-6">A calm mind leads to radiant skin, better sleep, and overall longevity.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Practice Deep Breathing', sub: '5 mins a day to lower cortisol', icon: '🫁' },
                { title: 'Spend Time in Nature', sub: 'Even 30 mins boosts serotonin', icon: '🌲' },
                { title: 'Limit Screen Time', sub: 'Turn off screens 1 hr before bed', icon: '📱' },
                { title: 'Stay Connected', sub: 'Engage with supportive communities', icon: '🗣️' },
              ].map((tip, idx) => (
                <div key={idx} className="bg-[#FAF8F3] p-6 rounded-2xl border border-[#ECE7DF] space-y-2">
                  <div className="text-3xl mb-2">{tip.icon}</div>
                  <h3 className="font-serif font-bold text-base text-[#283B2E]">{tip.title}</h3>
                  <p className="text-xs text-[#657367]">{tip.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. CUSTOM PLAN TAB */}
      {activeTab === 'PLAN' && (
        <div className="bg-white border border-[#ECE7DF] rounded-[32px] p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-serif font-bold text-2xl text-[#283B2E]">Personalized Weekly Schedule</h2>
              <p className="text-xs text-[#657367]">Select a day to review your customized meal timeline.</p>
            </div>
            <div className="flex gap-1.5 bg-[#EAE6DF] p-1.5 rounded-full">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    selectedDay === day ? 'bg-[#283B2E] text-white' : 'text-[#657367] hover:text-[#283B2E]'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {[
              { time: '08:00 AM', meal: 'Breakfast', desc: 'Overnight Oats + banana + chia seeds (~ 420 kcal)' },
              { time: '11:00 AM', meal: 'Snack', desc: 'Organic green tea + roasted almonds (~ 180 kcal)' },
              { time: '01:30 PM', meal: 'Lunch', desc: 'Paneer & mixed veg bowl with herbs (~ 550 kcal)' },
              { time: '05:00 PM', meal: 'Snack', desc: 'Fresh seasonal fruit bowl (~ 150 kcal)' },
              { time: '08:00 PM', meal: 'Dinner', desc: 'Warm tomato basil soup + quinoa (~ 530 kcal)' },
            ].map((slot, idx) => (
              <div key={idx} className="bg-[#FAF8F3] p-4 rounded-2xl border border-[#ECE7DF] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-[#283B2E] bg-[#EAE6DF] px-3 py-1 rounded-full">{slot.time}</span>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#283B2E]">{slot.meal}</h4>
                    <p className="text-xs text-[#657367]">{slot.desc}</p>
                  </div>
                </div>
                <span className="text-xs text-[#283B2E] font-semibold">Scheduled ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECIPE DETAIL MODAL */}
      {selectedRecipeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F5F2EA] border border-[#ECE7DF] rounded-[32px] max-w-xl w-full overflow-hidden shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="relative h-64 shrink-0">
              <img src={selectedRecipeModal.img} alt={selectedRecipeModal.title} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedRecipeModal(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-lg font-bold text-[#283B2E] hover:bg-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
              <div>
                <h2 className="font-serif font-bold text-3xl text-[#283B2E]">{selectedRecipeModal.title}</h2>
                <div className="flex gap-2 mt-2">
                  {selectedRecipeModal.tags.map((t, idx) => (
                    <span key={idx} className="text-[11px] font-semibold bg-[#EAE6DF] text-[#283B2E] px-3 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-white p-4 rounded-2xl border border-[#ECE7DF] text-center">
                <div>
                  <p className="text-[10px] text-[#657367] uppercase font-semibold">Prep Time</p>
                  <p className="text-xs font-bold text-[#283B2E] mt-0.5">{selectedRecipeModal.prep}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#657367] uppercase font-semibold">Cook Time</p>
                  <p className="text-xs font-bold text-[#283B2E] mt-0.5">{selectedRecipeModal.cook}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#657367] uppercase font-semibold">Servings</p>
                  <p className="text-xs font-bold text-[#283B2E] mt-0.5">{selectedRecipeModal.servings}</p>
                </div>
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg text-[#283B2E] mb-2">Ingredients</h3>
                <ul className="space-y-1.5 text-xs text-[#657367] bg-white p-4 rounded-2xl border border-[#ECE7DF]">
                  {selectedRecipeModal.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-[#283B2E]">•</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg text-[#283B2E] mb-2">Instructions</h3>
                <div className="space-y-2 text-xs text-[#657367] bg-white p-4 rounded-2xl border border-[#ECE7DF]">
                  {selectedRecipeModal.instructions.map((inst, idx) => (
                    <p key={idx} className="leading-relaxed">{inst}</p>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  toggleSave(selectedRecipeModal.title);
                  setSelectedRecipeModal(null);
                }}
                className="w-full py-3 bg-[#283B2E] hover:bg-[#1E2D23] text-white text-xs font-semibold rounded-full transition-colors"
              >
                Save Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
