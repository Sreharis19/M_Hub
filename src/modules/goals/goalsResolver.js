/* eslint-disable no-console */
import { combineResolvers } from 'graphql-resolvers';
import mongoose from 'mongoose';
import { getUserDetail } from '../../lib/fetch';
import { hierarchicalGoalEditAccess, accessToAddGoal, isAuthenticated } from '../auth';

export default {
    Query: {
        listGoal: combineResolvers(isAuthenticated, async (parent, { menteeId }, { models, me }) => {
            try {
                const andCond = [{ $expr: { $eq: ['$goalId', '$$goalId'] } }];
                if (me.role[0] === 'mentee')
                    andCond.push({
                        $or: [
                            { $expr: { $eq: ['$assignedTo', mongoose.Types.ObjectId(menteeId)] } },
                            { assignedTo: { $exists: false } },
                            { assignedTo: null },
                        ],
                    });

                const listGoal = await models.goals.aggregate([
                    { $match: { userId: mongoose.Types.ObjectId(menteeId) } },
                    { $project: { title: 1, description: 1 } },
                    {
                        $lookup: {
                            from: 'Tasks',
                            let: { goalId: '$_id' },
                            pipeline: [
                                { $match: { $and: andCond } },
                                {
                                    $project: {
                                        title: 1,
                                        description: 1,
                                        attachments: 1,
                                        completed: 1,
                                        dueDate: 1,
                                        assignedTo: 1,
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
                                                            $expr: {
                                                                $ne: ['$senderId', mongoose.Types.ObjectId(me.id)],
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
                            as: 'activities',
                        },
                    },
                ]);
                return listGoal;
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),
    },

    Mutation: {
        addGoal: combineResolvers(
            accessToAddGoal,
            async (parent, { title, description, userId }, { models, me, loaders }) => {
                try {
                    const mentee = await getUserDetail({ id: userId });
                    let childOrgId = mentee.enrolledInOrganizations.map((org) => org.organizationId);
                    [childOrgId] = [...new Set([...childOrgId])];
                    let programId = mentee.enrolledInPrograms.map((program) => program.programId);
                    [programId] = [...new Set([...programId])];
                    const organization = await loaders.organization.load(childOrgId.toString());
                    const goal = await new models.goals({
                        title,
                        description,
                        userId,
                        organizationId: organization.parentOrganizationId,
                        childOrganizationId: childOrgId,
                        programId,
                        createdBy: me.id,
                    }).save();
                    return goal;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        editGoal: combineResolvers(
            hierarchicalGoalEditAccess,
            async (parent, { goalId, title, description }, { models }) => {
                try {
                    const goal = await models.goals.findById(goalId);
                    if (title) goal.title = title;
                    if (description) goal.description = description;
                    goal.updatedDate = new Date();
                    return await goal.save();
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
    },
};
