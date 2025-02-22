import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserCurriculumModel = new Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true, required: true },
    title: { type: String },
    description: { type: String },
    licenseRequired: { type: Boolean },
    evidenceBased: { type: Boolean },
    pointsPerTask: { type: Number },
    guidecategoryId: { type: mongoose.Schema.Types.ObjectId },
    gradeId: { type: mongoose.Schema.Types.ObjectId },
    ageGrpId: { type: mongoose.Schema.Types.ObjectId },
    programTypeId: { type: mongoose.Schema.Types.ObjectId },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    childOrganizationId: { type: mongoose.Schema.Types.ObjectId, required: true },
    parentOrganizationId: { type: mongoose.Schema.Types.ObjectId },
    programId: { type: mongoose.Schema.Types.ObjectId, required: true },
    curriculumId: { type: mongoose.Schema.Types.ObjectId, required: true },
    activeCurriculum: { type: Boolean, default: true },
    pinned: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
    },
    pinnedDate: {
        type: Date,
        // default: Date.now,
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

export default mongoose.model('UserCurriculum', UserCurriculumModel, 'UserCurriculum');
