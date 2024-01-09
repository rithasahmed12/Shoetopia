const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Make sure this matches the name of your User model
      required: true,
    },
    order_id: {
      type: String,
      required: true,
    },
    delivery_address: {
      type: String,
      required: true,
    },
    user_name: {
      type: String,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    expected_delivery: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    payment: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
    },
    totalDiscountAmount: {
      type: Number,
    },
    couponApplied: {
      type: Boolean,
    },
    coupon_name: {
      type: String,
    },
    items: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        total_price: {
          type: Number,
          required: true,
        },
        offerPercentage: {
          type: Number,
        },
        couponDiscountTotal: {
          type: Number,
        },
        ordered_status: {
          type: String,
          default: "placed",
        },
        cancellationReason: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
