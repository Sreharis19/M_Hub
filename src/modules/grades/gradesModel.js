import mongoose from 'mongoose';

const { Schema } = mongoose;

const Grades = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true,
    },
    title: {
        type: String,
    },
    status: {
        type: Boolean,
        default: true,
    },
});

export default mongoose.model('Grades', Grades, 'Grades');
