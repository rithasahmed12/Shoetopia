const User = require("../models/usersModels");
const moment = require('moment');
const Products = require("../models/productsModel");
const Categories = require("../models/categoriesModel");
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel')
const dotenv = require('dotenv');
const path = require('path')
const fs = require('fs')
const ejs = require("ejs");
const puppeteer = require("puppeteer");
dotenv.config();



const loadOrders = async (req, res) => {
  try {
    req.session.couponApplied = false;
    req.session.discountAmount = 0;

    console.log(req.query);

    const userId = req.session.userId;
    let { page, status,payment } = req.query;
    const perPage = 4; 

    let query = { user_id: userId };

   
    if (status) {
      query['items.ordered_status'] = status;
    }

    if (payment) {
      query['payment'] = payment;
    }
    
    const totalCount = await Order.countDocuments(query);

    console.log('query:', query);
    const orders = await Order.find(query)
      .populate('items.product_id')
      .sort({ _id: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    console.log('orders:', orders);

    const user = await User.findOne({ _id: userId });

    res.locals.orders = orders;
    res.locals.user = user;

    res.render('orders', {
      orders,
      user,
      moment,
      totalPages: Math.ceil(totalCount / perPage),
      currentPage: parseInt(page),
      status,
      payment
    });
  } catch (error) {
    console.log(error.message);
  }
};






  const loadSingleOrderDetails = async (req, res) => {
    try {
      req.session.couponApplied = false;
      req.session.discountAmount= 0;

      const userId = req.session.userId;
      const orderId = req.query.orderId;
  
      // Load  main order details
      const mainOrder = await Order.findOne({ _id: orderId, user_id: userId }).populate({
        path: "items.product_id",
        populate:{
          path:'offer'
        }
      }).populate({
        path: "items.product_id",
        populate: {
          path: 'category',
          populate: {
            path: 'offer',
        
          },  
        }
      });
  
      // Load  specific item details 
      // const orderItem = mainOrder.items.find(item => item._id.toString() === req.query.itemId);
  
   

      const user = await User.findOne({_id:userId});
  
     
      res.render('single-order', { order: mainOrder, user ,moment});
     
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  };

  const cancelOrder = async (req, res) => {
    console.log('sghjdshdj:',req.body);
    const orderId = req.body.orderId;
    const itemId = req.body.itemId;
    const reason = req.body.reason;
    const returnReason = req.body.returnReason;

  
    try {
      if(reason){
        const updatedOrder = await Order.updateOne(
          { _id: orderId, 'items._id': itemId },
          { $set: { 
            'items.$.ordered_status': 'request_cancellation',
            'items.$.cancellationReason':reason
        } }
        );
    
        res.status(200).json({ message: 'Order cancellation requested', order: updatedOrder });

      }

     if(returnReason){
      const updatedOrder = await Order.updateOne(
        { _id: orderId, 'items._id': itemId },
        { $set: { 
          'items.$.ordered_status': 'request_return',
          'items.$.cancellationReason':reason
      } }
      );
  
      res.status(200).json({ message: 'Order return requested', order: updatedOrder });

    }

     
    
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };


  // admin side

  const loadAdminOrders = async (req, res) => {
    try {
    
      const orders = await Order.find().populate({
        path: "items.product_id",
        populate:{
          path:'offer'
        }
      }).populate({
        path: "items.product_id",
        populate: {
          path: 'category',
          populate: {
            path: 'offer',
        
          },  
        }
      }).sort({_id:1});

      
        
      res.render('orders', { orders,moment});
    } catch (error) {
      console.log(error.message);
      
      res.status(500).send('Internal Server Error');
    }
  };




const updateOrderStatus = async (req, res) => {
  const { orderId, itemId, newStatus } = req.body;

  let update = { 'items.$.ordered_status': newStatus };

  try {
    const order = await Order.findById(orderId);
    const item = order.items.find((item) => item._id.toString() === itemId);

    console.log('item:',item);

    if (item) {
        console.log('orderpayment:',order.payment);
      // If payment is RazorPay and status is 'cancelled' or 'returned'
      if ((order.payment == 'razorPay') && (newStatus === 'cancelled' || newStatus === 'returned') || newStatus === 'returned' ) {
        // Update user's wallet and wallet history
        console.log('okayyy');
        const user = await User.findById(order.user_id);
        const currentDate = new Date();
        const walletHistoryEntry = {
          date: currentDate,
          amount: item.total_price,
          description: `Refund for order`,
        };

        // Update wallet history and wallet amount
        user.wallet_history.push(walletHistoryEntry);
        user.wallet += item.total_price;
        await user.save();

        const product = await Products.findById(item.product_id);
      
        if (product) {
          // Increase the product quantity by the ordered quantity
          const newStockQuantity = product.stockQuantity + item.quantity;
          await Products.findByIdAndUpdate(item.product_id, { stockQuantity: newStockQuantity });
        }

      }

      // If status is 'cancelled' or 'returned', update product stock quantity
      if (newStatus === 'cancelled') {
        const product = await Products.findById(item.product_id);
        console.log('mot okay');
        if (product) {
          // Increase the product quantity by the ordered quantity
          const newStockQuantity = product.stockQuantity + item.quantity;
          await Products.findByIdAndUpdate(item.product_id, { stockQuantity: newStockQuantity });
        }
      }
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, 'items._id': itemId },
      { $set: update },
      { new: true }
    );

    res.json({ success: true, updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};




const loadOrderDetailsAdmin = async(req,res)=>{
  try {
   const itemId = req.query.itemId;
   const orderId = req.query.orderId;

   const mainOrder = await Order.findOne({ _id: orderId }).populate('user_id').populate({
    path: "items.product_id",
    populate:{
      path:'offer'
    }
  }).populate({
    path: "items.product_id",
    populate: {
      path: 'category',
      populate: {
        path: 'offer',
    
      },  
    }
  });


   const orderItem = mainOrder.items.find(item => item._id.toString() === itemId);



   res.render('order-details', {order:mainOrder, item:orderItem, moment}); 
   
    

  } catch (error) {

    console.log(error.message);
  }
}


const invoiceDownload = async (req, res) => {
  try {
    const { orderId } = req.query;
    const { userId } = req.session;
    let sumTotal = 0;

    const userData = await User.findById(userId);
    const orderData = await Order.findById(orderId).populate('items.product_id');

    orderData.items.forEach((item) => {
      const total = item.product_id.price * item.quantity;
      sumTotal += total;
    });

    const date = new Date();
    const data = {
      order: orderData,
      user: userData,
      date,
      sumTotal,
      moment
    };

    // Render the EJS template
    const ejsTemplate = path.resolve(__dirname, '../views/user/invoice.ejs');
    const ejsData = await ejs.renderFile(ejsTemplate, data);

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(ejsData, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    // Close the browser
    await browser.close();

    // Set headers for inline display in the browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=order_invoice.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};


  
  module.exports = {
    loadOrders,
    loadSingleOrderDetails,
    cancelOrder,
    // admin side,
    loadAdminOrders,
    updateOrderStatus,
    loadOrderDetailsAdmin,
    // invoice
    invoiceDownload

  };
  