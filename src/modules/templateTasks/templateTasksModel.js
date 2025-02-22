import mongoose from 'mongoose';

const { Schema } = mongoose;

const TemplateTasks = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    order: {
        type: Number,
    },
    milestoneId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    curriculumId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    masterTaskId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    assignedTo: {
        type: String,
        enum: ['mentor', 'mentee', 'matchSupportSpecialist', 'programManager', 'organizationAdmin'],
    },
    attachments: [
        {
            s3URL: {
                type: String,
                required: true,
            },
            type: {
                type: String,
            },
            status: {
                type: Boolean,
                required: true,
            },
            order: Number,
            createdBy: mongoose.Schema.Types.ObjectId,
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
    createdBy: mongoose.Schema.Types.ObjectId,
    createdDate: {
        type: Date,
        default: Date.now,
    },
    updatedDate: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('TemplateTasks', TemplateTasks, 'TemplateTasks');
