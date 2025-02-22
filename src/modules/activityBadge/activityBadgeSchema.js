import { gql } from 'apollo-server-express';

export default gql`
    type activityBadge {
        _id: String
        badgeDescription: String
        badgeCategoryId: String
        badgeCategory: String
        badgeImage: String
    }

    input badgeCategoryIds {
        badgeCategoryId: String
    }

    type badgeReturn {
        count: Int
        data: [activityBadge]
    }

    extend type Query {
        listActivityBadge(skip: Int, limit: Int, orgId: String): badgeReturn
        listActivityBadgeByCategory(badgeCategoryIds: [String!]!, orgId: String): badgeReturn
    }

    extend type Mutation {
        createBadge(
            badgeDescription: String
            badgeCategoryId: String!
            badgeImage: String
            orgId: String
        ): activityBadge
        editBadge(
            badgeId: String!
            badgeDescription: String
            badgeCategoryId: String
            badgeImage: String
        ): activityBadge
    }
`;
