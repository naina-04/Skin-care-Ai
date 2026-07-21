export const translateText = async (text: string, targetLang: string) => {
  if (!text) return '';
  if (targetLang === 'en') return text;
  
  try {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ q: text }),
    });
    const data = await response.json();
    let translatedText = '';
    if (data && data[0]) {
      data[0].forEach((item: any) => {
        if (item[0]) translatedText += item[0];
      });
    }
    return translatedText;
  } catch (e) {
    console.error('Translation failed:', e);
    return text;
  }
};
