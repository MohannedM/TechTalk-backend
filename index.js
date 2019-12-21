const express = require("express");
const app = express();
const mongoose = require("mongoose");
const graphqlHttp = require('express-graphql');
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const bodyParser = require("body-parser");
const mongoDBKey = require("./env-variables").mongoDBKey;

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
