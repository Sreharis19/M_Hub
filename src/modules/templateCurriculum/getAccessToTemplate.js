/* eslint-disable default-case */
export const dat = null;
export const getOrganizationIdsWithAccess = (me) => {
    let organizationIds = [];
    switch (me.role[0]) {
        case 'programManager':
            organizationIds = me.programManagerInPrograms.map((pgm) => pgm.organizationId);
            break;
        case 'childOrganizationAdmin':
            organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
            break;
        case 'organizationAdmin':
            organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
            break;
        case 'matchSupportSpecialist':
            organizationIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.organizationId);
            break;
        case 'mentor':
            organizationIds = me.mentorInPrograms.map((pgm) => pgm.organizationId);
            break;
        case 'mentee':
            organizationIds = me.enrolledInPrograms.map((pgm) => pgm.organizationId);
            break;
    }
    return [...new Set([...organizationIds])];
};
