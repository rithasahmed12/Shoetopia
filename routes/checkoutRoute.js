const express = require("express");
const checkoutRoute = express();

const auth = require("../middleware/userAuth");

const checkoutController = require("../controllers/checkoutController");

checkoutRoute.set("views", "./views/user");


checkoutRoute.get('/checkout-items',auth.checkBlocked,auth.isLogin,checkoutController.loadCheckout);

checkoutRoute.post('/addAddress',checkoutController.addAddress);

checkoutRoute.post('/placeOrder',checkoutController.postOrderPlaced);

checkoutRoute.get('/order-placed/:id',auth.isLogin,checkoutController.loadOrderPlaced);

checkoutRoute.post('/verify-payment',checkoutController.verifyPayment);

checkoutRoute.post('/applyCoupon',checkoutController.applyCoupon);


module.exports = checkoutRoute;