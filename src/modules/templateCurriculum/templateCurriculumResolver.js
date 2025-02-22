/* eslint-disable prefer-const */
/* eslint-disable no-console */
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { combineResolvers } from 'graphql-resolvers';
import mongoose from 'mongoose';
import {
    isRoleWithAccessOrganizationalTemplate,
    accessToProgram,
    // hasAccessToOrganizationalCurriculum,
    hierarchicalAccessForCurriculumTemplate,
    accessToMentee,
    isAuthenticated,
} from '../auth';
import { getOrganizationIdsWithAccess } from './getAccessToTemplate';
import getDetails from './operations';
import { cloneTemplate, updateMilestones } from './cloneTemplate';

export default {
    Query: {
        listCurriculumTemplates: combineResolvers(
            isRoleWithAccessOrganizationalTemplate,
            async (
                parent,
                { skip, limit, search, gradeId, ageGrpId, guidecategoryId, programTypeId, pgmId, organizationId },
                { models }
            ) => {
                try {
                    const skipDocs = skip || 0;
                    const limitDocs = limit || 10;
                    const pipeline = [];
                    const andCond = [];
                    const arg = {};

                    if (gradeId) {
                        andCond.push({ gradeId: mongoose.Types.ObjectId(gradeId) });
                        Object.assign(arg, { gradeId });
                    }

                    if (ageGrpId) {
                        andCond.push({ ageGrpId: mongoose.Types.ObjectId(ageGrpId) });
                        Object.assign(arg, { ageGrpId });
                    }

                    if (pgmId) {
                        andCond.push({ programId: mongoose.Types.ObjectId(pgmId) });
                        Object.assign(arg, { programId: pgmId });
                    }

                    if (guidecategoryId) {
                        andCond.push({ guidecategoryId: mongoose.Types.ObjectId(guidecategoryId) });
                        Object.assign(arg, { guidecategoryId });
                    }

                    if (programTypeId) {
                        andCond.push({ programTypeId: mongoose.Types.ObjectId(programTypeId) });
                        Object.assign(arg, { programTypeId });
                    }

                    if (organizationId) {
                        andCond.push({ childOrganizationId: mongoose.Types.ObjectId(organizationId) });
                        Object.assign(arg, { childOrganizationId: organizationId });
                    }

                    if (search) {
                        const cleanSearch = search.trim().replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&');
                        andCond.push({
                            $or: [
                                { title: { $regex: `^${cleanSearch}.*`, $options: 'i' } },
                                { title: { $regex: `.*${cleanSearch}.*`, $options: 'i' } },
                            ],
                        });
                        Object.assign(arg, {
                            $or: [
                                { title: { $regex: `^${cleanSearch}.*`, $options: 'i' } },
                                { title: { $regex: `.*${cleanSearch}.*`, $options: 'i' } },
                            ],
                        });
                    }

                    if (andCond.length > 0) pipeline.push({ $match: { $and: andCond } });
                    pipeline.push(
                        { $sort: { createdDate: -1 } },
                        { $skip: skipDocs },
                        { $limit: limitDocs },
                        {
                            $lookup: {
                                from: 'TemplateMilestone',
                                let: { curriculumId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$curriculumId', '$$curriculumId'] } } },
                                    { $project: { _id: 1 } },
                                ],
                                as: 'badges',
                            },
                        },
                        { $set: { badges: { $size: '$badges' } } },
                        {
                            $lookup: {
                                from: 'TemplateTasks',
                                let: { curriculumId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$curriculumId', '$$curriculumId'] } } },
                                    { $project: { _id: 1 } },
                                ],
                                as: 'activities',
                            },
                        },
                        { $set: { activities: { $size: '$activities' } } }
                    );

                    const [getCurriculumTemplate, length] = await Promise.all([
                        models.templateCurriculum.aggregate(pipeline),
                        models.templateCurriculum.countDocuments(arg),
                    ]);
                    return {
                        length,
                        data: getCurriculumTemplate,
                    };
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
        listMasterTemplates: combineResolvers(
            isRoleWithAccessOrganizationalTemplate,
            async (
                parent,
                { skip, limit, search, gradeId, ageGrpId, guidecategoryId, programTypeId, pgmId, childOrgId },
                { models, me, loaders }
            ) => {
                try {
                    const skipDocs = skip || 0;
                    const limitDocs = limit || 10;

                    let parentOrgIds = [];
                    const organizationIds = getOrganizationIdsWithAccess(me);

                    if (me.role.includes('organizationAdmin')) parentOrgIds = [...new Set([...organizationIds])];
                    else if (
                        me.role.includes('programManager') ||
                        me.role.includes('childOrganizationAdmin') ||
                        me.role.includes('matchSupportSpecialist')
                    ) {
                        const organizations = await loaders.organization.loadMany([...new Set([...organizationIds])]);
                        parentOrgIds = [...new Set([...organizations.map((org) => org.parentOrganizationId)])];
                    }

                    const parentOrg = parentOrgIds.map((id) => mongoose.Types.ObjectId(id));
                    let childOrg = [];
                    if (me.role.includes('organizationAdmin')) childOrg.push(mongoose.Types.ObjectId(childOrgId));
                    else childOrg = organizationIds.map((id) => mongoose.Types.ObjectId(id));

                    if (!me.role.includes('admin') && parentOrgIds.length < 1) throw new Error('Not authorized');

                    const pipeline = [];
                    const andCond = [];
                    const andCondAdmin = [];
                    andCond.push(
                        { parentOrganizationId: { $in: parentOrg } },
                        { childOrganizationId: { $in: childOrg } },
                        { masterTemplate: true }
                    );

                    andCondAdmin.push({ createdByRole: 'admin' }, { masterTemplate: true });
                    if (gradeId) {
                        andCond.push({ gradeId: mongoose.Types.ObjectId(gradeId) });
                        andCondAdmin.push({ gradeId: mongoose.Types.ObjectId(gradeId) });
                    }
                    if (ageGrpId) {
                        andCond.push({ ageGrpId: mongoose.Types.ObjectId(ageGrpId) });
                        andCondAdmin.push({ ageGrpId: mongoose.Types.ObjectId(ageGrpId) });
                    }
                    if (guidecategoryId) {
                        andCond.push({ guidecategoryId: mongoose.Types.ObjectId(guidecategoryId) });
                        andCondAdmin.push({ guidecategoryId: mongoose.Types.ObjectId(guidecategoryId) });
                    }
                    if (programTypeId) {
                        andCond.push({ programTypeId: mongoose.Types.ObjectId(programTypeId) });
                        andCondAdmin.push({ programTypeId: mongoose.Types.ObjectId(programTypeId) });
                    }

                    if (pgmId) andCond.push({ programId: mongoose.Types.ObjectId(pgmId) });

                    if (search) {
                        const cleanSearch = search.trim().replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&');
                        andCond.push({
                            $or: [
                                { title: { $regex: `^${cleanSearch}.*`, $options: 'i' } },
                                { title: { $regex: `.*${cleanSearch}.*`, $options: 'i' } },
                            ],
                        });
                        andCondAdmin.push({
                            $or: [
                                { title: { $regex: `^${cleanSearch}.*`, $options: 'i' } },
                                { title: { $regex: `.*${cleanSearch}.*`, $options: 'i' } },
                            ],
                        });
                    }

                    pipeline.push(
                        {
                            $match: {
                                $or: [{ $and: andCond }, { $and: andCondAdmin }],
                            },
                        },
                        // { $match: { $and: andCond } },
                        { $sort: { createdDate: -1 } },
                        { $skip: skipDocs },
                        { $limit: limitDocs },
                        {
                            $lookup: {
                                from: 'TemplateMilestone',
                                let: { curriculumId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$curriculumId', '$$curriculumId'] } } },
                                    { $project: { _id: 1 } },
                                ],
                                as: 'badges',
                            },
                        },
                        { $set: { badges: { $size: '$badges' } } },
                        {
                            $lookup: {
                                from: 'TemplateTasks',
                                let: { curriculumId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$curriculumId', '$$curriculumId'] } } },
                                    { $project: { _id: 1 } },
                                ],
                                as: 'activities',
                            },
                        },
                        { $set: { activities: { $size: '$activities' } } }
                    );

                    const arg = {
                        $or: [{ $and: andCond }, { $and: andCondAdmin }],
                    };
                    const [getMasterTemplate, length] = await Promise.all([
                        models.templateCurriculum.aggregate(pipeline),
                        models.templateCurriculum.countDocuments(arg),
                    ]);
                    return {
                        length,
                        data: getMasterTemplate,
                    };
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
        listOrganizationTemplates: combineResolvers(
            isRoleWithAccessOrganizationalTemplate,
            async (
                parent,
                { skip, limit, search, gradeId, ageGrpId, guidecategoryId, programTypeId, pgmId, orgId },
                { loaders, models, me }
            ) => {
                try {
                    const skipDocs = skip || 0;
                    const limitDocs = limit || 10;

                    let parentOrgIds = [];
                    const organizationIds = getOrganizationIdsWithAccess(me);

                    if (me.role.includes('organizationAdmin')) parentOrgIds = [...new Set([...organizationIds])];
                    else if (
                        me.role.includes('programManager') ||
                        me.role.includes('childOrganizationAdmin') ||
                        me.role.includes('matchSupportSpecialist')
                    ) {
                        const organizations = await loaders.organization.loadMany([...new Set([...organizationIds])]);
                        parentOrgIds = [...new Set([...organizations.map((org) => org.parentOrganizationId)])];
                    }

                    const parentOrg = parentOrgIds.map((id) => mongoose.Types.ObjectId(id));
                    if (!me.role.includes('admin') && parentOrgIds.length < 1) throw new Error('Not authorized');

                    const pipeline = [];
                    const andCond = [{ parentOrganizationId: { $in: parentOrg } }, { masterTemplate: false }];
                    const arg = {
                        parentOrganizationId: { $in: parentOrgIds },
                        masterTemplate: false,
                    };

                    if (gradeId) {
                        andCond.push({ gradeId: mongoose.Types.ObjectId(gradeId) });
                        Object.assign(arg, { gradeId });
                    }

                    if (ageGrpId) {
                        andCond.push({ ageGrpId: mongoose.Types.ObjectId(ageGrpId) });
                        Object.assign(arg, { ageGrpId });
                    }

                    if (guidecategoryId) {
                        andCond.push({ guidecategoryId: mongoose.Types.ObjectId(guidecategoryId) });
                        Object.assign(arg, { guidecategoryId });
                    }
                    if (programTypeId) {
                        andCond.push({ programTypeId: mongoose.Types.ObjectId(programTypeId) });
                        Object.assign(arg, { programTypeId });
                    }

                    if (pgmId) {
                        andCond.push({ programId: mongoose.Types.ObjectId(pgmId) });
                        Object.assign(arg, { programId: pgmId });
                    }
                    if (orgId) {
                        andCond.push({ childOrganizationId: mongoose.Types.ObjectId(orgId) });
                        Object.assign(arg, { childOrganizationId: orgId });
                    }

                    if (search) {
                        const cleanSearch = search.trim().replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&');
                        andCond.push({
                            $or: [
                                { title: { $regex: `^${cleanSearch}.*`, $options: 'i' } },
                                { title: { $regex: `.*${cleanSearch}.*`, $options: 'i' } },
                            ],
                        });

                        Object.assign(arg, {
                            $or: [
                                { title: { $regex: `^${cleanSearch}.*`, $options: 'i' } },
                                { title: { $regex: `.*${cleanSearch}.*`, $options: 'i' } },
                            ],
                        });
                    }

                    pipeline.push(
                        { $match: { $and: andCond } },
                        { $sort: { createdDate: -1 } },
                        { $skip: skipDocs },
                        { $limit: limitDocs },
                        {
                            $lookup: {
                                from: 'TemplateMilestone',
                                let: { curriculumId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$curriculumId', '$$curriculumId'] } } },
                                    { $project: { _id: 1 } },
                                ],
                                as: 'badges',
                            },
                        },
                        { $set: { badges: { $size: '$badges' } } },
                        {
                            $lookup: {
                                from: 'TemplateTasks',
                                let: { curriculumId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$curriculumId', '$$curriculumId'] } } },
                                    { $project: { _id: 1 } },
                                ],
                                as: 'activities',
                            },
                        },
                        { $set: { activities: { $size: '$activities' } } }
                    );

                    const [getOrganizationTemplate, length] = await Promise.all([
                        models.templateCurriculum.aggregate(pipeline),
                        models.templateCurriculum.countDocuments(arg),
                    ]);
                    return {
                        length,
                        data: getOrganizationTemplate,
                    };
                } catch (error) {
                    // console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
        listProgramTemplates: combineResolvers(
            isAuthenticated,
            async (
                parent,
                { limit, skip, search, gradeId, ageGrpId, guidecategoryId, programTypeId, pgmId },
                { models }
            ) => {
                try {
                    const skipDocs = skip || 0;
                    const limitDocs = limit || 10;

                    const pipeline = [];
                    const andCond = [{ allPgmIds: mongoose.Types.ObjectId(pgmId) }, { masterTemplate: false }];
                    const arg = {
                        allPgmIds: mongoose.Types.ObjectId(pgmId),
                        masterTemplate: false,
                    };

                    if (gradeId) {
                        andCond.push({ gradeId: mongoose.Types.ObjectId(gradeId) });
                        Object.assign(arg, { gradeId });
                    }

                    if (ageGrpId) {
                        andCond.push({ ageGrpId: mongoose.Types.ObjectId(ageGrpId) });
                        Object.assign(arg, { ageGrpId });
                    }

                    if (guidecategoryId) {
                        andCond.push({ guidecategoryId: mongoose.Types.ObjectId(guidecategoryId) });
                        Object.assign(arg, { guidecategoryId });
                    }
                    if (programTypeId) {
                        andCond.push({ programTypeId: mongoose.Types.ObjectId(programTypeId) });
                        Object.assign(arg, { programTypeId });
                    }

                    if (search) {
                        const cleanSearch = search.trim().replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&');
                        andCond.push({
                            $or: [
                                { title: { $regex: `^${cleanSearch}.*`, $options: 'i' } },
                                { title: { $regex: `.*${cleanSearch}.*`, $options: 'i' } },
                            ],
                        });

                        Object.assign(arg, {
                            $or: [
                                { title: { $regex: `^${cleanSearch}.*`, $options: 'i' } },
                                { title: { $regex: `.*${cleanSearch}.*`, $options: 'i' } },
                            ],
                        });
                    }

                    pipeline.push(
                        { $match: { $and: andCond } },
                        { $sort: { createdDate: -1 } },
                        { $skip: skipDocs },
                        { $limit: limitDocs },
                        {
                            $lookup: {
                                from: 'TemplateMilestone',
                                let: { curriculumId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$curriculumId', '$$curriculumId'] } } },
                                    { $project: { _id: 1 } },
                                ],
                                as: 'badges',
                            },
                        },
                        { $set: { badges: { $size: '$badges' } } },
                        {
                            $lookup: {
                                from: 'TemplateTasks',
                                let: { curriculumId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$curriculumId', '$$curriculumId'] } } },
                                    { $project: { _id: 1 } },
                                ],
                                as: 'activities',
                            },
                        },
                        { $set: { activities: { $size: '$activities' } } }
                    );

                    const [programTemplates, length] = await Promise.all([
                        models.templateCurriculum.aggregate(pipeline),
                        models.templateCurriculum.countDocuments(arg),
                    ]);
                    return {
                        length,
                        data: programTemplates,
                    };
                } catch (err) {
                    console.log('listProgramTemplates error', err);
                    throw new Error(err);
                }
            }
        ),
        listLessonPlan: combineResolvers(isAuthenticated, async (parent, { curriculumId }, { models }) => {
            try {
                return models.templateMilestone.aggregate([
                    { $match: { curriculumId: mongoose.Types.ObjectId(curriculumId) } },
                    {
                        $lookup: {
                            from: 'ActivityBadge',
                            let: { activityBadgeId: '$activityBadgeId' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$_id', '$$activityBadgeId'] } } },
                                { $project: { badgeCategoryId: 1 } },
                            ],
                            as: 'activityBadge',
                        },
                    },
                    { $unwind: { path: '$activityBadge', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'TemplateTasks',
                            let: { milestoneId: '$_id' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$milestoneId', '$$milestoneId'] } } },
                                {
                                    $project: {
                                        _id: 1,
                                        title: 1,
                                        description: 1,
                                        assignedTo: 1,
                                        milestoneId: 1,
                                        attachments: 1,
                                        dueDate: 1,
                                    },
                                },
                            ],
                            as: 'tasks',
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            description: 1,
                            badgeImage: 1,
                            order: 1,
                            activityBadgeId: '$activityBadge._id',
                            badgeCategoryId: '$activityBadge.badgeCategoryId',
                            tasks: 1,
                        },
                    },
                    { $sort: { order: 1, _id: 1 } },
                ]);
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),
        listLessonPlanMentee: combineResolvers(
            accessToMentee,
            async (parent, { menteeId, curriculumId }, { models, me }) => {
                try {
                    const taskAndCond = [
                        { $expr: { $eq: ['$milestoneId', '$$milestoneId'] } },
                        { menteeId: mongoose.Types.ObjectId(menteeId) },
                    ];
                    if (me.role[0] === 'mentee')
                        taskAndCond.push({
                            $or: [
                                { $expr: { $eq: ['$assignedTo', mongoose.Types.ObjectId(menteeId)] } },
                                { assignedTo: { $exists: false } },
                                { assignedTo: null },
                            ],
                        });

                    const [listLessonPlanMentee] = await models.userCurriculum.aggregate([
                        {
                            $match: {
                                $and: [{ _id: mongoose.Types.ObjectId(curriculumId) }],
                            },
                        },
                        { $project: { title: 1 } },
                        {
                            $lookup: {
                                from: 'Milestone',
                                let: { userCurriculumId: '$_id' },
                                as: 'milestone',
                                pipeline: [
                                    {
                                        $match: {
                                            $and: [
                                                { $expr: { $eq: ['$userCurriculumId', '$$userCurriculumId'] } },
                                                { menteeId: mongoose.Types.ObjectId(menteeId) },
                                            ],
                                        },
                                    },
                                    { $sort: { order: 1 } },
                                    {
                                        $lookup: {
                                            from: 'ActivityBadge',
                                            let: { activityBadgeId: '$activityBadgeId' },
                                            pipeline: [
                                                { $match: { $expr: { $eq: ['$_id', '$$activityBadgeId'] } } },
                                                { $project: { badgeCategoryId: 1 } },
                                            ],
                                            as: 'activityBadge',
                                        },
                                    },
                                    { $unwind: { path: '$activityBadge', preserveNullAndEmptyArrays: true } },
                                    {
                                        $project: {
                                            _id: 1,
                                            title: 1,
                                            description: 1,
                                            badgeImage: 1,
                                            createdDate: 1,
                                            assignedToRole: 1,
                                            isBadgeGranted: 1,
                                            favourite: 1,
                                            order: 1,
                                            activityBadgeId: '$activityBadge._id',
                                            badgeCategoryId: '$activityBadge.badgeCategoryId',
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: 'Tasks',
                                            let: { milestoneId: '$_id' },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $and:
                                                            // [
                                                            //     { $expr: { $eq: ['$milestoneId', '$$milestoneId'] } },
                                                            //     { menteeId: mongoose.Types.ObjectId(menteeId) },
                                                            // ]
                                                            taskAndCond,
                                                    },
                                                },
                                                { $sort: { createdDate: 1, templateTaskCreatedDate: 1 } },
                                                {
                                                    $project: {
                                                        _id: 1,
                                                        title: 1,
                                                        description: 1,
                                                        attachments: 1,
                                                        dueDate: 1,
                                                        completed: 1,
                                                        assignedTo: 1,
                                                        goalId: 1,
                                                        createdBy: 1,
                                                    },
                                                },
                                                {
                                                    $lookup: {
                                                        from: 'UserModel',
                                                        let: { assignedTo: '$assignedTo' },
                                                        pipeline: [
                                                            { $match: { $expr: { $eq: ['$_id', '$$assignedTo'] } } },
                                                            {
                                                                $project: {
                                                                    _id: 1,
                                                                    firstName: 1,
                                                                    lastName: 1,
                                                                    profileImage: 1,
                                                                },
                                                            },
                                                        ],
                                                        as: 'assignedToData',
                                                    },
                                                },
                                                {
                                                    $unwind: {
                                                        path: '$assignedToData',
                                                        preserveNullAndEmptyArrays: true,
                                                    },
                                                },
                                                {
                                                    $lookup: {
                                                        from: 'TaskComments',
                                                        let: { taskId: '$_id' },
                                                        pipeline: [
                                                            {
                                                                $match: {
                                                                    $and: [
                                                                        { $expr: { $eq: ['$taskId', '$$taskId'] } },
                                                                        {
                                                                            senderId: {
                                                                                $ne: mongoose.Types.ObjectId(me.id),
                                                                            },
                                                                        },
                                                                        {
                                                                            readByUsers: {
                                                                                $ne: mongoose.Types.ObjectId(me.id),
                                                                            },
                                                                        },
                                                                    ],
                                                                },
                                                            },
                                                            { $project: { _id: 1 } },
                                                        ],
                                                        as: 'unreadCommentsCount',
                                                    },
                                                },
                                                { $set: { unreadCommentsCount: { $size: '$unreadCommentsCount' } } },
                                            ],
                                            as: 'tasks',
                                        },
                                    },
                                ],
                            },
                        },
                    ]);
                    return listLessonPlanMentee;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        listAvailableGuides: combineResolvers(
            async (
                parent,
                { menteeId, gradeId, ageGrpId, guidecategoryId, badgeCategoryId, programTypeId, search, myAgeGrp },
                { models, loaders, me }
            ) => {
                try {
                    const [mentee, assignedTemplates] = await Promise.all([
                        loaders.user.load(menteeId.toString()),
                        models.userCurriculum.find(
                            {
                                userId: mongoose.Types.ObjectId(menteeId),
                            },
                            { curriculumId: 1 }
                        ),
                    ]);
                    const menteePgm = mentee.enrolledInPrograms.find((pgm) => pgm.activeProgram === true);

                    const assignedTemplatesId = [
                        ...new Set([...assignedTemplates.map((templates) => templates.curriculumId.toString())]),
                    ];
                    const templatesIds = assignedTemplatesId.map((assignedIds) => mongoose.Types.ObjectId(assignedIds));

                    const andCond = [
                        { _id: { $nin: templatesIds } },
                        { masterTemplate: false },
                        { status: true },
                        {
                            $or: [
                                {
                                    $expr: {
                                        $in: [mongoose.Types.ObjectId(menteePgm.programId), '$assignedPgmIds'],
                                    },
                                },
                                {
                                    $expr: {
                                        $in: [mongoose.Types.ObjectId(menteePgm.matchSupportSpecialistId), '$mssIds'],
                                    },
                                },
                            ],
                        },
                    ];

                    if (gradeId) andCond.push({ gradeId: mongoose.Types.ObjectId(gradeId) });
                    if (ageGrpId) andCond.push({ ageGrpId: mongoose.Types.ObjectId(ageGrpId) });
                    if (guidecategoryId) andCond.push({ guidecategoryId: mongoose.Types.ObjectId(guidecategoryId) });
                    if (programTypeId) andCond.push({ programTypeId: mongoose.Types.ObjectId(programTypeId) });

                    if (search) {
                        const cleanSearch = search.trim().replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&');
                        andCond.push({
                            $or: [
                                { title: { $regex: `^${cleanSearch}.*`, $options: 'i' } },
                                { title: { $regex: `.*${cleanSearch}.*`, $options: 'i' } },
                            ],
                        });
                    }
                    if (myAgeGrp && me.dateOfBirth) {
                        const dob = DateTime.fromISO(new Date(me.dateOfBirth).toISOString());
                        const curr = DateTime.fromISO(new Date().toISOString());
                        const diff = curr.diff(dob, ['years']);

                        const years = Math.round(diff.toObject().years);
                        const ageGroups = await models.ageGroup.find(
                            { status: true },
                            { _id: 1, title: 1, startAge: 1, endAge: 1 }
                        );
                        const ageGroup = ageGroups.find(
                            (ageGrp) => years >= ageGrp.startAge && years <= ageGrp.endAge && ageGrp
                        );

                        if (!ageGroup) return [];
                        andCond.push({ ageGrpId: mongoose.Types.ObjectId(ageGroup._id) });
                    }

                    const pipeline = [
                        {
                            $match: {
                                $and: andCond,
                            },
                        },
                        { $sort: { createdDate: -1 } },
                        {
                            $lookup: {
                                from: 'TemplateMilestone',
                                let: { curriculumId: '$_id' },
                                pipeline: [
                                    { $match: { $and: [{ $expr: { $eq: ['$curriculumId', '$$curriculumId'] } }] } },
                                    { $project: { activityBadgeId: 1, badgeImage: 1 } },
                                ],
                                as: 'milestones',
                            },
                        },
                        {
                            $project: {
                                title: 1,
                                description: 1,
                                badgeCategoryId: 1,
                                guidecategoryId: 1,
                                programTypeId: 1,
                                gradeId: 1,
                                ageGrpId: 1,
                                startDate: 1,
                                milestoneImages: '$milestones.badgeImage',
                            },
                        },
                    ];

                    if (badgeCategoryId) {
                        pipeline.push(
                            {
                                $lookup: {
                                    from: 'TemplateMilestone',
                                    let: { curriculumId: '$_id' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $and: [{ $expr: { $eq: ['$curriculumId', '$$curriculumId'] } }],
                                            },
                                        },
                                        { $project: { activityBadgeId: 1 } },
                                        {
                                            $lookup: {
                                                from: 'ActivityBadge',
                                                let: { activityBadgeId: '$activityBadgeId' },
                                                pipeline: [
                                                    {
                                                        $match: {
                                                            $and: [
                                                                { $expr: { $eq: ['$_id', '$$activityBadgeId'] } },
                                                                {
                                                                    badgeCategoryId: mongoose.Types.ObjectId(
                                                                        badgeCategoryId
                                                                    ),
                                                                },
                                                            ],
                                                        },
                                                    },
                                                    { $project: { badgeCategoryId: 1 } },
                                                ],
                                                as: 'activityBadge',
                                            },
                                        },
                                        { $unwind: '$activityBadge' },
                                    ],
                                    as: 'badgeCategoryMilestone',
                                },
                            },
                            { $set: { milestoneLength: { $size: '$badgeCategoryMilestone' } } },
                            { $match: { milestoneLength: { $gt: 0 } } }
                        );
                    }

                    const availableGuides = await models.templateCurriculum.aggregate(pipeline);

                    const todaysDate = new Date().toLocaleDateString('en-CA');
                    let result = [];
                    _.forEach(availableGuides, async (value) => {
                        if (value.startDate) {
                            if (new Date(value.startDate) <= new Date(todaysDate.toString())) {
                                result.push(value);
                            }
                        } else {
                            result.push(value);
                        }
                    });

                    return result;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        getThisCirriculamTemplate: combineResolvers(async (parent, { curriculumId }, { models }) => {
            try {
                const carriculamTemplate = await models.templateCurriculum.findById(curriculumId);

                return carriculamTemplate;
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),

        getTemplateCurriculamWithStartDate: combineResolvers(async (parent, { startDate }, { models }) => {
            try {
                return await models.templateCurriculum.aggregate([
                    {
                        $match: {
                            startDate,
                            masterTemplate: false,
                            $expr: { $gt: [{ $size: '$allPgmIds' }, 0] },
                        },
                    },
                ]);
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),
    },

    Mutation: {
        addCurriculumTemplate: combineResolvers(
            accessToProgram,
            async (parent, curriculumData, { models, loaders, me }) => {
                try {
                    // if (!curriculumData.masterTemplate && !curriculumData.masterTemplateId)
                    //     throw new Error('masterTemplateId is required');
                    if (curriculumData.pointsPerTask < 0) throw new Error('Points per activity should be positive');
                    const newCurriculumTemplate = await new models.templateCurriculum(curriculumData);
                    if (curriculumData.programId) {
                        const program = await loaders.program.load(curriculumData.programId);
                        const organization = await loaders.organization.load(program.organizationId);
                        newCurriculumTemplate.programId = curriculumData.programId;
                        newCurriculumTemplate.parentOrganizationId = organization.parentOrganizationId;
                        newCurriculumTemplate.childOrganizationId = program.organizationId;
                    } else if (curriculumData.organizationId) {
                        const organization = await loaders.organization.load(curriculumData.organizationId);
                        newCurriculumTemplate.parentOrganizationId = organization.parentOrganizationId;
                        newCurriculumTemplate.childOrganizationId = curriculumData.organizationId;
                    }
                    if (curriculumData.masterTemplate && me.role.includes('admin')) {
                        newCurriculumTemplate.programId = null;
                        newCurriculumTemplate.childOrganizationId = null;
                        newCurriculumTemplate.parentOrganizationId = null;
                    }
                    newCurriculumTemplate.createdBy = me.id;
                    newCurriculumTemplate.startDate = curriculumData.startDate;
                    [newCurriculumTemplate.createdByRole] = me.role;
                    // console.log('program', program);
                    return newCurriculumTemplate.save();
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
        deleteCurriculumTemplate: combineResolvers(
            hierarchicalAccessForCurriculumTemplate,
            async (parent, { curriculumId }, { models }) => {
                try {
                    const isCloned = await models.templateCurriculum.exists({ 'masterTemplateData._id': curriculumId });
                    if (isCloned) throw new Error('Already cloned');
                    const deleteResult = await models.templateCurriculum.deleteOne({ _id: curriculumId });
                    let message;
                    let status = false;
                    if (deleteResult.deletedCount) {
                        status = true;
                        message = 'Curriculum template deleted successfully';
                    }
                    return { status, message };
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        editCurriculumTemplate: combineResolvers(
            hierarchicalAccessForCurriculumTemplate,
            async (
                parent,
                {
                    curriculumId,
                    title,
                    description,
                    masterTemplate,
                    pointsPerTask,
                    licenseRequired,
                    evidenceBased,
                    status,
                    gradeId,
                    ageGrpId,
                    guidecategoryId,
                    programTypeId,
                    startDate,
                },
                { models }
            ) => {
                try {
                    const getCurriculum = await models.templateCurriculum.findById(curriculumId);
                    if (!getCurriculum) throw new Error('Curriculum template not found');
                    if (title) getCurriculum.title = title;
                    if (description) getCurriculum.description = description;
                    if (masterTemplate === true || masterTemplate === false)
                        getCurriculum.masterTemplate = masterTemplate;
                    if (pointsPerTask) getCurriculum.pointsPerTask = pointsPerTask;
                    if (licenseRequired === true || licenseRequired === false)
                        getCurriculum.licenseRequired = licenseRequired;
                    if (evidenceBased === true || evidenceBased === false) getCurriculum.evidenceBased = evidenceBased;
                    if (status === true || status === false) getCurriculum.status = status;
                    if (gradeId || gradeId === null) getCurriculum.gradeId = gradeId;
                    if (ageGrpId) getCurriculum.ageGrpId = ageGrpId;
                    if (guidecategoryId) getCurriculum.guidecategoryId = guidecategoryId;
                    if (programTypeId) getCurriculum.programTypeId = programTypeId;
                    if (startDate) getCurriculum.startDate = startDate;
                    getCurriculum.updatedDate = new Date();
                    getCurriculum.save();
                    return getCurriculum;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
        cloneCurriculumTemplate: combineResolvers(
            isAuthenticated,
            // hierarchicalAccessForCurriculumTemplate,
            async (parent, { curriculumId, programId, organizationId }, { models, me, loaders }) => {
                try {
                    const [res, curriculum] = await Promise.all([
                        getDetails(me, loaders, programId, organizationId),
                        models.templateCurriculum.findById(curriculumId),
                    ]);
                    if (!curriculum) throw new Error('Curriculum template not found');
                    if (!curriculum.masterTemplate) throw new Error('Guide is not a MentorHub template');
                    const clonedTemplatePromise = new models.templateCurriculum({
                        title: `Copy of ${curriculum.title}`,
                        description: curriculum.description,
                        masterTemplate: res.masterTemplate,
                        masterTemplateId: curriculumId,
                        programId: res.programId,
                        parentOrganizationId: res.parentOrganizationId,
                        childOrganizationId: res.childOrganizationId,
                        licenseRequired: curriculum.licenseRequired,
                        evidenceBased: curriculum.evidenceBased,
                        pointsPerTask: curriculum.pointsPerTask,
                        gradeId: curriculum.gradeId,
                        ageGrpId: curriculum.ageGrpId,
                        guidecategoryId: curriculum.guidecategoryId,
                        programTypeId: curriculum.programTypeId,
                        createdBy: me.id,
                        createdByRole: me.role[0],
                        startDate: curriculum.startDate ? curriculum.startDate : null,
                    }).save();

                    const templateMilestonesPromise = models.templateMilestone.find(
                        { curriculumId },
                        { title: 1, description: 1, order: 1, badgeImage: 1, activityBadgeId: 1 }
                    );

                    const [clonedTemplate, templateMilestones] = await Promise.all([
                        clonedTemplatePromise,
                        templateMilestonesPromise,
                    ]);
                    cloneTemplate(templateMilestones, clonedTemplate, curriculumId, models, me);
                    return clonedTemplate;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        synchMasterWithClones: combineResolvers(isAuthenticated, async (parent, { curriculumId }, { models }) => {
            try {
                const [curriculumTemplate, milestones, clonedTemplates] = await Promise.all([
                    models.templateCurriculum.findById(curriculumId),
                    models.templateMilestone.find({ curriculumId: mongoose.Types.ObjectId(curriculumId) }),
                    models.templateCurriculum.find(
                        { masterTemplateId: mongoose.Types.ObjectId(curriculumId) },
                        { _id: 1, createdBy: 1 }
                    ),
                ]);
                if (!curriculumTemplate.masterTemplate) throw new Error('The guide is not a master guide');
                console.log('clonedTemplates', clonedTemplates);
                console.log('milestones', milestones);

                await updateMilestones(clonedTemplates, milestones, models);
                return { status: true, message: 'Clones synched successfully' };
            } catch (err) {
                console.log('error from synch master', err);
                throw new Error(err.message);
            }
        }),
    },

    TemplateCurriculum: {
        program: (templateCurriculum, args, { loaders }) => {
            if (templateCurriculum.programId) return loaders.program.load(templateCurriculum.programId.toString());
            return null;
        },
        organization: (templateCurriculum, args, { loaders }) => {
            if (templateCurriculum.childOrganizationId)
                return loaders.organization.load(templateCurriculum.childOrganizationId.toString());
            return null;
        },
        masterTemplateData: (templateCurriculum, args, { loaders }) => {
            if (templateCurriculum.masterTemplateId)
                return loaders.curriculumTemplate.load(templateCurriculum.masterTemplateId.toString());
            return null;
        },
        createdByData: async (templateCurriculum, args, { loaders }) => {
            if (!templateCurriculum.createdBy) return null;
            const mentee = await loaders.user.load(templateCurriculum.createdBy.toString());
            return { ...mentee, role: mentee ? mentee.role[0] : null };
        },
    },

    availableGuides: {
        ageGroup: async (availableGuides, args, { loaders }) => {
            if (!availableGuides.ageGrpId) return null;
            const ageGroup = await loaders.ageGroup.load(availableGuides.ageGrpId.toString());
            return { _id: ageGroup._id, title: ageGroup.title };
        },
        grade: async (availableGuides, args, { loaders }) => {
            if (!availableGuides.gradeId) return null;
            const grade = await loaders.grades.load(availableGuides.gradeId.toString());
            return { _id: grade._id, title: grade.title };
        },
        guideCategory: async (availableGuides, args, { loaders }) => {
            if (!availableGuides.guidecategoryId) return null;
            const guidecategory = await loaders.guideCategory.load(availableGuides.guidecategoryId.toString());
            return { _id: guidecategory._id, title: guidecategory.title };
        },
        programType: async (availableGuides, args, { loaders }) => {
            if (!availableGuides.programTypeId) return null;
            const programType = await loaders.programType.load(availableGuides.programTypeId.toString());
            return { _id: programType._id, title: programType.title };
        },
    },
};
