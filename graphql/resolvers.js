const bcrypt = require("bcrypt");
const validator = require("validator").default;

const User = require("../models/user");


module.exports = {
    createUser: async function(args, req) {
        const { _id, name, email, password } = args.inputData;
        const errors = [];
        // try {
            if(!validator.isEmail(email)){
                errors.push({message: "E-mail is invalid."});
            };
            if(validator.isEmpty(password) || validator.isLength(password, { min: 5})){
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
        // } catch (error) {
        //     console.log(error)
        // }
    }
}