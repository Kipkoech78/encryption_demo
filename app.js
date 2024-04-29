
require('dotenv').config(); //must always be at the top of the file
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

//note there order: its important very important
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    password: String,
    // googleId: String,
    secret: String
}) ;

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

// var secret = process.env.SECRET;
//to encrypt the password field only add encytedfields:
// UserSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"]});


const User = new mongoose.model("User", UserSchema);


passport.use(User.createStrategy());
////////it only works with local strategy so commented to add a strategy that works with google oauth as well
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
///////this works for both local and google strategy///////
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" //this is to fix the error appearing in the console
  },
  function(accessToken, refreshToken, profile, cb) {
    //see what google sends back
    console.log(profile);
    User.findOrCreate({ username: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
});
// provide the google authentication pop up screen
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] })

);
//redirect to our website after google authentication
app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });
app.get("/Contact", function(req, res){
    res.render("Contact");
});
app.get("/index", function(req, res){
    res.render("index");
});

app.get("/login", function(req, res){
    res.render("login");
});
app.get("/register", function(req, res){    
    res.render("register");
}  );
app.get("/secrets", function(req, res){
    User.find({"secret":{$ne:null}}).then(function(foundUsers){
        if(foundUsers){
            res.render("secrets",{usersWithSecrets: foundUsers});
        }
   
    }).catch(function(err){
        console.log(err);
    });

});

app.get("/submit", function(req,res){
        if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }

});

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id).then(function(foundUser){
        if(foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save().then(function(){
                res.redirect("/secrets");
            });
        }
    }).catch(function(err){
        console.log(err);
    });

  
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

            
        }else {
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


// newsletter



app.post("/index",function(req, res){
    const firstname= req.body.firstname;
    const lastname= req.body.secondname;
    const emailget= req.body.emailget;



    const data ={
        members:[
            {
                email_address:emailget,
                status:"subscribed",
                merge_fields:{
                    FNAME:firstname,
                    LNAME:lastname
                }
            }
        ]
    };
    const jsonData = JSON.stringify(data);
//read mdn documentation for more info on option on https  (nodejs.org)(https.request)

    const url ="https://us22.api.mailchimp.com/3.0/lists/b0c58e0b7c";
    const options ={
        method:"POST",
        auth: "kipkoech78:77e6ad8b82f435a1124c4768577e54a4-us22"

    }
    const request = https.request(url, options, function(response){

        if (response.statusCode ===200){
            res.sendFile(__dirname+"/success.html");
        }
        else{
            res.sendFile(__dirname+"/failure.html");


        };
        response.on("data", function(data){
            console.log(JSON.parse(data));
        })
    })
    request.write(jsonData);
    request.end();

});
app.get("/failure",function(req,res){
    res.redirect("/index");

})






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