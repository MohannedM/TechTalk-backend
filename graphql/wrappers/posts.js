const validator = require("validator");
const User = require("../../modules/user");
const Post = require("../../modules/post");
const fs = require("fs");
const path = require("path");
module.exports = {
    createPost: async function({postInput}, req){
        const errors = [];
        if(validator.default.isEmpty(postInput.title) || !validator.default.isLength(postInput.title, {min: 4, max: 25})){
            errors.push({message: "Title should be from 4 to 25 characters"})
        }
        
        if(validator.default.isEmpty(postInput.content) || !validator.default.isLength(postInput.content, {min: 5, max: 300})){
            errors.push({message: "Content should be from 5 to 300 characters"})
        }
        
        if(validator.default.isEmpty(postInput.title) || !validator.default.isLength(postInput.title, {min: 3})){
            errors.push({message: "Image should not be empty"})
        }

        const exisitingUser = await User.findById(req.userId);

        if(!exisitingUser){
            errors.push({message: "Authentication Failed"});
        }

        if(errors.length > 0){
            const error = new Error("Invalid Input");
            error.code = 400;
            error.data = errors;
            throw error;
        }

        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            image: postInput.image,
            creator: exisitingUser._id
        });
        const createdPost = await post.save();
        exisitingUser.posts.push(createdPost);
        exisitingUser.save();
        return {
            _id: createdPost._id.toString(),
            ...createdPost._doc,
            creator: {
                _id: exisitingUser._id.toString(),
                ...exisitingUser._doc
            },
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        }
    },
    getUserPosts: async function(args, req){
        if(!req.isAuth || !req.userId){
            const error = new Error("Authentication failed");
            error.code = 401;
            throw error;
        }
        const user = await User.findById(req.userId).populate("posts");
        return user.posts.map(post=>{
            return {
                ...post._doc,
                _id: post._id.toString(),
                creator: {
                    ...user._doc,
                    _id: user._id.toString()
                },
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString()
            }
        });
    },
    getAllPosts: async function(args, req){
        const posts = await Post.find().populate('creator');
        return posts.map(post=>{
            return {
                ...post._doc,
                _id: post._id.toString(),
                creator: {
                    ...post.creator._doc,
                    _id: post.creator._id.toString()
                },
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString()
            }
        });
    },
    updatePost: async function({postInput, req}){
        const errors = [];
        if(validator.default.isEmpty(postInput.title) || !validator.default.isLength(postInput.title, {min: 4, max: 25})){
            errors.push({message: "Title should be from 4 to 25 characters"})
        }
        
        if(validator.default.isEmpty(postInput.content) || !validator.default.isLength(postInput.content, {min: 5, max: 300})){
            errors.push({message: "Content should be from 5 to 300 characters"})
        }
        
        const exisitingUser = await User.findById(req.userId);

        if(!exisitingUser){
            errors.push({message: "Authentication Failed"});
        }

        const fetchedPost = await Post.findById(postInput._id).populate("user");

        if(!fetchedPost){
            errors.push({message: "Post was not found"});
        }

        if(errors.length > 0){
            const error = new Error("Invalid Input");
            error.code = 400;
            error.data = errors;
            throw error;
        }
        let postImage;
        if(postInput.image){
            fs.unlinkSync(path.join(__dirname, fetchedPost.image));
            postImage = postInput.image;
        }else{
            postImage = fetchedPost.image;
        }
        fetchedPost.title = postInput.title;
        fetchedPost.image = postImage;
        fetchedPost.content = postInput.content;
        const updatedPost = await fetchedPost.save();
        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            creator: {
                ...fetchedPost.creator._doc,
                _id :fetchedPost._id.toString()
            },
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        }
    }
};