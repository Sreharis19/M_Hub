export const batchProgramType = async (keys, models) => {
    const programTypes = await models.programType.find({ _id: { $in: keys } });
    const requestedProgramTypes = keys.map((key) =>
        programTypes.find((programType) => programType._id.toString() === key)
    );
    return requestedProgramTypes;
};
export const def = {};
