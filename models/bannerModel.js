const mongoose = require( 'mongoose' ) 

const Schema = mongoose.Schema

const bannerSchema = Schema({
    image : {
        type : Array,
        required : true
    },

    title : {
        type : String,
        required : true
    },

    description : {
        type : String,
        required : true
    },
    occassion: {
        type: String,
        required:true
    },

    status : {
        type : Boolean, 
        default : true
    }

})

module.exports = mongoose.model("banner",bannerSchema)