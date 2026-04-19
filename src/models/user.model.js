const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const userSchema = new mongoose.Schema({
    name :{type : String , required:true , },
    email : {type : String , required : true , unique : true },
    password :{type: String , required : true , unique :false },
    credits :{type: Number , default: 20  },
})

// hash password before saving 
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePass = async function (password) {
  let comparePass = await bcrypt.compare(password, this.password);
  return comparePass;
};



const userModel = mongoose.model('userModel' , userSchema);
module.exports = userModel 