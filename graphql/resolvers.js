const bcrypt = require("bcrypt");
const validator = require("validator").default;
const jwt = require("jsonwebtoken");

const User = require("../models/user");


module.exports = {
    createUser: async function(args, req) {
        const { _id, name, email, password } = args.inputData;
        const errors = [];
            if(!validator.isEmail(email)){
                errors.push({message: "E-mail is invalid."});
            };
            if(!validator.isLength(password, { min: 5, max: 4098})){
                errors.push({message: "Password too short!"});
            };
 
            if(errors.length > 0){
                const error = new Error("Invalid input.");
                error.data = errors;
                error.code = 422;
                throw error;
            }
            const existingUser = await User.findOne({ email });
            if(existingUser) {
                const error = new Error("User exists alredy.");
                throw error;
            }
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = new User({ name, email, password: hashedPassword, status: "I am new!" });
            const createdUser = await user.save();

            return { ...createdUser._doc, _id: user._id.toString()}
    },
    login: async function({email, password}){
        const user = await User.findOne({email});
        if(!user){
            const error = new Error("User not found!");
            error.code = 401;
            throw error;
        }
        const passIsEqual = await bcrypt.compare(password, user.password);
        if(!passIsEqual) {
            const error = new Error("Password is incorrect.");
            error.code = 401;
            throw error;
        }
        const token = await jwt.sign({
            userId: user._id.toString(),
            name: user.name,
            email: user.email
        }, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log(token)
        return { token, userId: user._id.toString() }
    }
}