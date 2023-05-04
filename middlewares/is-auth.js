const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
    const authHeader = req.get("Authorization");

    try {
        if(!authHeader){
            const error = Error("Not authenticated.");
            error.statusCode = 401;
            throw error;
        }
        const token = authHeader.split(" ")[1];
        let decodedToken;
        
        decodedToken = await jwt.verify(token, process.env.JWT_SECRET);   
        
        if(!decodedToken) {
            const error = new Error("Not authenticated.");
            error.statusCode = 401;
            throw error;
        }
        
        req.userId = decodedToken.userId;
        next();

    } catch (error) {
        error.statusCode = 500;
        throw error;
    }
};