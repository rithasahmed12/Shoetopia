const User = require("../models/usersModels");


const loadWishlist = async(req,res)=>{
    try {
        const { userId } = req.session;

        const user = await User.findOne({_id:userId});

        const wishlistData = await User.findById({ _id: userId })
        .populate({
          path: 'wishlist.productId',
          populate: {
            path: 'offer' // Access offer schema from the product schema
          }
        })
        .populate({
          path: 'wishlist.productId',
          populate: {
            path: 'category',
            populate: {
              path: 'offer' // Access offer schema from the category schema
            }
          }
        });

        const wishlist = wishlistData.wishlist;
        res.render("wishlist", { wishlist ,user});
      } catch (error) {
        console.log(error.message);
        
      }
}


const addWishlist = async (req, res) => {
    try {
      const { userId } = req.session;
      const { productId } = req.body;
  
      // Check if user is logged in
      if (!userId) {
        res.redirect('/login');
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
        res.status(200).json({ success: true});
      } else {
        res.status(200).json({ used:true});
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: "Server error" });
    }
  };

  const deleteWishlistProduct = async (req, res) => {
    const { wishlistId } = req.body.data;
    const { userId } = req.session;
    console.log('aaaa',wishlistId);
    const wishlistData = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { wishlist: { _id: wishlistId } } },
      {new:true}
    );

    // console.log('wishlIst data',wishlistData);
    res.json({ success: true })
  };
  
  

module.exports = {
    loadWishlist,
    addWishlist,
    deleteWishlistProduct

}