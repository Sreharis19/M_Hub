import mongoose from 'mongoose';

const { Schema } = mongoose;

const AgeGroup = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true,
    },
    title: {
        type: String,
    },
    startAge: { type: Number },
    endAge: { type: Number },
    status: {
        type: Boolean,
        default: true,
    },
});

export default mongoose.model('AgeGroup', AgeGroup, 'AgeGroup');
