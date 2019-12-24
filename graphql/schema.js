const { buildSchema } = require("graphql");

module.exports = buildSchema(`

    input UserInputData{
        name: String!
        email: String!
        password: String!
    }

    input PostInputData{
        title: String!
        content: String!
        image: String!
    }

    type User{
        _id: ID!
        name: String!
        email: String!
        is_admin: Int!
    }

    type Post{
        _id: ID!
        title: String!
        content: String!
        image: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type authData{
        token: String!
        user: User!
        expiration: String!
    }

    type RootMutation{
        signup(userData: UserInputData): Boolean!
        isEmailTaken(email: String!): Boolean!
        createPost(postInput: PostInputData!): Post!
    }

    type RootQuery{
        login(email: String!, password: String!): authData!
        getUserData(token: String!): User!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);