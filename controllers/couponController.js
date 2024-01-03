const moment = require('moment');
const User = require("../models/usersModels");
const Coupon = require('../models/couponModel');

const loadCouponList = async(req,res)=>{
    try {
    
      const coupons = await Coupon.find({});  

      res.render('coupons',{coupons})      

    } catch (error) {

        console.log(error.message);
    
    }
}

const loadAddCoupons = async(req,res)=>{
    try {
        
        res.render('add-coupons')

    } catch (error) {

        console.log(error.message);
    }
}


const addCoupon=async(req,res)=>{
    try {
  console.log('COUPONS:',req.body);
  const{name,couponCode,couponDescription,couponAvailability,discountAmount,minAmount,expiryDate}=req.body
   

    const existCoupon = await Coupon.findOne({
  couponCode: { $regex: new RegExp(couponCode), $options: 'i' }
});

console.log(existCoupon);

       if(existCoupon){

     res.render('add-coupons',{message:'Coupon code already exists',
     name,couponCode,couponDescription,couponAvailability,discountAmount,minAmount,expiryDate},)
      
    } else {

      const coupon=new Coupon({
        couponName:name,
        couponCode:couponCode,
        discountAmount:discountAmount,
        minAmount:minAmount,
        couponDescription:couponDescription,
        Availability:couponAvailability,
        expiryDate:expiryDate,
        status:true

      })


       
   await coupon.save()


    res.redirect('/admin/coupons')

       }
    
    } catch (error) {
      console.log(error.message);
    }
}

const deleteCoupons = async (req, res) => {
  try {
      const couponId = req.params.couponId;

      await Coupon.deleteOne({ _id:couponId });
      
      res.json({ success: true });

  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};



module.exports = {
    loadCouponList,
    loadAddCoupons,
    addCoupon,
    deleteCoupons
}