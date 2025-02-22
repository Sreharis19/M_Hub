import { combineResolvers } from 'graphql-resolvers';
import mongoose from 'mongoose';
import { isAuthenticated } from '../auth';
import { commentNotification } from '../../lib/notificationOps';

/* eslint-disable no-console */
export default {
    Query: {
        listCommentsForATask: combineResolvers(isAuthenticated, async (parent, { taskId, skip, limit }, { models }) => {
            try {
                const skipDocs = skip || 0;
                const limitDocs = limit || 10;
                const getComments = await models.taskComments.aggregate([
                    { $match: { $and: [{ taskId: mongoose.Types.ObjectId(taskId) }] } },
                    { $sort: { createdDate: -1 } },
                    { $limit: limitDocs },
                    { $skip: skipDocs },
                    {
                        $lookup: {
                            from: 'UserModel',
                            let: { userId: '$senderId' },
                            pipeline: [
                                { $match: { $and: [{ $expr: { $eq: ['$_id', '$$userId'] } }] } },
                                { $project: { firstName: 1, lastName: 1, profileImage: 1 } },
                            ],
                            as: 'userDetails',
                        },
                    },
                    { $unwind: '$userDetails' },
                    {
                        $project: {
                            commentText: 1,
                            readStatus: 1,
                            attachments: 1,
                            senderId: 1,
                            senderFirstName: '$userDetails.firstName',
                            senderLastName: '$userDetails.lastName',
                            senderProfileImage: '$userDetails.profileImage',
                            createdBy: 1,
                            createdDate: 1,
                            updatedDate: 1,
                        },
                    },
                ]);
                const getCount = await models.taskComments.countDocuments({ taskId });
                return {
                    count: getCount,
                    data: getComments,
                };
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),
    },
    Mutation: {
        addComment: combineResolvers(
            isAuthenticated,
            async (parent, { taskId, commentText, attachments }, { models, me, loaders }) => {
                try {
                    const task = await models.tasks.findById(taskId);
                    if (!task) throw new Error('Task not found');
                    if (attachments && attachments.length > 0) {
                        attachments.forEach((attachment) => {
                            Object.assign(attachment, { createdBy: me.id });
                        });
                    }
                    const newComment = await new models.taskComments({
                        commentText,
                        readStatus: false,
                        childOrganizationId: task.childOrganizationId,
                        programId: task.programId,
                        milestoneId: task.milestoneId,
                        curriculumId: task.curriculumId,
                        userCurriculumId: task.userCurriculumId,
                        taskId: task._id,
                        senderId: me.id,
                        attachments,
                        createdBy: me.id,
                    }).save();

                    if (task.assignedTo) commentNotification(me, task, loaders);
                    return newComment;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        editComment: combineResolvers(
            isAuthenticated,
            async (parent, { commentId, commentText, attachments }, { models, me }) => {
                try {
                    const comment = await models.taskComments.findById(commentId);
                    if (!comment) throw new Error('Comment not found');
                    if (attachments && attachments.length > 0) {
                        attachments.forEach((attachment) => {
                            Object.assign(attachment, { createdBy: me.id });
                        });
                        comment.attachments = attachments;
                    }
                    if (commentText) comment.commentText = commentText;
                    comment.updatedDate = new Date();
                    await comment.save();
                    return comment;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        markAsRead: combineResolvers(isAuthenticated, async (parent, { taskId }, { models, me }) => {
            try {
                await models.taskComments.updateMany(
                    { taskId },
                    { $set: { readStatus: true, updatedDate: new Date() }, $addToSet: { readByUsers: me.id } }
                );
                return {
                    status: true,
                    message: 'Comment marked as read',
                };
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),
    },
};
