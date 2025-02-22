import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        getAccessiblePrograms(userId: String!, orgId: String, search: String): [Program]
        getAccessibleOrganizations(userId: String!, search: String): [Organization]
    }

    type Organization {
        _id: String
        organizationName: String
    }

    type Program {
        _id: String
        programName: String
    }

    extend type Mutation {
        assignToPrograms(programId: String!, curriculumIds: [String!]!): statusMessage
        assignCurriculumToMentee(menteeId: String!, curriculumId: String!): statusMessage
        unassignFromProgram(programId: String!, curriculumId: String!): statusMessage
    }

    type statusMessage {
        status: Boolean
        message: String
    }
`;
