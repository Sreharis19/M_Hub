/* eslint-disable quotes */
import { skip, combineResolvers } from 'graphql-resolvers';
import { intersection } from 'ramda';
import { getUserDetail } from '../lib/fetch';
// const objectId = mongoose.Types.ObjectId;

export const isAuthenticated = (root, args, { me }) => (me ? skip : new Error('Not authenticated'));

export const isAdmin = combineResolvers(isAuthenticated, (root, args, { me: { role } }) =>
    role.includes('admin') ? skip : new Error('Not authorized')
);

export const isHubspireUser = async (root, args, { hub }) => (hub ? skip : new Error('Not authorized'));

export const isRoleWithAccessOrganizationalTemplate = combineResolvers(isAuthenticated, (_root, _args, { me }) => {
    if (
        intersection(me.role, [
            'admin',
            'administrator',
            'manager',
            'organizationAdmin',
            'matchSupportSpecialist',
            'childOrganizationAdmin',
            'programManager',
        ]).length > 0
    )
        return skip;
    return new Error('Not authorized');
});

export const hasAccessToOrganizationalCurriculum = combineResolvers(
    isRoleWithAccessOrganizationalTemplate,
    async (_root, { curriculumId }, { models, me }) => {
        const curriculum = await models.templateCurriculum.findById(curriculumId, {
            parentOrganizationId: 1,
            childOrganizationId: 1,
        });
        let organizationIds = [];

        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'administrator':
                return skip;
            case 'manager':
                return skip;
            case 'programManager':
                organizationIds = me.programManagerInPrograms.map((pgm) => pgm.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (organizationIds.includes(curriculum.childOrganizationId.toString())) return skip;
                return new Error('Not authorized');
            case 'childOrganizationAdmin':
                organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (organizationIds.includes(curriculum.childOrganizationId.toString())) return skip;
                return new Error('Not authorized');
            case 'organizationAdmin':
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (organizationIds.includes(curriculum.parentOrganizationId.toString())) return skip;
                return new Error('Not authorized');
            case 'matchSupportSpecialist':
                organizationIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (organizationIds.includes(curriculum.childOrganizationId.toString())) return skip;
                return new Error('Not authorized');
            default:
                return new Error('Not authorized');
        }
    }
);

export const hierarchicalAccessForCurriculumTemplate = combineResolvers(
    isRoleWithAccessOrganizationalTemplate,
    async (_root, { curriculumId }, { models, me }) => {
        const curriculum = await models.templateCurriculum.findById(curriculumId, {
            programId: 1,
            createdBy: 1,
            createdByRole: 1,
            masterTemplate: 1,
            parentOrganizationId: 1,
            childOrganizationId: 1,
        });
        if (!curriculum) throw new Error('Guide not found');
        if (me.id === curriculum.createdBy.toString()) return skip;

        let organizationIds = [];
        let programIds = [];
        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'administrator':
                return skip;
            case 'manager':
                return skip;
            case 'childOrganizationAdmin':
                if (curriculum.masterTemplate) return new Error("You don't have edit access");
                organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(curriculum.childOrganizationId.toString()) &&
                    ['programManager', 'matchSupportSpecialist'].includes(curriculum.createdByRole)
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'organizationAdmin':
                if (curriculum.masterTemplate) return new Error("You don't have edit access");
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(curriculum.parentOrganizationId.toString()) &&
                    ['childOrganizationAdmin', 'programManager', 'matchSupportSpecialist'].includes(
                        curriculum.createdByRole
                    )
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'matchSupportSpecialist':
                if (
                    curriculum.masterTemplate ||
                    curriculum.createdByRole === 'admin' ||
                    curriculum.createdByRole === 'administrator' ||
                    curriculum.createdByRole === 'manager' ||
                    curriculum.createdByRole === 'organizationAdmin' ||
                    curriculum.createdByRole === 'childOrganizationAdmin' ||
                    curriculum.createdByRole === 'programManager'
                )
                    return new Error("You don't have edit access");
                programIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (
                    programIds.includes(curriculum.programId.toString()) &&
                    ['matchSupportSpecialist'].includes(curriculum.createdByRole)
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'programManager':
                if (
                    curriculum.masterTemplate ||
                    curriculum.createdByRole === 'admin' ||
                    curriculum.createdByRole === 'administrator' ||
                    curriculum.createdByRole === 'manager' ||
                    curriculum.createdByRole === 'organizationAdmin' ||
                    curriculum.createdByRole === 'childOrganizationAdmin'
                )
                    return new Error("You don't have edit access");
                programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (
                    programIds.includes(curriculum.programId.toString()) &&
                    ['programManager', 'matchSupportSpecialist'].includes(curriculum.createdByRole)
                )
                    return skip;
                return new Error("You don't have edit access");
            default:
                return new Error("You don't have edit access");
        }
    }
);

export const accessToProgram = combineResolvers(
    isRoleWithAccessOrganizationalTemplate,
    async (_root, { programId, organizationId }, { loaders, me }) => {
        // const programDetails = await loaders.program.load(programId);
        let organizationIds = [];
        let programIds = [];
        let organizationDetails;
        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'administrator':
                return skip;
            case 'manager':
                return skip;
            case 'childOrganizationAdmin':
                if (!organizationId) throw new Error('Not authorized');
                organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (organizationIds.includes(organizationId.toString())) return skip;
                return new Error('Not authorized');
            case 'organizationAdmin':
                if (!organizationId) throw new Error('Not authorized');
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                organizationDetails = await loaders.organization.load(organizationId);
                if (organizationIds.includes(organizationDetails.parentOrganizationId.toString())) return skip;
                return new Error('Not authorized');
            case 'programManager':
                if (!programId) throw new Error('Not authorized');
                programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (programIds.includes(programId)) return skip;
                return new Error('Not authorized');
            case 'matchSupportSpecialist':
                if (!programId) throw new Error('Not authorized');
                programIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (programIds.includes(programId)) return skip;
                return new Error('Not authorized');
            default:
                return new Error('Not authorized');
        }
    }
);

export const accessToMenteeBadgeList = combineResolvers(isAuthenticated, async (parent, { menteeId }, { me }) => {
    let menteeIds = [];
    switch (me.role[0]) {
        case 'admin':
            return skip;
        case 'administrator':
            return skip;
        case 'manager':
            return skip;
        case 'mentor':
            [menteeIds] = me.mentorInPrograms.map((program) => program.menteeIds);
            if (menteeIds.includes(menteeId.toString())) return skip;
            return new Error('Not Authorized');
        case 'mentee':
            if (me.id.toString() === menteeId.toString()) return skip;
            return new Error('Not Authorized');
        default:
            return new Error('Not authorized');
    }
});

export const accessToAddBadge = combineResolvers(isAuthenticated, async (_root, { menteeId }, { loaders, me }) => {
    if (
        !intersection(me.role, [
            'admin',
            'administrator',
            'manager',
            'organizationAdmin',
            'matchSupportSpecialist',
            'childOrganizationAdmin',
            'programManager',
            'mentor',
        ]).length > 0
    )
        return new Error("You don't have edit access");

    const mentee = await getUserDetail({ id: menteeId });
    // const programId = mentee.activeProgram;
    // const enrlPgmObj = mentee.enrolledInPrograms.find((pgm) => mentee.activeProgram === pgm.programId);
    let [menteeOrgId, menteeProgramId] = [
        mentee.enrolledInOrganizations.map((org) => org.organizationId),
        mentee.enrolledInPrograms.map((pgm) => pgm.programId),
    ];
    menteeOrgId = [...new Set([...menteeOrgId])];
    menteeProgramId = [...new Set([...menteeProgramId])];

    let organizationIds = [];
    let programIds = [];
    let menteeIds = [];
    let organizationDetails;
    switch (me.role[0]) {
        case 'admin':
            return skip;
        case 'administrator':
            return skip;
        case 'manager':
            return skip;
        case 'childOrganizationAdmin':
            organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
            organizationIds = [...new Set([...organizationIds])];
            // if (organizationIds.includes(enrlPgmObj.organizationId)) return skip;
            if (intersection(organizationIds, menteeOrgId).length > 0) return skip;
            return new Error("You don't have edit access");
        case 'organizationAdmin':
            organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
            [organizationIds] = [...new Set([...organizationIds])];
            organizationDetails = await loaders.organization.load(menteeOrgId[0]);
            if (organizationIds.includes(organizationDetails.parentOrganizationId)) return skip;
            return new Error("You don't have edit access");
        case 'programManager':
            programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
            programIds = [...new Set([...programIds])];
            // if (programIds.includes(programId)) return skip;
            if (intersection(programIds, menteeProgramId).length > 0) return skip;
            return new Error("You don't have edit access");
        case 'matchSupportSpecialist':
            programIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.programId);
            programIds = [...new Set([...programIds])];
            // if (programIds.includes(programId)) return skip;
            if (intersection(programIds, menteeProgramId).length > 0) return skip;
            return new Error("You don't have edit access");
        case 'mentor':
            [menteeIds] = me.mentorInPrograms.map((program) => program.menteeIds);
            if (menteeIds.includes(menteeId.toString())) return skip;
            return new Error("You don't have edit access");
        case 'mentee':
            if (me.id.toString() === menteeId.toString()) return skip;
            return new Error("You don't have edit access");
        default:
            return new Error("You don't have edit access");
    }
});

export const hierarchicalBadgeEditAccess = combineResolvers(
    isAuthenticated,
    async (parent, { badgeId }, { models, me, loaders }) => {
        if (
            !intersection(me.role, [
                'admin',
                'administrator',
                'manager',
                'organizationAdmin',
                'matchSupportSpecialist',
                'childOrganizationAdmin',
                'programManager',
                'mentor',
            ]).length > 0
        )
            return new Error("You don't have edit access");

        const badge = await models.milestone.findById(badgeId);
        if (me.id === badge.createdBy.toString()) return skip;
        const user = await getUserDetail({ id: badge.createdBy });
        let organizationIds = [];
        let programIds = [];
        let menteeIds = [];
        let organizationDetails;
        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'administrator':
                return skip;
            case 'manager':
                return skip;
            case 'childOrganizationAdmin':
                organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(badge.childOrganizationId.toString()) &&
                    ['programManager', 'matchSupportSpecialist', 'mentor', 'mentee'].includes(user.role[0])
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'organizationAdmin':
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                organizationDetails = await loaders.organization.load(badge.childOrganizationId.toString());
                if (
                    organizationIds.includes(organizationDetails.parentOrganizationId.toString()) &&
                    ['childOrganizationAdmin', 'programManager', 'matchSupportSpecialist', 'mentor', 'mentee'].includes(
                        user.role[0]
                    )
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'programManager':
                programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (
                    programIds.includes(badge.programId.toString()) &&
                    ['programManager', 'matchSupportSpecialist', 'mentor', 'mentee'].includes(user.role[0])
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'matchSupportSpecialist':
                organizationIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(badge.childOrganizationId.toString()) &&
                    ['mentor', 'mentee'].includes(user.role[0])
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'mentor':
                me.mentorInPrograms.forEach((pgm) => menteeIds.push(...pgm.menteeIds));
                menteeIds = [...new Set([...menteeIds])];
                if (menteeIds.includes(badge.menteeId.toString()) && ['mentor', 'mentee'].includes(user.role[0]))
                    return skip;
                return new Error("You don't have edit access");
            default:
                return new Error("You don't have edit access");
        }
    }
);

export const hierarchicalActivityAddAccess = combineResolvers(
    isAuthenticated,
    async (_root, { milestoneId }, { models, me, loaders }) => {
        const milestone = await models.milestone.findById(milestoneId, {
            programId: 1,
            createdBy: 1,
            childOrganizationId: 1,
            menteeId: 1,
        });

        if (me.id === milestone.createdBy.toString()) return skip;
        // const user = await getUserDetail({ id: milestone.createdBy });
        let organizationIds = [];
        let programIds = [];
        let menteeIds = [];
        let organizationDetails;
        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'administrator':
                return skip;
            case 'manager':
                return skip;
            case 'childOrganizationAdmin':
                organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (organizationIds.includes(milestone.childOrganizationId.toString())) return skip;
                return new Error('Not authorized');
            case 'organizationAdmin':
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                organizationDetails = await loaders.organization.load(milestone.childOrganizationId.toString());
                if (organizationIds.includes(organizationDetails.parentOrganizationId.toString())) return skip;
                return new Error('Not authorized');
            case 'programManager':
                programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (programIds.includes(milestone.programId.toString())) return skip;
                return new Error('Not authorized');
            case 'matchSupportSpecialist':
                organizationIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (organizationIds.includes(milestone.childOrganizationId.toString())) return skip;
                return new Error('Not authorized');
            case 'mentor':
                me.mentorInPrograms.forEach((pgm) => menteeIds.push(...pgm.menteeIds));
                menteeIds = [...new Set([...menteeIds])];
                if (menteeIds.includes(milestone.menteeId.toString())) return skip;
                return new Error('Not authorized');
            case 'mentee':
                if (me.id.toString() === milestone.menteeId.toString()) return skip;
                return new Error('Not Authorized');
            default:
                return new Error('Not authorized');
        }
    }
);

export const favouriteBadgeAccess = combineResolvers(
    isAuthenticated,
    async (_root, { badgeId }, { models, me, loaders }) => {
        const milestone = await models.milestone.findById(badgeId, {
            programId: 1,
            createdBy: 1,
            childOrganizationId: 1,
            menteeId: 1,
        });

        if (me.id === milestone.createdBy.toString()) return skip;
        // const user = await getUserDetail({ id: milestone.createdBy });
        let organizationIds = [];
        let programIds = [];
        let menteeIds = [];
        let organizationDetails;
        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'administrator':
                return skip;
            case 'manager':
                return skip;
            case 'childOrganizationAdmin':
                organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (organizationIds.includes(milestone.childOrganizationId.toString())) return skip;
                return new Error('Not authorized');
            case 'organizationAdmin':
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                organizationDetails = await loaders.organization.load(milestone.childOrganizationId.toString());
                if (organizationIds.includes(organizationDetails.parentOrganizationId.toString())) return skip;
                return new Error('Not authorized');
            case 'programManager':
                programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (programIds.includes(milestone.programId.toString())) return skip;
                return new Error('Not authorized');
            case 'matchSupportSpecialist':
                organizationIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (organizationIds.includes(milestone.childOrganizationId.toString())) return skip;
                return new Error('Not authorized');
            case 'mentor':
                me.mentorInPrograms.forEach((pgm) => menteeIds.push(...pgm.menteeIds));
                menteeIds = [...new Set([...menteeIds])];
                if (menteeIds.includes(milestone.menteeId.toString())) return skip;
                return new Error('Not authorized');
            case 'mentee':
                if (me.id.toString() === milestone.menteeId.toString()) return skip;
                return new Error('Not Authorized');
            default:
                return new Error('Not authorized');
        }
    }
);

export const hierarchicalActivityEditAccess = combineResolvers(
    isAuthenticated,
    async (parent, { taskId, goalId, completed }, { models, me, loaders }) => {
        if (goalId) return skip;
        if (completed === true || completed === false) return skip;
        const task = await models.tasks.findById(taskId);
        if (me.id === task.createdBy.toString()) return skip;
        const user = await getUserDetail({ id: task.createdBy });
        let organizationIds = [];
        let programIds = [];
        let menteeIds = [];
        let organizationDetails;
        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'administrator':
                return skip;
            case 'manager':
                return skip;
            case 'childOrganizationAdmin':
                organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(task.childOrganizationId.toString()) &&
                    ['programManager', 'matchSupportSpecialist', 'mentor', 'mentee'].includes(user.role[0])
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'organizationAdmin':
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                organizationDetails = await loaders.organization.load(task.childOrganizationId.toString());
                if (
                    organizationIds.includes(organizationDetails.parentOrganizationId.toString()) &&
                    ['childOrganizationAdmin', 'programManager', 'matchSupportSpecialist', 'mentor', 'mentee'].includes(
                        user.role[0]
                    )
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'programManager':
                programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (
                    programIds.includes(task.programId.toString()) &&
                    ['programManager', 'matchSupportSpecialist', 'mentor', 'mentee'].includes(user.role[0])
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'matchSupportSpecialist':
                organizationIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(task.childOrganizationId.toString()) &&
                    ['mentor', 'mentee'].includes(user.role[0])
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'mentor':
                me.mentorInPrograms.forEach((pgm) => menteeIds.push(...pgm.menteeIds));
                menteeIds = [...new Set([...menteeIds])];
                if (menteeIds.includes(task.menteeId.toString()) && ['mentor', 'mentee'].includes(user.role[0]))
                    return skip;
                return new Error("You don't have edit access");
            case 'mentee':
                if (me.id.toString() === task.createdBy.toString()) return skip;
                return new Error("You don't have edit access");
            default:
                return new Error("You don't have edit access");
        }
    }
);

export const accessToAddGoal = combineResolvers(isAuthenticated, async (_root, { userId }, { loaders, me }) => {
    if (
        !intersection(me.role, [
            'admin',
            'administrator',
            'manager',
            'organizationAdmin',
            'matchSupportSpecialist',
            'childOrganizationAdmin',
            'programManager',
            'mentor',
            'mentee',
        ]).length > 0
    )
        return new Error('Not authorized');

    const mentee = await getUserDetail({ id: userId });
    // const programId = mentee.activeProgram;
    // const enrlPgmObj = mentee.enrolledInPrograms.find((pgm) => mentee.activeProgram === pgm.programId);
    let [menteeOrgId, menteeProgramId] = [
        mentee.enrolledInOrganizations.map((org) => org.organizationId),
        mentee.enrolledInPrograms.map((pgm) => pgm.programId),
    ];
    menteeOrgId = [...new Set([...menteeOrgId])];
    menteeProgramId = [...new Set([...menteeProgramId])];

    let organizationIds = [];
    let programIds = [];
    let menteeIds = [];
    let organizationDetails;
    switch (me.role[0]) {
        case 'admin':
            return skip;
        case 'administrator':
            return skip;
        case 'manager':
            return skip;
        case 'childOrganizationAdmin':
            organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
            organizationIds = [...new Set([...organizationIds])];
            // if (organizationIds.includes(enrlPgmObj.organizationId)) return skip;
            if (intersection(organizationIds, menteeOrgId).length > 0) return skip;
            return new Error('Not authorized');
        case 'organizationAdmin':
            organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
            [organizationIds] = [...new Set([...organizationIds])];
            organizationDetails = await loaders.organization.load(menteeOrgId[0]);
            if (organizationIds.includes(organizationDetails.parentOrganizationId)) return skip;
            return new Error('Not authorized');
        case 'matchSupportSpecialist':
            programIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.programId);
            programIds = [...new Set([...programIds])];
            // if (programIds.includes(programId)) return skip;
            if (intersection(programIds, menteeProgramId).length > 0) return skip;
            return new Error('Not authorized');
        case 'programManager':
            programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
            programIds = [...new Set([...programIds])];
            // if (programIds.includes(programId)) return skip;
            if (intersection(programIds, menteeProgramId).length > 0) return skip;
            return new Error('Not authorized');
        case 'mentor':
            [menteeIds] = me.mentorInPrograms.map((program) => program.menteeIds);
            if (menteeIds.includes(userId.toString())) return skip;
            return new Error('Not Authorized');
        case 'mentee':
            if (me.id.toString() === userId.toString()) return skip;
            return new Error('Not Authorized');
        default:
            return new Error('Not authorized');
    }
});

export const hierarchicalGoalEditAccess = combineResolvers(
    isAuthenticated,
    async (parent, { goalId }, { models, me, loaders }) => {
        if (
            !intersection(me.role, [
                'admin',
                'administrator',
                'manager',
                'organizationAdmin',
                'matchSupportSpecialist',
                'childOrganizationAdmin',
                'programManager',
                'mentor',
                'mentee',
            ]).length > 0
        )
            return new Error("You don't have edit access");

        const goal = await models.goals.findById(goalId);
        if (me.id === goal.createdBy.toString()) return skip;
        const user = await loaders.user.load(goal.createdBy.toString());
        let organizationIds = [];
        let programIds = [];
        let menteeIds = [];
        let organizationDetails;
        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'administrator':
                return skip;
            case 'manager':
                return skip;
            case 'childOrganizationAdmin':
                organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(goal.childOrganizationId.toString()) &&
                    ['programManager', 'matchSupportSpecialist', 'mentor', 'mentee'].includes(user.role[0])
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'organizationAdmin':
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                organizationDetails = await loaders.organization.load(goal.childOrganizationId.toString());
                if (
                    organizationIds.includes(organizationDetails.parentOrganizationId.toString()) &&
                    ['childOrganizationAdmin', 'programManager', 'matchSupportSpecialist', 'mentor', 'mentee'].includes(
                        user.role[0]
                    )
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'programManager':
                programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (
                    programIds.includes(goal.programId.toString()) &&
                    ['programManager', 'matchSupportSpecialist', 'mentor', 'mentee'].includes(user.role[0])
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'matchSupportSpecialist':
                organizationIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(goal.childOrganizationId.toString()) &&
                    ['mentor', 'mentee'].includes(user.role[0])
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'mentor':
                me.mentorInPrograms.forEach((pgm) => menteeIds.push(...pgm.menteeIds));
                menteeIds = [...new Set([...menteeIds])];
                if (menteeIds.includes(goal.userId.toString()) && ['mentor', 'mentee'].includes(user.role[0]))
                    return skip;
                return new Error("You don't have edit access");
            case 'mentee':
                if (me.id.toString() === goal.createdBy.toString()) return skip;
                return new Error("You don't have edit access");
            default:
                return new Error("You don't have edit access");
        }
    }
);

export const accessToMentee = combineResolvers(
    // isRoleWithAccessOrganizationalTemplate,
    async (_root, { menteeId }, { loaders, me }) => {
        const mentee = await getUserDetail({ id: menteeId });
        // const programId = mentee.activeProgram;
        // const enrlPgmObj = mentee.enrolledInPrograms.find((pgm) => mentee.activeProgram === pgm.programId);
        let [menteeOrgId, menteeProgramId] = [
            mentee.enrolledInOrganizations.map((org) => org.organizationId),
            mentee.enrolledInPrograms.map((pgm) => pgm.programId),
        ];
        menteeOrgId = [...new Set([...menteeOrgId])];
        menteeProgramId = [...new Set([...menteeProgramId])];

        let organizationIds = [];
        let programIds = [];
        let menteeIds = [];
        let organizationDetails;
        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'administrator':
                return skip;
            case 'manager':
                return skip;
            case 'childOrganizationAdmin':
                organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                // if (organizationIds.includes(enrlPgmObj.organizationId)) return skip;
                if (intersection(organizationIds, menteeOrgId).length > 0) return skip;
                return new Error('Not authorized');
            case 'organizationAdmin':
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
                [organizationIds] = [...new Set([...organizationIds])];
                organizationDetails = await loaders.organization.load(menteeOrgId[0]);
                if (organizationIds.includes(organizationDetails.parentOrganizationId)) return skip;
                return new Error('Not authorized');
            case 'matchSupportSpecialist':
                programIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (intersection(programIds, menteeProgramId).length > 0) return skip;
                return new Error('Not authorized');
            case 'programManager':
                programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                // if (programIds.includes(programId)) return skip;
                if (intersection(programIds, menteeProgramId).length > 0) return skip;
                return new Error('Not authorized');
            case 'mentor':
                [menteeIds] = me.mentorInPrograms.map((program) => program.menteeIds);
                if (menteeIds.includes(menteeId.toString())) return skip;
                return new Error('Not Authorized');
            case 'mentee':
                if (me.id.toString() === menteeId.toString()) return skip;
                return new Error('Not Authorized');
            default:
                return new Error('Not authorized');
        }
    }
);

export const accessToMenteeLessionPlan = combineResolvers(async (_root, { menteeId }, { loaders, models, me }) => {
    const menteeCurriculum = await models.userCurriculum.findOne(
        { userId: menteeId, activeCurriculum: true },
        { programId: 1, childOrganizationId: 1, parentOrganizationId: 1 }
    );

    if (
        !intersection(me.role, [
            'admin',
            'administrator',
            'manager',
            'organizationAdmin',
            'matchSupportSpecialist',
            'childOrganizationAdmin',
            'programManager',
            'mentor',
            'mentee',
        ]).length > 0
    )
        return new Error('Not authorized');

    let organizationIds = [];
    let mentorsMenteeIds = [];
    let menteeIds = [];
    let programIds = [];
    let organizationDetails;

    switch (me.role[0]) {
        case 'admin':
            return skip;
        case 'administrator':
            return skip;
        case 'manager':
            return skip;
        case 'childOrganizationAdmin':
            organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
            organizationIds = [...new Set([...organizationIds])];
            if (organizationIds.includes(menteeCurriculum.childOrganizationId.toString())) return skip;
            return new Error('Not authorized');
        case 'organizationAdmin':
            organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
            organizationIds = [...new Set([...organizationIds])];
            organizationDetails = await loaders.organization.load(menteeCurriculum.childOrganizationId.toString());
            if (organizationIds.includes(organizationDetails.parentOrganizationId.toString())) return skip;
            return new Error('Not authorized');
        case 'programManager':
            programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
            programIds = [...new Set([...programIds])];
            if (programIds.includes(menteeCurriculum.programId.toString())) return skip;
            return new Error('Not authorized');
        case 'matchSupportSpecialist':
            me.matchSupportSpecialistInPrograms.forEach((pgm) => menteeIds.push(...pgm.menteeIds));
            menteeIds = [...new Set([...menteeIds])];
            if (menteeIds.includes(menteeId)) return skip;
            return new Error('Not authorized');
        case 'mentor':
            me.mentorInPrograms.forEach((pgm) => mentorsMenteeIds.push(...pgm.menteeIds));
            mentorsMenteeIds = [...new Set([...mentorsMenteeIds])];
            if (mentorsMenteeIds.includes(menteeId)) return skip;
            return new Error('Not authorized');
        case 'mentee':
            if (me.id === menteeId) return skip;
            return new Error('Not authorized');
        default:
            return new Error('Not authorized');
    }
});

export const edtDelMile = combineResolvers(
    isRoleWithAccessOrganizationalTemplate,
    async (_root, { milestoneId }, { models, me }) => {
        const milestone = await models.templateMilestone.findById(milestoneId, { curriculumId: 1, createdBy: 1 });

        if (milestone.createdBy && me.id === milestone.createdBy.toString()) return skip;
        const user = await getUserDetail({ id: milestone.createdBy });
        const curriculum = await models.templateCurriculum.findById(milestone.curriculumId, {
            programId: 1,
            createdBy: 1,
            createdByRole: 1,
            parentOrganizationId: 1,
            childOrganizationId: 1,
            masterTemplate: 1,
        });

        let organizationIds = [];
        let programIds = [];
        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'administrator':
                return skip;
            case 'manager':
                return skip;
            case 'childOrganizationAdmin':
                if (
                    user.role.includes('admin') ||
                    user.role.includes('administrator') ||
                    user.role.includes('manager') ||
                    user.role.includes('organizationAdmin')
                )
                    return new Error("You don't have edit access");
                organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(curriculum.childOrganizationId.toString()) &&
                    ['programManager', 'matchSupportSpecialist'].includes(curriculum.createdByRole)
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'organizationAdmin':
                if (user.role.includes('admin') || user.role.includes('administrator') || user.role.includes('manager'))
                    return new Error("You don't have edit access");
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(curriculum.parentOrganizationId.toString()) &&
                    ['childOrganizationAdmin', 'programManager', 'matchSupportSpecialist'].includes(
                        curriculum.createdByRole
                    )
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'programManager':
                if (
                    user.role.includes('admin') ||
                    user.role.includes('administrator') ||
                    user.role.includes('manager') ||
                    user.role.includes('organizationAdmin') ||
                    user.role.includes('childOrganizationAdmin')
                )
                    return new Error("You don't have edit access");
                programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (
                    programIds.includes(curriculum.programId.toString()) &&
                    ['programManager', 'matchSupportSpecialist'].includes(curriculum.createdByRole)
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'matchSupportSpecialist':
                if (
                    user.role.includes('admin') ||
                    user.role.includes('administrator') ||
                    user.role.includes('manager') ||
                    user.role.includes('organizationAdmin') ||
                    user.role.includes('childOrganizationAdmin') ||
                    user.role.includes('programManager')
                )
                    return new Error("You don't have edit access");
                programIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (
                    programIds.includes(curriculum.programId.toString()) &&
                    ['matchSupportSpecialist'].includes(curriculum.createdByRole)
                )
                    return skip;
                return new Error("You don't have edit access");
            default:
                return new Error("You don't have edit access");
        }
    }
);

export const edtDelTsk = combineResolvers(
    isRoleWithAccessOrganizationalTemplate,
    async (_root, { taskId }, { models, me }) => {
        const task = await models.templateTasks.findById(taskId, { curriculumId: 1, createdBy: 1 });

        if (task.createdBy && me.id === task.createdBy.toString()) return skip;
        const user = await getUserDetail({ id: task.createdBy });

        const curriculum = await models.templateCurriculum.findById(task.curriculumId, {
            programId: 1,
            createdBy: 1,
            createdByRole: 1,
            parentOrganizationId: 1,
            childOrganizationId: 1,
        });

        let organizationIds = [];
        let programIds = [];
        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'administrator':
                return skip;
            case 'manager':
                return skip;
            case 'childOrganizationAdmin':
                if (
                    user.role.includes('admin') ||
                    user.role.includes('administrator') ||
                    user.role.includes('manager') ||
                    user.role.includes('organizationAdmin')
                )
                    return new Error("You don't have edit access");
                organizationIds = me.adminInChildOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(curriculum.childOrganizationId.toString()) &&
                    ['programManager', 'matchSupportSpecialist'].includes(curriculum.createdByRole)
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'organizationAdmin':
                if (user.role.includes('admin') || user.role.includes('administrator') || user.role.includes('manager'))
                    return new Error("You don't have edit access");
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId);
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(curriculum.parentOrganizationId.toString()) &&
                    ['childOrganizationAdmin', 'programManager', 'matchSupportSpecialist'].includes(
                        curriculum.createdByRole
                    )
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'programManager':
                if (
                    user.role.includes('admin') ||
                    user.role.includes('administrator') ||
                    user.role.includes('manager') ||
                    user.role.includes('organizationAdmin') ||
                    user.role.includes('childOrganizationAdmin')
                )
                    return new Error("You don't have edit access");
                programIds = me.programManagerInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (
                    programIds.includes(curriculum.programId.toString()) &&
                    ['programManager', 'matchSupportSpecialist'].includes(curriculum.createdByRole)
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'matchSupportSpecialist':
                if (
                    user.role.includes('admin') ||
                    user.role.includes('administrator') ||
                    user.role.includes('manager') ||
                    user.role.includes('organizationAdmin') ||
                    user.role.includes('childOrganizationAdmin') ||
                    user.role.includes('programManager')
                )
                    return new Error("You don't have edit access");
                programIds = me.matchSupportSpecialistInPrograms.map((pgm) => pgm.programId);
                programIds = [...new Set([...programIds])];
                if (
                    programIds.includes(curriculum.programId.toString()) &&
                    ['matchSupportSpecialist'].includes(curriculum.createdByRole)
                )
                    return skip;
                return new Error("You don't have edit access");
            default:
                return new Error("You don't have edit access");
        }
    }
);

export const accessToEditActivityBadge = combineResolvers(
    isAuthenticated,
    async (parent, { badgeId }, { me, models }) => {
        if (!intersection(me.role, ['admin', 'organizationAdmin', 'childOrganizationAdmin']).length > 0)
            return new Error("You don't have edit access");

        const activityBadge = await models.activityBadge.findById(badgeId);
        if (me.id === activityBadge.createdBy) return skip;

        let organizationIds = [];

        switch (me.role[0]) {
            case 'admin':
                return skip;
            case 'organizationAdmin':
                if (activityBadge.createdByRole === 'admin') return new Error("You don't have edit access");
                organizationIds = me.adminInOrganizations.map((org) => org.organizationId.toString());
                organizationIds = [...new Set([...organizationIds])];
                if (
                    organizationIds.includes(activityBadge.parentOrganizationId.toString()) &&
                    ['childOrganizationAdmin'].includes(activityBadge.createdByRole)
                )
                    return skip;
                return new Error("You don't have edit access");
            case 'childOrganizationAdmin':
                if (me.id.toString() === activityBadge.createdBy.toString()) return skip;
                return new Error("You don't have edit access");
            default:
                return new Error("You don't have edit access");
        }
    }
);

// export const hasPmAccessToTheOrganization = (_root, args, { models,me }) => {
//     let programIds = [...new Set(me.programManagerInPrograms.map(pgm=>pgm.programId))]
//     let exists = await models.templateCurriculum.exists({curriculumId:args.curriculumId,programIds:{$in:programIds}})
//      return exists? skip : new Error('Not authorized')
// }

// export const isMeetingOwner = async (root, { meetingId }, { models, me }) => {
//     const record = await models.meeting.exists({ _id: objectId(meetingId), createdBy: objectId(me.username) });
//     return !record ? new Error('Not authorized') : skip;
// };
