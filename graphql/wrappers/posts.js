const validator = require("validator");
const User = require("../../modules/user");
const Post = require("../../modules/post");

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
    }
};