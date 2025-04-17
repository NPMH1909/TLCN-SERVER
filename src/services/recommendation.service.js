import ReviewModel from '../models/reviews.model.js';
import winkSentiment from 'wink-sentiment';
import { RestaurantModel } from '../models/restaurants.model.js';
import translate from 'translate'; // ✅ Thêm dòng này

// Cấu hình translate (nếu cần API key hoặc ngôn ngữ mặc định)
translate.engine = 'google'; // Sử dụng Google Translate engine
translate.key = 'YOUR_GOOGLE_API_KEY'; // (Chỉ nếu cần API key)

export async function getRestaurantRecommendations() {
  const allReviews = await ReviewModel.find({
    deleted_at: null,
    content: { $exists: true, $ne: '' }
  });

  const sentimentMap = {};

  for (const review of allReviews) {
    const rid = review.restaurant_id?.toString();
    const content = review.content?.trim();

    if (!rid || !content) continue;

    let sentimentScore = 0;

    try {
      // ✅ Dịch nội dung review từ tiếng Việt sang tiếng Anh
      const translated = await translate(content, { from: 'vi', to: 'en' });

      // ✅ Phân tích sentiment của nội dung đã dịch
      const result = winkSentiment(translated);

      sentimentScore = result.score;
    } catch (e) {
      console.error(`Sentiment error:`, e.message);
      continue;
    }

    if (!sentimentMap[rid]) {
      sentimentMap[rid] = {
        restaurant_id: rid,
        positive: 0,
        negative: 0,
        total: 0
      };
    }

    sentimentMap[rid].total += 1;
    if (sentimentScore > 0) {
      sentimentMap[rid].positive += 1;
    } else if (sentimentScore < 0) {
      sentimentMap[rid].negative += 1;
    }
  }

  // Chuyển đổi sentimentMap thành mảng các đề xuất
  const recommendations = await Promise.all(
    Object.values(sentimentMap)
      .filter((item) => item.total > 0)  // Lọc các nhà hàng có ít nhất một đánh giá
      .map(async (item) => {
        const restaurant = await RestaurantModel.findById(item.restaurant_id);
        if (!restaurant) return null;
        if (restaurant.rating < 4) {
          return null;
        }
        const positiveRate = item.total > 0 ? (item.positive / item.total) : 0;
        const negativeRate = item.total > 0 ? (item.negative / item.total) : 0;

        // Tính tỷ lệ tích cực / tiêu cực
        const positiveNegativeRatio = negativeRate === 0 ? positiveRate : positiveRate / negativeRate;

        // Chỉ trả về nhà hàng nếu tỷ lệ tích cực lớn hơn tiêu cực
        if (positiveRate > negativeRate) {
          return {
            _id: item.restaurant_id,
            totalReviews: item.total,
            positiveReviews: item.positive,
            negativeReviews: item.negative,
            positiveRate,
            negativeRate,
            positiveNegativeRatio, // Thêm tỷ lệ tích cực / tiêu cực
            name: restaurant.name,
            address: restaurant.address,
            type: restaurant.type,
            rating: restaurant.rating,
            image_url: restaurant.image_url,
            description: restaurant.description,
            openTime: restaurant.openTime,
            closeTime: restaurant.closeTime,
            price_per_table: restaurant.price_per_table
          };
        }

        return null;  // Nếu tỷ lệ tích cực không cao hơn tiêu cực thì không trả về nhà hàng này
      })
  );

  // Sắp xếp theo tỷ lệ tích cực / tiêu cực
  return recommendations
    .filter((item) => item !== null)  // Lọc các nhà hàng không hợp lệ
    .sort((a, b) => b.positiveNegativeRatio - a.positiveNegativeRatio);  // Sắp xếp theo tỷ lệ tích cực / tiêu cực
}
