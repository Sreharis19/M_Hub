import mongoose from 'mongoose';

const { Schema } = mongoose;

const TemplateCurriculum = new Schema({
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
    tag: {
        type: String,
        trim: true,
    },
    ageGrpId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    gradeId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    guidecategoryId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    programTypeId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    pointsPerTask: {
        type: Number,
    },
    licenseRequired: {
        type: Boolean,
        default: false,
    },
    evidenceBased: {
        type: Boolean,
        default: false,
    },
    masterTemplate: {
        type: Boolean,
        default: false,
    },
    masterTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
    },
    parentOrganizationId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        //  required: true,
    },
    childOrganizationId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        //  required: true,
    },
    programId: {
        type: mongoose.Schema.Types.ObjectId,
        //  required: true,
    },
    allPgmIds: [{ type: mongoose.Schema.Types.ObjectId, default: [] }],
    assignedPgmIds: [{ type: mongoose.Schema.Types.ObjectId, default: [] }],
    mssIds: [{ type: mongoose.Schema.Types.ObjectId, default: [] }],
    // program: {
    //     _id: {
    //         type: mongoose.Schema.Types.ObjectId,
    //     },
    //     programName: {
    //         type: String,
    //     },
    //     organizationId: {
    //         type: mongoose.Schema.Types.ObjectId,
    //     },
    // },
    // masterTemplateData: {
    //     _id: {
    //         type: mongoose.Schema.Types.ObjectId,
    //     },
    //     title: {
    //         type: String,
    //     },
    // },
    status: {
        type: Boolean,
        default: true,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
    },
    createdByRole: {
        type: String,
        required: true,
    },
    createdDate: {
        type: Date,
        default: Date.now,
    },
    updatedDate: {
        type: Date,
        default: Date.now,
    },
    startDate: {
        type: String,
        required: false,
    },
});

export default mongoose.model('TemplateCurriculum', TemplateCurriculum, 'TemplateCurriculum');
