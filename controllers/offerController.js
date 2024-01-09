const Offer = require("../models/offerModel");
const Categories = require("../models/categoriesModel");
const Products = require("../models/productsModel");
const moment = require("moment");

const loadOffers = async (req, res) => {
  try {
    const offers = await Offer.find({});
    res.render("offers", { offers, moment });
  } catch (error) {
    res.redirect("/500");
  }
};

const loadAddOffer = async (req, res) => {
  try {
    res.render("add-offer");
  } catch (error) {
    res.redirect("/500");
  }
};

const addOffer = async (req, res) => {
  try {
    const { name, startingDate, expiryDate, percentage } = req.body;

    const offerExist = await Offer.findOne({ name: name });

    if (offerExist) {
      req.session.message = "offer already exist";
      res.render("add-offer", { message: "offer already exist" });
    } else {
      const offer = new Offer({
        name: name,
        startingDate: startingDate,
        expiryDate: expiryDate,
        percentage: percentage,
      });
      await offer.save();

      res.redirect("/admin/offers");
    }
  } catch (err) {
    res.redirect("/500");
  }
};

const applycategoryOffer = async (req, res) => {
  try {
    const { offerId, categoryId } = req.body;
    await Categories.updateOne(
      { _id: categoryId },
      {
        $set: {
          offer: offerId,
        },
      }
    );
    res.json({ success: true });
  } catch (err) {
    res.redirect("/500");
  }
};

const removeCategoryOffer = async (req, res) => {
  try {
    const { categoryId } = req.body;
    await Categories.updateOne(
      { _id: categoryId },
      {
        $unset: {
          offer: "",
        },
      }
    );
    res.json({ success: true });
  } catch (err) {
    res.redirect("/500");
  }
};

const applyProductOffer = async (req, res) => {
  try {
    const { offerId, productId } = req.body;
    await Products.updateOne(
      { _id: productId },
      {
        $set: {
          offer: offerId,
        },
      }
    );
    await Products.find({ _id: productId });

    res.json({ success: true });
  } catch (err) {
    res.redirect("/500");
  }
};

const removeProductOffer = async (req, res) => {
  try {
    const { productId } = req.body;
    await Products.updateOne(
      { _id: productId },
      {
        $unset: {
          offer: "",
        },
      }
    );
    res.json({ success: true });
  } catch (err) {
    res.redirect("/500");
  }
};

const deleteOffer = async (req, res) => {
  try {
    const offerId = req.params.offerId;

    await Offer.deleteOne({ _id: offerId });

    res.json({ success: true });
  } catch (error) {
    res.redirect("/500");
  }
};

module.exports = {
  loadOffers,
  loadAddOffer,
  addOffer,
  applycategoryOffer,
  removeCategoryOffer,
  applyProductOffer,
  removeProductOffer,
  deleteOffer,
};
