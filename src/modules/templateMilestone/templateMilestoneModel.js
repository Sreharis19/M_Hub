import mongoose from 'mongoose';

const { Schema } = mongoose;

const TemplateMilestone = new Schema({
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
    badgeImage: {
        type: String,
    },
    order: {
        type: Number,
    },
    curriculumId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    activityBadgeId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
    },
    masterMilestoneId: {
        type: mongoose.Schema.Types.ObjectId,
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
});

export default mongoose.model('TemplateMilestone', TemplateMilestone, 'TemplateMilestone');
