require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)

const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const flash = require('express-flash');


// Use the 'upload' middleware for handling file uploads

app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.set('view engine','ejs');


app.use(express.static(path.join(__dirname,'public','assets')));
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

app.use(flash());

const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);

const port = process.env.PORT || 3000;



app.listen(port,()=>{
    console.log(`http://localhost:${port}`);
})