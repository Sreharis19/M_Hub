/* eslint-disable import/prefer-default-export */
/* eslint-disable no-console */
export const assignedToCheck = (user, task) => {
    let menteeIds = [];
    let programIds = [];
    console.log('user', user);
    switch (user.role[0]) {
        case 'mentee':
            if (user.id.toString() === task.menteeId.toString()) return null;
            throw new Error('Unauthorized');
        case 'matchSupportSpecialist':
            user.matchSupportSpecialistInPrograms.forEach((pgm) => menteeIds.push(...pgm.menteeIds));
            menteeIds = [...new Set([...menteeIds])];
            if (menteeIds.includes(task.menteeId.toString())) return null;
            throw new Error('Unauthorized');
        case 'mentor':
            user.mentorInPrograms.forEach((program) => {
                if (program.menteeIds.includes(task.menteeId.toString())) return null;
                throw new Error('Unauthorized');
            });
            break;
        case 'programManager':
            programIds = user.programManagerInPrograms.map((pgm) => pgm.programId);
            programIds = [...new Set([...programIds])];
            if (programIds.includes(task.programId.toString())) return null;
            throw new Error('Unauthorized');
        // case 'childOrganizationAdmin':
        //     if (user.adminInChildOrganizationIds.includes(task.childOrganizationId.toString())) return null;
        //     throw new Error('Unauthorized');
        // case 'organizationAdmin':
        //     console.log('orgDetail', orgDetail);
        //     if (user.adminInOrganizationIds.includes(orgDetail.parentOrganizationId.toString())) return null;
        //     throw new Error('Unauthorized');
        default:
            throw new Error('Unauthorized');
    }
    return null;
};

export const grantBadge = async (milestoneId, models, me, type) => {
    const milestone = await models.milestone.findById(milestoneId);
    milestone.isBadgeGranted = true;
    milestone.badgeGrantedBy = me.id;
    milestone.badgeGrantedTime = new Date();
    if (type === 'button') milestone.grantedByGrantButton = true;
    else milestone.grantedByGrantButton = false;
    milestone.updatedDate = new Date();
    milestone.save();
};

export const getRoles = (mentee) => {
    const people = [];
    // if (
    //     me.role[0] === 'admin' ||
    //     me.role[0] === 'organizationAdmin' ||
    //     me.role[0] === 'childOrganizationAdmin' ||
    //     me.role[0] === 'matchSupportSpecialist' ||
    //     me.role[0] === 'programManager'
    // ) {
    mentee.enrolledInPrograms.forEach((program) => {
        people.push(program.mentorId);
        people.push(program.programManagerId);
        people.push(program.matchSupportSpecialistId);
    });
    // } else if (me.role[0] === 'mentor') {
    //     mentee.enrolledInPrograms.forEach((program) => {
    //         people.push(program.mentorId);
    //     });
    // }
    return people;
};
