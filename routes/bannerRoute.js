const express = require("express");
const bannerRoute = express();
const adminAuth = require("../middleware/adminAuth");

const bannerController = require("../controllers/bannerController");
const upload = require("../middleware/uploadImages");


bannerRoute.set("views", "./views/admin");


bannerRoute.get("/banner", adminAuth.isLogin, bannerController.loadBanner);

bannerRoute.get("/addBanner", adminAuth.isLogin, bannerController.addBanner);

bannerRoute.post(
  "/addBanner",
  upload.array("bannerImage", 1),
  bannerController.postBanner
);

bannerRoute.get("/bannerEdit", adminAuth.isLogin, bannerController.loadEditBanner);

bannerRoute.post(
  "/bannerEdit",
  upload.array("bannerImage", 1),
  bannerController.editBanner
);

bannerRoute.patch('/bannerRemove',bannerController.removeBanner);

module.exports = bannerRoute;