const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
    userId  : {
        type : String,
        ref : 'user'
    },
    userName  : {
        type : String,
    },
    name : {
        type : String,
        required : true 
    }   ,
    messages : [{
        isImage :   {type : Boolean , default : false },
        isPublished : {type : Boolean , default : false},
        role : {type : String , required : true},
        content : {type : String , required : true},
        timestamp : {type : Number , required : true}

    }]
},{timestamps : true})

const chatModel = mongoose.model("chatModel" , chatSchema)
module.exports = chatModel;
