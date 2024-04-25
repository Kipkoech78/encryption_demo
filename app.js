
require('dotenv').config(); //must always be at the top of the file
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

//note there order: its important very important
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

// const encrypt = require("mongoose-encryption"); // uses key a level2 security encription
// const md5 = require('md5'); //level3 security using hashing 
// const bcrypt = require('bcrypt'); //level4 security using hashing and salting
// const saltRounds = 10;


const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
// using session
app.use(session(
    {
        secret: "our little secret.",
        resave:false,
        saveUninitialized:false
    }
));

app.use(passport.initialize());
app.use(passport.session());



//connect to mongodb
mongoose.connect("mongodb://localhost:27017/userDB ");
//update the simple version of the schema
const UserSchema = new mongoose.Schema({
    email: String,
    password: String
}) ;

UserSchema.plugin(passportLocalMongoose);

// var secret = process.env.SECRET;
//to encrypt the password field only add encytedfields:
// UserSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"]});


const User = new mongoose.model("User", UserSchema);


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
    res.render("home");
});
app.get("/login", function(req, res){
    res.render("login");
});
app.get("/register", function(req, res){    
    res.render("register");
}  );
app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
        else{
            res.redirect("/");
        }
    });
});

// clicking register button
app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            });
        }
    });



});
//clicking login button

app.post("/login", function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

});



app.listen(3000, function(){
    console.log("Server started on port 3000");
});




//     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    
//     const newUser = new User({
//         email: req.body.username,
//         password:hash
//     });
//     newUser.save().then(function(){
//         res.render("secrets");
//         console.log("User saved successfully");
//     }).catch(function(err){
//         console.log(err);
    
//     });
// });





//     const username =req.body.username;
//     const password = req.body.password;
//     User.findOne({email:username}).then(function(foundUser){
//         if(foundUser){
//             bcrypt.compare(password,foundUser.password).then (function(result) {

//             if(result === true){
//                 res.render("secrets");
//                 console.log("User logged in successfully");
//             }else{
//                 console.log("Password incorrect");
//             }
//     // result == true
// });
//         }else{
//             console.log("User not found");
//         }
//     }).catch(function(err){
//         console.log(err);
//     });