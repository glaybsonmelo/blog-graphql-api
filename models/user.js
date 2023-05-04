const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true
    },
    status: {
        type: String,
        default: "I am new!",
    },
    posts: [
        { type: Schema.Types.ObjectId, ref: "Post" }
    ]
});

module.exports = model("User", userSchema);