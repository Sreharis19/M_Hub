import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        listRelativeDateOptions(curriculumId: String!): [relativeDateOptions]
    }

    type relativeDateOptions {
        _id: String
        type: String
        title: String
        milestones: [milestoneReturn]
    }

    type milestoneReturn {
        _id: String
        title: String
        tasks: [tasksReturn]
    }

    type tasksReturn {
        _id: String
        title: String
    }
`;
