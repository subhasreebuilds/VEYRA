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
    const openRouterKey = this.configService.get<string>('FALLBACK_LLM_API_KEY') || this.configService.get<string>('OPENROUTER_API_KEY');
    
    let lastError: any = null;

    // 1. Try Gemini
    if (geminiKey) {
      try {
        this.logger.log('Attempting AI generation with Gemini Pro...');
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

        let res;
        for (let attempt = 1; attempt <= 3; attempt++) {
          res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(nativePayload),
            signal: AbortSignal.timeout(20000)
          });

          if (res.ok) break;
          
          const errorText = await res.text();
          this.logger.warn(`Gemini attempt ${attempt} failed with status ${res.status}: ${errorText}`);
          
          if (res.status === 503 && attempt < 3) {
            this.logger.log(`Waiting 2 seconds before retry ${attempt + 1}...`);
            await new Promise(r => setTimeout(r, 2000));
          } else {
            break;
          }
        }

        if (res && res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            this.logger.log('✅ SUCCESS: AI request fulfilled by GEMINI PRO');
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanedText);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Gemini exception: ${err.message}`);
        lastError = err;
      }
    } else {
      this.logger.warn('No GEMINI_API_KEY provided, skipping Gemini.');
    }

    // 2. Try OpenRouter (Fallback)
    if (openRouterKey) {
      try {
        this.logger.log('Attempting AI generation with OpenRouter Fallback...');
        const orPayload = { ...payload, model: 'google/gemini-2.5-pro' };
        
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Veyra'
          },
          body: JSON.stringify(orPayload)
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            this.logger.log('✅ SUCCESS: AI request fulfilled by OPENROUTER');
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanedText);
          }
        } else {
          this.logger.error(`OpenRouter failed with status ${res.status}: ${await res.text()}`);
        }
      } catch (err: any) {
        this.logger.error(`OpenRouter exception: ${err.message}`);
        lastError = err;
      }
    } else {
      this.logger.error('No FALLBACK_LLM_API_KEY (OpenRouter) provided.');
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
        // Generate a random score. If lower is better, tend towards lower numbers for a realistic "good" scan.
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
          { id: "r1", title: "Demo: High Protein Pancakes", category: "Breakfast", time: "15 min", calories: "400", macros: { protein: "30g", carbs: "40g", fat: "10g" }, tags: ["High Protein"], image: "/recipe-1.jpg", description: "Fluffy protein pancakes.", benefits: "Muscle repair.", ingredients: ["1 cup oats", "1 scoop protein powder", "2 eggs"], instructions: ["Blend ingredients", "Cook on skillet"] },
          { id: "r2", title: "Demo: Chicken Salad", category: "Lunch", time: "10 min", calories: "450", macros: { protein: "35g", carbs: "15g", fat: "25g" }, tags: ["Low Carb"], image: "/recipe-2.jpg", description: "Quick salad.", benefits: "Sustained energy.", ingredients: ["Chicken breast", "Mixed greens", "Olive oil"], instructions: ["Chop chicken", "Toss with greens and oil"] }
        ]
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
Your task is to generate 7 personalized, delicious recipes that STRICTLY adhere to the user's calculated macro-nutrient targets and constraints (allergies, dislikes).

IMPORTANT INSTRUCTIONS:
- Generate exactly 7 recipes.
- Allergies are HARD CONSTRAINTS.
- Return ONLY valid JSON. Do not include markdown code blocks.

REQUIRED JSON STRUCTURE:
{
  "recipes": [
    {
      "id": "will_be_generated_by_db",
      "title": "Recipe Name",
      "category": "High Protein",
      "time": "25 min",
      "calories": "[DYNAMIC]",
      "macros": { "protein": "[DYNAMIC]g", "carbs": "[DYNAMIC]g", "fat": "[DYNAMIC]g" },
      "tags": ["Gluten-Free"],
      "image": "/placeholder.png",
      "description": "Description",
      "benefits": "Benefit",
      "ingredients": ["Ingredient 1"],
      "instructions": ["Step 1"]
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
- For Products, act as a knowledgeable skincare expert and recommend REAL, popular, and affordable products from trendy Indian brands (e.g., Dot & Key, Hyphen, Pilgrim, Minimalist, Plum).
- Include the actual brand name, product name, and an estimated price in INR (e.g., "₹450"). Do NOT include URLs or stock info.
- EXTREME TOKEN LIMIT: You MUST output exactly 3 product recommendations, exactly 1 home remedy, exactly 2 diet tips, and exactly 2 lifestyle tips. Any more will cause a crash.
- Return ONLY valid JSON matching this exact structure, but filled with ACTUAL personalized recommendations for the user:

{
  "recommendations": [
    {
      "category": "<e.g., CLEANSER, SERUM, MOISTURIZER>",
      "brand": "<Real brand name, e.g. CeraVe>",
      "name": "<Real product name>",
      "price": "<Estimated price in USD, e.g. 15.00>",
      "reason": "<Specific reason based on user's metrics>"
    }
  ],
  "homeRemedies": [
    {
      "name": "<DIY remedy name>",
      "reason": "<Why it helps>"
    }
  ],
  "diet": [
    "<Dietary advice 1>",
    "<Dietary advice 2>"
  ],
  "lifestyle": [
    "<Lifestyle advice 1>",
    "<Lifestyle advice 2>"
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
