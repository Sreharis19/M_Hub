import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        templateReportNavBar(curriculumId: String!): reportNavBar
        badgeCategoryChart(
            curriculumId: String
            menteeId: String
            orgId: String
            programId: String
            earned: Boolean
        ): [badgeChart]
        badgeEarnedByDateGraph(
            curriculumId: String
            menteeId: String
            programId: String
            startDateISO: String!
            endDateISO: String!
            timezoneString: String!
        ): [dateGraph]
        topTemplates(skip: Int, limit: Int, orgId: String, programId: String): [topTemplates]
    }

    type topTemplates {
        _id: ID
        title: String
        programs: Int
        enrolledMentees: Int
        mentors: Int
    }

    type badgeChart {
        _id: ID
        title: String
        colour: String
        count: Int
    }

    type reportNavBar {
        _id: ID
        programs: Int
        enrolledMentees: Int
        earnedBadges: Int
    }

    type dateGraph {
        _id: String
        count: Int
    }
`;
