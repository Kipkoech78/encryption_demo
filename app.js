
require('dotenv').config(); //must always be at the top of the file
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { register } = require("module");
const encrypt = require("mongoose-encryption");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

//connect to mongodb
mongoose.connect("mongodb://localhost:27017/userDB ");
//update the simple version of the schema
const UserSchema = new mongoose.Schema({
    email: String,
    password: String
}) ;

var secret = process.env.SECRET;
//to encrypt the password field only add encytedfields:
UserSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"]});


const User = new mongoose.model("User", UserSchema);

app.get("/", function(req, res){
    res.render("home");
});
app.get("/login", function(req, res){
    res.render("login");
});
app.get("/register", function(req, res){    
    res.render("register");
}  );

// clicking register button
app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save().then(function(){
        res.render("secrets");
        console.log("User saved successfully");
    }).catch(function(err){
        console.log(err);
    
    });
});
//clicking login button

app.post("/login", function(req,res){
    const username =req.body.username;
    const getpassword = req.body.password;
    User.findOne({email:username}).then(function(foundUser){
        if(foundUser){
            if(foundUser.password === getpassword){
                res.render("secrets");
                console.log("User logged in successfully");
            }else{
                console.log("Password incorrect");
            }
        }else{
            console.log("User not found");
        }
    }).catch(function(err){
        console.log(err);
    });
});








app.listen(3000, function(){
    console.log("Server started on port 3000");
});
