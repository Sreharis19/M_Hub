import { getUsers } from '../../lib/fetch';

export const batchUsers = async (keys) => {
    const users = await getUsers({ ids: keys });
    const requestedUsers = keys.map((key) => users.find((user) => user._id.toString() === key));
    return requestedUsers;
};
export const def = {};
