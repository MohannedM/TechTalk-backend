const express = require("express");
const app = express();
const mongoose = require("mongoose");
const graphqlHttp = require('express-graphql');
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const bodyParser = require("body-parser");
const mongoDBKey = require("./env-variables").mongoDBKey;
const auth = require("./middleware/auth");
const multer = require("multer");
const uuidv4 = require("uuid/v4");
const path = require("path");



app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(bodyParser.json());

app.use((req, res, next)=>{
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if(req.method === "OPTIONS"){
        return res.sendStatus(200);
    }
    next();
});

app.use(auth);

const storage = multer.diskStorage({
    destination(req, file, cb){
        cb(null, 'images')
    },
    filename(req, file, cb){
        cb(null, uuidv4());
    }
});

const fileFilter = (req, file, cb) => {
    if(!req.isAuth) return cb(null, false);
    if(file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg"){
        cb(null, true);
    }else{
        cb(null, false);
    }
}
app.use(multer({storage, fileFilter}).single('image'));

app.put("/post/add-image", (req,res,next)=>{
    if(!req.isAuth){
        res.status(401).json({message: "Unauthorized"});
        return;
    }
    if(req.file){
        const imageUrl = req.file.path.replace("\\" ,"/");
        imageUrl ? res.status(200).json({imageUrl}) : res.status(400).json({error: "Image upload failed"});
        return; 
    }else if(!req.file){
        res.status(200).json({imageUrl: ''});
        return;
    }
    
});

app.use("/graphql", graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err){
        if(!err.originalError){
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An Error Occured';
        const code = err.originalError.code || 500;
        return{message, status: code, data }
    }
}));





mongoose.connect(mongoDBKey)
.then(()=>{
    app.listen(8080);
});
