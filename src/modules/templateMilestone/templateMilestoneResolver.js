/* eslint-disable no-console */

import { combineResolvers } from 'graphql-resolvers';
import { forEach } from 'lodash';
import { edtDelMile, hierarchicalAccessForCurriculumTemplate } from '../auth';

export default {
    Mutation: {
        addMilestoneToTemplate: combineResolvers(
            hierarchicalAccessForCurriculumTemplate,
            async (
                parent,
                { curriculumId, activityBadgeId, position, title, description, badgeImage },
                { models, me }
            ) => {
                try {
                    const milestoneExists = await models.templateMilestone.find({ curriculumId });
                    forEach(milestoneExists, (milestone) => {
                        if (milestone.title.toLowerCase() === title.trim().toLowerCase())
                            throw new Error('Badge with the same title already exists');
                    });

                    let pos;
                    if (!position) {
                        const milestone = await models.templateMilestone
                            .findOne({ curriculumId }, { order: 1 })
                            .sort({ order: -1 });
                        pos = milestone.order + 1;
                    } else {
                        pos = position;
                        await models.templateMilestone.updateMany(
                            {
                                curriculumId,
                                order: { $gte: pos },
                            },
                            { $inc: { order: 1 } }
                        );
                    }

                    return new models.templateMilestone({
                        curriculumId,
                        activityBadgeId,
                        order: pos,
                        title,
                        description,
                        badgeImage,
                        createdBy: me.id,
                    }).save();
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
        editMilestone: combineResolvers(
            edtDelMile,
            async (parent, { milestoneId, title, activityBadgeId, description, badgeImage }, { models }) => {
                try {
                    const milestone = await models.templateMilestone.findById(milestoneId);
                    if (!milestone) throw new Error('Milestone template not found');

                    // const getActivityBadge = await models.activityBadge.findById(activityBadgeId);
                    // if (!getActivityBadge) throw new Error('Badge not found');

                    if (activityBadgeId) milestone.activityBadgeId = activityBadgeId;
                    if (title) milestone.title = title;
                    if (description) milestone.description = description;
                    if (badgeImage) milestone.badgeImage = badgeImage;
                    milestone.updatedDate = new Date();
                    return milestone.save();
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
        deleteMilestone: combineResolvers(edtDelMile, async (parent, { milestoneId }, { models }) => {
            try {
                const [deleteResult] = await Promise.all([
                    models.templateMilestone.deleteOne({ _id: milestoneId }),
                    models.templateTasks.deleteMany({ milestoneId }),
                ]);
                let message;
                let status = false;
                if (deleteResult.deletedCount) {
                    status = true;
                    message = 'Milestone template deleted successfully';
                }
                return { status, message };
            } catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        }),
    },
};
