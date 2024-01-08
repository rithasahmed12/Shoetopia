const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type:mongoose.Types.ObjectId,
    ref:'categories',
    required:true,
    
  },
  image: {
    type:[String],
    required:true
  },
  stockQuantity: {
    type: Number,
    required:true,
  },
  date:{
    type: String,
    required:true
  },
  is_listed:{
    type:Number,
    default:1
  },
  offer:{
    type : mongoose.Schema.Types.ObjectId,
    ref:"offer"
  },
  offerPrice:{
    type:Number
  },
  reviews:[{
    user_id: {
      type : mongoose.Schema.Types.ObjectId,
      ref:"User"
    },
    rating:{ type:Number},
    description:{ type:String },
    createdAt: {type: Date},
  }],

});


module.exports= mongoose.model('product',productSchema);