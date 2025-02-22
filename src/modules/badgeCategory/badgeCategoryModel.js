import mongoose from 'mongoose';

const { Schema } = mongoose;

const BadgeCategory = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true,
    },
    title: {
        type: String,
    },
    colour: { type: String },
    status: {
        type: Boolean,
        default: true,
    },
});

export default mongoose.model('BadgeCategory', BadgeCategory, 'BadgeCategory');
