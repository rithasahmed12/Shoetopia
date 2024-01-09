const Coupon = require("../models/couponModel");

const loadCouponList = async (req, res) => {
  try {
    const coupons = await Coupon.find({});

    res.render("coupons", { coupons });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadAddCoupons = async (req, res) => {
  try {
    res.render("add-coupons");
  } catch (error) {
    res.redirect("/500");
  }
};

const addCoupon = async (req, res) => {
  try {
    const {
      name,
      couponCode,
      couponDescription,
      couponAvailability,
      discountAmount,
      minAmount,
      expiryDate,
    } = req.body;

    const existCoupon = await Coupon.findOne({
      couponCode: { $regex: new RegExp(couponCode), $options: "i" },
    });

    if (existCoupon) {
      res.render("add-coupons", {
        message: "Coupon code already exists",
        name,
        couponCode,
        couponDescription,
        couponAvailability,
        discountAmount,
        minAmount,
        expiryDate,
      });
    } else {
      const coupon = new Coupon({
        couponName: name,
        couponCode: couponCode,
        discountAmount: discountAmount,
        minAmount: minAmount,
        couponDescription: couponDescription,
        Availability: couponAvailability,
        expiryDate: expiryDate,
        status: true,
      });

      await coupon.save();

      res.redirect("/admin/coupons");
    }
  } catch (error) {
    res.redirect("/500");
  }
};

const deleteCoupons = async (req, res) => {
  try {
    const couponId = req.params.couponId;

    await Coupon.deleteOne({ _id: couponId });

    res.json({ success: true });
  } catch (error) {
    res.redirect("/500");
  }
};

module.exports = {
  loadCouponList,
  loadAddCoupons,
  addCoupon,
  deleteCoupons,
};
