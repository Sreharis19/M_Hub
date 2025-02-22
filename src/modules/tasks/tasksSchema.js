import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        getAssignedToList(menteeId: String!): [assignedToReturn]
        getTask(taskId: String!): getTask
        getDueTasks(skip: Int!): [dueTasks]
    }

    type getTask @cacheControl(maxAge: 10) {
        _id: String
        title: String
        attachments: [attachmentData]
        goalId: String
        goalData: goalData
        description: String
        completed: Boolean
        dueDate: String
        assignedTo: String
        assignedToData: assignedToReturn @cacheControl(maxAge: 240)
    }

    type dueTasks {
        _id: ID
        size: Int
    }

    type goalData {
        _id: ID
        title: String
    }

    type assignedToReturn {
        _id: String
        firstName: String
        lastName: String
        profileImage: String
        role: String
    }

    type assignedTaskReturn {
        _id: String
        title: String
        description: String
        assignedTo: String
        completed: Boolean
        assignedToRole: String
        dueDate: String
        attachments: [attachmentsReturn]
    }
    type attachmentsReturn {
        s3URL: String
        type: String
        fileName: String
        extension: String
        status: String
        order: Int
    }
    extend type Mutation {
        editAssignedTask(
            taskId: String!
            title: String
            description: String
            assignedTo: String
            completed: Boolean
            dueDate: String
            goalId: String
            attachments: [attachments]
        ): assignedTaskReturn
        addActivityToGoal(
            goalId: String!
            title: String!
            description: String
            order: Int
            dueDate: String
            assignedTo: String
        ): assignedTaskReturn
        addAssignedActivity(
            milestoneId: String!
            title: String!
            description: String
            goalId: String
            dueDate: String
            assignedTo: String
        ): assignedTaskReturn
    }
`;
