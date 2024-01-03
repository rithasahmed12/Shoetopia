const express = require("express");
const offerRoute = express();
const adminAuth = require("../middleware/adminAuth");

const offerController = require("../controllers/offerController");

offerRoute.set("views", "./views/admin");


offerRoute.get("/offers", adminAuth.isLogin, offerController.loadOffers);

offerRoute.get("/addOffer", adminAuth.isLogin, offerController.loadAddOffer);

offerRoute.post("/addOffer", offerController.addOffer);

offerRoute.patch("/applycategoryOffer", offerController.applycategoryOffer);

offerRoute.patch("/removeCategoryOffer", offerController.removeCategoryOffer);

offerRoute.patch("/applyProductOffer", offerController.applyProductOffer);

offerRoute.patch("/removeProductOffer", offerController.removeProductOffer);

offerRoute.post("/offer/deleteOffer/:offerId", offerController.deleteOffer);


module.exports = offerRoute;