import mongoose from 'mongoose';

const { Schema } = mongoose;

const Goals = new Schema({
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
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    childOrganizationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    programId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
    },
    createdDate: {
        type: Date,
        default: Date.now,
    },
    updatedDate: {
        type: Date,
        default: Date.now,
    },
    completedDate: {
        type: Date,
        required: false,
    },
});

export default mongoose.model('Goals', Goals, 'Goals');
