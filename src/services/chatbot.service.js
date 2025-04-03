import dialogflow from "@google-cloud/dialogflow";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const projectId = "bookingrestaurant-453309"; // Thay bằng Project ID của bạn
const keyPath = path.resolve("dialogflow-key.json");

// Khởi tạo session Client
const sessionClient = new dialogflow.SessionsClient({ keyFilename: keyPath });

export const detectIntent = async (text) => {
  try {
    const sessionId = uuidv4();
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
          languageCode: "vi",
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    console.log("Phản hồi từ Dialogflow:", JSON.stringify(responses, null, 2));

    if (!responses || responses.length === 0 || !responses[0].queryResult) {
      throw new Error("Không nhận được queryResult từ Dialogflow");
    }

    return responses[0].queryResult;
  } catch (error) {
    console.error("Lỗi khi gọi Dialogflow:", error);
    return null;
  }
};
