import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        badgeListApp(menteeId: String!): [badgeList]
        badgeListAppAllList(menteeId: String!): [badgeList]
        menteeSummary(menteeId: String!, limit: Int): summaryData
        menteeLatestSummary(menteeId: String!, limit: Int): latestSummaryData
    }

    type summaryData {
        badges: [earnedBadges]
        goals: [latestGoals]
    }

    type latestSummaryData {
        badges: [earnedBadges]
        goals: [latestCompletedGoals]
    }

    type latestGoals {
        _id: String
        title: String
        totalActivities: Int
        completedActivities: Int
    }

    type latestCompletedGoals {
        _id: String
        title: String
        completed: Boolean
        goalId: String
    }

    type earnedBadges {
        _id: String
        title: String
        badgeImage: String
    }

    type badgeList {
        _id: String
        title: String
        badgeDescription: String
        badgeImage: String
        guideId: String
        guideName: String
        favourite: Boolean
        totalActivities: Int
        completedActivities: Int
    }

    type milestone {
        _id: String
        title: String
        description: String
        badgeImage: String
        activityBadgeId: String
        favourite: Boolean
    }

    extend type Mutation {
        grantBadge(milestoneId: String!): messageReturn
        addAssignedBadge(
            curriculumId: String!
            menteeId: String!
            title: String!
            activityBadgeId: String!
            position: Int
            description: String
            badgeImage: String
        ): milestone
        editAssignedBadge(
            badgeId: String!
            title: String
            description: String
            badgeImage: String
            activityBadgeId: String
        ): milestone
        favouriteAssignedBadge(badgeId: String!, favourite: Boolean): milestone
    }
`;
