/* eslint-disable no-await-in-loop */
/* eslint-disable no-loop-func */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-async-promise-executor */
/* eslint-disable import/prefer-default-export */
import mongoose from 'mongoose';

export const createTasks = (models, curriculumId, milestoneId, me, templateTasks) => {
    const tasks = templateTasks.map((task) => {
        return {
            title: task.title,
            description: task.description,
            attachments: task.attachments,
            curriculumId,
            milestoneId,
            masterTaskId: task._id,
            assignedTo: task.assignedTo,
            createdBy: me.id,
            createdDate: new Date(),
            updatedDate: new Date(),
        };
    });
    return models.templateTasks.insertMany(tasks);
};

export const cloneTemplate = (templateMilestones, clonedTemplate, curriculumId, models, me) =>
    new Promise(async (resolve) => {
        try {
            const milestoneTemplateTaskPromises = [];
            const milestoneClone = [];
            templateMilestones.forEach((milestone, i) => {
                milestoneClone.push({
                    title: milestone.title,
                    description: milestone.description,
                    badgeImage: milestone.badgeImage,
                    activityBadgeId: milestone.activityBadgeId,
                    masterMilestoneId: milestone._id,
                    curriculumId: clonedTemplate._id,
                    order: milestone.order || i + 1,
                    createdBy: me.id,
                });
                milestoneTemplateTaskPromises.push(
                    models.templateTasks.find(
                        { curriculumId, milestoneId: milestone._id },
                        {
                            title: 1,
                            description: 1,
                            order: 1,
                            milestoneId: 1,
                            attachments: 1,
                            assignedTo: 1,
                            dueDateSetType: 1,
                            relativeDueDateOption: 1,
                            dueDate: 1,
                            goalId: 1,
                        }
                    )
                );
            });
            const [milestoneTemplateTask, createdMilestones] = await Promise.all([
                Promise.all(milestoneTemplateTaskPromises),
                models.templateMilestone.insertMany(milestoneClone),
            ]);
            const createTasksPromise = [];
            createdMilestones.forEach((createdMilestone, i) => {
                if (milestoneTemplateTask[i] && milestoneTemplateTask[i].length > 0)
                    createTasksPromise.push(
                        createTasks(
                            models,
                            clonedTemplate._id,
                            createdMilestone._id,
                            // programId,
                            me,
                            milestoneTemplateTask[i]
                            // role,
                            // mentee
                        )
                    );
            });
            await Promise.all(createTasksPromise);
            resolve(true);
        } catch (error) {
            resolve(true);
        }
    });

export const updateTasks = (models, curriculumId, milestoneId, createdBy, templateTasks) => {
    const taskUpdatePromise = [];
    templateTasks.forEach((task) => {
        taskUpdatePromise.push(
            models.templateTasks.findOneAndUpdate(
                {
                    curriculumId: mongoose.Types.ObjectId(curriculumId),
                    milestoneId: mongoose.Types.ObjectId(milestoneId),
                    masterTaskId: mongoose.Types.ObjectId(task._id),
                },
                {
                    $set: {
                        title: task.title,
                        description: task.description,
                        attachments: task.attachments,
                        curriculumId,
                        milestoneId,
                        masterTaskId: task._id,
                        assignedTo: task.assignedTo,
                        createdBy,
                        updatedDate: new Date(),
                    },
                },
                { upsert: true, returnNewDocument: true }
            )
        );
    });
    return taskUpdatePromise;
};

export const updateMilestones = async (clonedTemplates, masterMilestones, models) => {
    try {
        const milestoneUpdatePromise = [];
        const masterTaskPromises = [];

        let template;
        for (template of clonedTemplates) {
            masterMilestones.forEach((milestone) => {
                // console.log('masterMilestoneId', milestone._id);
                milestoneUpdatePromise.push(
                    models.templateMilestone.findOneAndUpdate(
                        {
                            curriculumId: mongoose.Types.ObjectId(template._id),
                            masterMilestoneId: mongoose.Types.ObjectId(milestone._id),
                        },
                        {
                            $set: {
                                title: milestone.title,
                                description: milestone.description,
                                badgeImage: milestone.badgeImage,
                                activityBadgeId: milestone.activityBadgeId,
                                masterMilestoneId: milestone._id,
                                curriculumId: template._id,
                                order: milestone.order,
                                updatedDate: new Date(),
                                createdBy: template.createdBy,
                            },
                        },
                        { upsert: true, returnNewDocument: true }
                    )
                );
                masterTaskPromises.push(
                    models.templateTasks.find(
                        { milestoneId: milestone._id },
                        {
                            title: 1,
                            description: 1,
                            order: 1,
                            milestoneId: 1,
                            attachments: 1,
                            assignedTo: 1,
                            dueDateSetType: 1,
                            relativeDueDateOption: 1,
                            dueDate: 1,
                            goalId: 1,
                        }
                    )
                );
            });
            const [updatedMilestones, masterTasks] = await Promise.all([
                Promise.all(milestoneUpdatePromise),
                Promise.all(masterTaskPromises),
            ]);

            const updateTasksPromises = [];
            updatedMilestones.forEach((updatedMilestone, i) => {
                if (masterTasks[i] && masterTasks[i].length > 0)
                    updateTasksPromises.push(
                        updateTasks(models, template._id, updatedMilestone._id, template.createdBy, masterTasks[i])
                    );
            });
            await Promise.all(updateTasksPromises.map((updateTasksPromise) => Promise.all(updateTasksPromise)));
        }
    } catch (err) {
        console.log(err);
    }
};
