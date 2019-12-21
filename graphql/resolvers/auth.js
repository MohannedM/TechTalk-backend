const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../modules/user");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const sendGripApi = require("../../env-variables").sendGripApi;
const jwtKey = require("../../env-variables").jwtKey;

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: sendGripApi
    }
}))
module.exports = {
    signup: async function({userData}, req){
        const errors = [];
        if(!validator.default.isEmail(userData.email)){
            errors.push({message: "The email you entered is invalid"});
        }
        if(!validator.default.isLength(userData.name,{min: 5, max: 30}) || validator.default.isEmpty(userData.name)){
            errors.push({message: "Name should be between 5 and 30 characters"});
        }
        if(!validator.default.isLength(userData.password,{min: 5, max: 20}) || validator.default.isEmpty(userData.password)){
            errors.push({message: "Password should be between 5 and 20 characters"});
        }
        if(errors.length > 0){
            const error = new Error("Invalid input");
            error.code = 400;
            error.data = errors;
            throw error;
        }
        const exisitingUser = await User.findOne({email: userData.email});
        if(exisitingUser){
            throw new Error("Email already exists");
        }
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = new User({
            name: userData.name,
            email: userData.email,
            password: hashedPassword
        });
        await user.save();
        transporter.sendMail({
            to: userData.email,
            from: 'info@tech-talk.com',
            subject: 'Welcome To TechTalk',
            html: `
                <h1>Welcome ${userData.name} to TechTalk</h1>
                <p>Don't forget to take advantage of your access to its fullest by reacting with posts and posting one!</p>
            `
        });
        return true;
    },
    login: async function({email, password}, req){
        const errors = [];
        if(!validator.default.isEmail(email)){
            errors.push({message: "The email you entered is invalid"});
        }
        if(!validator.default.isLength(password,{min: 5, max: 20}) || validator.default.isEmpty(password)){
            errors.push({message: "Password should be between 5 and 20 characters"});
        }

        const exisitingUser = await User.findOne({email: email});
        if(!exisitingUser){
            errors.push({message: "Email doesn't exist"});
        }

        if(errors.length > 0){
            const error = new Error("Invalid input");
            error.code = 400;
            error.data = errors;
            throw error;
        }

        const isEqual = await bcrypt.compare(password, exisitingUser.password);

        if(!isEqual){
            errors.push({message: "Password is incorrect"});
            const error = new Error("Password is incorrect!");
            error.code = 400;
            error.data = errors;
            throw error;
        }
        const tokenExpiration = new Date().getTime() + 3600000;
        const token = jwt.sign({
            _id: exisitingUser._id,
            is_admin: exisitingUser.is_admin,
            expiration: tokenExpiration
        }, jwtKey);

        return {
            token,
            user: {
                _id: exisitingUser._id.toString(),
                ...exisitingUser._doc
            },
            expiration: tokenExpiration

        }
    },
    getUserData: async function({token}, req){
        const decodedToken =  jwt.verify(token, jwtKey);
        if(decodedToken.expiration < new Date()){
            const error = new Error("Token is expired");
            error.code = 401;
            error.data = "Token is expired";
            throw error;
        }
        const user = await User.findById(decodedToken._id);
        if(!user){
            const error = new Error("User doesn't exist");
            error.code = 401;
            error.data = "User doesn't exist";
            throw error;
        }
        return {
            ...user._doc,
            _id: user._id.toString(),
        }
    },
    isEmailTaken: async function({email}, req){
        const exisitingUser = await User.findOne({email});
        return exisitingUser ? true : false;
    }
}