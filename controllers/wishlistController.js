const User = require("../models/usersModels");

const loadWishlist = async (req, res) => {
  try {
    const { userId } = req.session;

    const user = await User.findOne({ _id: userId });

    const wishlistData = await User.findById({ _id: userId })
      .populate({
        path: "wishlist.productId",
        populate: {
          path: "offer",
        },
      })
      .populate({
        path: "wishlist.productId",
        populate: {
          path: "category",
          populate: {
            path: "offer",
          },
        },
      });

    const wishlist = wishlistData.wishlist;
    res.render("wishlist", { wishlist, user });
  } catch (error) {
    res.redirect("/500");
  }
};

const addWishlist = async (req, res) => {
  try {
    const { userId } = req.session;
    const { productId } = req.body;

    // Check if user is logged in
    if (!userId) {
      res.redirect("/login");
    }

    const date = new Date()
      .toLocaleDateString("en-us", {
        weekday: "short",
        day: "numeric",
        year: "numeric",
        month: "short",
      })
      .replace(",", "");

    const existingProduct = await User.findOne({
      _id: userId,
      "wishlist.productId": productId,
    });

    if (!existingProduct) {
      const userWishlist = await User.findOneAndUpdate(
        { _id: userId },
        { $push: { wishlist: { productId, date } } },
        { new: true }
      );
      const count = userWishlist.wishlist.length;
      res.status(200).json({ success: true });
    } else {
      res.status(200).json({ used: true });
    }
  } catch (error) {
    res.redirect("/500");
    res.status(500).json({ error: "Server error" });
  }
};

const deleteWishlistProduct = async (req, res) => {
  try {
    const { wishlistId } = req.body.data;
    const { userId } = req.session;
    const wishlistData = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { wishlist: { _id: wishlistId } } },
      { new: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.redirect("/500");
  }
};

module.exports = {
  loadWishlist,
  addWishlist,
  deleteWishlistProduct,
};
