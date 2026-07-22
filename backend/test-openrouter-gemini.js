const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const callOpenRouterGemini = async () => {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const models = [
    'google/gemini-2.0-flash-lite-preview-02-05:free',
    'google/gemini-2.5-flash-preview-05-20:free',
    'google/gemini-exp-1206:free',
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-2.0-pro-exp-02-05:free',
    'google/gemini-2.0-flash-thinking-exp:free'
  ];

  for (const model of models) {
    try {
      console.log('Testing model:', model);
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: model,
        messages: [{ role: 'user', content: 'Say hello in one word' }],
      }, {
        headers: {
          'Authorization': 'Bearer ' + openRouterKey,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Skin Analyzer AI',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data?.choices?.[0]?.message?.content) {
        console.log('SUCCESS with ' + model + ':', response.data.choices[0].message.content);
      } else {
        console.log('NO CONTENT with ' + model);
      }
    } catch (err) {
      console.error('Error with ' + model + ':', err.response?.data || err.message);
    }
  }
};
callOpenRouterGemini();
