const bcrypt = require("bcrypt");
const validator = require("validator").default;
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");


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
        return { token, userId: user._id.toString() }
    },
    createPost: async function({ postInput }, req){
        if(!req.isAuth){
            const error = new Error("Not authenticated!");
            error.code = 401;
            throw error;
        }
        const { title, content, imageUrl } = postInput;
        const errors = [];
        if(!validator.isLength(title, {min: 3})){
            const error = new Error("Title is invalid.");
            error.status = 422;
            errors.push(error);
        }
        if(!validator.isLength(content, {min: 3})){
            const error = new Error("Content is invalid..");
            error.status = 422;
            errors.push(error);
        }
        if(errors.length > 0){
            const error = new Error("Invalid input.");
            error.data = errors;
            error.code = 422;
            throw error;
        }
        try {
            const user = await User.findById(req.userId);
            if(!user){
                const error = new Error("Invalid user.");
                error.data = errors;
                error.code = 401;
                throw error;
            }
            const post = new Post({title, content, imageUrl, creator: user});
            const createdPost = await post.save();
            user.posts.push(createdPost);
            await user.save();

            return {      
                ...createdPost._doc,
                _id: createdPost._id.toString(),
                createdAt: createdPost.createdAt.toISOString(),
                updatedAt: createdPost.updatedAt.toISOString()

             }
        } catch (error) {
            throw error;
        }
    },
    posts: async function({ page }, req){
        if(!req.isAuth){
            const error = new Error("Not authenticated!");
            error.code = 401;
            throw error;
        }
        if(!page) {
            page = 1
        };
        const perPage = 2;

        try {
            const totalPosts = await Post.countDocuments();
            const posts = await Post
                .find()
                .sort({createdAt: -1})
                .skip((page - 1) * perPage)
                .limit(perPage)
                .populate('creator');
            if(!posts){
                return [];
            }
            return { posts: posts.map(post => {
                return { 
                    ...post._doc,
                      _id: post._id.toString(), 
                      createdAt: post.createdAt.toISOString(), 
                      updatedAt: post.updatedAt.toISOString()
                    }
            }), totalPosts };
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    post: async function({id}, req) {
        if(!req.isAuth){
            const error = new Error("Not authenticated!");
            error.code = 401;
            throw error;
        }
        try {
            const post = await Post.findById(id).populate("creator");
            // console.log(post)
            if(!post) {
                const error = new Error("No post found.");
                error.status = 404;
                throw error;
            }
            return { 
                ...post._doc, 
                _id: post._id.toString(), 
                createdAt: post.createdAt.toISOString(), 
                updatedAt: post.updatedAt.toISOString()
            };
            
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
    updatePost: async function({id, postInput}, req) {
        const { title, content, imageUrl } = postInput;
        try {
            const post = await Post.findById(id).populate("creator");
            if(!post) {
                const error = new Error("No post found.");
                error.status = 404;
                throw error;
            }
            if(post.creator._id.toString() !== req.userId){
                const error = new Error("No authorized.");
                error.status = 401;
                throw error;
            }
            post.title = title;
            post.content = content,
            post.imageUrl = imageUrl
            const updatedPost = await post.save();

            console.log(updatedPost)
            return { ...updatedPost._doc };

        } catch (error) {
            console.log(error)
        }
    }
}