export const batchUserCurriculum = async (keys, models) => {
    const userCurriculum = await models.userCurriculum.find({ _id: { $in: keys } }).lean();
    const requestedCurriculum = keys.map((key) =>
        userCurriculum.find((curriculum) => curriculum._id.toString() === key)
    );
    return requestedCurriculum;
};
export const def = {};
