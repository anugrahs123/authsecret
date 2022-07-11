require('dotenv').config()
const express=require('express')
const app=new express()
const session=require('express-session')
const passport=require('passport')
const passportLocalMongoose=require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const ejs=require('ejs')
const {UserData}=require('./config/connection')


app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session())
app.set('view engine','ejs')
app.set('views','./views')
app.use(express.static('./public'))
app.use(express.urlencoded({extended:true}))
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8008/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("token",accessToken);
    UserData.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get('/',(req,res)=>{
    res.render('home')
})
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secret');
  });
app.get('/login',(req,res)=>{
    res.render('login')
})
app.get('/register',(req,res)=>{
    res.render('register')
})
app.get('/secret',(req,res)=>{
   UserData.find({"secret":{$ne:null}},(err,found)=>{
    if(err) throw err
    else{
        if(found){
            res.render("secrets",{userWithSecrets:found})
        }
    }
   })
})

app.post('/register',async(req,res)=>{


    UserData.register({username:req.body.username},req.body.password,(err,user)=>{
        if(err) {
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,()=> {
                res.redirect('/secret')
            })
        }

    })
})

app.post('/login',(req,res)=>{
    const user=new UserData({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user,(err)=>{
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect('/secret')
            })
        }
    })
 
})
app.get('/submit',(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit")
    }
    else{
        res.redirect('/login')
    }
})
app.post('/submit',(req,res)=>{
    const submittedSecret=req.body.secret;
    UserData.findById(req.user.id,(err,found)=>{
        if(err) throw err
        else{
            if(found){
                found.secret=submittedSecret;
                found.save(()=>{

                    res.redirect("/secret")
                })
            }
        }
    })
})
app.get('/logout',(req,res)=>{
    req.logout({keep:true},(err)=>{
        if(err) throw err
        else{

            res.redirect('/')
        }
    });
})

app.listen(8008)