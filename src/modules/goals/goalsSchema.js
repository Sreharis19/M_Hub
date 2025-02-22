import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        listGoal(menteeId: String!): [goalsDataMentee]
    }

    type goalsDataMentee {
        _id: String
        title: String
        description: String
        activities: [activitiesDataMentee]
    }

    type activitiesDataMentee {
        _id: String
        title: String
        attachments: [attachmentData]
        description: String
        completed: Boolean
        dueDate: String
        assignedTo: String
        assignedToData: assignedToData
        unreadCommentsCount: Int
        createdBy: String
    }

    type goal {
        _id: String
        title: String
        description: String
        userId: String
        organizationId: String
        childOrganizationId: String
        programId: String
        createdBy: String
    }

    extend type Mutation {
        addGoal(title: String!, description: String, userId: String!): goal
        editGoal(goalId: String!, title: String, description: String): goal
    }
`;
