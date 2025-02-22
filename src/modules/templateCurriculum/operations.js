const getDetails = async (me, loaders, pgmId, organizationId) => {
    let programId;
    let childOrganizationId;
    let parentOrganizationId;
    let masterTemplate;
    switch (me.role[0]) {
        case 'admin':
            masterTemplate = true;
            programId = null;
            childOrganizationId = null;
            parentOrganizationId = null;
            break;
        case 'organizationAdmin':
            masterTemplate = false;
            programId = null;
            childOrganizationId = organizationId;
            parentOrganizationId = me.adminInOrganizations[0].organizationId;
            break;
        case 'childOrganizationAdmin': {
            masterTemplate = false;
            const organization = await loaders.organization.load(organizationId);
            programId = null;
            childOrganizationId = organizationId;
            parentOrganizationId = organization.parentOrganizationId;
            break;
        }
        case 'programManager': {
            masterTemplate = false;
            const program = await loaders.program.load(pgmId);
            const organization = await loaders.organization.load(program.organizationId);
            programId = pgmId;
            childOrganizationId = program.organizationId;
            parentOrganizationId = organization.parentOrganizationId;
            break;
        }
        case 'matchSupportSpecialist': {
            masterTemplate = false;
            const program = await loaders.program.load(pgmId);
            const organization = await loaders.organization.load(program.organizationId);
            programId = pgmId;
            childOrganizationId = program.organizationId;
            parentOrganizationId = organization.parentOrganizationId;
            break;
        }
        default:
            masterTemplate = true;
            programId = null;
            childOrganizationId = null;
            parentOrganizationId = null;
    }
    return {
        masterTemplate,
        programId,
        childOrganizationId,
        parentOrganizationId,
    };
};

export default getDetails;
