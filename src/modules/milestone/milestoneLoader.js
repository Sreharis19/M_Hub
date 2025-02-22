export const batchMilestone = async (keys, models) => {
    const milestones = await models.milestone.find({ _id: { $in: keys } });
    const requestedMilestones = keys.map((key) => milestones.find((milestone) => milestone._id.toString() === key));
    return requestedMilestones;
};
export const def = {};
