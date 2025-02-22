import { getProgramData } from '../../lib/fetch';

export const batchProgram = async (keys) => {
    const programs = await getProgramData({ ids: keys });
    const requestedProgram = keys.map((key) => programs.find((program) => program._id.toString() === key));
    return requestedProgram;
};
export const def = {};
