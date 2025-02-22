import { gql } from 'apollo-server-express';

export default gql`
    type milestoneTemplate {
        _id: String
        curriculumId: String
        title: String
        description: String
        badgeImage: String
    }

    type deleteReturn {
        status: Boolean
        message: String
    }

    extend type Mutation {
        addMilestoneToTemplate(
            curriculumId: String!
            position: Int
            title: String!
            activityBadgeId: String
            description: String
            badgeImage: String
        ): milestoneTemplate
        deleteMilestone(milestoneId: String!): deleteReturn
        editMilestone(
            milestoneId: String!
            title: String!
            activityBadgeId: String
            description: String
            badgeImage: String
        ): milestoneTemplate
    }
`;

// type tasksData {
//     _id: String
//     title: String
//     description: String
//     assignedTo: [String]
//     dueDateSetType: String
//     relativeDueDateOption: relativeDueDate
//     dueDate: String
// }

// type relativeDueDate {
//     type: String
//     title: String
//     taskId: String
// }
