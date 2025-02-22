import mongoose from 'mongoose';

const { Schema } = mongoose;

const RelativeDateOptions = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true,
    },
    type: {
        type: String,
        enum: ['mentoring-connection', 'task'],
    },
    title: {
        type: String,
    },
});

export default mongoose.model('RelativeDateOptions', RelativeDateOptions, 'RelativeDateOptions');
