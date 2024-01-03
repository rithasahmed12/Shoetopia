const express = require("express");
const wishlistRoute = express();

const auth = require("../middleware/userAuth");

const wishlistController = require('../controllers/wishlistController');

wishlistRoute.set("views", "./views/user");

wishlistRoute.get('/wishlist',auth.isLogin,wishlistController.loadWishlist);

wishlistRoute.post('/addWishlist',auth.isLogin,wishlistController.addWishlist)

wishlistRoute.patch('/deleteWishlist',auth.isLogin,wishlistController.deleteWishlistProduct);

module.exports = wishlistRoute;