const User = require("../models/usersModels");
const Products = require("../models/productsModel");
const Categories = require("../models/categoriesModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const bannerModel = require("../models/bannerModel");
const bcrypt = require("bcrypt");
const moment = require("moment");
const { error } = require("console");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const userOtpVerification = require("../models/userOtpVerification");
const { request } = require("http");
const { query } = require("express");
dotenv.config();

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    res.redirect("/500");
  }
};

const loadHome = async (req, res) => {
  try {
    const id = req.session.userId;
    const userData = await User.findOne({ _id: id });
    const banner = await bannerModel.find({ status: true });
    const latestProducts = await Products.find()
      .sort({ _id: -1 })
      .limit(4)
      .populate({
        path: "offer",
        match: {
          startingDate: { $lte: new Date() },
          expiryDate: { $gte: new Date() },
        },
      })
      .populate({
        path: "category",
        populate: {
          path: "offer",
          match: {
            startingDate: { $lte: new Date() },
            expiryDate: { $gte: new Date() },
          },
        },
      });

    const orders = await Order.aggregate([
      { $unwind: "$items" }, // Deconstruct the items array
      {
        $group: {
          _id: "$items.product_id",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total_price" },
        },
      },
      { $sort: { totalQuantity: -1 } }, // Sort by totalQuantity in descending order
      { $limit: 4 }, // Limit to the top 4 products
      {
        $lookup: {
          from: "products", // Assuming the name of your product collection is 'products'
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: "$productDetails._id",
          name: "$productDetails.name",
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    const orderProductIds = orders.map((order) => order._id);

    const topProducts = await Products.find({ _id: { $in: orderProductIds } })
      .sort({ _id: -1 })
      .limit(4)
      .populate({
        path: "offer",
        match: {
          startingDate: { $lte: new Date() },
          expiryDate: { $gte: new Date() },
        },
      })
      .populate({
        path: "category",
        populate: {
          path: "offer",
          match: {
            startingDate: { $lte: new Date() },
            expiryDate: { $gte: new Date() },
          },
        },
      });

    // Sort products by totalQuantity in descending order
    const topDeals = topProducts.sort((a, b) => {
      const aQuantity = orders.find((order) =>
        order._id.equals(a._id)
      ).totalQuantity;
      const bQuantity = orders.find((order) =>
        order._id.equals(b._id)
      ).totalQuantity;
      return bQuantity - aQuantity;
    });

    req.session.couponApplied = false;
    req.session.discountAmount = 0;

    res.render("home", {
      user: userData,
      currentRoute: "/",
      banner,
      latestProducts,
      topDeals,
    });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadAbout = async (req, res) => {
  try {
    const { userId } = req.session;
    const user = await User.findOne({ _id: userId });

    res.render("about", { user });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    res.redirect("/500");
  }
};

const loadSignup = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    res.redirect("/500");
  }
};
const generateOtp = async ({ email }, res) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const otpExpirationMinutes = 2; // Adjust the expiration time as needed

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Account Verification - Action Required",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #3498db; text-align: center;">Shoetopia</h1>
          <p style="text-align: center; font-size: 18px;">Dear User,</p>
          <p style="text-align: center; font-size: 16px;">Thank you for using our service. To complete your login, please enter the following OTP (One-Time Password):</p>
          <h2 style="color: #2ecc71; text-align: center; font-size: 36px; margin: 20px 0;">${otp}</h2>
          <p style="text-align: center; font-size: 16px;">This OTP is valid for ${otpExpirationMinutes} minutes. If you did not initiate this action, please ignore this email.</p>
          <p style="text-align: center; font-size: 16px; margin-bottom: 20px;">For security reasons, do not share your OTP with anyone.</p>
          <p style="text-align: center; font-size: 16px;">If you have any questions or concerns, please contact our support team.</p>
          <p style="text-align: center; font-size: 16px; margin: 20px 0;">Best regards,<br>Shoetopia</p>
        </div>
      `,
    };

    // hash the otp
    const saltrounds = 10;

    const hashedOtp = await bcrypt.hash(otp, saltrounds);
    // const newOtpVerification = await new userOtpVerification({
    //   email: email,
    //   createdAt: Date.now(),
    //   expiresAt: Date.now() + (2 * 60 * 1000)
    // });

    const filter = { email: email };
    const update = {
      $set: {
        otp: hashedOtp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 2 * 60 * 1000,
      },
    };

    const options = {
      upsert: true, // Create a new document if it doesn't exist
      new: true, // Return the modified document rather than the original
      setDefaultsOnInsert: true, // Apply default values on insert
    };

    const result = await userOtpVerification.findOneAndUpdate(
      filter,
      update,
      options
    );

    // save otp record
    // await newOtpVerification.save();
    await transporter.sendMail(mailOptions);

    res.redirect(`/otp?email=${email}`);
  } catch (error) {
    res.redirect("/500");
  }
};

const sendOtpVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    let transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

    const otpExpirationMinutes = 2; // Adjust the expiration time as needed

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Signup OTP - Verify Your Account",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #3498db; text-align: center;">Shoetopia</h1>
          <p style="text-align: center; font-size: 18px;">Dear User,</p>
          <p style="text-align: center; font-size: 16px;">Thank you for signing up with Shoetopia. To verify your account, please enter the following OTP (One-Time Password):</p>
          <h2 style="color: #2ecc71; text-align: center; font-size: 36px; margin: 20px 0;">${otp}</h2>
          <p style="text-align: center; font-size: 16px;">This OTP is valid for ${otpExpirationMinutes} minutes. If you did not initiate this action, please ignore this email.</p>
          <p style="text-align: center; font-size: 16px; margin-bottom: 20px;">For security reasons, do not share your OTP with anyone.</p>
          <p style="text-align: center; font-size: 16px;">If you have any questions or concerns, please contact our support team.</p>
          <p style="text-align: center; font-size: 16px; margin: 20px 0;">Best regards,<br>Shoetopia</p>
        </div>
      `,
    };

    // hash the otp
    const saltrounds = 10;

    const hashedOtp = await bcrypt.hash(otp, saltrounds);
    // const newOtpVerification = await new userOtpVerification({
    //   email: email,
    //   otp: hashedOtp,
    //   createdAt: new Date(),
    // });

    // // save otp record
    // await newOtpVerification.save();
    const filter = { email: email };
    const update = {
      $set: {
        otp: hashedOtp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 2 * 60 * 1000,
      },
    };

    const options = {
      upsert: true, // Create a new document if it doesn't exist
      new: true, // Return the modified document rather than the original
      setDefaultsOnInsert: true, // Apply default values on insert
    };

    const result = await userOtpVerification.findOneAndUpdate(
      filter,
      update,
      options
    );

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadVerificationPage = async (req, res) => {
  try {
    var id = req.query.email;
    res.render("otpVerification", { id: id });
  } catch (error) {
    res.redirect("/500");
  }
};

const verifyOtpSignup = async (req, res) => {
  try {
    const email = req.body.email;
    const enteredOTP = req.body.otpInput;

    const userOtpRecord = await userOtpVerification.findOne({ email });
    const expiresAt = userOtpRecord.expiresAt;

    if (!userOtpRecord) {
      return res.json({ message: "otp not found" });
    }

    if (expiresAt < Date.now()) {
      return res.json({ message: "otp expired resent otp" });
    }

    const { otp: hashedOTP } = userOtpRecord;

    const validOTP = await bcrypt.compare(enteredOTP, hashedOTP);

    if (!validOTP) {
      return res.json({ message: "otp doesnt match" });
    }

    // If OTP is valid, set the session flag
    req.session.isOtpVerified = true;

    // If OTP is valid, proceed with user insertion
    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.json({ message: "User already exists. Please login." });
    }

    // await userOtpVerification.deleteOne({ email });

    // Return a success message or redirect if needed
    return res.json({ message: "OTP verified successfully", success: true });
  } catch (error) {
    res.redirect("/500");
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const submitRegistration = async (req, res) => {
  try {
    // Check if OTP is verified
    if (!req.session.isOtpVerified) {
      return res.status(400).send("OTP verification required");
    }

    // Extract data from the request body
    const { username, email, phoneNumber, password } = req.body;

    // Create a new User instance and save it to the database
    const hashPassword = await securePassword(password);

    const user = new User({
      username,
      email,
      mobile: phoneNumber,
      password: hashPassword,
      createdAt: new Date(),
    });

    await user.save();

    req.session.isOtpVerified = false;

    res.redirect("/login");
  } catch (error) {
   
    res.status(500).send({error:error.message});
  }
};

// Export the controller function

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        req.session.userId = userData._id;
        res.redirect("/home");
      } else {
        res.render("login", { message: "Password is not correct", email });
      }
    } else {
      res.render("login", {
        message: "User not found please register",
        email,
        password,
      });
    }
  } catch (error) {
    res.redirect("/500");
  }
};

const logoutUser = async (req, res) => {
  try {
    req.session.userId = null;
    req.session.couponApplied = false;
    req.session.discountAmount = 0;
    res.redirect("/");
  } catch (error) {
    res.redirect("/500");
  }
};

const loadEmailInput = async (req, res) => {
  try {
    req.session.userId = req.query.id;
    res.render("emailinput");
  } catch (error) {
    res.redirect("/500");
  }
};

const sentOtpbyMail = async (req, res) => {
  try {
    const userData = await User.findOne({ email: req.body.email });

    if (!userData) {
      res.render("emailinput", {
        message: `user doesnt exist <a href="/signup">Register</a>`,
      });
    } else {
      generateOtp(userData, res);
    }
  } catch (error) {
    res.redirect("/500");
  }
};

const verifyOtp = async (req, res) => {
  try {
    const email = req.body.id;
    const enteredOTP = req.body.otp;

    const userOtpRecord = await userOtpVerification.findOne({ email: email });

    const expiresAt = userOtpRecord.expiresAt;

    if (!userOtpRecord) {
      res.render("otpVerification", {
        message: `otp not found`,
        id: email,
      });
    }

    if (expiresAt < Date.now()) {
      return res.render("otpVerification", {
        message: `otp expired <a href="/emailVerify">try again</a>`,
        id: email,
      });
    }

    const { otp: hashedOTP } = userOtpRecord;

    const validOTP = await bcrypt.compare(enteredOTP, hashedOTP);

    if (validOTP) {
      const userData = await User.findOne({ email: email });

      req.session.userId = userData;
      res.redirect("/home");
    } else {
      res.render("otpVerification", { message: `otp is incorrect`, id: email });
    }
  } catch (error) {
    res.redirect("/500");
  }
};

// const loadShop = async (req, res) => {
//   try {
//     let user;
//     if(req.session.userId){
//       const id = req.session.userId;
//        user = await User.findOne({ _id: id });
//     }
//     const category = req.query.Id;
//     let products = [];
//     if (category) {
//       products = await Products.find({ category: category });
//     } else {
//       products = await Products.find({});
//     }

//     const categories = await Categories.find({});

//     const listedCategories = categories.filter(
//       (category) => category.is_listed === 1
//     );

//     const listedProducts = products.filter((product) => {
//       // Check if the product is listed
//       const isProductListed = product.is_listed === 1;

//       // Check if the product's category is listed
//       const productCategory = listedCategories.find(
//         (category) =>
//           category.name === product.category && category.is_listed === 1
//       );

//       return isProductListed && productCategory;
//     });

//     res.render("shop", {
//       products: listedProducts,
//       categories: listedCategories,
//       user,
//       req,
//       currentRoute: '/shop'

//     });
//   } catch (error) {
//     res.redirect('/500');
//   }
// };

const PRODUCTS_PER_PAGE = 6;

const loadShop = async (req, res) => {
  try {
    req.session.couponApplied = false;
    req.session.discountAmount = 0;
    let user;
    if (req.session.userId) {
      const id = req.session.userId;
      user = await User.findOne({ _id: id });
    }

    const category = req.query.category;
    const page = req.query.page || 1;
    const searchTerm = req.query.search;
    const priceFrom = req.query.priceFrom;
    const priceTo = req.query.priceTo;
    const priceSort = req.query.priceSort;

    // Fetch products from the database
    const products = await Products.find({ is_listed: 1 })
      .populate({
        path: "offer",
        match: {
          startingDate: { $lte: new Date() },
          expiryDate: { $gte: new Date() },
        },
      })
      .populate({
        path: "category",
        populate: {
          path: "offer",
          match: {
            startingDate: { $lte: new Date() },
            expiryDate: { $gte: new Date() },
          },
        },
      });

    // Filter out products with a non-listed category
    let listedProducts = products.filter(
      (product) => product.category.is_listed === 1
    );

    const categories = await Categories.find({}).populate("offer");
    let listedCategories = categories.filter((cat) => cat.is_listed === 1);

    // Extend the query conditions based on the category
    if (category) {
      listedProducts = listedProducts.filter(
        (product) => product.category.name === category
      );
    }

    // Extend the query conditions based on the search term
    if (searchTerm) {
      listedProducts = listedProducts.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Further filter products based on price range
    if (priceFrom && priceTo) {
      listedProducts = listedProducts.filter((product) => {
        const productPrice = parseFloat(product.price);
        return (
          productPrice >= parseFloat(priceFrom) &&
          productPrice <= parseFloat(priceTo)
        );
      });
    }

    // Extend the query conditions based on the sorting option
    if (priceSort) {
      if (priceSort === "asc" || priceSort[0] === "asc") {
        listedProducts.sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price)
        );
      } else if (priceSort === "desc" || priceSort[0] === "desc") {
        listedProducts.sort(
          (a, b) => parseFloat(b.price) - parseFloat(a.price)
        );
      }
    }

    // Calculate the total number of pages
    const totalPages = Math.ceil(listedProducts.length / PRODUCTS_PER_PAGE);

    // Perform pagination on the listed products
    const startIndex = (page - 1) * PRODUCTS_PER_PAGE;
    const endIndex = page * PRODUCTS_PER_PAGE;
    const paginatedProducts = listedProducts.slice(startIndex, endIndex);

    if (req.xhr) {
      // If it's an AJAX request, render the partial view
      res.render("partials/product-list", {
        products: paginatedProducts,
        categories: listedCategories,
        user,
        req,
        totalPages,
        priceFrom,
      });
    } else {
      res.render("shop", {
        products: paginatedProducts,
        categories: listedCategories,
        user,
        req,
        totalPages,
      });
    }
  } catch (error) {
    res.redirect("/500");
  }
};

const loadProduct = async (req, res) => {
  try {
    req.session.couponApplied = false;
    req.session.discountAmount = 0;

    let user;
    if (req.session.userId) {
      const id = req.session.userId;
      user = await User.findOne({ _id: id });
    }

    const productId = req.query.productId;

    const products = await Products.find({})
      .populate({
        path: "offer",
        match: {
          startingDate: { $lte: new Date() },
          expiryDate: { $gte: new Date() },
        },
      })
      .populate({
        path: "category",
        populate: {
          path: "offer",
          match: {
            startingDate: { $lte: new Date() },
            expiryDate: { $gte: new Date() },
          },
        },
      })
      .populate("reviews.user_id");

    const product = await Products.findOne({ _id: productId })
      .populate({
        path: "offer",
        match: {
          startingDate: { $lte: new Date() },
          expiryDate: { $gte: new Date() },
        },
      })
      .populate({
        path: "category",
        populate: {
          path: "offer",
          match: {
            startingDate: { $lte: new Date() },
            expiryDate: { $gte: new Date() },
          },
        },
      })
      .populate("reviews.user_id");

    // Extract ratings from reviews
    const ratings = product.reviews.map((review) => review.rating);

    // Calculate the average rating
    const averageRating =
      ratings.reduce((total, rating) => total + rating, 0) / ratings.length;

    const sameCategoryProducts = products.filter(
      (pro) => pro.category.name === product.category.name
    );

    res.render("product-details", {
      product: product,
      products: sameCategoryProducts,
      user,
      currentRoute: "/shop",
      averageRating,
      moment,
    });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadEmailInputForgetPass = async (req, res) => {
  try {
    res.render("emailinput-forgot-Pass");
  } catch (error) {
    res.redirect("/500");
  }
};

const verifyEmailForPass = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (!userData) {
      res.render("emailinput-forgot-pass", {
        message: "Your email is incorrect",
      });
    }

    const randomString = randomstring.generate();

    const updatedData = await User.updateOne(
      { email: email },
      { $set: { token: randomString } }
    );

    sentResetLink(userData.username, userData.email, randomString);
    res.render("emailinput-forgot-Pass", {
      message: "Please Check Your Mail to reset your Password",
    });
  } catch (error) {
    res.redirect("/500");
  }
};

//   for reset password mail

const sentResetLink = async (username, email, token) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // const otp = `${Math.floor(100000 + Math.random()*900000)}`

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #3498db; text-align: center;">Shoetopia</h1>
          <p style="text-align: center; font-size: 18px;">Hi ${username},</p>
          <p style="text-align: center; font-size: 16px;">We received a request to reset your password. If this wasn't you, please ignore this email.</p>
          <p style="text-align: center; font-size: 16px;">To reset your password, click the link below:</p>
          <p style="text-align: center; font-size: 16px;"><a href='http://shoetopia.site/ResetForgetPass?token=${token}' style="color: #2ecc71; text-decoration: none;">Reset Your Password</a></p>
          <p style="text-align: center; font-size: 16px;">This link will expire in 1 hour for security reasons.</p>
          <p style="text-align: center; font-size: 16px;">If you didn't request a password reset or have any concerns, please contact our support team immediately.</p>
          <p style="text-align: center; font-size: 16px; margin: 20px 0;">Best regards,<br>Shoetopia</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    res.redirect("/500");
  }
};

const loadForgetPass = async (req, res) => {
  try {
    const token = req.query.token;

    if (token === undefined) {
      return res.render("404", { message: "Token is Invalid" });
    } else {
      const tokenData = await User.findOne({ token: token });

      if (!tokenData) {
        return res.render("404", { message: "Token is Invalid" });
      }

      res.render("forget-password", { user_id: tokenData._id });
    }
  } catch (error) {
    res.redirect("/500");
  }
};

const resetForgetPassword = async (req, res) => {
  try {
    const { id, password } = req.body;

    const hashNewPassword = await securePassword(password);

    const userData = await User.findOne({ _id: id });

    const { password: hashedPassword } = userData;

    const passwordExist = await bcrypt.compare(password, hashedPassword);

    if (passwordExist === true) {
      return res.render("forget-password", {
        message: "Enter a new password instead of current password",
        user_id: userData._id,
      });
    }

    await User.findByIdAndUpdate(
      { _id: id },
      { password: hashNewPassword, token: "" }
    );

    res.redirect("/login");
  } catch (error) {
    res.redirect("/500");
  }
};

const loadCart = async (req, res) => {
  try {
    const userId = req.session.userId;

    req.session.couponApplied = false;
    req.session.discountAmount = 0;

    if (!userId) {
      res.redirect("/login");
    } else {
      // Fetch cart details
      const cartDetails = await Cart.findOne({ user_id: userId }).populate({
        path: "items.product_id",
        populate: [
          {
            path: "offer",
          },
          {
            path: "category",
            populate: {
              path: "offer",
            },
          },
        ],
      });

      const userData = await User.findOne({ _id: userId });

      let total = 0;
      let discountAmt = 0;
      let originalAmts = 0;

      if (cartDetails) {
        cartDetails.items.forEach((product) => {
          let itemPrice = product.product_id.price;
          originalAmts += itemPrice * product.quantity;

          // Check if there's an offer on the product
          if (product.product_id.offer) {
            const { percentage } = product.product_id.offer;

            itemPrice -= (itemPrice * percentage) / 100;
          }

          // Check if there's an offer on the category
          else if (product.product_id.category.offer) {
            const { percentage } = product.product_id.category.offer;
            itemPrice -= (itemPrice * percentage) / 100;
          }

          // let price = Math.floor(itemPrice)

          total += itemPrice * product.quantity;

          discountAmt = originalAmts - total;

          req.session.offerDiscount = discountAmt;
        });
      }

      res.render("cart", {
        user: userData,
        cartDetails,
        subTotal: originalAmts,
        total,
        discountAmt,
      });
    }
  } catch (error) {
    res.redirect("/500");
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const { userId } = req.session;

    if (!userId) {
      res.redirect("/login");
    } else {
      const product = await Products.findOne({ _id: productId })
        .populate({
          path: "offer",
          match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } }
        })
        .populate({
          path: "category",
          populate: {
            path: "offer",
            match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } }
          },
        });

      const cart = await Cart.findOne({ user_id: userId });

      if (cart) {
        const existProduct = cart.items.find(
          (x) => x.product_id.toString() === productId
        );

        if (existProduct) {
          let itemPrice = product.price;

          if (product.offer) {
            const { percentage } = product.offer;
            itemPrice -= (itemPrice * percentage) / 100;
          }

          // Check if there's an offer on the category
          else if (product.category.offer) {
            const { percentage } = product.category.offer;
            itemPrice -= (itemPrice * percentage) / 100;
          }
          // Update existing product in the cart
          

          await Cart.findOneAndUpdate(
            { user_id: userId, "items.product_id": productId },
            {
              $inc: {
                "items.$.quantity": quantity,
                "items.$.total_price": quantity * product.price,
              },
            }
          );
        } else {
          let itemPrice = product.price;

          // Check if there's an offer on the product
          if (product.offer) {
            const { percentage } = product.offer;
            itemPrice -= (itemPrice * percentage) / 100;
          }

          // Check if there's an offer on the category
          else if (product.category.offer) {
            const { percentage } = product.category.offer;
            itemPrice -= (itemPrice * percentage) / 100;
          }

          // Add new product to the cart
          await Cart.findOneAndUpdate(
            { user_id: userId },
            {
              $push: {
                items: {
                  product_id: productId,
                  quantity: quantity,
                  price: itemPrice,
                  total_price: quantity * product.price,
                  offerPercentage: product.offer
                    ? product.offer.percentage
                    : product.category && product.category.offer
                    ? product.category.offer.percentage
                    : 0,
                },
              },
            }
          );
        }
      } else {
        let itemPrice = product.price;

        // Check if there's an offer on the product
        if (product.offer) {
          const { percentage } = product.offer;
          itemPrice -= (itemPrice * percentage) / 100;
        }

        // Check if there's an offer on the category
        else if (product.category.offer) {
          const { percentage } = product.category.offer;
          itemPrice -= (itemPrice * percentage) / 100;
        }
        // Create a new cart and add the product
        const newCart = new Cart({
          user_id: userId,
          items: [
            {
              product_id: productId,
              quantity: quantity,
              price: itemPrice,
              total_price: quantity * product.price,
              offerPercentage: product.offer
                ? product.offer.percentage
                : product.category && product.category.offer
                ? product.category.offer.percentage
                : 0,
            },
          ],
        });

        await newCart.save();
      }

      res.json({ success: true });
    }

    
  } catch (error) {
    res.redirect("/500");
  }
};

const postChangeQuantity = async (req, res) => {
  try {
    const userId = req.session.userId;
    const productId = req.body.productId;
    const count = req.body.count;

    const cart = await Cart.findOne({ user_id: req.session.userId });
    if (!cart) {
      return res.json({ success: false, message: "Cart not found." });
    }

    const cartProduct = cart.items.find(
      (item) => item.product_id.toString() === productId
    );
    if (!cartProduct) {
      return res.json({
        success: false,
        message: "Product not found in the cart.",
      });
    }

    const product = await Products.findById(productId);
    if (!product) {
      return res.json({
        success: false,
        message: "Product not found in the database.",
      });
    }

    if (count == 1) {
      if (
        cartProduct.quantity < 10 &&
        cartProduct.quantity < product.stockQuantity
      ) {
        await Cart.updateOne(
          { user_id: userId, "items.product_id": productId },
          {
            $inc: {
              "items.$.quantity": 1,
              "items.$.total_price": product.price,
            },
          }
        );
        return res.json({ success: true });
      } else {
        const maxAllowedQuantity = Math.min(10, product.stockQuantity);
        return res.json({
          success: false,
          message: `The maximum quantity available for this product is ${maxAllowedQuantity}. Please adjust your quantity.`,
        });
      }
    } else if (count == -1) {
      // Decrease quantity logic
      if (cartProduct.quantity > 1) {
        await Cart.updateOne(
          { user_id: userId, "items.product_id": productId },
          {
            $inc: {
              "items.$.quantity": -1,
              "items.$.total_price": -product.price,
            },
          }
        );
        return res.json({ success: true });
      } else {
        return res.json({
          success: false,
          message: "Quantity cannot be less than 1.",
        });
      }
    }
  } catch (error) {
    res.redirect("/500");
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const postDeleteItems = async (req, res) => {
  try {
    const productOgId = req.body.productOgId;
    const userId = req.session.userId;

    const cartUser = await Cart.findOne({ user_id: userId });
    if (cartUser.items.length == 1) {
      await Cart.deleteOne({ user_id: userId });
    } else {
      await Cart.updateOne(
        { user_id: userId },
        { $pull: { items: { _id: productOgId } } }
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadUserProfile = async (req, res) => {
  try {
    req.session.couponApplied = false;
    req.session.discountAmount = 0;

    const userId = req.session.userId;
    const userData = await User.findOne({ _id: userId });

    res.render("profile", { user: userData });
  } catch (error) {
    res.redirect("/500");
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.session.userId;

    // extract updated user profile data from the request body
    const { username, mobile } = req.body;

    // check if another user already has the same mobile number
    const userWithSameMobile = await User.findOne({
      mobile: mobile,
      _id: { $ne: userId },
    });
    if (userWithSameMobile) {
      return res
        .status(400)
        .json({
          message: "Another user with the same mobile number already exists.",
        });
    }

    // Find the user by ID and update the profile data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          username,
          mobile,
        },
      },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loadProfileAddress = async (req, res) => {
  try {
    req.session.couponApplied = false;
    req.session.discountAmount = 0;

    const userId = req.session.userId;
    const userData = await User.findOne({ _id: userId });

    res.render("address", { user: userData });
  } catch (error) {
    res.redirect("/500");
  }
};

const editAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const {
      id,
      editName,
      editHouseName,
      editCity,
      editState,
      editPhone,
      editPincode,
    } = req.body;

    // Update the address
    await User.updateOne(
      { _id: userId, "address._id": id },
      {
        $set: {
          "address.$.name": editName,
          "address.$.housename": editHouseName,
          "address.$.city": editCity,
          "address.$.state": editState,
          "address.$.pincode": editPincode,
          "address.$.phone": editPhone,
        },
      }
    );

 
    return res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error updating address" });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.body.addressId;

    const userId = req.session.userId;

    const result = await User.updateOne(
      { _id: userId },
      { $pull: { address: { _id: addressId } } }
    );

    if (result.nModified === 1) {
      res.json({ success: true, message: "Address successfully deleted" });
    } else {
      res.json({
        success: false,
        message: "Address not found or not modified",
      });
    }
  } catch (error) {
    res.redirect("/500");

    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const loadBlockedUser = async (req, res) => {
  try {
    res.render("blocked-user");
  } catch (error) {
    res.redirect("/500");
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.session.userId; // Assuming you're using session-based authentication

    // Retrieve the user data
    const user = await User.findById(userId);

    // Extract the old password, new password, and confirm password from the request body
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Check if the old password matches the stored password
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!passwordMatch) {
      // Old password does not match
      return res
        .status(400)
        .json({ success: false, message: "Old password is incorrect." });
    }

    // Check if the new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "New password and confirm password do not match.",
        });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    // Optionally, you can clear the user's session after changing the password
    req.session.destroy();

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    res.redirect('/500');
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const loadWallet = async (req, res) => {
  try {
    req.session.couponApplied = false;
    req.session.discountAmount = 0;

    const userId = req.session.userId;

    const user = await User.findOne({ _id: userId });

    res.render("wallet", { user });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadRatings = async (req, res) => {
  try {
    const productId = req.query.id;

    const { userId } = req.session;

    const user = await User.findOne({ _id: userId });

    const orderData = await Order.find({
      user_id: userId,
      "items.product_id": productId,
      "items.ordered_status": "delivered",
    });

    const productPurchased = orderData.length > 0;

    const product = await Products.aggregate([
      { $unwind: "$reviews" }, // Unwind the reviews array
    ]).exec();

    const filteredProducts = product.filter(
      (product) => product._id.toString() === productId
    );

    const filteredProductsByUser = filteredProducts.filter((product) => {
      return product.reviews.user_id.toString() === userId;
    });

    if (product) {
      // User has provided ratings for the product
      const reviews = filteredProductsByUser[0]?.reviews;

      // You can now use the 'reviews' data to render on the page
      res.render("ratings", {
        user,
        orderData,
        productPurchased,
        productId,
        reviews,
      });
    } else {
      // User has not provided ratings for the product
      res.render("ratings", { user, orderData, productPurchased, productId });
    }
  } catch (error) {
    res.redirect("/500");
    
  }
};

const postReview = async (req, res) => {
  try {
    const { description, rate } = req.body;

    const { userId } = req.session;
    const productId = req.query.id;
    const reviewId = req.body.reviewId;
    let product;
    if (reviewId) {
      product = await Products.findOne({
        _id: productId,
        "reviews._id": reviewId,
      });
    }

    if (product) {
      // If the review exists, update it
      await Products.updateOne(
        { _id: productId, "reviews._id": reviewId },
        {
          $set: {
            "reviews.$.user_id": userId,
            "reviews.$.description": description,
            "reviews.$.rating": parseInt(rate),
            "reviews.$.createdAt": new Date(),
          },
        }
      );
    } else {
      // If the review does not exist, create a new one
      await Products.updateOne(
        { _id: productId },
        {
          $push: {
            reviews: {
              user_id: userId,
              description: description,
              rating: parseInt(rate),
              createdAt: new Date(),
            },
          },
        }
      );
    }

    res.redirect(`/product?productId=${productId}`);
  } catch (error) {
    res.redirect("/500");
  }
};

module.exports = {
  loadHome,
  loadAbout,
  loadLogin,
  loadSignup,
  loadVerificationPage,
  verifyOtpSignup,
  verifyLogin,
  logoutUser,
  loadEmailInput,
  sentOtpbyMail,
  sendOtpVerificationEmail,
  verifyOtp,
  submitRegistration,
  loadShop,
  loadProduct,
  loadEmailInputForgetPass,
  verifyEmailForPass,
  loadForgetPass,
  resetForgetPassword,
  loadCart,
  addToCart,
  postChangeQuantity,
  postDeleteItems,
  loadUserProfile,
  updateUserProfile,
  loadProfileAddress,
  editAddress,
  deleteAddress,
  loadBlockedUser,
  changePassword,
  loadWallet,
  loadRatings,
  postReview,
};
