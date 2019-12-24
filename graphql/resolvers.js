const authResolvers = require("./wrappers/auth");
const postsResolvers = require("./wrappers/posts");
module.exports = {
    ...authResolvers,
    ...postsResolvers
}