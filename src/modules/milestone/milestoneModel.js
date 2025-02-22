import mongoose from 'mongoose';

const { Schema } = mongoose;

const Milestone = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true,
    },
    title: {
        type: String,
        // required: true,
    },
    description: {
        type: String,
    },
    badgeImage: {
        type: String,
    },
    order: {
        type: Number,
    },
    isBadgeGranted: {
        type: Boolean,
        default: false,
    },
    badgeGrantedBy: {
        type: mongoose.Schema.Types.ObjectId,
    },
    badgeGrantedTime: {
        type: Date,
    },
    grantedByGrantButton: {
        type: Boolean,
    },
    favourite: {
        type: Boolean,
        default: false,
    },
    favouriteDate: {
        type: Date,
        default: null,
    },
    /* organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    }, */
    templateMilestoneId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    childOrganizationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    programId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    curriculumId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    userCurriculumId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    menteeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    activityBadgeId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    assignedToRole: { type: String, enum: ['mentor', 'mentee', 'matchSupportSpecialist', 'programManager'] },
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

export default mongoose.model('Milestone', Milestone, 'Milestone');
