/* eslint-disable no-console */
import mongoose from 'mongoose';
import { combineResolvers } from 'graphql-resolvers';
import { isRoleWithAccessOrganizationalTemplate } from '../auth';

export default {
    Query: {
        listRelativeDateOptions: combineResolvers(
            isRoleWithAccessOrganizationalTemplate,
            async (parent, { curriculumId }, { models }) => {
                try {
                    const relativeDateOptions = await models.relativeDateOption.find({ type: 'mentoring-connection' });
                    console.log('relativeDateOptions', relativeDateOptions);
                    const taskTypes = await models.relativeDateOption.aggregate([
                        { $match: { type: 'task' } },
                        {
                            $lookup: {
                                from: 'TemplateMilestone',
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: ['$curriculumId', mongoose.Types.ObjectId(curriculumId)] },
                                        },
                                    },
                                    { $project: { title: 1 } },
                                    {
                                        $lookup: {
                                            from: 'TemplateTasks',
                                            let: { milestoneId: '$_id' },
                                            pipeline: [
                                                { $match: { $expr: { $eq: ['$milestoneId', '$$milestoneId'] } } },
                                                { $project: { title: 1 } },
                                            ],
                                            as: 'tasks',
                                        },
                                    },
                                ],
                                as: 'milestones',
                            },
                        },
                    ]);
                    console.log('taskType', taskTypes);
                    taskTypes.forEach((taskType) => {
                        relativeDateOptions.push(taskType);
                    });
                    console.log('rel', relativeDateOptions);
                    return relativeDateOptions;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
    },
};
