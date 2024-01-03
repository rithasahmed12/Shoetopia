const express = require("express");
const couponRoute = express();
const adminAuth = require("../middleware/adminAuth");

const couponController = require("../controllers/couponController");


couponRoute.set("views", "./views/admin");


couponRoute.get("/coupons", adminAuth.isLogin, couponController.loadCouponList);

couponRoute.get("/addCoupons", adminAuth.isLogin, couponController.loadAddCoupons);

couponRoute.post("/addCoupons", couponController.addCoupon);

couponRoute.post(
  "/coupons/deleteCoupon/:couponId",
  couponController.deleteCoupons
);

module.exports = couponRoute;