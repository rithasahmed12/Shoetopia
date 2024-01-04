const express = require("express");
const adminRoute = express();
const adminAuth = require("../middleware/adminAuth");

const path = require("path");

const adminController = require("../controllers/adminControllers");
const ordersController = require("../controllers/ordersController");

const upload = require("../middleware/uploadImages");


adminRoute.use(express.json());
adminRoute.use(express.urlencoded({ extended: true }));



adminRoute.set("views", "./views/admin");

adminRoute.get("/", adminAuth.isLogout, adminController.loadLogin);

adminRoute.post("/", adminController.verifyAdmin);

adminRoute.get("/dashboard", adminAuth.isLogin, adminController.loadDashboard);

adminRoute.get("/users", adminAuth.isLogin, adminController.loadUsers);

adminRoute.get("/logout", adminAuth.isLogin, adminController.logoutAdmin);

// routes for blocking and unblocking
adminRoute.post("/users/block/:id", adminController.blockUser);
adminRoute.post("/users/unblock/:id", adminController.unblockUser);

adminRoute.get(
  "/addCategories",
  adminAuth.isLogin,
  adminController.loadAddCategories
);

adminRoute.post(
  "/addCategories",
  adminAuth.isLogin,
  adminController.insertCategories
);

adminRoute.get("/categories", adminAuth.isLogin, adminController.loadCategories);

adminRoute.get(
  "/editCategories",
  adminAuth.isLogin,
  adminController.loadEditCategories
);

adminRoute.post("/editCategories", adminController.editCategories);

// routes for listing and unlisting categories
adminRoute.post("/categories/list/:id", adminController.listCategories);
adminRoute.post("/categories/unlist/:id", adminController.unlistCategories);

adminRoute.post(
  "/categories/deleteCategory/:categoryId",
  adminController.deleteCategory
);

adminRoute.get("/products", adminAuth.isLogin, adminController.loadProducts);

adminRoute.get("/addProducts", adminAuth.isLogin, adminController.loadAddProducts);

adminRoute.post(
  "/addProducts",
  upload.upload.array("image"),
  adminController.addProducts
);

// list and unlist products
adminRoute.post("/products/list/:id", adminController.listProducts);
adminRoute.post("/products/unlist/:id", adminController.unlistProducts);

adminRoute.post(
  "/products/deleteProducts/:productId",
  adminController.deleteProducts
);

adminRoute.get("/editProducts", adminAuth.isLogin, adminController.loadEditProducts);

adminRoute.post(
  "/editProducts",
  upload.upload.array("image"),
  adminController.editProducts
);

adminRoute.put("/products/deleteImage", adminController.deleteImg);

adminRoute.get("/orders", adminAuth.isLogin, ordersController.loadAdminOrders);

adminRoute.post("/update-order-status", ordersController.updateOrderStatus);

adminRoute.get(
  "/order-details",
  adminAuth.isLogin,
  ordersController.loadOrderDetailsAdmin
);


adminRoute.get("/salesReport", adminAuth.isLogin, adminController.salesReport);

adminRoute.post("/salesReport", adminController.datePicker);



module.exports = adminRoute;
