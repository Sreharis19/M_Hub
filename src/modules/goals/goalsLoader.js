export const batchGoals = async (keys, models) => {
    const goals = await models.goals.find({ _id: { $in: keys } });
    const requestedGoals = keys.map((key) => goals.find((goal) => goal._id.toString() === key));
    return requestedGoals;
};
export const def = {};
