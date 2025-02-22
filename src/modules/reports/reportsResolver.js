import mongoose from 'mongoose';
import { combineResolvers } from 'graphql-resolvers';
import { isAuthenticated } from '../auth';

export default {
    Query: {
        templateReportNavBar: combineResolvers(isAuthenticated, async (parent, { curriculumId }, { models }) => {
            try {
                const [report] = await models.templateCurriculum.aggregate([
                    { $match: { $and: [{ _id: mongoose.Types.ObjectId(curriculumId) }] } },
                    { $project: { allPgmIds: 1 } },
                    {
                        $lookup: {
                            from: 'UserCurriculum',
                            let: { curriculumId: '$_id' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$curriculumId', '$$curriculumId'] } } },
                                { $group: { _id: '$userId' } },
                            ],
                            as: 'userCurriculum',
                        },
                    },
                    {
                        $lookup: {
                            from: 'Milestone',
                            let: { curriculumId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $and: [
                                            { $expr: { $eq: ['$curriculumId', '$$curriculumId'] } },
                                            { isBadgeGranted: true },
                                        ],
                                    },
                                },
                            ],
                            as: 'milestones',
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            programs: { $size: '$allPgmIds' },
                            enrolledMentees: { $size: '$userCurriculum' },
                            earnedBadges: { $size: '$milestones' },
                        },
                    },
                ]);
                return report;
            } catch (err) {
                console.log('templateReportNavBarError', err);
                throw new Error(err.message);
            }
        }),

        badgeCategoryChart: combineResolvers(
            isAuthenticated,
            async (parent, { curriculumId, menteeId, orgId, programId, earned }, { models }) => {
                try {
                    const pipeline = [];
                    const andCond = [];
                    if (curriculumId) andCond.push({ curriculumId: mongoose.Types.ObjectId(curriculumId) });
                    if (menteeId) andCond.push({ menteeId: mongoose.Types.ObjectId(menteeId) });
                    if (orgId) andCond.push({ childOrganizationId: mongoose.Types.ObjectId(orgId) });
                    if (programId) andCond.push({ programId: mongoose.Types.ObjectId(programId) });
                    if (earned) andCond.push({ isBadgeGranted: true });

                    if (andCond.length) pipeline.push({ $match: { $and: andCond } });
                    pipeline.push(
                        {
                            $lookup: {
                                from: 'ActivityBadge',
                                let: { activityBadgeId: '$activityBadgeId' },
                                pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$activityBadgeId'] } } }],
                                as: 'activityBadge',
                            },
                        },
                        { $unwind: { path: '$activityBadge', preserveNullAndEmptyArrays: true } },
                        {
                            $lookup: {
                                from: 'BadgeCategory',
                                let: { badgeCategoryId: '$activityBadge.badgeCategoryId' },
                                pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$badgeCategoryId'] } } }],
                                as: 'badgeCategory',
                            },
                        },
                        { $unwind: { path: '$badgeCategory', preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: '$badgeCategory._id',
                                // title: { $addToSet: '$badgeCategory.title' },
                                // colour: { $addToSet: '$badgeCategory.colour' },
                                count: { $sum: 1 },
                            },
                        },
                        // { $unwind: { path: '$title', preserveNullAndEmptyArrays: true } },
                        // { $unwind: { path: '$colour', preserveNullAndEmptyArrays: true } },

                        { $sort: { count: -1 } }
                    );
                    let [result, badgeCategory] = await Promise.all([
                        models.milestone.aggregate(pipeline),
                        models.badgeCategory.find({}, { _id: 1, colour: 1, title: 1 }).sort({ title: 1 }),
                    ]);
                    badgeCategory = badgeCategory.map((category) => {
                        let resp = { _id: category._id, title: category.title, colour: category.colour, count: 0 };
                        result.forEach((res) => {
                            if (category._id.toString() === res._id.toString()) resp = { ...resp, count: res.count };
                        });
                        return resp;
                    });
                    result = badgeCategory;
                    return result;
                } catch (err) {
                    console.log('error from badgeCategoryChart', err);
                    throw new Error(err);
                }
            }
        ),

        badgeEarnedByDateGraph: combineResolvers(
            isAuthenticated,
            async (
                parent,
                { curriculumId, menteeId, programId, startDateISO, endDateISO, timezoneString },
                { models }
            ) => {
                try {
                    const match = {
                        badgeGrantedTime: { $gte: new Date(startDateISO), $lte: new Date(endDateISO) },
                        isBadgeGranted: true,
                    };
                    if (curriculumId) match.curriculumId = mongoose.Types.ObjectId(curriculumId);
                    if (menteeId) match.menteeId = mongoose.Types.ObjectId(menteeId);
                    if (programId) match.programId = mongoose.Types.ObjectId(programId);

                    const result = await models.milestone.aggregate([
                        { $match: match },
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: '%Y-%m-%d',
                                        date: '$badgeGrantedTime',
                                        timezone: timezoneString,
                                    },
                                },
                                count: { $sum: 1 },
                            },
                        },
                        { $sort: { _id: 1 } },
                    ]);
                    return result;
                } catch (err) {
                    console.log('error from badgeEarnedByDateGraph', err);
                    throw new Error(err);
                }
            }
        ),

        topTemplates: combineResolvers(
            isAuthenticated,
            async (parent, { skip, limit, orgId, programId }, { models }) => {
                try {
                    const skipDocs = skip || 0;
                    const limitDocs = limit || 10;

                    const andCond = [{ masterTemplate: false }];
                    const menteeAndCond = [{ $expr: { $eq: ['$curriculumId', '$$curriculumId'] } }];
                    const mentorAndCond = [{ $expr: { $eq: ['$curriculumId', '$$curriculumId'] } }];
                    if (orgId) {
                        andCond.push({ childOrganizationId: mongoose.Types.ObjectId(orgId) });
                        menteeAndCond.push({ childOrganizationId: mongoose.Types.ObjectId(orgId) });
                        mentorAndCond.push({ childOrganizationId: mongoose.Types.ObjectId(orgId) });
                    }
                    if (programId) {
                        andCond.push({ allPgmIds: mongoose.Types.ObjectId(programId) });
                        menteeAndCond.push({ programId: mongoose.Types.ObjectId(programId) });
                        mentorAndCond.push({ programId: mongoose.Types.ObjectId(programId) });
                    }

                    const result = await models.templateCurriculum.aggregate([
                        { $match: { $and: andCond } },
                        { $project: { title: 1, allPgmIds: 1 } },
                        {
                            $lookup: {
                                from: 'UserCurriculum',
                                let: { curriculumId: '$_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $and: menteeAndCond,
                                        },
                                    },
                                    { $group: { _id: '$userId' } },
                                ],
                                as: 'userCurriculum',
                            },
                        },
                        {
                            $lookup: {
                                from: 'UserCurriculum',
                                let: { curriculumId: '$_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $and: mentorAndCond,
                                        },
                                    },
                                    { $group: { _id: '$userId' } },
                                    {
                                        $lookup: {
                                            from: 'UserModel',
                                            let: { menteeId: '$_id' },
                                            pipeline: [
                                                { $match: { $expr: { $eq: ['$_id', '$$menteeId'] } } },
                                                { $project: { enrolledInPrograms: 1 } },
                                                {
                                                    $unwind: {
                                                        path: '$enrolledInPrograms',
                                                        preserveNullAndEmptyArrays: true,
                                                    },
                                                },
                                                { $project: { mentorId: '$enrolledInPrograms.mentorId' } },
                                            ],
                                            as: 'userDetail',
                                        },
                                    },
                                    { $unwind: { path: '$userDetail', preserveNullAndEmptyArrays: true } },
                                    { $project: { mentorId: '$userDetail.mentorId' } },
                                    { $group: { _id: '$mentorId' } },
                                ],
                                as: 'mentors',
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                programs: { $size: '$allPgmIds' },
                                enrolledMentees: { $size: '$userCurriculum' },
                                mentors: { $size: '$mentors' },
                            },
                        },
                        { $sort: { enrolledMentees: -1 } },
                        { $skip: skipDocs },
                        { $limit: limitDocs },
                    ]);
                    return result;
                } catch (err) {
                    console.log('error from top templates', err);
                    throw new Error(err);
                }
            }
        ),
    },
};
