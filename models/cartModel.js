const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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
        default: 1,
      },

      price: {
        type: Number,
        required: true,
      },

      total_price: {
        type: Number,
        required: true,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      couponDiscountTotal: {
        type: Number,
        default: 0,
      },
      offerPercentage: {
        type: Number,
      },
      status: {
        type: String,
        default: "placed",
      },
      cancellationReason: {
        type: String,
        default: "none",
      },
    },
  ],
});

module.exports = mongoose.model("cart", cartSchema);
