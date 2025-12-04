"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ChatbotController_1 = require("../controllers/ChatbotController");
const router = (0, express_1.Router)();
router.post('/chat', ChatbotController_1.ChatbotController.chat);
router.get('/search', ChatbotController_1.ChatbotController.search);
exports.default = router;
