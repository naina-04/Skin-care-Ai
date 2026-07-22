const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const callGeminiAPI = async (prompt) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return console.log('No GEMINI_API_KEY found');
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + geminiKey;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 350, temperature: 0.2 }
    }, { timeout: 10000 });
    
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('SUCCESS:', response.data.candidates[0].content.parts[0].text);
    } else {
      console.log('No text in response:', JSON.stringify(response.data));
    }
  } catch (err) {
    console.error('Gemini error:', err.response?.data || err.message);
  }
};

callGeminiAPI('You are a top-tier expert dermatologist. A patient\'s skin scan just detected "Melanoma" with 95% confidence. Provide exactly 3 short, actionable recommendations for skincare or medical advice. Format your response as a strict JSON array of 3 strings. Example: ["Advice 1", "Advice 2", "Advice 3"]. Do not include any markdown formatting like ```json. Return only the array.');
