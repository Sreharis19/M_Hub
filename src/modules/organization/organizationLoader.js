import { getOrganizationData } from '../../lib/fetch';

export const batchOrganization = async (keys) => {
    const organizations = await getOrganizationData({ ids: keys });
    const requestedorganization = keys.map((key) =>
        organizations.find((organization) => organization._id.toString() === key)
    );
    return requestedorganization;
};
export const def = {};
