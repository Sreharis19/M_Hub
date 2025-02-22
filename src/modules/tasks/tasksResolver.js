/* eslint-disable no-console */
import { combineResolvers } from 'graphql-resolvers';
import { getUserDetail, getUsers } from '../../lib/fetch';
import { assignedToCheck, grantBadge } from './operations';
import { hierarchicalActivityEditAccess, isAuthenticated } from '../auth';

export default {
    Query: {
        getAssignedToList: combineResolvers(isAuthenticated, async (parent, { menteeId }) => {
            try {
                let people = [];
                const mentee = await getUserDetail({ id: menteeId });
                people = mentee.enrolledInPrograms.map((program) => program.mentorId);
                people = [...new Set([...people])];
                const result = await getUsers({ ids: people });
                result.push({ ...mentee, _id: mentee.id || mentee._id });
                result.forEach((res) => {
                    [res.role] = res.role;
                });
                return result;
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),

        getTask: combineResolvers(isAuthenticated, async (parent, { taskId }, { models }) => {
            try {
                const task = await models.tasks.findById(taskId, {
                    _id: 1,
                    title: 1,
                    attachments: 1,
                    goalId: 1,
                    description: 1,
                    completed: 1,
                    dueDate: 1,
                    assignedTo: 1,
                });
                return task;
            } catch (err) {
                console.log(err);
                throw new Error(err.message);
            }
        }),

        getDueTasks: combineResolvers(isAuthenticated, async (parent, { skip }, { models }) => {
            try {
                const users = await models.tasks.aggregate([
                    {
                        $match: {
                            $and: [
                                { completed: false },
                                { dueDate: { $exists: true } },
                                { dueDate: { $ne: null } },
                                { assignedTo: { $exists: true } },
                                { assignedTo: { $ne: null } },
                                { assignedToRole: { $in: ['mentee', 'mentor'] } },
                                {
                                    $expr: {
                                        $lt: [
                                            {
                                                $dayOfYear: {
                                                    date: '$dueDate',
                                                    timezone: 'America/New_York',
                                                },
                                            },
                                            {
                                                $dayOfYear: {
                                                    date: new Date(),
                                                    timezone: 'America/New_York',
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                    { $group: { _id: '$assignedTo', size: { $sum: 1 } } },
                    { $sort: { _id: -1 } },
                    { $skip: skip },
                    { $limit: 10 },
                ]);
                return users;
            } catch (err) {
                console.log(err);
                throw new Error(err.message);
            }
        }),
    },
    Mutation: {
        editAssignedTask: combineResolvers(
            hierarchicalActivityEditAccess,
            async (
                parent,
                { taskId, title, description, assignedTo, completed, dueDate, attachments, goalId },
                { models, me }
            ) => {
                try {
                    const task = await models.tasks.findById(taskId);
                    if (!task) throw new Error('Task not found');
                    if (title) task.title = title;
                    if (description || description === '') task.description = description;
                    if (dueDate) task.dueDate = dueDate;
                    if (attachments) task.attachments = attachments;
                    if (goalId) task.goalId = goalId;
                    if (completed === true) {
                        task.completed = completed;
                        task.completedBy = me.id;
                        await task.save();

                        const goalTask = await models.tasks.find({ goalId: task.goalId });
                        const taskStatus = goalTask.every((element) => element.completed);
                        if (taskStatus) {
                            /* update goal add completed Date */
                            await models.goals.updateOne({ _id: task.goalId }, { $set: { completedDate: new Date() } });
                            /* goal update ends here */
                        }

                        const otherTasks = await models.tasks.find({ milestoneId: task.milestoneId });
                        const status = otherTasks.every((element) => element.completed);
                        if (status) {
                            grantBadge(task.milestoneId, models, me, 'activity');
                            // const milestone = await models.milestone.findById(task.milestoneId);
                            // milestone.isBadgeGranted = true;
                            // milestone.badgeGrantedBy = me.id;
                            // milestone.badgeGrantedTime = new Date();
                            // milestone.grantedByGrantButton = false;
                            // milestone.save();
                        }
                    } else if (completed === false) {
                        task.completed = completed;
                        task.completedBy = null;
                    }
                    if (assignedTo) {
                        task.assignedTo = assignedTo;
                        const user = await getUserDetail({ id: assignedTo });
                        if (user) {
                            assignedToCheck(user, task);
                            [task.assignedToRole] = user.role;
                        }
                    }
                    task.updatedDate = new Date();
                    return task.save();
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        addActivityToGoal: combineResolvers(
            isAuthenticated,
            async (parent, { goalId, title, description, order, dueDate, assignedTo }, { models, me, loaders }) => {
                try {
                    const goal = await models.goals.findById(goalId);
                    let user = null;
                    if (assignedTo) user = await loaders.user.load(assignedTo.toString());
                    const activity = await new models.tasks({
                        goalId,
                        title,
                        description,
                        order,
                        childOrganizationId: goal.childOrganizationId,
                        programId: goal.programId,
                        menteeId: goal.userId,
                        assignedTo,
                        dueDate,
                        assignedToRole: user ? user.role[0] : null,
                        createdBy: me.id,
                    }).save();
                    return activity;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        addAssignedActivity: combineResolvers(
            isAuthenticated,
            // hierarchicalActivityAddAccess,
            async (
                parent,
                { milestoneId, title, description, dueDate, goalId, assignedTo },
                { models, me, loaders }
            ) => {
                try {
                    let user = null;
                    if (assignedTo) user = await loaders.user.load(assignedTo.toString());
                    const milestone = await models.milestone.findById(milestoneId);
                    const task = await new models.tasks({
                        title,
                        description,
                        dueDate,
                        goalId,
                        curriculumId: milestone.curriculumId,
                        userCurriculumId: milestone.userCurriculumId,
                        milestoneId,
                        childOrganizationId: milestone.childOrganizationId,
                        programId: milestone.programId,
                        menteeId: milestone.menteeId,
                        assignedTo,
                        assignedToRole: user ? user.role[0] : null,
                        createdBy: me.id,
                    }).save();
                    return task;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
    },

    getTask: {
        assignedToData: async (task, args, { loaders }) => {
            if (!task.assignedTo) return null;
            const mentee = await loaders.user.load(task.assignedTo.toString());
            return { ...mentee, role: mentee.role[0] };
        },
        goalData: async (task, args, { loaders }) => {
            let goal = null;
            if (task.goalId) goal = await loaders.goals.load(task.goalId.toString());
            return goal;
        },
    },
};
