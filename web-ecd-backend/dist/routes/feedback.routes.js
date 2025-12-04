"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FeedbackController_1 = require("../controllers/FeedbackController");
const router = (0, express_1.Router)();
router.post('/', FeedbackController_1.FeedbackController.create);
router.get('/client/:clientId', FeedbackController_1.FeedbackController.getByClient);
exports.default = router;
