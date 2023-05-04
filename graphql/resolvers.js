const bcrypt = require("bcrypt");

const User = require("../models/user");


module.exports = {
    createUser: async function(args, req) {
        const { _id, name, email, password } = args.inputData;
        console.log(_id)
        try {
            const existingUser = await User.findOne({email});
            if(existingUser) {
                const error = new Error("User exists alredy.");
                throw error;
            }
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = new User({name, email, password: hashedPassword, status: "I am new!"});
            const createdUser = await user.save();

            return { ...createdUser._doc, _id: user._id.toString()}
        } catch (error) {
            console.log(error)
        }
    }
}