const path = require("path");
const fs = require("fs");

const io = require("../socket");

const Post = require("../models/post");
const { validationResult } = require("express-validator");
const { listeners } = require("process");
const User = require("../models/user");
const user = require("../models/user");

exports.getPosts = async (req, res, next) => {

    const currentPage = req.query.page || 1;
    const perPage = 2;
    try {
        const totalItems = await Post.countDocuments();

        const posts = await Post.find()
            .populate('creator', 'name')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPage)
            .limit(perPage)

        if(!posts) {
            let error = new Error("Posts not found.");
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({message: "Fetched posts successfully.", posts, totalItems});
    } catch (error) {
        if(!error.statusCode)
            error.statusCode = 500;
        next(error);
    }
  
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId).populate('creator', 'name');
        if(!post) {
            let error = new Error("Post not found.");
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({message: "Fetched post successfully.", post});
    } catch (error) {
        if(!error.statusCode)
            error.statusCode = 500;
        next(error);
    }
};

exports.createPost = async (req, res, next) => {

    const errors = validationResult(req);
    const { title, content } = req.body;
    
    try {
        if (!errors.isEmpty()) {
            let erro = new Error("Validation failed, entered data is incorrect.");
            erro.statusCode = 422;
            throw erro;
        }

        if (!req.file) {
            const error = new Error("No image privided.");
            error.statusCode = 422;
            throw error;
        }
        const imageUrl = req.file.path;
            const post = new Post({title, content, imageUrl, creator: req.userId});
            await post.save();

            const creator = await User.findById(req.userId);
            creator.posts.push(post);
            await creator.save();
            
            io.getIo().emit("posts", { action: 'create',
            post: {...post._doc, creator: { _id: req.userId, name: creator.name}}
            
            });
            res.status(201).json({
                message: "Post created successfully!",
                post: post,
                creator: {
                    _id: creator._id,
                    name: creator.name
                }
            })
      
    } catch (error) {
        if(!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
        
    }

};
exports.updatePost = async (req, res, next) => {
    const { postId } = req.params;
    const { title, content } = req.body;
    let imageUrl = req.body.image;

    const errors = validationResult(req);
    try {
        if(!errors.isEmpty()){
            const error = new Error("Validation failed, entered data is incorrect.");
            error.statusCode = 422;
            throw error;    
        }

        if(req.file) {
            imageUrl = req.file.path;
        }

        if(!imageUrl) {
            const error = new Error("No file picked.");
            error.statusCode = 422;
            throw error;
        }

        const post = await Post.findById(postId).populate("creator");

        if(post.creator._id.toString() !== req.userId.toString()) {
            const error = new Error("Not authorized.");
            error.statusCode = 403;
            throw error;
        }

        if(!post) {
            let error = new Error("Post not found.");
            error.statusCode = 404;
            throw error;
        }

        if(imageUrl !== post.image){
            clearImage(post.imageUrl);
        }
    
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        const result = await post.save();

        io.getIo().emit("posts", { action: 'update', post: result })
        res.status(200).json({message: "Post Updated!", post: result});
    
    }catch(err) {
        if(!err.statusCode)
            err.statusCode = 500;
        next(err);
    }
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => {
        console.log(err);
    });
}

exports.deletePost = async (req, res, next) => {
    const { postId } = req.params;
    try{
        const post = await Post.findById(postId);

        if(post.creator.toString() !== req.userId){
            const error = new Error("Not authorized.");
            error.statusCode = 403;
            throw error;
        }

        if(!post) {
            let error = new Error("Post not found.");
            error.statusCode = 404;
            throw error;
        }
        
        clearImage(post.imageUrl);

        await Post.findByIdAndRemove(postId);
        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        io.getIo().emit('posts', { action: 'delete', postId })
        res.status(200).json({message: "Deleted post"})
    } catch (err) {
        if(!err.statusCode)
            err.statusCode = 500;
        
        next(err);
    }

}