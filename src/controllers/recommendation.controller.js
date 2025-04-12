// recommendation.controller.js
import { getRestaurantRecommendations } from '../services/recommendation.service.js';

export const getUserRecommendations = async (req, res) => {
  try {
    const recommendations = await getRestaurantRecommendations();
    res.json(recommendations);
  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
};
