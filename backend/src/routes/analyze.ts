import { Router, Request, Response } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { isAuthenticated } from '../middleware/auth';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Fallback recommendations logic based on condition
const generateFallbackRecommendations = (condition: string) => {
  const recommendationsMap: Record<string, string[]> = {
    'Acne and Rosacea': [
      'Use a gentle, non-comedogenic cleanser with salicylic acid.',
      'Avoid picking or popping blemishes to prevent scarring.',
      'Apply a light, oil-free moisturizer daily.'
    ],
    'Melanoma Skin Cancer Nevi and Moles': [
      'URGENT: Schedule an appointment with a dermatologist immediately.',
      'Monitor the lesion for changes in asymmetry, border, color, or diameter (ABCDs).',
      'Avoid further UV exposure and consistently apply broad-spectrum SPF 50+.'
    ],
    'BCC': [
      'URGENT: Consult a dermatologist or oncologist for a biopsy.',
      'Protect the area from any further sun exposure.',
      'Do not attempt to treat this with over-the-counter creams.'
    ],
    'Eczema': [
      'Use a rich, fragrance-free moisturizing cream or ointment frequently.',
      'Take short, lukewarm showers instead of long hot ones.',
      'Avoid harsh soaps and switch to a gentle body wash.'
    ],
    'Psoriasis Lichen Planus and related diseases': [
      'Keep the skin well-moisturized to reduce scaling and itching.',
      'Consider over-the-counter coal tar or salicylic acid preparations if mild.',
      'Consult a dermatologist for advanced therapies if symptoms persist.'
    ],
    'Vitiligo': [
      'Protect depigmented areas with high-SPF sunscreen as they are extremely vulnerable to sunburn.',
      'Consult a dermatologist to discuss therapies like topical corticosteroids or light therapy.'
    ],
    'Rosacea': [
      'Avoid common triggers like spicy foods, alcohol, extreme temperatures, and sun exposure.',
      'Use very gentle, non-irritating skincare products and always apply a physical sunscreen.',
      'Consult a dermatologist for prescription topical or oral treatments.'
    ]
  };

  return recommendationsMap[condition] || [
    'Maintain a consistent daily cleansing routine.',
    'Apply broad-spectrum SPF 30+ sunscreen every day.',
    'Stay hydrated and eat a balanced diet for overall skin health.'
  ];
};

// Helper function to call Google Gemini API (Ultra-fast ~300-500ms)
const callGeminiAPI = async (prompt: string): Promise<string | null> => {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiKey) return null;

  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  for (const model of models) {
    try {
      console.log(`Using Google Gemini API (${model})...`);
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 350
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 2000
        }
      );
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch (error: any) {
      console.warn(`Gemini API model ${model} failed:`, error?.response?.data?.error?.message || error.message);
    }
  }
  return null;
};

// Helper function to call Groq API (Extremely fast, sub-second)
const callGroqAPI = async (prompt: string): Promise<string | null> => {
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  if (!groqKey) return null;

  const groqModels = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];

  for (const model of groqModels) {
    try {
      console.log(`Using Groq API (${model})...`);
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 450
      }, {
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      });

      if (response.status === 200 && response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content.trim();
      }
    } catch (error: any) {
      console.warn(`Groq API (${model}) failed:`, error?.response?.data?.error?.message || error.message);
    }
  }
  return null;
};

// Helper function to call OpenRouter API with high-speed models
const callOpenRouterAPI = async (prompt: string): Promise<string | null> => {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) return null;

  // List of active high-speed free models on OpenRouter (limited to 2 for faster fallback)
  const fastModels = [
    'nvidia/nemotron-nano-9b-v2:free',
    'google/gemma-4-31b-it:free'
  ];

  for (const model of fastModels) {
    try {
      console.log(`Using OpenRouter API with model ${model}...`);
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model,
        temperature: 0.2,
        max_tokens: 350,
        messages: [{ role: 'user', content: prompt }],
      }, {
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Skin Analyzer AI',
          'Content-Type': 'application/json',
        },
        timeout: 2000
      });

      if (response.status === 200 && response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content.trim();
      }
    } catch (error: any) {
      console.warn(`OpenRouter model ${model} failed/timed out, trying next...`);
    }
  }
  return null;
};

// Unified Fast AI Caller (Gemini -> Groq -> OpenRouter)
const callAI = async (prompt: string): Promise<string | null> => {
  const geminiRes = await callGeminiAPI(prompt);
  if (geminiRes) return geminiRes;

  const groqRes = await callGroqAPI(prompt);
  if (groqRes) return groqRes;

  const openRouterRes = await callOpenRouterAPI(prompt);
  if (openRouterRes) return openRouterRes;

  return null;
};

// Dynamic AI Recommendations via Fast LLMs
const generateAIRecommendations = async (condition: string, confidence: number): Promise<string[]> => {
  const prompt = `You are a top-tier expert dermatologist. A patient's skin scan just detected "${condition}" with ${confidence}% confidence. 
Provide exactly 3 short, actionable recommendations for skincare or medical advice. 
If the condition is a serious cancer (like Melanoma or BCC), emphasize seeing a doctor immediately.
Format your response as a strict JSON array of 3 strings. Example: ["Advice 1", "Advice 2", "Advice 3"]. Do not include any markdown formatting like \`\`\`json. Return only the array.`;

  const parseAIResponse = (content: string): string[] => {
    // Try strict JSON array first
    const jsonMatch = content.match(/\[([\s\S]*?)\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String).slice(0, 3);
      } catch { /* fall through to text parsing */ }
    }

    // Handle numbered lists ("1. ...", "2. ...") or bullet points ("- ...", "* ...")
    const lines = content.split('\n')
      .map(l => l.replace(/^\s*(?:\d+[.)\-]|[-*•])\s*/, '').trim())
      .filter(l => l.length > 10 && !l.startsWith('#') && !l.startsWith('```'));
    if (lines.length >= 2) return lines.slice(0, 3);

    throw new Error("Could not extract recommendations from AI response");
  };

  const rawResult = await callAI(prompt);
  if (rawResult) {
    try {
      return parseAIResponse(rawResult);
    } catch (err) {
      console.error("Failed to parse AI recommendation output:", err);
    }
  }

  // Fallback to static mapping if AI generation fails
  console.log("Falling back to static recommendations.");
  return generateFallbackRecommendations(condition);
};

router.post('/', isAuthenticated, upload.single('image'), async (req: Request, res: Response): Promise<any> => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    // 1. Forward the image to Python microservice
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const aiResponse = await axios.post('http://localhost:8000/predict', formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000 // 30s timeout
    });

    const results = aiResponse.data;

    if (results.error) {
      return res.status(500).json({ error: results.error });
    }

    // 2. Format the response for the frontend
    // Use ensemble_best from the Triple-Ensemble
    const bestPrediction = results.ensemble_best || results.model1_prediction || null;
    const secondaryPrediction = results.model3_prediction || results.model2_prediction || null;

    const conditionName = bestPrediction?.class_name || 'Normal';
    const confidenceVal = bestPrediction ? Number((bestPrediction.confidence * 100).toFixed(1)) : 95.0;

    // Fast fallback recommendations initially
    const initialRecommendations = generateFallbackRecommendations(conditionName);

    const formattedResponse = {
      filename: req.file.originalname,
      primary: {
        condition: conditionName,
        confidence: confidenceVal.toString()
      },
      secondary: {
        condition: secondaryPrediction?.class_name || 'Clear',
        severity: secondaryPrediction?.confidence > 0.8 ? 'High' : 'Mild',
        confidence: secondaryPrediction ? (secondaryPrediction.confidence * 100).toFixed(1) : 90.0
      },
      recommendations: initialRecommendations
    };

    res.json(formattedResponse);
  } catch (error: any) {
    console.error('Error connecting to AI service:', error.message);
    res.status(500).json({ error: 'Failed to process image through AI service. Ensure the AI microservice is running.' });
  }
});

const generateFallbackDetailedReport = (condition: string, severity: string): string => {
  const reports: Record<string, string> = {
    'Acne and Rosacea': `### Overview & Causes
**Acne and Rosacea** are chronic inflammatory skin conditions characterized by papules, pustules, erythema, and clogged pores. Common triggers include hormonal fluctuations, excess sebum production, *Cutibacterium acnes* bacterial proliferation, stress, spicy foods, and temperature shifts.

### Lifestyle Changes
- Cleanse gently twice daily with a non-comedogenic, pH-balanced cleanser.
- Avoid picking, squeezing, or popping lesions to prevent scarring and post-inflammatory hyperpigmentation.
- Identify and avoid dietary triggers such as high-glycemic foods and dairy.
- Apply broad-spectrum physical sunscreen (zinc oxide/titanium dioxide) daily.

### Specific Prescriptions
- **Topical Retinoids**: Tretinoin 0.025% cream or Adapalene 0.1% gel (nightly).
- **Topical Antibacterials & Anti-inflammatories**: Benzoyl Peroxide 2.5%–5% wash, Azelaic Acid 15% gel, or Clindamycin 1% topical solution.
- **Oral Antibiotics (Severe Cases)**: Doxycycline 100mg daily or Minocycline 50mg–100mg under dermatologist supervision.`,

    'Melanoma Skin Cancer Nevi and Moles': `### Overview & Causes
**Melanoma & Dysplastic Nevi** represent serious melanocytic neoplasms requiring urgent medical evaluation. Melanoma arises from malignant transformation of melanocytes, primarily driven by cumulative or intense intermittent ultraviolet (UV) radiation exposure, genetic predisposition (CDKN2A mutations), and high mole count.

### Lifestyle Changes
- **URGENT**: Schedule an immediate in-person dermatoscopic examination and biopsy with a board-certified dermatologist.
- Strictly monitor moles using the **ABCDE criteria** (Asymmetry, Border irregularity, Color variation, Diameter > 6mm, Evolving).
- Avoid all UV exposure and tanning beds; wear protective clothing (UPF 50+) and wide-brimmed hats.
- Apply broad-spectrum SPF 50+ sunscreen every 2 hours when outdoors.

### Specific Prescriptions
- **Diagnostic Biopsy**: Full-thickness excisional biopsy required for histopathological staging (Breslow depth).
- **Surgical Excision**: Wide local excision with appropriate surgical margins based on Breslow thickness.
- **Systemic Immunotherapy / Targeted Therapy**: Pembrolizumab (Keytruda), Nivolumab (Opdivo), or Dabrafenib + Trametinib for BRAF-mutated advanced melanoma.`,

    'BCC': `### Overview & Causes
**Basal Cell Carcinoma (BCC)** is the most common form of skin cancer, arising from basal cells in the innermost layer of the epidermis. It is primarily caused by long-term UV radiation exposure damaging cellular DNA. While BCC rarely metastasizes, it is locally destructive if untreated.

### Lifestyle Changes
- **URGENT**: Consult a dermatologist or surgical oncologist promptly for definitive diagnosis and treatment options.
- Protect the lesion from friction, trauma, and further solar radiation.
- Conduct monthly self-examinations to check for new translucent, pearly, or non-healing bleeding papules.

### Specific Prescriptions
- **Surgical Interventions**: Mohs Micrographic Surgery (for facial/high-risk areas) or Standard Excision.
- **Topical Immunotherapy (Superficial BCC)**: Imiquimod 5% cream or Fluorouracil (5-FU) 5% cream.
- **Hedgehog Pathway Inhibitors (Advanced BCC)**: Vismodegib (Erivedge) or Sonidegib (Odomzo).`,

    'Eczema': `### Overview & Causes
**Eczema (Atopic Dermatitis)** is a chronic pruritic inflammatory skin disorder linked to skin barrier dysfunction (often filaggrin gene mutations), immune dysregulation, and environmental hypersensitivity. It presents with dry, erythematous, scaling, and intensely itchy plaques.

### Lifestyle Changes
- Apply ceramide-rich emollients within 3 minutes of bathing ("soak and seal" method).
- Limit showers to 5–10 minutes using lukewarm water and soap-free cleanser.
- Wear breathable, 100% cotton clothing and avoid wool or synthetic fabrics.
- Use hypoallergenic, fragrance-free laundry detergents.

### Specific Prescriptions
- **Topical Corticosteroids**: Hydrocortisone 2.5% (face/folds) or Triamcinolone Acetonide 0.1% cream (body).
- **Topical Calcineurin Inhibitors**: Tacrolimus 0.1% ointment or Pimecrolimus 1% cream.
- **Biologic / Targeted Therapy**: Dupilumab (Dupixent) injections for moderate-to-severe eczema.`,

    'Psoriasis Lichen Planus and related diseases': `### Overview & Causes
**Psoriasis & Lichenoid Dermatoses** are autoimmune-mediated inflammatory conditions driven by hyperproliferation of keratinocytes and T-cell mediated cytokine cascades (TNF-alpha, IL-17, IL-23). They present with silver-scaled erythematous plaques on extensor surfaces.

### Lifestyle Changes
- Maintain continuous skin hydration with heavy emollients (ointments/petrolatum).
- Avoid skin trauma (Koebner phenomenon), such as scratching, rubbing, or tight clothing.
- Manage stress and reduce alcohol intake, as both are well-known flare triggers.

### Specific Prescriptions
- **Topical Therapies**: Clobetasol Propionate 0.05% ointment, Calcipotriene (Vitamin D3 analog), or Coal Tar formulations.
- **Oral Systemic Agents**: Methotrexate, Cyclosporine, or Apremilast (Otezla).
- **Biologic Agents**: Secukinumab (Cosentyx), Ustekinumab (Stelara), or Adalimumab (Humira).`,

    'Rosacea': `### Overview & Causes
**Rosacea** is a vascular and inflammatory facial skin condition causing persistent central facial erythema, telangiectasias, and papulopustules. Triggered by Demodex folliculorum mites, UV radiation, thermal stress, alcohol, and spicy foods.

### Lifestyle Changes
- Avoid known vascular triggers (hot beverages, alcohol, spicy foods, extreme temperature changes).
- Apply gentle, non-chemical physical sunscreen (Zinc Oxide 10%+) daily.
- Use ultra-gentle, non-foaming cleansers and avoid alcohol-based toners.

### Specific Prescriptions
- **Topical Vasoconstrictors & Anti-inflammatories**: Metronidazole 0.75% gel, Ivermectin 1% cream (Soolantra), or Brimonidine 0.33% gel (Mirvaso).
- **Oral Antibiotics**: Doxycycline 40mg sub-antimicrobial modified-release capsules daily.`
  };

  return reports[condition] || `### Overview & Causes
Based on clinical computer vision analysis, the scan evaluated characteristics associated with **${condition}** (Severity: ${severity}). This condition presents with localized skin changes influenced by epidermal barrier factors, immune responses, or environmental exposures.

### Lifestyle Changes
- Maintain a clean, hydrated skin barrier using gentle, fragrance-free cleansers.
- Avoid picking, scratching, or irritating the affected area to prevent secondary bacterial infection.
- Protect the skin from excess UV exposure by wearing broad-spectrum SPF 30+ sunscreen daily.

### Specific Prescriptions
- **Topical Protection & Emollients**: Ceramide-based barrier repair creams or OTC hydrocortisone 1% for mild itch.
- **Medical Consultation**: Consult a qualified dermatologist for a comprehensive physical examination and personalized prescription treatment.`;
};

const generateAIDetailedReport = async (condition: string, severity: string): Promise<string> => {
  const prompt = `Act as an expert dermatologist. The patient's AI skin scan just detected "${condition}" with high confidence. The secondary risk severity is evaluated as "${severity}". 

CRITICAL REQUIREMENT: You must respond ONLY in English. Do not include any foreign language characters, symbols, or unreadable text under any circumstances.

Please provide a detailed clinical overview structured exactly as follows using Markdown:

### Overview & Causes
A paragraph explaining the condition and its common causes.

### Lifestyle Changes
A paragraph detailing recommended lifestyle adjustments.

### Specific Prescriptions
Explicitly list specific examples of medications (creams, ointments, sunscreens, or oral tablets) that are commonly prescribed for this condition. Format these prescriptions as a clear, easy-to-read bulleted list. This section must be highly distinct and detailed.`;

  const rawResult = await callAI(prompt);
  if (rawResult) {
    return rawResult;
  }

  // Instant fallback rich clinical report if OpenRouter times out (>3s) or fails
  return generateFallbackDetailedReport(condition, severity);
};

router.post('/report', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
  try {
    const { condition, severity } = req.body;
    if (!condition) {
      return res.status(400).json({ error: 'Condition is required' });
    }
    const report = await generateAIDetailedReport(condition, severity || 'Mild');
    res.json({ report });
  } catch (error: any) {
    console.error('Error generating AI report:', error.message);
    res.status(500).json({ error: 'Failed to generate clinical report' });
  }
});

router.post('/recommendations', isAuthenticated, async (req: Request, res: Response): Promise<any> => {
  try {
    const { condition, confidence } = req.body;
    if (!condition) {
      return res.status(400).json({ error: 'Condition is required' });
    }
    const aiRecommendations = await generateAIRecommendations(condition, confidence || 90);
    res.json({ recommendations: aiRecommendations });
  } catch (error: any) {
    console.error('Error fetching AI recommendations:', error.message);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

export default router;
