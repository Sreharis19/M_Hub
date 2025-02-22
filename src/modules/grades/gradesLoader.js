export const batchGrades = async (keys, models) => {
    const grades = await models.grades.find({ _id: { $in: keys } });
    const requestedGrades = keys.map((key) => grades.find((grade) => grade._id.toString() === key));
    return requestedGrades;
};
export const def = {};
