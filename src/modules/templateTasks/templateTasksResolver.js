import { combineResolvers } from 'graphql-resolvers';
import mongoose from 'mongoose';
import { edtDelMile, edtDelTsk, isAuthenticated } from '../auth';

/* eslint-disable no-console */
export default {
    Query: {
        assignedTo: combineResolvers(isAuthenticated, async () => ['mentee', 'mentor']),
    },

    Mutation: {
        addTaskToMilestone: combineResolvers(
            edtDelMile,
            async (parent, { title, description, milestoneId, assignedTo, dueDate, attachments }, { models, me }) => {
                try {
                    const milestone = await models.templateMilestone.findById(milestoneId, { curriculumId: 1 });
                    if (!milestone) throw new Error('Milestone not found');

                    const task = await new models.templateTasks({
                        title,
                        description,
                        milestoneId,
                        curriculumId: milestone.curriculumId,
                        assignedTo,
                        dueDate,
                        attachments,
                        createdBy: me.id,
                    }).save();
                    return {
                        _id: task._id,
                        title: task.title,
                        description: task.description,
                    };
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        editTask: combineResolvers(
            edtDelTsk,
            async (parent, { taskId, title, description, assignedTo, dueDate, attachments }, { models }) => {
                try {
                    const templateTask = await models.templateTasks.findById(taskId);
                    if (!templateTask) throw new Error('Task not found');
                    if (title) templateTask.title = title;
                    if (description || description === '') templateTask.description = description;
                    if (assignedTo) templateTask.assignedTo = assignedTo;
                    if (dueDate) templateTask.dueDate = dueDate;
                    if (attachments) templateTask.attachments = attachments;
                    templateTask.updatedDate = new Date();
                    return templateTask.save();
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        deleteTask: combineResolvers(edtDelTsk, async (parent, { taskId }, { models }) => {
            try {
                await models.templateTasks.deleteOne({ _id: mongoose.Types.ObjectId(taskId) });
                return { status: true, message: 'Task template deleted successfully' };
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),
    },
};
