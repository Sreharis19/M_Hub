/* eslint-disable object-shorthand */
/* eslint-disable no-param-reassign */
import { combineResolvers } from 'graphql-resolvers';
import mongoose from 'mongoose';
import { accessToMentee, isAuthenticated } from '../auth';

/* eslint-disable no-console */
export default {
    Query: {
        listGuides: combineResolvers(accessToMentee, async (parent, { menteeId }, { models }) => {
            try {
                const guides = await models.userCurriculum.aggregate([
                    { $match: { userId: mongoose.Types.ObjectId(menteeId) } },
                    {
                        $project: {
                            curriculumId: 1,
                            title: 1,
                            description: 1,
                            pinnedDate: 1,
                            pinned: 1,
                            createdDate: 1,
                        },
                    },
                    { $set: { order: { $cond: ['$pinned', 1, 2] } } },
                    { $sort: { order: 1, pinnedDate: -1, createdDate: -1 } },
                    {
                        $lookup: {
                            from: 'Milestone',
                            let: { userCurriculumId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $and: [
                                            { $expr: { $eq: ['$userCurriculumId', '$$userCurriculumId'] } },
                                            { menteeId: mongoose.Types.ObjectId(menteeId) },
                                        ],
                                    },
                                },
                                {
                                    $lookup: {
                                        from: 'Tasks',
                                        let: { milestoneId: '$_id' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $and: [
                                                        {
                                                            $expr: {
                                                                $eq: ['$milestoneId', '$$milestoneId'],
                                                            },
                                                        },
                                                        { menteeId: mongoose.Types.ObjectId(menteeId) },
                                                    ],
                                                },
                                            },
                                            { $project: { title: 1, completed: 1 } },
                                        ],
                                        as: 'tasks',
                                    },
                                },
                                { $set: { activitiesInBadge: { $size: '$tasks' } } },
                                {
                                    $project: {
                                        title: 1,
                                        badgeImage: 1,
                                        activitiesInBadge: 1,
                                    },
                                },
                            ],
                            as: 'milestones',
                        },
                    },
                    { $set: { totalBadges: { $size: '$milestones' } } },
                    { $set: { totalActivities: { $sum: '$milestones.activitiesInBadge' } } },
                    {
                        $lookup: {
                            from: 'Milestone',
                            let: { userCurriculumId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $and: [
                                            { $expr: { $eq: ['$userCurriculumId', '$$userCurriculumId'] } },
                                            { menteeId: mongoose.Types.ObjectId(menteeId) },
                                            { isBadgeGranted: true },
                                        ],
                                    },
                                },
                                { $project: { _id: 1 } },
                            ],
                            as: 'grantedBadgesList',
                        },
                    },
                    { $set: { grantedBadges: { $size: '$grantedBadgesList' } } },

                    {
                        $lookup: {
                            from: 'Milestone',
                            let: { userCurriculumId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $and: [
                                            { $expr: { $eq: ['$userCurriculumId', '$$userCurriculumId'] } },
                                            { menteeId: mongoose.Types.ObjectId(menteeId) },
                                        ],
                                    },
                                },
                                { $project: { _id: 1 } },
                                {
                                    $lookup: {
                                        from: 'Tasks',
                                        let: { milestoneId: '$_id' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $and: [
                                                        {
                                                            $expr: {
                                                                $eq: ['$milestoneId', '$$milestoneId'],
                                                            },
                                                        },
                                                        { menteeId: mongoose.Types.ObjectId(menteeId) },
                                                        { completed: true },
                                                    ],
                                                },
                                            },
                                            { $project: { _id: 1, completed: 1 } },
                                        ],
                                        as: 'completedActivitiesList',
                                    },
                                },
                                {
                                    $set: {
                                        completedActivitiesInBadge: { $size: '$completedActivitiesList' },
                                    },
                                },
                            ],
                            as: 'allBadges',
                        },
                    },
                    { $set: { completedActivities: { $sum: '$allBadges.completedActivitiesInBadge' } } },
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            milestones: 1,
                            totalBadges: 1,
                            totalActivities: 1,
                            grantedBadges: 1,
                            completedActivities: 1,
                            pinned: 1,
                        },
                    },
                ]);
                console.log('guides', guides);
                return guides;
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),
    },

    Mutation: {
        pinGuide: combineResolvers(accessToMentee, async (parent, { guideId, pinned }, { models }) => {
            try {
                const guide = await models.userCurriculum.findById(guideId, { pinned: 1 });
                guide.pinned = pinned;
                if (pinned === true) {
                    guide.pinnedDate = new Date();
                } else if (pinned === false) {
                    guide.pinnedDate = null;
                }
                guide.updatedDate = new Date();
                await guide.save();
                return {
                    message: 'Guide updated successfully',
                    status: true,
                };
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),
        unAssignGuide: combineResolvers(isAuthenticated, async (parent, { curriculumId }, { models }) => {
            try {
                const delArray = [
                    models.userCurriculum.deleteOne({ _id: mongoose.Types.ObjectId(curriculumId) }),
                    models.milestone.deleteMany({ userCurriculumId: mongoose.Types.ObjectId(curriculumId) }),
                    models.tasks.deleteMany({ userCurriculumId: mongoose.Types.ObjectId(curriculumId) }),
                    models.taskComments.deleteMany({ userCurriculumId: mongoose.Types.ObjectId(curriculumId) }),
                ];
                await Promise.all(delArray);
                return { status: true, message: 'Unassigned Guide Successfully' };
            } catch (error) {
                console.log('Error from unassign guide', error);
                throw new Error(error);
            }
        }),
        addGuide: combineResolvers(
            async (
                parent,
                {
                    title,
                    description,
                    programId,
                    parentOrganizationId,
                    childOrganizationId,
                    gradeId,
                    ageGrpId,
                    programTypeId,
                    guidecategoryId,
                    licenseRequired,
                    evidenceBased,
                    pointsPerTask,
                    userId,
                    curriculumId,
                    pinned,
                    activeCurriculum,
                },
                { models }
            ) => {
                try {
                    const arg = {
                        curriculumId: curriculumId,
                        userId: userId,
                    };
                    const getCount = await models.userCurriculum.countDocuments(arg);
                    if (getCount > 0) {
                        throw new Error('Guide already exists');
                    } else {
                        const newGuide = new models.userCurriculum({
                            title,
                            description,
                            programId,
                            parentOrganizationId,
                            childOrganizationId,
                            gradeId,
                            ageGrpId,
                            programTypeId,
                            guidecategoryId,
                            licenseRequired,
                            evidenceBased,
                            pointsPerTask,
                            userId,
                            curriculumId,
                            pinned,
                            activeCurriculum,
                            createdBy: userId,
                        });
                        await newGuide.save();
                        return { status: true, message: 'Guide added successfully' };
                    }
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
    },
};
