export const batchAgeGroup = async (keys, models) => {
    const ageGroups = await models.ageGroup.find({ _id: { $in: keys } });
    const requestedAgeGroup = keys.map((key) => ageGroups.find((ageGroup) => ageGroup._id.toString() === key));
    return requestedAgeGroup;
};
export const def = {};
