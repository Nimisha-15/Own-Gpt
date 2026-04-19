const mongoose = require("mongoose")

const connectDb = async ()=>{
    try {
        mongoose.connection.on("connected" , ()=> console.log("database connected successfully ! "))
        await mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err))
    } catch (error) {
        console.log("error in db -->" , error )
    }
}
module.exports=connectDb;