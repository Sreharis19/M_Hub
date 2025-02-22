export const batchCurriculumTemplates = async (keys, models) => {
    const curriculumTemplates = await models.templateCurriculum.find({ _id: { $in: keys } }).lean();
    const requestedTemplates = keys.map((key) =>
        curriculumTemplates.find((curriculumTemplate) => curriculumTemplate._id.toString() === key)
    );
    return requestedTemplates;
};
export const def = {};
