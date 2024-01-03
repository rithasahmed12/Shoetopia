const Offer = require('../models/offerModel');
const Categories = require('../models/categoriesModel');
const Products = require('../models/productsModel');
const moment = require('moment');

const loadOffers = async(req,res)=>{
    try {
        const offers = await Offer.find({}); 
        res.render('offers',{offers,moment});
        
    } catch (error) {

        console.log(error.message);
   
    }
}

const loadAddOffer = async(req,res)=>{
    try {
        
    res.render('add-offer')

    } catch (error) {

        console.log(error.message);
    }
}


const addOffer = async(req,res,next)=>{
    try {
        const {name,startingDate,expiryDate,percentage} = req.body

        const offerExist = await Offer.findOne({ name : name })

        if( offerExist ) {
            req.session.message='offer already exist'
            res.render('add-offer',{message:"offer already exist"});
        }else{
         const offer = new Offer({
            name : name,
            startingDate : startingDate, 
            expiryDate : expiryDate,
            percentage : percentage,
            // search : search,
            // page : page
         }) 
         await offer.save()
        
         res.redirect('/admin/offers')
        }
    } catch (err) {
        next(err)
    }
}

const applycategoryOffer = async(req,res)=>{
    try {
        const {offerId,categoryId}=req.body
        await Categories.updateOne({_id:categoryId },{
            $set:{
                offer:offerId
            }
        })
        res.json({success:true})

    } catch (err) {
        console.log(err.message);
    }
}

const removeCategoryOffer = async(req,res)=>{
    try {
        const { categoryId } = req.body
             await Categories.updateOne({ _id : categoryId },{
                $unset : {
                    offer : ""
                }
            })
            res.json({ success : true })
    } catch (err) {
        console.log(err.message);
    }
}



const applyProductOffer = async  (req,res) => {
    try {

        const { offerId, productId } = req.body
        await Products.updateOne({ _id : productId },{
            $set : {
                offer : offerId
            }
        })
         await Products.find({_id:productId})

        res.json({ success : true})
    } catch (err) {
        console.log(err.message);

    }
}

const removeProductOffer = async(req,res)=>{
    try {
        const { productId } = req.body
             await Products.updateOne({ _id : productId },{
                $unset : {
                    offer : ""
                }
            })
            res.json({ success : true })
    } catch (err) {
       console.log(err.message);
    }
}


const deleteOffer = async (req, res) => {
    try {
        const offerId = req.params.offerId;
  
        await Offer.deleteOne({ _id:offerId });
        
        res.json({ success: true });
  
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };




module.exports={
loadOffers,
loadAddOffer,
addOffer,
applycategoryOffer,
removeCategoryOffer,
applyProductOffer,
removeProductOffer,
deleteOffer

}