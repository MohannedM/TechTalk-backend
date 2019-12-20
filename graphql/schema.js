const { buildSchema } = require("graphql");

module.exports = buildSchema(`

    input userInputData{
        name: String!
        email: String!
        password: String!
    }

    type User{
        _id: ID!
        name: String!
        email: String!
        is_admin: Int!
    }

    type authData{
        token: String!,
        user: User!
    }

    type RootMutation{
        signup(userData: userInputData): Boolean!
        isEmailTaken(email: String!): Boolean!
    }

    type RootQuery{
        login(email: String!, password: String!): authData!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);