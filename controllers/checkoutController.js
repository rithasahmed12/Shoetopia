const razorpay = require("razorpay");
const moment = require("moment");

const User = require("../models/usersModels");
const Products = require("../models/productsModel");
const Coupon = require("../models/couponModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const dotenv = require("dotenv");
dotenv.config();

var instance = new razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { offerDiscount } = req.session;

    // Ensure that couponApplied is set in the session
    if (req.session.couponApplied !== true) {
      req.session.couponApplied = false;
    }

    const cart = await Cart.findOne({ user_id: userId })
      .populate({
        path: "items.product_id",
        populate: {
          path: "offer",
        },
      })
      .populate({
        path: "items.product_id",
        populate: {
          path: "category",
          populate: {
            path: "offer",
          },
        },
      });

    if (userId && cart) {
      let subTotal = 0;
      let originalAmt = 0;

      if (cart && cart.items) {
        cart.items.forEach(async (cartItem) => {
          let itemPrice = cartItem.product_id.price; // Use the price from the populated product
          let itemQuantity = cartItem.quantity;
          cartTotalPrice = cartItem.total_price;

          originalAmt += cartTotalPrice;
          // Check if there's an offer at the product level
          if (cartItem.product_id.offer) {
            itemPrice -=
              (itemPrice * cartItem.product_id.offer.percentage) / 100;
          }

          // Check if there's an offer at the category level
          else if (
            cartItem.product_id.category &&
            cartItem.product_id.category.offer
          ) {
            itemPrice -=
              (itemPrice * cartItem.product_id.category.offer.percentage) / 100;
          }

          let itemTotal = itemPrice * itemQuantity;

          subTotal += itemTotal;
        });
      }

      const user = await User.findOne({ _id: req.session.userId });
      const coupons = await Coupon.find({});

      let discountAmount = 0;

      if (req.session.discountAmount) {
        discountAmount = req.session.discountAmount;
      }

      // Filter out coupons that the user has already used
      const filteredCoupons = coupons.filter((coupon) => {
        const isUserUsed = coupon.userUsed.some(
          (used) => String(used.user_id) === String(userId)
        );
        return !isUserUsed;
      });

      res.render("checkout-items", {
        cart,
        subTotal,
        discountAmount,
        user,
        coupons: filteredCoupons,
        offerDiscount,
        originalAmt,
      });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    res.redirect("/500");
  }
};

const addAddress = async (req, res) => {
  try {
    const { name, phone, housename, city, state, pincode } = req.body;

    const user = await User.findOne({ _id: req.session.userId });
    if (user) {
      await User.updateOne(
        { _id: req.session.userId },
        {
          $push: {
            address: {
              name: name,
              phone: phone,
              housename: housename,
              city: city,
              state: state,
              pincode: pincode,
            },
          },
        }
      );

      // Send a JSON response
      res.json({ success: true, message: "Address added successfully" });
    } else {
      // Send a JSON response indicating an error
      res.status(400).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res.redirect("/500");

    // Send a JSON response indicating an error
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const postOrderPlaced = async (req, res) => {
  try {
    const date = new Date();

    const { selectedAddress, selectedPayment, subTotal, CouponDiscTotal } =
      req.body;
    const userId = req.session.userId;

    let couponApply = false;

    let couponName;

    const couponData = req.session.coupon;
    let id;

    if (couponData) {
      id = couponData._id;
      couponName = couponData.couponCode;
    }

    const randomNum = Math.floor(10000 + Math.random() * 90000);

    const orderID = "SHTP" + randomNum;

    if (selectedPayment === "wallet") {
      const user = await User.findById(userId);

      // Check if wallet balance is sufficient
      if (user.wallet < subTotal) {
        return res.json({
          walletFailed: true,
          message: "Insufficient wallet balance.",
        });
      }
      const status = "placed";

      // Deduct order amount from wallet
      user.wallet -= subTotal;

      // Update wallet history
      user.wallet_history.push({
        date: new Date(),
        amount: -subTotal,
        description: "Order placed",
      });

      await user.save();

      const userData = await User.findOne({ _id: userId });
      let cartData;
      let cartProducts;

      // Check if a coupon is applied
      if (req.session.couponApplied === true) {
        couponApply = true;

        const updateCouponUsed = await Coupon.updateOne(
          { _id: id },
          { $push: { userUsed: { user_id: userId } } }
        );
        await Coupon.updateOne({ _id: id }, { $inc: { Availability: -1 } });

        const couponDiscount = req.session.discountAmount || 0;

        cartData = await Cart.findOne({ user_id: userId });
        cartProducts = cartData.items;

        const totalQuantity = cartProducts.reduce(
          (total, item) => total + item.quantity,
          0
        );

        for (let i = 0; i < cartProducts.length; i++) {
          const item = cartProducts[i];
          const discountFraction = item.quantity / totalQuantity;
          const itemDiscount = Math.round(couponDiscount * discountFraction);

          cartProducts[i].discountAmount = itemDiscount;

          cartProducts[i].couponDiscountTotal += itemDiscount;
        }
        req.session.couponApplied = false;
      } else {
        cartData = await Cart.findOne({ user_id: userId });
        cartProducts = cartData.items;
      }

      const orderDate = date.toLocaleString();

      const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
      const deliveryDate = delivery
        .toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
        .replace(/\//g, "-");

      const order = new Order({
        user_id: userId,
        order_id: orderID,
        delivery_address: selectedAddress,
        user_name: userData.username,
        total_amount: subTotal,
        totalDiscountAmount: CouponDiscTotal,
        coupon_name: couponName,
        date: date,
        status: status,
        expected_delivery: deliveryDate,
        couponApplied: couponApply,
        payment: selectedPayment,
        items: cartProducts,
      });

      let orderData = await order.save();
      const orderId = orderData._id;

      await Cart.deleteOne({ user_id: userId });

      for (let i = 0; i < cartData.items.length; i++) {
        const productId = cartProducts[i].product_id;
        const count = cartProducts[i].quantity;

        await Products.updateOne(
          { _id: productId },
          { $inc: { stockQuantity: -count } }
        );
      }

      return res.json({ success: true, params: orderId });
    }

    const status = selectedPayment === "cod" ? "placed" : "pending";

    const userData = await User.findOne({ _id: userId });
    let cartData;
    let cartProducts;

    if (req.session.couponApplied === true) {
      couponApply = true;

      const updateCouponUsed = await Coupon.updateOne(
        { _id: id },
        { $push: { userUsed: { user_id: userId } } }
      );
      await Coupon.updateOne({ _id: id }, { $inc: { Availability: -1 } });

      const couponDiscount = req.session.discountAmount || 0;

      cartData = await Cart.findOne({ user_id: userId });
      cartProducts = cartData.items;

      const totalQuantity = cartProducts.reduce(
        (total, item) => total + item.quantity,
        0
      );

      for (let i = 0; i < cartProducts.length; i++) {
        const item = cartProducts[i];
        const discountFraction = item.quantity / totalQuantity;
        const itemDiscount = Math.round(couponDiscount * discountFraction);

        cartProducts[i].discountAmount = itemDiscount;

        cartProducts[i].couponDiscountTotal = itemDiscount;
      }
      req.session.couponApplied = false;
    } else {
      cartData = await Cart.findOne({ user_id: userId });
      cartProducts = cartData.items;
    }

    // const orderDate = date.toLocaleString();

    const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
    const deliveryDate = delivery
      .toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
      .replace(/\//g, "-");

    const order = new Order({
      user_id: userId,
      order_id: orderID,
      delivery_address: selectedAddress,
      user_name: userData.username,
      total_amount: subTotal,
      totalDiscountAmount: CouponDiscTotal,
      coupon_name: couponName,
      date: date,
      status: status,
      expected_delivery: deliveryDate,
      payment: selectedPayment,
      couponApplied: couponApply,
      items: cartProducts,
    });

    let orderData = await order.save();
    const orderId = orderData._id;

    if (orderData.status === "placed") {
      await Cart.deleteOne({ user_id: userId });

      for (let i = 0; i < cartData.items.length; i++) {
        const productId = cartProducts[i].product_id;
        const count = cartProducts[i].quantity;

        await Products.updateOne(
          { _id: productId },
          { $inc: { stockQuantity: -count } }
        );
      }

      res.json({ success: true, params: orderId });
    } else {
      const orderid = orderData._id;
      const total = orderData.total_amount;

      var options = {
        amount: total * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderid,
      };

      instance.orders.create(options, function (err, order) {
        return res.json({ success: false, order: order });
      });
    }
  } catch (error) {
    res.redirect("/500");
  }
};

const verifyPayment = async (req, res) => {
  try {
    const cartData = await Cart.findOne({ user_id: req.session.userId });
    const cartProducts = cartData.items;
    const details = req.body;

    const crypto = require("crypto");

    // Your secret key from the environment variable
    const secretKey = process.env.RAZORPAY_SECRET_KEY;

    // Creating an HMAC with SHA-256
    const hmac = crypto.createHmac("sha256", secretKey);

    // Updating the HMAC with the data
    hmac.update(
      details.payment.razorpay_order_id +
        "|" +
        details.payment.razorpay_payment_id
    );

    // Getting the hexadecimal representation of the HMAC
    const hmacFormat = hmac.digest("hex");

    if (hmacFormat == details.payment.razorpay_signature) {
      await Order.findByIdAndUpdate(
        { _id: details.order.receipt },
        { $set: { paymentId: details.payment.razorpay_payment_id } }
      );

      for (let i = 0; i < cartProducts.length; i++) {
        let count = cartProducts[i].quantity;
        await Products.findByIdAndUpdate(
          { _id: cartProducts[i].product_id },
          { $inc: { stockQuantity: -count } }
        );
      }

      await Order.findByIdAndUpdate(
        { _id: details.order.receipt },
        { $set: { status: "placed" } }
      );

      const userData = await User.findOne({ _id: req.session.userId });
      await Cart.deleteOne({ user_id: userData._id });

      res.json({ success: true, params: details.order.receipt });
    } else {
      await Order.findByIdAndDelete({ _id: details.order.receipt });
      res.json({ success: false });
    }
  } catch (error) {
    res.redirect("/500");
  }
};

const loadOrderPlaced = async (req, res) => {
  try {
    const userid = req.session.userId;
    const id = req.params.id;

    const order = await Order.findOne({ _id: id })
      .populate({
        path: "items.product_id",
        populate: {
          path: "offer",
        },
      })
      .populate({
        path: "items.product_id",
        populate: {
          path: "category",
          populate: {
            path: "offer",
          },
        },
      });

    const user = await User.findOne({ _id: userid });

    res.render("orderPlaced", { user: user, order: order, moment });
  } catch (error) {
    res.redirect("/500");
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, cartTotal } = req.body;
    const { userId } = req.session;
    const couponData = await Coupon.findOne({ couponCode: couponCode });

    req.session.coupon = couponData;
    let discountedTotal = 0;
    if (couponData) {
      let currentDate = new Date();

      let minAmount = couponData.minAmount;

      if (cartTotal >= couponData.minAmount) {
        if (
          currentDate <= couponData.expiryDate &&
          couponData.status !== false
        ) {
          const id = couponData._id;
          const couponUsed = await Coupon.findOne({
            _id: id,
            "userUsed.user_id": userId,
          });

          if (couponUsed) {
            res.send({ usedCoupon: true });
          } else {
            if (req.session.couponApplied === false) {
              if (couponData.Availability <= 0) {
                // Update the status to expired
                await Coupon.updateOne(
                  { _id: couponData._id },
                  { $set: { status: false } }
                );
                return res.send({ expired: true });
              }

              req.session.couponApplied = true;

              req.session.discountAmount = couponData.discountAmount;

              // req.session.discountAmount = minAmount;
              res.send({
                couponApplied: true,
                discountAmount: req.session.discountAmount,
              });
            } else {
              res.send({ onlyOneTime: true });
            }
          }
        } else {
          res.send({ expired: true });
        }
      } else {
        res.send({ shouldMinAmount: true, minAmount });
      }
    } else {
      res.send({ wrongCoupon: true });
    }
  } catch (error) {
    res.redirect("/500");
  }
};

module.exports = {
  loadCheckout,
  addAddress,
  postOrderPlaced,
  loadOrderPlaced,
  verifyPayment,
  applyCoupon,
};
