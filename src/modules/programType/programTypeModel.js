import mongoose from 'mongoose';

const { Schema } = mongoose;

const ProgramType = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
        required: true,
    },
    title: {
        type: String,
    },
});

export default mongoose.model('ProgramType', ProgramType, 'ProgramType');
