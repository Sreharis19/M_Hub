/* eslint-disable import/prefer-default-export */
export const getOrg = (me, orgId) => {
    let organizationId;
    switch (me.role[0]) {
        case 'admin':
            break;
        case 'organizationAdmin':
            if (!orgId) throw new Error('orgId is required');
            organizationId = orgId;
            break;
        case 'childOrganizationAdmin':
            if (!orgId) throw new Error('orgId is required');
            organizationId = orgId;
            break;
        case 'programManager':
            organizationId = me.programManagerInPrograms[0].organizationId;
            break;
        case 'matchSupportSpecialist':
            organizationId = me.matchSupportSpecialistInPrograms[0].organizationId;
            break;
        case 'mentor':
            organizationId = me.mentorInPrograms[0].organizationId;
            break;
        case 'mentee':
            organizationId = me.enrolledInPrograms[0].organizationId;
            break;
        default:
            break;
    }
    return organizationId;
};
