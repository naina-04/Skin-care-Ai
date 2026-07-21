import { Router, Request, Response } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { isAuthenticated } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Recommendations logic based on condition
const generateRecommendations = (condition: string) => {
  const recommendationsMap: Record<string, string[]> = {
    'Acne': [
      'Use a gentle, non-comedogenic cleanser with salicylic acid.',
      'Avoid picking or popping blemishes to prevent scarring.',
      'Apply a light, oil-free moisturizer daily.'
    ],
    'Dryness': [
      'Use a rich, hydrating moisturizer with ceramides or hyaluronic acid.',
      'Avoid long, hot showers which strip natural oils.',
      'Consider using a humidifier in your bedroom.'
    ],
    'Redness': [
      'Use gentle, fragrance-free products to avoid irritation.',
      'Apply products with soothing ingredients like aloe vera or niacinamide.',
      'Always wear broad-spectrum SPF to protect sensitive skin.'
    ]
  };

  return recommendationsMap[condition] || [
    'Maintain a consistent daily cleansing routine.',
    'Apply broad-spectrum SPF 30+ sunscreen every day.',
    'Stay hydrated and eat a balanced diet for overall skin health.'
  ];
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
      }
    });

    const results = aiResponse.data;

    if (results.error) {
      return res.status(500).json({ error: results.error });
    }

    // 2. Format the response for the frontend
    const formattedResponse = {
      filename: req.file.originalname,
      primary: {
        condition: results.model1_prediction?.class_name || 'Normal',
        confidence: results.model1_prediction ? (results.model1_prediction.confidence * 100).toFixed(1) : 95.0
      },
      secondary: {
        condition: results.model2_prediction?.class_name || 'Clear',
        severity: results.model2_prediction?.confidence > 0.8 ? 'High' : 'Mild',
        confidence: results.model2_prediction ? (results.model2_prediction.confidence * 100).toFixed(1) : 90.0
      },
      recommendations: generateRecommendations(results.model2_prediction?.class_name || 'Normal')
    };

    res.json(formattedResponse);
  } catch (error: any) {
    console.error('Error connecting to AI service:', error.message);
    res.status(500).json({ error: 'Failed to process image through AI service. Ensure the AI microservice is running.' });
  }
});

export default router;
