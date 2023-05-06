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
    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }
    
    type AuthData {
        token: String!
        userId: String!
    }
    type RootQuery {
        login(email: String!, password: String!): AuthData!
    }

    type RootMutat {
        createUser(inputData: UserInputData): User!
        createPost(postInput: PostInputData): Post!
    }
    schema {
        query: RootQuery
        mutation: RootMutat
    }
`);
