const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const multer = require("multer");

const { graphqlHTTP } = require('express-graphql')
// const feedRoutes = require("./routes/feed");
// const authRoutes = require("./routes/auth");
const graphqlcSchema = require("./graphql/schema");
const graphqlcResolver = require("./graphql/resolvers");

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
    next();
});

app.use('/graphql', graphqlHTTP({
    schema: graphqlcSchema,
    rootValue: graphqlcResolver,
    graphiql: true
}));

// app.use("/auth", authRoutes);
// app.use("/feed", feedRoutes);

app.use((error, req, res, next) => {
    const { statusCode, message, data } = error;
    res.status(statusCode).json({ message, data });
})

mongoose
    .connect(process.env.MONGO_DB_URI)
    .then(() => {
        const server = app.listen(8080);
}).catch(err => console.log(err))

