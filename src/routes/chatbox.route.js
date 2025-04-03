import express from 'express';
import { CommentController } from '../controllers/comment.controller.js';
import { requireApiKey } from '../middlewares/useApiKey.middleware.js';
import { chatbotResponse } from '../controllers/chatbot.controller.js';

const ChatBox = express.Router();

// Route để tạo bình luận mới cho video
ChatBox.post('/', chatbotResponse);

export default ChatBox;
