import mongoose from 'mongoose';

const { Schema } = mongoose;

const ActivityBadge = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        auto: true,
    },
    // title: {
    //     type: String,
    //     required: true,
    // },
    badgeDescription: {
        type: String,
    },
    badgeCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    badgeImage: {
        type: String,
    },
    childOrgId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    parentOrgId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
    },
    createdByRole: {
        type: String,
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

export default mongoose.model('ActivityBadge', ActivityBadge, 'ActivityBadge');
