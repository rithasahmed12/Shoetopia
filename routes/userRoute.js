const express = require("express");
const userRoute = express();

const auth = require("../middleware/userAuth");
const userController = require("../controllers/userControllers");
const ordersController = require('../controllers/ordersController');
const wishlistController = require('../controllers/wishlistController');

userRoute.set("views", "./views/user");

userRoute.get("/", auth.isLogout, userController.loadHome);

userRoute.get("/home", auth.isLogin, userController.loadHome);

userRoute.get("/about",userController.loadAbout);

userRoute.get("/login", auth.isLogout, userController.loadLogin);

userRoute.get("/signup", auth.isLogout, userController.loadSignup);

userRoute.post("/send-otp", userController.sendOtpVerificationEmail);

userRoute.post("/verify-otp-signup", userController.verifyOtpSignup);

userRoute.post("/submit-registration", userController.submitRegistration);

userRoute.get("/otp", auth.isLogout, userController.loadVerificationPage);

userRoute.post("/otp", userController.verifyOtp);

userRoute.post("/login", userController.verifyLogin);

userRoute.get("/logout", auth.isLogin, userController.logoutUser);

userRoute.get("/emailVerify", auth.isLogout, userController.loadEmailInput);

userRoute.post("/emailVerify", userController.sentOtpbyMail);

userRoute.get("/shop", userController.loadShop);

userRoute.get('/shop/filter',userController.loadShop);

userRoute.get("/product", userController.loadProduct);

userRoute.get('/forgetPass', auth.isLogout, userController. loadEmailInputForgetPass);

userRoute.post('/forgetPass',userController.verifyEmailForPass)

userRoute.get('/ResetForgetPass',auth.isLogout,userController.loadForgetPass);

userRoute.post('/ResetForgetPass',userController.resetForgetPassword);

userRoute.get('/cart',auth.checkBlocked,auth.isLogin,userController.loadCart);

userRoute.post('/addToCart',userController.addToCart);

userRoute.post('/changeQuantity',userController.postChangeQuantity)

userRoute.post('/deleteItems',userController.postDeleteItems)

userRoute.get('/profile',auth.isLogin,userController.loadUserProfile);

userRoute.post('/updateUserProfile',userController.updateUserProfile)

userRoute.get('/profile-address',auth.isLogin,userController.loadProfileAddress);

userRoute.post('/updateAddress',userController.editAddress);

userRoute.post('/deleteAddress',userController.deleteAddress);

userRoute.get('/orders',ordersController.loadOrders);

userRoute.get('/single-order',auth.isLogin,ordersController.loadSingleOrderDetails);

userRoute.post('/cancel-order',ordersController.cancelOrder);

userRoute.get('/blocked-user',auth.isLogin,userController.loadBlockedUser);

userRoute.post('/change-password',userController.changePassword);

userRoute.get('/wallet',auth.isLogin,userController.loadWallet);

userRoute.get('/invoice',auth.isLogin,ordersController.invoiceDownload)

module.exports = userRoute;