const User = require("../models/usersModels");
const Categories = require("../models/categoriesModel");
const Products = require("../models/productsModel");
const Order = require("../models/orderModel");
const Offer = require("../models/offerModel");
const moment = require("moment");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const dotenv = require("dotenv");
dotenv.config();

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    res.redirect("/500");
  }
};

const verifyAdmin = async (req, res) => {
  try {
    const admin_email = process.env.ADMIN_EMAIL;
    const admin_pass = process.env.ADMIN_PASS;

    const emailInput = req.body.email;
    const passInput = req.body.password;

    if (admin_email == emailInput && admin_pass == passInput) {
      req.session.admin = emailInput;

      res.redirect("/admin/dashboard");
    } else {
      res.render("login", { message: "invalid username and password" });
    }
  } catch (error) {
    res.redirect("/500");
  }
};

const loadDashboard = async (req, res) => {
  try {
    // Unwind orders based on items
    const unwoundOrders = [
      {
        $unwind: "$items",
      },
      {
        $match: {
          $and: [
            { "items.ordered_status": "delivered" },
            { status: { $ne: "pending" } },
          ],
        },
      },
    ];

    // Monthly sales report based on items.ordered_status - delivered
    let monthlySales = await Order.aggregate([
      // Use the unwoundOrders variable in the pipeline
      ...unwoundOrders,
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalSales: {
            $sum: {
              $subtract: [
                {
                  $multiply: ["$items.quantity", "$items.price"],
                },
                "$items.couponDiscountTotal", // Deduct couponDiscountTotal
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Yearly sales report based on items.ordered_status - delivered
    let yearlySales = await Order.aggregate([
      // Use the unwoundOrders variable in the pipeline
      ...unwoundOrders,
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) },
        },
      },
      {
        $group: {
          _id: { $year: "$createdAt" },
          totalSales: {
            $sum: {
              $subtract: [
                {
                  $multiply: ["$items.quantity", "$items.price"],
                },
                "$items.couponDiscountTotal", // Deduct couponDiscountTotal
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Total sales price yearly and monthly from items.quantity and items.price
    const totalSales = await Order.aggregate([
      {
        $unwind: "$items",
      },

      {
        $match: {
          status: { $ne: "pending" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $subtract: [
                {
                  $multiply: ["$items.quantity", "$items.price"],
                },
                "$items.couponDiscountTotal",
              ],
            },
          },
        },
      },
    ]);

    const orderCounts = await Order.aggregate([
      // Unwind without conditions
      {
        $unwind: "$items",
      },

      {
        $match: {
          status: { $ne: "pending" },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: {
              $cond: [
                {
                  $eq: ["$items.ordered_status", "delivered"],
                },
                1,
                0,
              ],
            },
          },
          cancelOrders: {
            $sum: {
              $cond: [
                {
                  $eq: ["$items.ordered_status", "cancelled"],
                },
                1,
                0,
              ],
            },
          },
          otherOrders: {
            $sum: {
              $cond: [
                {
                  $ne: ["$items.ordered_status", "delivered"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const paymentCounts = await Order.aggregate([
      {
        $unwind: "$items",
      },

      {
        $match: {
          status: { $ne: "pending" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          cod: {
            $sum: {
              $cond: [
                {
                  $eq: ["$payment", "cod"],
                },
                1,
                0,
              ],
            },
          },
          razorpay: {
            $sum: {
              $cond: [
                {
                  $eq: ["$payment", "razorPay"],
                },
                1,
                0,
              ],
            },
          },
          wallet: {
            $sum: {
              $cond: [
                {
                  $eq: ["$payment", "wallet"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const productCount = await Products.countDocuments({});
    const categoryCount = await Categories.countDocuments({});
    const latestUsers = await User.find({}).sort({ createdAt: -1 }).limit(5);

    const latestOrders = await Order.aggregate([
      {
        $unwind: "$items",
      },
      {
        $match: {
          status: { $ne: "pending" },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: 10,
      },
    ]);

    const currentYear = new Date().getFullYear();
    const yearsToInclude = 7;
    const currentMonth = new Date().getMonth() + 1;

    const defaultMonthlyValues = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      count: 0,
    }));

    const defaultYearlyValues = Array.from(
      { length: yearsToInclude },
      (_, i) => ({
        year: currentYear - yearsToInclude + i + 1,
        total: 0,
        count: 0,
      })
    );

    // Monthly sales data
    const monthlySalesData = await Order.aggregate([
      {
        $unwind: "$items",
      },
      {
        $match: {
          "items.ordered_status": "delivered",
          createdAt: { $gte: new Date(currentYear, currentMonth - 1, 1) },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: {
            $sum: {
              $subtract: [
                { $multiply: ["$items.price", "$items.quantity"] },
                "$items.couponDiscountTotal",
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          total: "$total",
          count: "$count",
        },
      },
    ]);

    // Update monthly values based on retrieved data
    const updatedMonthlyValues = defaultMonthlyValues.map((defaultMonth) => {
      const foundMonth = monthlySalesData.find(
        (monthData) => monthData.month === defaultMonth.month
      );
      return foundMonth || defaultMonth;
    });


    // Yearly sales data
    const yearlySalesData = await Order.aggregate([
      {
        $unwind: "$items",
      },
      {
        $match: {
          "items.ordered_status": "delivered",
          createdAt: { $gte: new Date(currentYear - yearsToInclude, 0, 1) }, // Adjust the start date
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: { $year: "$createdAt" },
          total: {
            $sum: {
              $subtract: [
                {
                  $ifNull: [
                    { $multiply: ["$items.price", "$items.quantity"] },
                    0, // Default value if couponDiscountTotal is not present
                  ],
                },
                { $ifNull: ["$items.couponDiscountTotal", 0] }, // Default value if couponDiscountTotal is not present
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id",
          total: "$total",
          count: "$count",
        },
      },
    ]);

    // Update yearly values based on retrieved data
    const updatedYearlyValues = defaultYearlyValues.map((defaultYear) => {
      const foundYear = yearlySalesData.find(
        (yearData) => yearData.year === defaultYear.year
      );
      return foundYear || defaultYear;
    });

    // Monthly total orders
const monthlyTotalOrders = await Order.aggregate([
  {
    $unwind: "$items",
  },
  {
    $match: {
      createdAt: { $gte: new Date(currentYear, currentMonth - 1, 1) },
      status: { $ne: "pending" },
    },
  },
  {
    $group: {
      _id: { $month: "$createdAt" },
      totalOrders: { $sum: 1 },
    },
  },
]);

// Update monthly total orders based on retrieved data
const updatedMonthlyTotalOrders = defaultMonthlyValues.map((defaultMonth) => {
  const foundMonth = monthlyTotalOrders.find(
    (monthData) => monthData._id === defaultMonth.month
  );
  return { month: defaultMonth.month, totalOrders: foundMonth ? foundMonth.totalOrders : 0 };
});


// Yearly total orders
const yearlyTotalOrders = await Order.aggregate([
  {
    $unwind: "$items",
  },
  {
    $match: {
      createdAt: { $gte: new Date(currentYear - yearsToInclude, 0, 1) },
      status: { $ne: "pending" },
    },
  },
  {
    $group: {
      _id: { $year: "$createdAt" },
      totalOrders: { $sum: 1 },
    },
  },
]);

// Update yearly total orders based on retrieved data
const updatedYearlyTotalOrders = defaultYearlyValues.map((defaultYear) => {
  const foundYear = yearlyTotalOrders.find(
    (yearData) => yearData._id === defaultYear.year
  );
  return { year: defaultYear.year, totalOrders: foundYear ? foundYear.totalOrders : 0 };
});



   // Monthly total users
const monthlyTotalUsers = await User.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date(currentYear, currentMonth - 1, 1) },
    },
  },
  {
    $group: {
      _id: { $month: "$createdAt" },
      totalUsers: { $sum: 1 },
    },
  },
]);

// Update monthly total users based on retrieved data
const updatedMonthlyTotalUsers = defaultMonthlyValues.map((defaultMonth) => {
  const foundMonth = monthlyTotalUsers.find(
    (monthData) => monthData._id === defaultMonth.month
  );
  return { month: defaultMonth.month, totalUsers: foundMonth ? foundMonth.totalUsers : 0 };
});


// Yearly total users
const yearlyTotalUsers = await User.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date(currentYear - yearsToInclude, 0, 1) },
    },
  },
  {
    $group: {
      _id: { $year: "$createdAt" },
      totalUsers: { $sum: 1 },
    },
  },
]);

// Update yearly total users based on retrieved data
const updatedYearlyTotalUsers = defaultYearlyValues.map((defaultYear) => {
  const foundYear = yearlyTotalUsers.find(
    (yearData) => yearData._id === defaultYear.year
  );
  return { year: defaultYear.year, totalUsers: foundYear ? foundYear.totalUsers : 0 };
});
      console.log(updatedMonthlyValues);

    res.render("dashboard", {
      monthlySales,
      yearlySales,
      totalSales: totalSales[0],
      orderCounts: orderCounts[0],
      paymentCounts: paymentCounts[0],
      productCount,
      categoryCount,
      latestUsers,
      latestOrders,
      moment,
      updatedMonthlyValues,
      updatedYearlyValues,
      updatedMonthlyTotalOrders,
      updatedYearlyTotalOrders,
      updatedMonthlyTotalUsers,
      updatedYearlyTotalUsers

    });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadUsers = async (req, res) => {
  try {
    let query = {};
    const userData = await User.find(query);

    res.render("users", { users: userData });
  } catch (error) {
    res.redirect("/500");
  }
};

//block and unblock
const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { is_blocked: 1 },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    res.json({ status: "success", user: updatedUser });
  } catch (error) {
    res.redirect("/500");
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { is_blocked: 0 },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    res.json({ status: "success", user: updatedUser });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadCategories = async (req, res) => {
  try {
    const categories = await Categories.find({}).populate("offer");
    const availableOffers = await Offer.find({
      expiryDate: { $gte: new Date() },
    });

    res.render("categories", {
      categories: categories,
      offers: availableOffers,
      moment,
    });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadAddCategories = async (req, res) => {
  try {
    res.render("add-categories");
  } catch (error) {
    res.redirect("/500");
  }
};
const insertCategories = async (req, res) => {
  try {
    const categoryName = req.body?.cName;

    const categoriesExist = await Categories.findOne({
      name: { $regex: new RegExp(`^${categoryName}$`, "i") },
    });

    if (categoriesExist) {
      res.render("add-categories", {
        message: "Category already exists",
        cName: req.body.cName,
        cDescription: req.body.cDescription,
      });
    } else {
      const categories = new Categories({
        name: categoryName,
        description: req.body.cDescription,
      });

      await categories.save();

      res.redirect("/admin/categories");
    }
  } catch (error) {
    res.redirect("/500");
  }
};

const loadEditCategories = async (req, res) => {
  try {
    const id = req.query.categoriesId;

    const data = await Categories.findOne({ _id: id });

    res.render("edit-categories", { categories: data });
  } catch (error) {
    res.redirect("/500");
  }
};

const editCategories = async (req, res) => {
  try {
    const categoryId = req.body.id;
    const newName = req.body.cName;

    const existingCategory = await Categories.findOne({
      _id: { $ne: categoryId },
      name: { $regex: new RegExp(`^${newName}$`, "i") },
    });

    if (existingCategory) {
      const categories = await Categories.findOne({ _id: categoryId });
      return res.render("edit-categories", {
        message: "Category name already exists in another category.",
        categories,
      });
    }

    await Categories.findByIdAndUpdate(
      { _id: categoryId },
      { name: newName, description: req.body.cDescription }
    );

    res.redirect("/admin/categories");
  } catch (error) {
    res.redirect("/500");
    res.status(500).send("Internal Server Error");
  }
};

const listCategories = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const updatedCategory = await Categories.findByIdAndUpdate(
      categoryId,
      { is_listed: 1 },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).send("User not found");
    }

    res.json({ status: "success", category: updatedCategory });
  } catch (error) {
  res.redirect('/500');
  }
};

const unlistCategories = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const updatedCategory = await Categories.findByIdAndUpdate(
      categoryId,
      { is_listed: 0 },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).send("User not found");
    }

    res.json({ status: "success", category: updatedCategory });
  } catch (error) {
    res.redirect('/500');
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    await Categories.deleteOne({ _id: categoryId });

    res.json({ success: true });
  } catch (error) {
      res.redirect('/500');
  }
};

const loadProducts = async (req, res) => {
  try {
    const products = await Products.find()
      .populate("offer")
      .populate("category");
    const availableOffers = await Offer.find({
      expiryDate: { $gte: new Date() },
    });

    res.render("products", {
      products: products,
      offers: availableOffers,
      moment,
    });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadAddProducts = async (req, res) => {
  try {
    const categories = await Categories.find({ is_listed: 1 });

    res.render("add-products", { categories: categories });
  } catch (error) {
    res.redirect("/500");
  }
};

const addProducts = async (req, res) => {
  try {
    const { name, description, price, category, quantity } = req.body;
    const filenames = [];

    const categories = await Categories.find({ is_listed: 1 });

    const cat = await Categories.findOne({ name: category });

    const categoryId = cat._id;

    if (req.files.length !== 4) {
      // Clear uploaded files if the number is not exactly 4
      for (let i = 0; i < req.files.length; i++) {
        const filePath = req.files[i].path;
        fs.unlinkSync(filePath); // Delete the file
      }
      return res.render("add-products", {
        message: "Exactly 4 images needed",
        categories,
      });
    }

    // Resize and save each uploaded image
    for (let i = 0; i < req.files.length; i++) {
      const resizedPath = path.join(
        __dirname,
        "../public/ResizedImages",
        req.files[i].filename
      );

      await sharp(req.files[i].path)
        .resize(800, 1200, { fit: "fill" })
        .toFile(resizedPath);

      filenames.push(req.files[i].filename);
    }

    const newProduct = new Products({
      name,
      description,
      price,
      image: filenames,
      category: categoryId,
      stockQuantity: quantity,
      date: formatDate(Date.now()),
    });

    function formatDate(timestamp) {
      const date = new Date(timestamp);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      return formattedDate;
    }

    await newProduct.save();

    res.redirect("/admin/products");
  } catch (error) {
    res.redirect("/500");
  }
};

const listProducts = async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedProduct = await Products.findByIdAndUpdate(
      productId,
      { is_listed: 1 },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send("User not found");
    }

    res.json({ status: "success", product: updatedProduct });
  } catch (error) {
    res.redirect("/500");
    res.status(500).json({ status: "error", error: "Internal Server Error" });
  }
};

const unlistProducts = async (req, res) => {
  try {
    const productId = req.params.id;

    const updatedProduct = await Products.findByIdAndUpdate(
      productId,
      { is_listed: 0 },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send("User not found");
    }

    res.json({ status: "success", product: productId });
  } catch (error) {
    res.redirect("/500");
  
  }
};

const deleteProducts = async (req, res) => {
  try {
    const productId = req.params.productId;

    await Products.deleteOne({ _id: productId });

    res.json({ success: true });
  } catch (error) {
    res.redirect("/500");
   
  }
};

const loadEditProducts = async (req, res) => {
  try {
    const id = req.query.productId;
    const data = await Products.findOne({ _id: id }).populate("category");
    const categories = await Categories.find({ is_listed: 1 });

    res.render("edit-products", { product: data, categories: categories });
  } catch (error) {
    res.redirect("/500");
  }
};

const editProducts = async (req, res) => {
  try {
    const id = req.body.id;
    const { name, description, price, category, quantity } = req.body;

    const data = await Products.findOne({ _id: id });
    const categories = await Categories.find({ is_listed: 1 });

    // Check if a new image is uploaded
    let imageData = [];
    if (req.files) {
      // Existing image count
      const existingImageCount = (await Products.findById(id)).image.length;

      // to ensure that the total number of existing and new images does not exceed 4
      if (existingImageCount + req.files.length !== 4) {
        return res.render("edit-products", {
          message: "only 4 images allowed",
          product: data,
          categories: categories,
        });
      }

      for (let i = 0; i < req.files.length; i++) {
        // Resized path
        const resizedPath = path.join(
          __dirname,
          "../public/ResizedImages",
          req.files[i].filename
        );

        // Resize image using sharp
        await sharp(req.files[i].path)
          .resize(800, 1200, { fit: "fill" })
          .toFile(resizedPath);

        // Push the resized filename to the array
        imageData.push(req.files[i].filename);
      }
    }

    // Find the category by name
    const selectedCategory = await Categories.findOne({
      name: category,
      is_listed: 1,
    });

    // Update the product in the database
    const updatedProduct = await Products.findByIdAndUpdate(
      { _id: id },
      {
        name,
        description,
        price,
        category: selectedCategory._id, // Use the ObjectId of the category
        stockQuantity: quantity,
        $push: { image: { $each: imageData } }, // Append new images to the existing array
      },
      { new: true } // Return the updated document
    );

    // Redirect back to the product page
    res.redirect("/admin/products");
  } catch (error) {
    res.redirect("/500");
  }
};

const deleteImg = async (req, res) => {
  try {
    const { img, prdtId } = req.body;

    fs.unlink(path.join(__dirname, "../public/ResizedImages", img), () => {});
    await Products.updateOne({ _id: prdtId }, { $pull: { image: img } });
    res.send({ success: true });
  } catch (error) {
    res.redirect("/500");
  }
};

const logoutAdmin = async (req, res) => {
  try {
    req.session.admin = null;
    res.redirect("/admin");
  } catch (error) {
    res.redirect("/500");
  }
};

const salesReport = async (req, res) => {
  try {
    const moment = require("moment");

    const firstOrder = await Order.find().sort({ createdAt: 1 });
    const lastOreder = await Order.find().sort({ createdAt: -1 });

    const salesReport = await Order.find({
      "items.ordered_status": "delivered",
    })
      .populate("user_id")
      .populate("items.product_id")
      .sort({ createdAt: -1 });

    res.render("salesReport", {
      firstOrder: moment(firstOrder[0].createdAt).format("YYYY-MM-DD"),
      lastOrder: moment(lastOreder[0].createdAt).format("YYYY-MM-DD"),
      salesReport,
      moment,
    });
  } catch (err) {
    res.redirect("/500");
  }
};

const datePicker = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const startDateObj = new Date(startDate);
    startDateObj.setHours(0, 0, 0, 0);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    const selectedDate = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDateObj,
            $lte: endDateObj,
          },
          "items.ordered_status": "delivered",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$items", // Unwind the items array
      },
      {
        $lookup: {
          from: "products", // Use the correct name of your products collection
          localField: "items.product_id",
          foreignField: "_id",
          as: "items.product",
        },
      },
      {
        $unwind: "$items.product", // Unwind the product array
      },
      {
        $group: {
          _id: "$_id", // Group by the order ID
          user: { $first: "$user" }, // Preserve the user information
          delivery_address: { $first: "$delivery_address" },
          order_id: { $first: "$order_id" },
          date: { $first: "$date" },
          payment: { $first: "$payment" },
          items: { $push: "$items" }, // Push items into an array
        },
      },
    ]);

    res.status(200).json({ selectedDate: selectedDate });
  } catch (err) {
    res.redirect("/500");
  }
};

module.exports = {
  loadLogin,
  verifyAdmin,
  loadDashboard,
  loadUsers,
  blockUser,
  unblockUser,
  loadCategories,
  loadAddCategories,
  insertCategories,
  loadEditCategories,
  editCategories,
  listCategories,
  unlistCategories,
  deleteCategory,
  loadProducts,
  loadAddProducts,
  addProducts,
  listProducts,
  unlistProducts,
  deleteProducts,
  loadEditProducts,
  editProducts,
  logoutAdmin,
  deleteImg,
  salesReport,
  datePicker,
};
