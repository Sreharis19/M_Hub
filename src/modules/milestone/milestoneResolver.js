/* eslint-disable no-console */
import mongoose from 'mongoose';
import { forEach } from 'lodash';
import { combineResolvers } from 'graphql-resolvers';
import {
    accessToAddBadge,
    accessToMenteeBadgeList,
    isAuthenticated,
    hierarchicalBadgeEditAccess,
    // favouriteBadgeAccess,
} from '../auth';
import { grantBadge } from '../tasks/operations';
import { getUserDetail } from '../../lib/fetch';

export default {
    Query: {
        badgeListAppAllList: combineResolvers(accessToMenteeBadgeList, async (parent, { menteeId }, { models }) => {
            try {
                const badgeList = await models.milestone.aggregate([
                    { $match: { menteeId: mongoose.Types.ObjectId(menteeId) } },
                    {
                        $project: {
                            title: 1,
                            badgeDescription: 1,
                            badgeImage: 1,
                            userCurriculumId: 1,
                            favourite: 1,
                            favouriteDate: 1,
                            updatedDate: 1,
                            isBadgeGranted: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: 'Tasks',
                            let: { milestoneId: '$_id' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$milestoneId', '$$milestoneId'] } } },
                                { $project: { completed: 1, updatedDate: 1, milestoneId: 1 } },
                                {
                                    $group: { _id: '$milestoneId', updatedDate: { $max: '$updatedDate' } },
                                },
                            ],
                            as: 'tasks',
                        },
                    },
                    { $unwind: { path: '$tasks', preserveNullAndEmptyArrays: true } },
                    {
                        $set: {
                            order: {
                                $cond: [
                                    '$isBadgeGranted',
                                    { $cond: ['$favourite', 3, 4] },
                                    { $cond: ['$favourite', 1, 2] },
                                ],
                            },
                        },
                    },
                    { $sort: { order: 1, favouriteDate: -1, 'tasks.updatedDate': -1, updatedDate: -1, _id: -1 } },
                    {
                        $lookup: {
                            from: 'UserCurriculum',
                            let: { userCurriculumId: '$userCurriculumId' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$_id', '$$userCurriculumId'] } } },
                                { $project: { title: 1 } },
                            ],
                            as: 'guide',
                        },
                    },
                    { $unwind: '$guide' },
                    {
                        $lookup: {
                            from: 'Tasks',
                            let: { milestoneId: '$_id' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$milestoneId', '$$milestoneId'] } } },
                                { $project: { completed: 1 } },
                            ],
                            as: 'activities',
                        },
                    },
                    { $set: { totalActivities: { $size: '$activities' } } },
                    {
                        $set: {
                            completedActivities: {
                                $sum: {
                                    $map: {
                                        input: '$activities',
                                        as: 'activity',
                                        in: { $cond: ['$$activity.completed', 1, 0] },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            favourite: 1,
                            title: 1,
                            badgeDescription: 1,
                            badgeImage: 1,
                            guideId: '$userCurriculumId',
                            guideName: '$guide.title',
                            totalActivities: 1,
                            completedActivities: 1,
                        },
                    },
                ]);
                return badgeList;
            } catch (error) {
                console.log(error);
                throw new Error(error);
            }
        }),

        badgeListApp: combineResolvers(accessToMenteeBadgeList, async (parent, { menteeId }, { models }) => {
            try {
                const badgeList = await models.milestone.aggregate([
                    { $match: { menteeId: mongoose.Types.ObjectId(menteeId), favourite: true } },
                    {
                        $project: {
                            title: 1,
                            badgeDescription: 1,
                            badgeImage: 1,
                            userCurriculumId: 1,
                            favourite: 1,
                            favouriteDate: 1,
                            updatedDate: 1,
                            isBadgeGranted: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: 'Tasks',
                            let: { milestoneId: '$_id' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$milestoneId', '$$milestoneId'] } } },
                                { $project: { completed: 1, updatedDate: 1, milestoneId: 1 } },
                                {
                                    $group: { _id: '$milestoneId', updatedDate: { $max: '$updatedDate' } },
                                },
                            ],
                            as: 'tasks',
                        },
                    },
                    { $unwind: { path: '$tasks', preserveNullAndEmptyArrays: true } },
                    {
                        $set: {
                            order: {
                                $cond: [
                                    '$isBadgeGranted',
                                    { $cond: ['$favourite', 3, 4] },
                                    { $cond: ['$favourite', 1, 2] },
                                ],
                            },
                        },
                    },
                    { $sort: { order: 1, favouriteDate: -1, 'tasks.updatedDate': -1, updatedDate: -1, _id: -1 } },
                    {
                        $lookup: {
                            from: 'UserCurriculum',
                            let: { userCurriculumId: '$userCurriculumId' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$_id', '$$userCurriculumId'] } } },
                                { $project: { title: 1 } },
                            ],
                            as: 'guide',
                        },
                    },
                    { $unwind: '$guide' },
                    {
                        $lookup: {
                            from: 'Tasks',
                            let: { milestoneId: '$_id' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$milestoneId', '$$milestoneId'] } } },
                                { $project: { completed: 1 } },
                            ],
                            as: 'activities',
                        },
                    },
                    { $set: { totalActivities: { $size: '$activities' } } },
                    {
                        $set: {
                            completedActivities: {
                                $sum: {
                                    $map: {
                                        input: '$activities',
                                        as: 'activity',
                                        in: { $cond: ['$$activity.completed', 1, 0] },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            favourite: 1,
                            title: 1,
                            badgeDescription: 1,
                            badgeImage: 1,
                            guideId: '$userCurriculumId',
                            guideName: '$guide.title',
                            totalActivities: 1,
                            completedActivities: 1,
                        },
                    },
                ]);
                return badgeList;
            } catch (error) {
                console.log(error);
                throw new Error(error);
            }
        }),

        menteeSummary: combineResolvers(async (parent, { menteeId, limit }, { models, me }) => {
            try {
                const limitDocs = limit || 3;

                const badgePromise = models.milestone
                    .find({ menteeId, favourite: true }, { title: 1, badgeImage: 1 })
                    .sort({ favouriteDate: -1 })
                    .limit(limitDocs);

                const andCond = [{ $expr: { $eq: ['$goalId', '$$goalId'] } }];
                if (me.role.includes('mentee')) andCond.push({ assignedTo: mongoose.Types.ObjectId(menteeId) });

                const goalPromise = models.goals.aggregate([
                    { $match: { $and: [{ userId: mongoose.Types.ObjectId(menteeId) }] } },
                    { $sort: { createdDate: -1 } },
                    { $project: { title: 1 } },
                    {
                        $lookup: {
                            from: 'Tasks',
                            let: { goalId: '$_id' },
                            pipeline: [
                                { $match: { $and: andCond } },
                                { $match: { $expr: { $eq: ['$goalId', '$$goalId'] } } },
                                { $project: { completed: 1 } },
                            ],
                            as: 'activities',
                        },
                    },
                    { $set: { totalActivities: { $size: '$activities' } } },
                    {
                        $set: {
                            completedActivities: {
                                $sum: {
                                    $map: {
                                        input: '$activities',
                                        as: 'activity',
                                        in: { $cond: ['$$activity.completed', 1, 0] },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $match: {
                            $or: [
                                {
                                    completedActivities: {
                                        $eq: 0,
                                    },
                                },
                                { $expr: { $ne: ['$completedActivities', '$totalActivities'] } },
                            ],
                        },
                    },
                    { $limit: limitDocs },
                ]);

                const [badges, goals] = await Promise.all([badgePromise, goalPromise]);

                return { badges, goals };
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),

        menteeLatestSummary: combineResolvers(async (parent, { menteeId, limit }, { models }) => {
            try {
                const limitDocs = limit || 3;

                const badgePromise = models.milestone
                    .find({ menteeId, isBadgeGranted: true }, { title: 1, badgeImage: 1 })
                    .sort({ updatedDate: -1 })
                    .limit(limitDocs);

                const andCond = [{ $expr: { $eq: ['$goalId', '$$goalId'] } }];
                const goalPromise = models.goals.aggregate([
                    { $match: { $and: [{ userId: mongoose.Types.ObjectId(menteeId) }] } },
                    { $sort: { createdDate: -1 } },
                    { $project: { title: 1, completedDate: 1 } },
                    {
                        $lookup: {
                            from: 'Tasks',
                            let: { goalId: '$_id' },
                            pipeline: [
                                { $match: { $and: andCond } },
                                { $match: { $expr: { $eq: ['$goalId', '$$goalId'] } } },
                                { $project: { completed: 1 } },
                            ],
                            as: 'activities',
                        },
                    },
                    { $set: { totalActivities: { $size: '$activities' } } },
                    { $set: { goalId: '$_id' } },
                    { $set: { createdDate: '$completedDate' } },
                    {
                        $set: {
                            completedActivities: {
                                $sum: {
                                    $map: {
                                        input: '$activities',
                                        as: 'activity',
                                        in: { $cond: ['$$activity.completed', 1, 0] },
                                    },
                                },
                            },
                        },
                    },
                    {
                        $match: {
                            $and: [
                                {
                                    completedActivities: {
                                        $ne: 0,
                                    },
                                },
                                { $expr: { $eq: ['$completedActivities', '$totalActivities'] } },
                            ],
                        },
                    },

                    { $set: { completed: 1 } },
                    { $sort: { createdDate: -1 } },
                    { $limit: limitDocs },
                ]);

                const [badges, goals] = await Promise.all([badgePromise, goalPromise]);

                return { badges, goals };
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),
    },
    Mutation: {
        grantBadge: combineResolvers(isAuthenticated, async (parent, { milestoneId }, { models, me }) => {
            try {
                grantBadge(milestoneId, models, me, 'button');
                return {
                    message: 'Badge granted successfully',
                    status: true,
                };
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),
        addAssignedBadge: combineResolvers(
            accessToAddBadge,
            async (
                parent,
                { curriculumId, menteeId, activityBadgeId, position, title, description, badgeImage },
                { models, me }
            ) => {
                try {
                    const milestoneExists = await models.milestone.find({ userCurriculumId: curriculumId });
                    forEach(milestoneExists, (milestone) => {
                        if (milestone.title.toLowerCase() === title.trim().toLowerCase())
                            throw new Error('Badge with the same title already exists');
                    });

                    let pos;

                    const [mentee, userCurriculum] = await Promise.all([
                        getUserDetail({ id: menteeId }),
                        models.userCurriculum.findById(curriculumId, { curriculumId: 1 }),
                    ]);

                    if (!position) {
                        const milestone = await models.milestone
                            .findOne({ userCurriculumId: curriculumId, menteeId }, { order: 1 })
                            .sort({ order: -1 });
                        pos = milestone.order + 1;
                    } else {
                        pos = position;
                        await models.milestone.updateMany(
                            {
                                userCurriculumId: curriculumId,
                                menteeId,
                                order: { $gte: pos },
                            },
                            { $inc: { order: 1 } }
                        );
                    }
                    const milestone = await new models.milestone({
                        title,
                        description,
                        badgeImage,
                        curriculumId: userCurriculum.curriculumId,
                        userCurriculumId: curriculumId,
                        activityBadgeId,
                        childOrganizationId: mentee.enrolledInPrograms[0].organizationId,
                        programId: mentee.activeProgram,
                        menteeId,
                        order: pos,
                        assignedTo: menteeId,
                        assignedToRole: 'mentee',
                        createdBy: me.id,
                    }).save();
                    return milestone;
                } catch (error) {
                    console.log(error);
                    throw new Error(error);
                }
            }
        ),

        editAssignedBadge: combineResolvers(
            hierarchicalBadgeEditAccess,
            async (parent, { badgeId, title, description, badgeImage, activityBadgeId }, { models }) => {
                try {
                    const badge = await models.milestone.findById(badgeId);
                    if (!badge) throw new Error('Badge not found');
                    if (title) badge.title = title;
                    if (description) badge.description = description;
                    if (badgeImage) badge.badgeImage = badgeImage;
                    if (activityBadgeId) badge.activityBadgeId = activityBadgeId;
                    badge.updatedDate = new Date();
                    badge.save();
                    return badge;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
        favouriteAssignedBadge: combineResolvers(
            isAuthenticated,
            async (parent, { badgeId, favourite }, { models }) => {
                try {
                    const badge = await models.milestone.findById(badgeId);
                    if (!badge) throw new Error('Badge not found');
                    if (favourite) {
                        badge.favourite = favourite;
                        badge.favouriteDate = new Date();
                    } else if (favourite === false) {
                        badge.favourite = favourite;
                        badge.favouriteDate = null;
                    }
                    badge.updatedDate = new Date();
                    badge.save();
                    return badge;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
    },
};
