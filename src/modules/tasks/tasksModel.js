import mongoose from 'mongoose';

const { Schema } = mongoose;

const Tasks = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    order: {
        type: Number,
    },
    /*    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    }, */
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
    },
    menteeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId },
    assignedToRole: {
        type: String,
        enum: ['mentor', 'mentee', 'matchSupportSpecialist', 'programManager', 'organizationAdmin', null],
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
    dueDateSetType: {
        type: String,
        enum: ['specificDate', 'dynamic'],
    },
    relativeDueDateOption: {
        type: {
            type: String,
            enum: ['mentoring-connection', 'task'],
        },
        title: {
            type: String,
        },
        taskId: { type: mongoose.Schema.Types.ObjectId },
    },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    completedOn: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    goalId: { type: mongoose.Schema.Types.ObjectId },
    createdBy: mongoose.Schema.Types.ObjectId,
    templateTaskCreatedDate: {
        type: Date,
        default: Date.now,
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

export default mongoose.model('Tasks', Tasks, 'Tasks');
