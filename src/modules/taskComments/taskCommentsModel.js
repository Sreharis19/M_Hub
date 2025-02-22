import mongoose from 'mongoose';

const { Schema } = mongoose;

const TaskComments = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true,
    },
    commentText: {
        type: String,
    },
    readStatus: {
        type: Boolean,
        default: false,
        required: true,
    },
    readByUsers: {
        type: [mongoose.Schema.Types.ObjectId],
    },
    childOrganizationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    programId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    milestoneId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
    },
    curriculumId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
    },
    userCurriculumId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
    },
    attachments: [
        {
            s3URL: {
                type: String,
            },
            type: {
                type: String,
            },
            fileName: {
                type: String,
            },
            extension: {
                type: String,
            },
            status: {
                type: Boolean,
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                // required: true,
            },
            createdDate: {
                type: Date,
                default: Date.now,
            },
            updatedDate: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    createdDate: {
        type: Date,
        default: Date.now,
    },
    updatedDate: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('TaskComments', TaskComments, 'TaskComments');
