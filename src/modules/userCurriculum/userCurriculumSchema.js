import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        listGuides(menteeId: String!): [guides]
    }

    type guides {
        _id: String
        title: String
        description: String
        milestones: [milestoneReturn]
        totalBadges: Int
        totalActivities: Int
        grantedBadges: Int
        completedActivities: Int
        pinned: Boolean
    }

    type milestoneReturn {
        _id: String
        title: String
        badgeImage: String
    }

    extend type Mutation {
        pinGuide(guideId: String!, menteeId: String!, pinned: Boolean!): messageReturn
        unAssignGuide(curriculumId: String!): messageReturn
        addGuide(
            title: String
            description: String
            programId: String
            parentOrganizationId: String
            childOrganizationId: String
            gradeId: String
            ageGrpId: String
            programTypeId: String
            guidecategoryId: String
            licenseRequired: Boolean
            evidenceBased: Boolean
            pointsPerTask: Int
            userId: String
            curriculumId: String
            pinned: Boolean
            activeCurriculum: Boolean
        ): messageReturn
    }
`;
