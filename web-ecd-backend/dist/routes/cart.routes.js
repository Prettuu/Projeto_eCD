"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CartController_1 = require("../controllers/CartController");
const router = (0, express_1.Router)();
router.post('/cart-item', CartController_1.CartController.addItem);
router.get('/', CartController_1.CartController.getCart);
exports.default = router;
