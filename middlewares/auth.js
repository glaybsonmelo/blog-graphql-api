const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
    const authHeader = req.get("Authorization");

    try {
        if(!authHeader){
            req.isAuth = false;
            return next();
        }
        const token = authHeader.split(" ")[1];

        let decodedToken = await jwt.verify(token, process.env.JWT_SECRET);   
        
        if(!decodedToken) {
            req.isAuth = false;
            return next();
        }
        req.userId = decodedToken.userId;
        req.isAuth = true;
        next();

    } catch (error) {
        error.statusCode = 500;
        throw error;
    }
};