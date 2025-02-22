export const batchGuideCategory = async (keys, models) => {
    const guideCategories = await models.guideCategory.find({ _id: { $in: keys } });
    const requestedGuideCategories = keys.map((key) =>
        guideCategories.find((guideCategory) => guideCategory._id.toString() === key)
    );
    return requestedGuideCategories;
};
export const def = {};
