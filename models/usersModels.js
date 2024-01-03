const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_blocked:{
        type:Number,
        default:0
    },
    token:{
        type:String
    },
    address: [
        {
          name: {
            type: String,
          },
          housename: {
            type: String,
          },
          city: {
            type: String,
          },
          state: {
            type: String,
          },
          phone: {
            type: Number,
          },
          pincode: {
            type: Number,
          },
        },
      ],
      wallet: {
        type: Number,
        default: 0,
      },
      wallet_history: [
        {
          date: {
            type: Date,
          },
          amount: {
            type: Number,
          },
          description: {
            type: String,
          },
        },
      ],
      wishlist: [
        {
          productId: {
            type: mongoose.Types.ObjectId,
            ref: "product",
            required: true,
          },
          date: {
            type: Date,
          },
        },
      ],
  
},{timestamps:true});



module.exports = mongoose.model('User',userSchema);