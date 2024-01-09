require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)

const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const flash = require('express-flash');
const morgan = require('morgan');


// Use the 'upload' middleware for handling file uploads

app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.set('view engine','ejs');


app.use(express.static(path.join(__dirname,'public')));



app.use(
    session({
      secret: 'key',
      saveUninitialized: true,
      resave: true
    })
  );

  app.use((req,res,next)=>{
    res.set('Cache-control','no-store,no-cache')
    next()
}) 

app.use(morgan('dev'));



app.use(flash());

const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);

const bannerRoute = require('./routes/bannerRoute');
app.use('/admin',bannerRoute);

const offerRoute = require('./routes/offerRoute');
app.use('/admin',offerRoute);

const couponRoute = require('./routes/couponRoute');
app.use('/admin',couponRoute);

const checkoutRoute = require('./routes/checkoutRoute');
app.use('/',checkoutRoute);

const wishlistRoute = require('./routes/wishlistRoute');
app.use('/',wishlistRoute);

app.set('views','./views/user')

app.get('/500',(req,res)=>{
  res.status(500).render('500');
})

app.get('*',(req,res)=>{   
    
  res.status(404).render('404');
  
});



const port = process.env.PORT || 3000;



app.listen(port,()=>{
    console.log(`http://localhost:${port}`);
})

