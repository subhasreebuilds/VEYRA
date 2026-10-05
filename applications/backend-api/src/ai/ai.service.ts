import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Internal helper to call AI providers with fallback logic.
   * Tries Gemini first (if key is available), then falls back to OpenRouter.
   */
  private async executeWithFallback(payload: any): Promise<any> {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const fallbackKey = this.configService.get<string>('FALLBACK_LLM_API_KEY') || this.configService.get<string>('OPENROUTER_API_KEY');
    const fallbackBaseUrl = this.configService.get<string>('FALLBACK_LLM_BASE_URL') || 'https://api.openai.com/v1';
    const fallbackModel = this.configService.get<string>('FALLBACK_AI_MODEL') || 'gpt-4o-mini';
    
    let lastError: any = null;

    // 1. Try Gemini with multiple model fallbacks
    if (geminiKey) {
      const geminiModels = [
        'gemini-flash-latest',
        'gemini-pro-latest',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-1.5-flash',
        'gemini-3.5-pro',
      ];

      const geminiContents = payload.messages.filter((m: any) => m.role !== 'system').map((m: any) => {
        let parts = [];
        if (Array.isArray(m.content)) {
          parts = m.content.map((c: any) => {
            if (c.type === 'text') return { text: c.text };
            if (c.type === 'image_url') {
              const url = c.image_url.url;
              const mimeType = url.substring(url.indexOf(':') + 1, url.indexOf(';'));
              const data = url.substring(url.indexOf(',') + 1);
              return { inlineData: { mimeType, data } };
            }
          });
        } else {
          parts = [{ text: m.content }];
        }
        return { role: m.role, parts };
      });

      const systemMsg = payload.messages.find((m: any) => m.role === 'system');
      const systemInstruction = systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined;

      const nativePayload: any = {
        contents: geminiContents,
        generationConfig: {
          responseMimeType: "application/json"
        }
      };
      if (systemInstruction) nativePayload.systemInstruction = systemInstruction;

      let keyInvalid = false;

      for (const model of geminiModels) {
        if (keyInvalid) break;

        try {
          this.logger.log(`Attempting AI generation with Gemini (${model})...`);
          
          let res;
          for (let attempt = 1; attempt <= 2; attempt++) {
            res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(nativePayload),
              signal: AbortSignal.timeout(15000)
            });

            if (res.ok) break;

            const errorText = await res.text();

            if (res.status === 400 || res.status === 403) {
              this.logger.warn(`Gemini API key error (${res.status}): ${errorText}. Skipping Gemini provider.`);
              keyInvalid = true;
              break;
            }

            this.logger.warn(`Gemini (${model}) attempt ${attempt} failed with status ${res.status}: ${errorText}`);

            if (res.status === 503 && attempt < 2) {
              this.logger.log(`Waiting 1 second before retry...`);
              await new Promise(r => setTimeout(r, 1000));
            } else {
              break;
            }
          }

          if (res && res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              this.logger.log(`✅ SUCCESS: AI request fulfilled by GEMINI (${model})`);
              const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              return JSON.parse(cleanedText);
            }
          }
        } catch (err: any) {
          this.logger.warn(`Gemini (${model}) exception: ${err.message}`);
          lastError = err;
        }
      }
    } else {
      this.logger.warn('No GEMINI_API_KEY provided, skipping Gemini.');
    }

    // 2. Try Fallback LLM (OpenAI / OpenRouter)
    if (fallbackKey) {
      try {
        const baseUrl = fallbackBaseUrl.replace(/\/$/, '');
        const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
        
        this.logger.log(`Attempting AI generation with Fallback LLM (${fallbackModel})...`);
        const llmPayload = { ...payload, model: fallbackModel };
        
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fallbackKey}`
          },
          body: JSON.stringify(llmPayload)
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            this.logger.log(`✅ SUCCESS: AI request fulfilled by Fallback LLM (${fallbackModel})`);
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanedText);
          }
        } else {
          const errText = await res.text();
          if (res.status === 402) {
            this.logger.warn(`Fallback LLM account has insufficient credits (402). Skipping.`);
          } else {
            this.logger.error(`Fallback LLM failed with status ${res.status}: ${errText}`);
          }
        }
      } catch (err: any) {
        this.logger.error(`Fallback LLM exception: ${err.message}`);
        lastError = err;
      }
    } else {
      this.logger.error('No FALLBACK_LLM_API_KEY provided.');
    }

    this.logger.warn('All AI providers failed or tokens expired. Returning DEMO FALLBACK DATA.');
    return this.getDemoFallbackData(payload);
  }

  /**
   * Internal helper to provide robust offline fallback data for presentations
   * or when API limits are reached.
   */
  private getDemoFallbackData(payload: any): any {
    const systemPrompt = payload.messages?.[0]?.content || '';
    
    // 1. Skin Analysis Mock (Randomized for dynamic demo experience)
    if (systemPrompt.includes('Analyze the provided facial scan image')) {
      const overallScore = Math.floor(Math.random() * (96 - 72 + 1)) + 72;
      
      const generateMetric = (name: string, isLowerBetter: boolean, goodNote: string, badNote: string) => {
        const score = isLowerBetter 
          ? Math.floor(Math.random() * (45 - 10 + 1)) + 10 
          : Math.floor(Math.random() * (98 - 65 + 1)) + 65;
          
        const isGood = isLowerBetter ? score <= 30 : score >= 75;
        
        return {
          name,
          score,
          status: isGood ? (isLowerBetter ? "Low Risk" : "Optimal") : (isLowerBetter ? "Elevated" : "Sub-optimal"),
          color: isGood ? "text-emerald-700" : "text-amber-700",
          bg: isGood ? "bg-emerald-500" : "bg-amber-500",
          note: isGood ? goodNote : badNote
        };
      };

      const allActives = [
        { name: "Niacinamide (5%)", purpose: "Regulates T-zone oil production.", match: `${Math.floor(Math.random() * 10 + 90)}% Match`, type: "Morning & Night" },
        { name: "Hyaluronic Acid", purpose: "Sustains deep layer hydration.", match: `${Math.floor(Math.random() * 10 + 90)}% Match`, type: "Morning & Night" },
        { name: "Vitamin C (L-Ascorbic)", purpose: "Brightens minor hyperpigmentation.", match: `${Math.floor(Math.random() * 10 + 85)}% Match`, type: "Morning" },
        { name: "Retinol 0.3%", purpose: "Accelerates cellular turnover.", match: `${Math.floor(Math.random() * 10 + 85)}% Match`, type: "Night" },
        { name: "Salicylic Acid (BHA)", purpose: "Clears congested pores.", match: `${Math.floor(Math.random() * 10 + 88)}% Match`, type: "Night" },
        { name: "Centella Asiatica", purpose: "Soothes barrier irritation.", match: `${Math.floor(Math.random() * 10 + 90)}% Match`, type: "Morning & Night" },
        { name: "Ceramide NP Complex", purpose: "Reinforces the natural skin barrier.", match: `${Math.floor(Math.random() * 10 + 90)}% Match`, type: "Night" }
      ];
      
      const shuffledActives = allActives.sort(() => 0.5 - Math.random()).slice(0, 3);

      return {
        overallScore,
        concerns: [
          { name: 'Acne & Breakouts', level: 'Moderate', score: 65, color: '#E76F51', text: 'You have active inflammation mainly on the cheeks and chin.' },
          { name: 'Uneven Skin Tone', level: 'Mild', score: 40, color: '#F4A261', text: 'Slight hyperpigmentation detected around the mouth.' },
          { name: 'Large Pores', level: 'Moderate', score: 70, color: '#8D7DA3', text: 'Visible pores concentrated on the T-zone.' },
          { name: 'Dark Circles', level: 'Mild', score: 35, color: '#598CA0', text: 'Faint under-eye shadows, likely due to fatigue.' }
        ],
        summary: "Based on the visual analysis, your skin exhibits good overall health with some mild signs of dehydration and localized texture variations. A consistent hydration and barrier-protection routine is recommended.",
        metrics: [
          generateMetric("Barrier Integrity", false, "Lipid matrix appears healthy.", "Slightly compromised barrier detected."),
          generateMetric("Hydration Level", false, "Sufficient intracellular water levels.", "Mild surface dehydration visible."),
          generateMetric("Texture & Micro-relief", false, "Smooth surface topography.", "Minor textural unevenness noted."),
          generateMetric("Redness & Sensitivity", true, "No active superficial erythema.", "Mild vascular reactivity detected."),
          generateMetric("Sebum Equilibrium", false, "Healthy lipid surface film.", "Slight excess sebum in T-zone."),
          generateMetric("UV / Photo-stress", true, "Minimal photo-damage risk.", "Early signs of localized UV stress.")
        ],
        actives: shuffledActives
      };
    }
    
    // 2. Grooming Routine Mock
    if (systemPrompt.includes('generate a highly personalized daily and weekly grooming routine')) {
      return {
        routineData: {
          morning: [
            { id: "m1", stepNumber: "01", title: "Gentle Hydrating Cleanse", category: "Cleanse", description: "Massage onto damp skin to remove overnight sebum.", duration: "60 sec", actives: ["Glycerin", "Amino Acids"], productName: "Botanical Velvet Cleanser", productType: "Cleanser" },
            { id: "m2", stepNumber: "02", title: "Antioxidant Defense", category: "Treat", description: "Apply 3-4 drops to face and neck.", duration: "30 sec", actives: ["Vitamin C", "Ferulic Acid"], productName: "C-Firma Day Serum", productType: "Serum" },
            { id: "m3", stepNumber: "03", title: "Barrier Protection SPF", category: "Protect", description: "Apply generously as final step.", duration: "60 sec", actives: ["Zinc Oxide", "Niacinamide"], productName: "Mineral Shield SPF 50", productType: "Sunscreen" }
          ],
          evening: [
            { id: "e1", stepNumber: "01", title: "Clarifying Oil Pre-Cleanse", category: "First Cleanse", description: "Dissolves mineral sunscreen.", duration: "60 sec", actives: ["Squalane"], productName: "Purifying Botanical Cleansing Oil", productType: "Oil Cleanse" },
            { id: "e2", stepNumber: "02", title: "Cellular Renewal", category: "Treat", description: "Apply pea-sized amount avoiding eyes.", duration: "30 sec", actives: ["Retinol 0.3%", "Ceramides"], productName: "Overnight Retinol Repair", productType: "Treatment" },
            { id: "e3", stepNumber: "03", title: "Deep Hydration Seal", category: "Moisturize", description: "Lock in actives.", duration: "30 sec", actives: ["Ceramides", "Cholesterol"], productName: "Lipid Restore Cream", productType: "Moisturizer" }
          ],
          weekly: [
            { id: "w1", stepNumber: "01", title: "Papaya Enzyme Gentle Peel", category: "Exfoliate", description: "Natural enzymatic non-abrasive treatment.", duration: "10 min", actives: ["Papain", "Lactic Acid 5%"], productName: "Micro-Exfoliating Enzyme Glaze", productType: "Weekly Mask" }
          ]
        }
      };
    }
    
    // 3. Nutrition Mock
    if (systemPrompt.includes('professional clinical dietitian')) {
      return {
        summary: "DEMO MODE: Clinical overview of the prescribed protocol and macro distribution strategy.",
        dailyCalories: 2000,
        macros: { protein: 150, carbs: 200, fat: 65 },
        meals: [
          { name: "Meal 1 (Morning Protocol)", suggestions: [{ meal: "High Protein Oats", description: "Oats with whey protein and berries.", approxCalories: 450, protein: 35, carbs: 50, fat: 12 }] },
          { name: "Meal 2 (Mid-Day Sustenance)", suggestions: [{ meal: "Chicken & Quinoa Bowl", description: "Grilled breast with quinoa and greens.", approxCalories: 600, protein: 45, carbs: 60, fat: 15 }] },
          { name: "Meal 3 (Evening Recovery)", suggestions: [{ meal: "Salmon Asparagus", description: "Wild caught salmon with roasted asparagus.", approxCalories: 550, protein: 40, carbs: 20, fat: 30 }] }
        ],
        hydration: { suggestion: "3.5L Daily", note: "Add electrolytes post-workout." },
        tips: ["Prioritize sleep for recovery.", "Eat protein every 3-4 hours."]
      };
    }
    
    // 4. Recipes Mock
    if (systemPrompt.includes('professional culinary nutritionist')) {
      return {
        recipes: [
          { id: "r1", title: "Masala Berry Oats Porridge", category: "Breakfast", time: "15 min", calories: "350 kcal", macros: { protein: "22g", carbs: "45g", fat: "8g" }, tags: ["Indian", "Breakfast"], image: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800&q=80", description: "Warm Indian-style rolled oats cooked with cardamom, milk, and fresh berries.", benefits: "Rich in soluble fiber and antioxidants to stabilize morning glucose levels.", ingredients: ["1/2 cup rolled oats", "1 cup almond milk", "1/4 tsp cardamom powder", "1/4 cup mixed berries", "1 tbsp chia seeds"], instructions: ["Cook oats in almond milk with cardamom for 5 minutes.", "Remove from heat and stir well.", "Top with fresh berries and chia seeds before serving warm."] },
          { id: "r2", title: "Indian Kachumber Salad", category: "Lunch", time: "15 min", calories: "320 kcal", macros: { protein: "14g", carbs: "22g", fat: "18g" }, tags: ["Low Carb", "Lunch"], image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80", description: "Crisp cucumber, tomatoes, greens, and avocado tossed with lemon and chaat masala.", benefits: "Promotes digestive hydration and skin radiance.", ingredients: ["2 cups mixed greens", "1 diced cucumber", "1/2 cup cherry tomatoes", "1/2 avocado", "1 tbsp lemon juice & chaat masala"], instructions: ["Chop cucumber, tomatoes, and greens.", "Toss with diced avocado in a bowl.", "Drizzle with lemon juice and chaat masala."] },
          { id: "r3", title: "Chicken Quinoa Khichdi", category: "Lunch", time: "25 min", calories: "420 kcal", macros: { protein: "38g", carbs: "42g", fat: "10g" }, tags: ["High Protein", "Indian"], image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&q=80", description: "Lean chicken breast cooked with organic quinoa, moong dal, ginger, and turmeric.", benefits: "Complete amino acid profile supporting lean muscle mass and digestive comfort.", ingredients: ["150g boneless chicken breast", "1/2 cup quinoa", "1/4 cup moong dal", "1/2 tsp turmeric & ginger-garlic paste", "1 tsp cow ghee"], instructions: ["Sauté ginger-garlic and turmeric in ghee.", "Add diced chicken, quinoa, moong dal, and 2 cups water.", "Simmer for 20 minutes until creamy."] },
          { id: "r4", title: "Paneer & Broccoli Kadhai Stir-Fry", category: "Dinner", time: "20 min", calories: "450 kcal", macros: { protein: "32g", carbs: "18g", fat: "22g" }, tags: ["Vegetarian", "Dinner"], image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80", description: "Fresh cottage cheese cubes sautéed with broccoli, bell peppers, and mild Indian spices.", benefits: "Abundant in calcium, zinc, and dietary fiber.", ingredients: ["140g fresh paneer cubes", "1.5 cups broccoli florets", "1/2 bell pepper", "1/2 tsp cumin & garam masala", "1 tsp mustard oil"], instructions: ["Sauté cumin, broccoli, and bell pepper in mustard oil for 4 minutes.", "Add paneer cubes and mild kadhai spices.", "Toss for 4 minutes until golden brown and serve hot."] },
          { id: "r5", title: "Roasted Tomato Moong Dal Soup", category: "Snacks", time: "15 min", calories: "240 kcal", macros: { protein: "12g", carbs: "28g", fat: "6g" }, tags: ["Low Calorie", "Indian"], image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80", description: "Comforting roasted tomato and yellow lentil soup seasoned with roasted cumin.", benefits: "High in lycopene and hydration to boost immune wellness.", ingredients: ["4 ripe tomatoes", "1/4 cup yellow moong dal", "2 garlic cloves", "1/2 tsp roasted cumin powder", "1 tsp ghee"], instructions: ["Roast tomatoes and boil moong dal until soft.", "Blend together into a velvety soup.", "Temper with ghee and cumin powder before serving."] },
          { id: "r6", title: "Tawa Pan-Seared Fish Tikka", category: "Dinner", time: "20 min", calories: "440 kcal", macros: { protein: "40g", carbs: "10g", fat: "24g" }, tags: ["High Protein", "Indian"], image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80", description: "Fresh fish fillet marinated in curd, lemon, and mild tawa spices, pan-seared to perfection.", benefits: "Packed with essential Omega-3 fatty acids for heart and skin health.", ingredients: ["160g fish fillet", "2 tbsp hung curd", "1 tsp kasuri methi & tikka masala", "1 tbsp olive oil", "Lemon wedges"], instructions: ["Marinate fish in hung curd, lemon, and tikka masala for 10 minutes.", "Heat oil on a tawa or pan and sear fish for 4 minutes per side.", "Garnish with lemon and serve hot."] },
          { id: "r7", title: "Mango Berry Protein Lassi", category: "Snacks", time: "10 min", calories: "260 kcal", macros: { protein: "24g", carbs: "30g", fat: "5g" }, tags: ["Indian", "Post Workout"], image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&q=80", description: "Traditional Indian yogurt lassi blended with protein powder and fresh berries.", benefits: "Probiotic gut support and rapid post-workout recovery.", ingredients: ["1 cup fresh curd", "1 scoop vanilla protein powder", "1/2 cup mixed berries", "Pinch of cardamom powder"], instructions: ["Add curd, protein powder, berries, and cardamom to blender.", "Blend until creamy and smooth.", "Pour into a chilled glass and serve."] }
        ]
      };
    }

    // 5. Skin Recommendations Mock
    if (systemPrompt.includes('generate STRICT structured JSON recommendations')) {
      return {
        recommendations: [
          { category: "CLEANSER", brand: "CeraVe", name: "Hydrating Facial Cleanser", price: "₹450", reason: "Soothes skin barrier and gently purifies." },
          { category: "TONER", brand: "Minimalist", name: "PHAs 3% Face Toner", price: "₹399", reason: "Refines pores and balances skin pH." },
          { category: "SERUM", brand: "The Ordinary", name: "Niacinamide 10% + Zinc 1%", price: "₹600", reason: "Balances sebum equilibrium and evens skin tone." },
          { category: "MOISTURIZER", brand: "La Roche-Posay", name: "Toleriane Double Repair Moisturizer", price: "₹850", reason: "Restores natural skin moisture barrier." },
          { category: "SUNSCREEN", brand: "Dot & Key", name: "Vitamin C + E SPF 50 Sunscreen", price: "₹495", reason: "Broad-spectrum UV protection without white cast." },
          { category: "EYE_CREAM", brand: "Hyphen", name: "Vitamin Infused Under Eye Cream", price: "₹425", reason: "Reduces dark circles and hydrates delicate eye area." }
        ],
        homeRemedies: [
          { name: "Honey & Oatmeal Mask", reason: "Calms superficial redness and hydrates." }
        ],
        diet: ["Drink 3L of water daily", "Increase omega-3 fatty acids intake"],
        lifestyle: ["Ensure 8 hours of sleep", "Change pillowcases twice weekly"]
      };
    }

    throw new InternalServerErrorException('All AI providers failed and no mock data matched.');
  }

  async generateNutritionPlan(context: any): Promise<any> {
    const systemPrompt = `You are an elite, professional clinical dietitian and sports nutritionist for the Veyra app.
Your task is to generate a highly structured, clinical macro-nutrient and supplementation schedule based strictly on the user's profile and pre-calculated targets.

IMPORTANT INSTRUCTIONS:
- The backend has already calculated the exact daily nutrition targets (Calories, Protein, Carbs, Fat). DO NOT recalculate them.
- DO NOT suggest ANY specific food items, ingredients, or recipes.
- ONLY provide the precise time block, exact macro-nutrient distribution, and professional clinical instructions.
- Return ONLY valid JSON. Do not include markdown code blocks.

REQUIRED JSON STRUCTURE:
{
  "summary": "Clinical overview of the prescribed protocol and macro distribution strategy.",
  "dailyCalories": 1800,
  "macros": { "protein": 120, "carbs": 200, "fat": 55 },
  "meals": [
    {
      "name": "Meal 1 (Morning Protocol)",
      "suggestions": [
        { "meal": "Macro-Nutrient Target", "description": "Instruction here.", "approxCalories": 400, "protein": 25, "carbs": 45, "fat": 12 }
      ]
    }
  ],
  "hydration": { "suggestion": "...", "note": "..." },
  "tips": ["Tip 1", "Tip 2"]
}`;

    const userPrompt = `User Profile & Targets:
${JSON.stringify(context, null, 2)}

Generate the personalized meal plan as a JSON object matching the required structure exactly.`;

    const payload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" }
    };

    return this.executeWithFallback(payload);
  }

  async generateSmartRecipes(context: any): Promise<any> {
    const systemPrompt = `You are an elite, professional culinary nutritionist for the Veyra app.
Your task is to generate 7 personalized, delicious Indian recipes that STRICTLY adhere to the user's calculated macro-nutrient targets and constraints (allergies, dislikes).

CRITICAL CUISINE REQUIREMENTS:
- You MUST ONLY generate simple, healthy, everyday INDIAN recipes (e.g. Masala Oats, Paneer Bhurji / Stir-Fry, Dal Khichdi, Tomato Moong Dal Soup, Veg Biryani, Chana Masala, Tawa Fish/Paneer, Mango Lassi/Smoothie).
- STRICTLY DO NOT USE beef, pork, veal, or non-Indian Western fast food.
- Focus on accessible, wholesome Indian home-cooked dishes using everyday Indian kitchen ingredients (Paneer, Oats, Dal, Chicken, Fish, Curd, Vegetables, Spices).
- Generate exactly 7 recipes.
- Allergies are HARD CONSTRAINTS.
- Return ONLY valid JSON. Do not include markdown code blocks.

REQUIRED JSON STRUCTURE:
{
  "recipes": [
    {
      "id": "recipe_1",
      "title": "Recipe Name",
      "category": "High Protein",
      "time": "25 min",
      "calories": "400 kcal",
      "macros": { "protein": "30g", "carbs": "40g", "fat": "12g" },
      "tags": ["Gluten-Free"],
      "image": "https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=800&auto=format&fit=crop",
      "description": "Description",
      "benefits": "Benefit",
      "ingredients": ["Ingredient 1", "Ingredient 2"],
      "instructions": ["Step 1", "Step 2"]
    }
  ]
}`;

    const userPrompt = `User Profile & Targets:
${JSON.stringify(context, null, 2)}

Generate the recipes JSON.`;

    const payload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" }
    };

    return this.executeWithFallback(payload);
  }

  async analyzeSkinImage(base64Image: string): Promise<any> {
    const systemPrompt = `You are an elite, clinical-grade AI dermatologist. Your task is to perform a highly rigorous visual analysis of the provided facial scan.
You MUST look for specific visual evidence in the image to determine the scores, rather than guessing or providing generic numbers. 

VISUAL ANALYSIS GUIDELINES:
- Barrier Integrity: Look for signs of peeling, severe dryness, or healthy plumpness.
- Hydration Level: Look for dullness, fine dehydration lines vs natural radiance.
- Texture & Micro-relief: Look for enlarged pores, bumps, rough patches, or acne scars.
- Redness & Sensitivity: Look closely for erythema (redness) across the cheeks, nose, and chin.
- Sebum Equilibrium: Look for excess shine/glare on the forehead and nose (T-zone) vs matte areas.
- UV / Photo-stress: Look for hyperpigmentation, sun spots, freckling, or dark periorbital circles.

You must return your analysis STRICTLY as a valid JSON object. Do not include markdown code blocks.

REQUIRED JSON STRUCTURE:
{
  "overallScore": "[Integer 0-100]",
  "summary": "[A brief 2-3 sentence overall clinical summary of the visual skin condition]",
  "metrics": [
    { "name": "Barrier Integrity", "score": "[Integer 0-100]", "status": "[String: e.g. Optimal, Compromised, Needs Attention]", "color": "[Tailwind text color]", "bg": "[Tailwind bg color]", "note": "[Mention the specific visual evidence you see for this]" },
    { "name": "Hydration Level", "score": "[Integer 0-100]", "status": "[String]", "color": "[Tailwind text color]", "bg": "[Tailwind bg color]", "note": "[Mention the specific visual evidence you see for this]" },
    { "name": "Texture & Micro-relief", "score": "[Integer 0-100]", "status": "[String]", "color": "[Tailwind text color]", "bg": "[Tailwind bg color]", "note": "[Mention the specific visual evidence you see for this]" },
    { "name": "Redness & Sensitivity", "score": "[Integer 0-100]", "status": "[String]", "color": "[Tailwind text color]", "bg": "[Tailwind bg color]", "note": "[Mention the specific visual evidence you see for this]" },
    { "name": "Sebum Equilibrium", "score": "[Integer 0-100]", "status": "[String]", "color": "[Tailwind text color]", "bg": "[Tailwind bg color]", "note": "[Mention the specific visual evidence you see for this]" },
    { "name": "UV / Photo-stress", "score": "[Integer 0-100]", "status": "[String]", "color": "[Tailwind text color]", "bg": "[Tailwind bg color]", "note": "[Mention the specific visual evidence you see for this]" }
  ],
  "actives": [
    {
      "name": "Recommended Active Ingredient Name",
      "purpose": "Why this is prescribed based EXACTLY on the visual flaws you found.",
      "match": "96% Match",
      "type": "Morning & Night"
    }
  ],
  "concerns": [
    {
      "name": "[Skin Concern Name, e.g. Acne, Uneven Tone]",
      "level": "[String: e.g. Mild, Moderate, Severe]",
      "score": "[Integer 0-100 indicating severity]",
      "color": "[Tailwind hex color e.g. #E76F51]",
      "text": "[1 sentence describing where and how this appears on the face]"
    }
  ]
}

Provide exactly 6 metrics matching those names, 3-4 recommended actives, and 2-4 primary skin concerns detected. Format precisely as requested, and ensure the notes are highly personalized to the actual face in the image.`;

    const payload = {
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this skin scan.' },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    };

    return this.executeWithFallback(payload);
  }

  async generateGroomingRoutine(skinScanData: any, userProfile: any): Promise<any> {
    const systemPrompt = `You are an elite, AI-powered virtual dermatologist and skincare expert.
Your task is to generate a highly personalized daily and weekly grooming routine based on the user's latest skin scan and profile.

IMPORTANT INSTRUCTIONS:
- You must generate three separate routines: "morning", "evening", and "weekly".
- Each routine should have 2-5 steps.
- Suggest specific product types and active ingredients based on the skin scan's recommended actives and the user's skin metrics.
- Take into account the user's profile, including their gender, age, and budget, to tailor the product recommendations.
- Return ONLY valid JSON. Do not include markdown code blocks.

REQUIRED JSON STRUCTURE:
{
  "routineData": {
    "morning": [
      {
        "id": "m1",
        "stepNumber": "01",
        "title": "Gentle Hydrating Cleanse",
        "category": "Cleanse",
        "description": "Massage onto damp skin...",
        "duration": "60 sec",
        "actives": ["Glycerin", "Amino Acids"],
        "productName": "Botanical Velvet Cleanser",
        "productType": "Cleanser"
      }
    ],
    "evening": [
      {
        "id": "e1",
        "stepNumber": "01",
        "title": "Clarifying Oil Pre-Cleanse",
        "category": "First Cleanse",
        "description": "Dissolves mineral sunscreen...",
        "duration": "60 sec",
        "actives": ["Squalane"],
        "productName": "Purifying Botanical Cleansing Oil",
        "productType": "Oil Cleanse"
      }
    ],
    "weekly": [
      {
        "id": "w1",
        "stepNumber": "01",
        "title": "Papaya Enzyme Gentle Peel",
        "category": "Exfoliate",
        "description": "Natural enzymatic non-abrasive treatment...",
        "duration": "10 min",
        "actives": ["Papain", "Lactic Acid 5%"],
        "productName": "Micro-Exfoliating Enzyme Glaze",
        "productType": "Weekly Mask"
      }
    ]
  }
}`;

    const userPrompt = `User Profile:
${JSON.stringify(userProfile, null, 2)}

Latest Skin Scan Metrics:
${JSON.stringify(skinScanData, null, 2)}

Generate the personalized grooming routine as a JSON object matching the required structure exactly.`;

    const payload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" }
    };

    return this.executeWithFallback(payload);
  }

  async generateSkinRecommendations(context: any): Promise<any> {
    const systemPrompt = `You are an elite, clinical-grade AI dermatologist for Veyra.
Your task is to generate STRICT structured JSON recommendations based on the user's existing Skin Health Score, Skin Overview, Skin Type, and Skin Concerns.

IMPORTANT RULES:
- BE EXTREMELY CONCISE. Keep all reasons and descriptions to one short sentence to conserve tokens.
- YOUR RECOMMENDATIONS MUST BE STRICTLY AND EXPLICITLY BASED ON THE USER'S OVERALL "SKIN HEALTH SCORE" AND THE DETAILED "METRICS" PROVIDED.
- For Products, recommend REAL, popular, and affordable products from top skincare brands (e.g., Dot & Key, Hyphen, Minimalist, Plum, CeraVe, La Roche-Posay, The Ordinary).
- Include product recommendations for ALL core grooming categories: CLEANSER, TONER, SERUM, MOISTURIZER, SUNSCREEN, and EYE_CREAM.
- Include the actual brand name, product name, category, and an estimated price in INR (e.g., "₹450"). Do NOT include URLs or stock info.
- Return ONLY valid JSON matching this exact structure:

{
  "recommendations": [
    {
      "category": "CLEANSER",
      "brand": "CeraVe",
      "name": "Hydrating Facial Cleanser",
      "price": "₹450",
      "reason": "Soothes skin barrier and gently purifies."
    },
    {
      "category": "TONER",
      "brand": "Minimalist",
      "name": "PHAs 3% Face Toner",
      "price": "₹399",
      "reason": "Refines pores and balances skin pH."
    },
    {
      "category": "SERUM",
      "brand": "The Ordinary",
      "name": "Niacinamide 10% + Zinc 1%",
      "price": "₹600",
      "reason": "Balances sebum equilibrium and evens skin tone."
    },
    {
      "category": "MOISTURIZER",
      "brand": "La Roche-Posay",
      "name": "Toleriane Double Repair Moisturizer",
      "price": "₹850",
      "reason": "Restores natural skin moisture barrier."
    },
    {
      "category": "SUNSCREEN",
      "brand": "Dot & Key",
      "name": "Vitamin C + E SPF 50 Sunscreen",
      "price": "₹495",
      "reason": "Broad-spectrum UV protection without white cast."
    },
    {
      "category": "EYE_CREAM",
      "brand": "Hyphen",
      "name": "Vitamin Infused Under Eye Cream",
      "price": "₹425",
      "reason": "Reduces dark circles and hydrates delicate eye area."
    }
  ],
  "homeRemedies": [
    {
      "name": "Honey & Oatmeal Mask",
      "reason": "Calms superficial redness and hydrates."
    }
  ],
  "diet": [
    "Drink 3L of water daily",
    "Increase omega-3 fatty acids intake"
  ],
  "lifestyle": [
    "Ensure 8 hours of sleep",
    "Change pillowcases twice weekly"
  ]
}`;

    const minimalProfile = { age: context.profile.age, gender: context.profile.gender, budget: context.profile.budget };
    const minimalAnalysis = {
      score: context.skinAnalysis.overallScore,
      metrics: context.skinAnalysis.metrics?.map((m: any) => ({ name: m.name, status: m.status })),
      concerns: context.skinAnalysis.concerns?.map((c: any) => ({ name: c.name, level: c.level }))
    };

    const userPrompt = `User Profile:
${JSON.stringify(minimalProfile)}

Latest Skin Profile:
${JSON.stringify(minimalAnalysis)}

Generate the personalized recommendations JSON matching the structure exactly.`;

    const payload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" }
    };

    return this.executeWithFallback(payload);
  }
}
