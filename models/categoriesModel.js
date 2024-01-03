const mongoose = require('mongoose');

const categoriesSchema = new mongoose.Schema({
   name:{
    type:String,
    required:true},

   description:String,

   is_listed:{
    type:Number,
    default:1
   },
   offer : {
      type : mongoose.Schema.Types.ObjectId,
      ref : 'offer'
  }
   
});



module.exports = mongoose.model('categories',categoriesSchema);