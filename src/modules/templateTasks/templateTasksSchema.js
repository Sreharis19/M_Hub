import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        assignedTo: [String]
    }

    type taskReturn {
        _id: String
        title: String
        description: String
    }
    input attachments {
        s3URL: String
        type: String
        fileName: String
        extension: String
        status: Boolean
        order: Int
    }

    extend type Mutation {
        addTaskToMilestone(
            title: String!
            description: String
            milestoneId: String!
            assignedTo: String
            dueDate: String
            attachments: [attachments]
        ): taskReturn

        editTask(
            taskId: String!
            title: String
            description: String
            assignedTo: String
            dueDate: String
            attachments: [attachments]
        ): taskReturn

        deleteTask(taskId: String!): deleteReturn
    }
`;

// extend type Mutation {
//     addTaskToMilestone(
//         title: String!
//         description: String
//         milestoneId: String!
//         assignedTo: String!
//         dueDateSetType: String!
//         relativeDueDateOption: relativeDueDateOption
//         dueDate: String
//         attachments: [attachments]
//     ): taskReturn

// input relativeDueDateOption {
//     type: String
//     title: String
//     taskId: String
// }
