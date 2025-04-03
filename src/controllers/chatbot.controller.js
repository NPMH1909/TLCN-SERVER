import { detectIntent } from "../services/chatbot.service.js";
import { RestaurantService } from "../services/restaurant.service.js";

// export const chatbotResponse = async (req, res) => {
//   try {
//     const { message } = req.body;
//     if (!message) {
//       return res.status(400).json({ error: "Message is required" });
//     }

//     const response = await detectIntent(message);
//     res.json({ reply: response.fulfillmentText });
//   } catch (error) {
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };

export const chatbotResponse = async (req, res) => {
  try {
    const { message, lat, lng } = req.body;
    const result = await detectIntent(message);

    if (!result || !result.intent) {
      console.error("Không tìm thấy intent:", result);
      return res.json({
        reply: "Mình chưa hiểu câu hỏi của bạn. Bạn có thể hỏi về:\n1️⃣ Nhà hàng gần đây\n2️⃣ Nhà hàng nổi bật nhất",
      });
    }

    console.log("Intent được nhận diện:", result.intent.displayName);

    // ✅ Xử lý intent chào hỏi
    if (result.intent.displayName === "greeting") {
      return res.json({
        reply: "Xin chào! 👋 Tôi có thể giúp gì cho bạn?\nBạn có thể hỏi về:\n1️⃣ Nhà hàng gần đây\n2️⃣ Nhà hàng nổi bật nhất",
      });
    }

    // ✅ Tìm nhà hàng gần vị trí
    if (result.intent.displayName === "find_nearby_restaurants") {
      if (!lat || !lng) {
        return res.status(400).json({ error: "Thiếu tọa độ (lat, lng)!" });
      }

      const restaurants = await RestaurantService.findNearbyRestaurants(lat, lng);
      let reply = restaurants.length > 0
        ? "Đây là một số nhà hàng gần bạn:"
        : "Không tìm thấy nhà hàng nào gần bạn.";

      return res.json({ reply, restaurants });
    }

    // ✅ Tìm nhà hàng nổi bật theo rating
    if (result.intent.displayName === "find_top_restaurants") {
      const topRestaurants = await RestaurantService.getTopRatedRestaurants();
      let reply = topRestaurants.length > 0
        ? "Dưới đây là các nhà hàng nổi bật có đánh giá cao nhất:"
        : "Không tìm thấy nhà hàng nổi bật.";

      return res.json({ reply, restaurants: topRestaurants });
    }

    // ✅ Trường hợp chatbot không hiểu
    return res.json({
      reply: "Mình chưa hiểu câu hỏi của bạn. Bạn có thể hỏi về:\n1️⃣ Nhà hàng gần đây\n2️⃣ Nhà hàng nổi bật nhất",
    });
  } catch (error) {
    console.error("Lỗi chatbot:", error);
    res.status(500).json({ error: "Có lỗi xảy ra!" });
  }
};
