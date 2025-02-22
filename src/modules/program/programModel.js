import mongoose from 'mongoose';

const { Schema } = mongoose;

const Program = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    programName: String,
    description: String,
});

export default mongoose.model('Program', Program, 'Program');
