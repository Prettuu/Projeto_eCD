"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RecommendationController_1 = require("../controllers/RecommendationController");
const router = (0, express_1.Router)();
router.get('/', RecommendationController_1.RecommendationController.getPersonalized);
exports.default = router;
