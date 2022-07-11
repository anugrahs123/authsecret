require('dotenv').config()
const mongoose=require('mongoose')
const encrypt = require('mongoose-encryption')
const passportLocalMongoose=require('passport-local-mongoose')
const passport=require('passport')
const findOrCreate = require('mongoose-findorcreate')

const url=process.env.MONGODB_URL

mongoose.connect(url,{useNewUrlParser:true},()=>{
    console.log("database connected");
})

const UserSchema=new mongoose.Schema({
    username:String,
    password:String,
    googleId:String,
    secret:String
})
UserSchema.plugin(passportLocalMongoose)
UserSchema.plugin(findOrCreate)


const UserData=mongoose.model('UserDetails',UserSchema)


passport.use(UserData.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

//UserSchema.plugin(encrypt,{secret: process.env.MONGOSECRET ,encryptedFields: ['password']})


module.exports={UserData}