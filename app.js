const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const { graphqlHTTP } = require('express-graphql')

const graphqlcSchema = require("./graphql/schema");
const graphqlcResolver = require("./graphql/resolvers");
const auth = require("./middlewares/auth");

require("dotenv").config();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString + file.originalname)
    }
})

const filter = (req, file, cb) => {
    if(
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg'
    ) 
        return cb(null, true)
    
    cb(null, false)
}

app.use(bodyParser.json());
app.use(multer({
    storage: fileStorage, fileFilter: filter}
    ).single('image'))
app.use("/images", express.static(path.join(__dirname, 'images')))

// cors
app.use((req, res, next) => {

    // tipo de reqs e headers que vou usar.
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if(req.method == "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => {
        console.log(err);
    });
}

app.use(auth);

app.put("/post-image", (req, res, next) => {
    if(!req.isAuth){
        throw new Error("Not authenticated!");
    }
    if(!req.file) {
        return res.status(200).json({message: "No image provided."});
    }
    if(req.body.oldPath){
        clearImage(req.body.oldPath);
    }
    return res.status(200).json({ message: "Image stored.", filePath: req.file.path});
});

app.use('/graphql', graphqlHTTP({
    schema: graphqlcSchema,
    rootValue: graphqlcResolver,
    graphiql: true,
    customFormatErrorFn(err) {
        if(!err.originalError) {
            return err;
        }
        const data = err.originalError.data;
        const code = err.originalError.code || 500;
        const message = err.message || "An error ocurred.";
        return { message, status: code, data}
    }
}));

app.use((error, req, res, next) => {
    const { statusCode, message, data } = error;
    res.status(statusCode).json({ message, data });
})

mongoose
    .connect(process.env.MONGO_DB_URI)
    .then(() => {
        const server = app.listen(8080);
}).catch(err => console.log(err))