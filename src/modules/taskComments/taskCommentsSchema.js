import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        listCommentsForATask(taskId: String!, skip: Int, limit: Int): listComments
    }

    type listComments {
        count: Int
        data: [commentList]
    }

    type commentList {
        _id: String
        commentText: String
        readStatus: Boolean
        attachments: [attachmentsData]
        senderId: String
        senderFirstName: String
        senderLastName: String
        senderProfileImage: String
        createdBy: String
        createdDate: String
        updatedDate: String
    }

    type comments {
        _id: String
        commentText: String
        readStatus: Boolean
        childOrganizationId: String
        programId: String
        milestoneId: String
        curriculumId: String
        taskId: String
        senderId: String
        attachments: [attachmentsData]
        createdBy: String
    }

    extend type Mutation {
        addComment(taskId: String!, commentText: String, attachments: [attachments]): comments
        editComment(commentId: String!, commentText: String, attachments: [attachments]): comments
        markAsRead(taskId: String!): messageReturn
    }

    type messageReturn {
        status: Boolean
        message: String
    }

    type attachmentsData {
        s3URL: String
        type: String
        fileName: String
        extension: String
        status: String
        createdBy: String
    }
`;
