const { buildSchema } = require("graphql");

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!

    }
    type User {
        _id: ID!
        name: String!
        email: String!
        password: String!
        status: String!
        posts: [Post!]!
    }
    input UserInputData {
        name: String!
        email: String!
        password: String!
    }

    type RootQuery {
        hello: String
    }

    type RootMutat {
        createUser(inputData: UserInputData): User!
    }
    schema {
        query: RootQuery
        mutation: RootMutat
    }
`);