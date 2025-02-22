/* eslint-disable no-async-promise-executor */

// import { setActiveCurriculum } from '../../lib/fetch';
import { uniq } from 'lodash';
import mongoose from 'mongoose';
import { assignGuideNotification } from '../../lib/notificationOps';

export const createTasks = (
    models,
    curriculumId,
    userCurriculum,
    milestoneId,
    programId,
    me,
    templateTasks,
    role,
    mentee
) => {
    const setData = {
        mentee: { assignedTo: mentee.id, assignedToRole: 'mentee' },
        mentor: { assignedTo: mentee.enrolledInPrograms[0].mentorId, assignedToRole: 'mentor' },
        programManager: { assignedTo: mentee.enrolledInPrograms[0].programManagerId, assignedToRole: 'programManager' },
        matchSupportSpecialist: {
            assignedTo: mentee.enrolledInPrograms[0].matchSupportSpecialistId,
            assignedToRole: 'matchSupportSpecialist',
        },
    };
    const tasks = templateTasks.map((task, i) => {
        return {
            title: task.title,
            description: task.description,
            attachments: task.attachments,
            // dueDateSetType: task.dueDateSetType,
            // relativeDueDateOption: task.relativeDueDateOption,
            // dueDate: task.dueDate,
            // goalId: task.goalId,
            curriculumId,
            userCurriculumId: userCurriculum._id,
            milestoneId,
            childOrganizationId: mentee.enrolledInPrograms[0].organizationId,
            programId,
            order: task.order || i + 1,
            menteeId: mentee.id,
            ...setData[task.assignedTo],
            createdBy: me.id,
            templateTaskCreatedDate: task.createdDate,
            createdDate: new Date(),
            updatedDate: new Date(),
        };
    });
    return models.tasks.insertMany(tasks);
};

export const createMilestonesAndTasks = (
    models,
    curriculumId,
    userCurriculum,
    programId,
    me,
    templateMilestones,
    role,
    mentee
) =>
    new Promise(async (resolve) => {
        try {
            const milestoneTemplateTaskPromises = [];
            const milestones = [];
            templateMilestones.forEach((milestone, i) => {
                milestones.push({
                    title: milestone.title,
                    description: milestone.description,
                    badgeImage: milestone.badgeImage,
                    activityBadgeId: milestone.activityBadgeId,
                    templateMilestoneId: milestone._id,
                    curriculumId,
                    userCurriculumId: userCurriculum._id,
                    childOrganizationId: mentee.enrolledInPrograms[0].organizationId,
                    programId,
                    order: milestone.order || i + 1,
                    menteeId: mentee.id,
                    assignedTo: mentee.id,
                    assignedToRole: role,
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
                            createdDate: 1,
                        }
                    )
                );
            });
            // console.log('milestones', milestones);
            const [milestoneTemplateTask, createdMilestones] = await Promise.all([
                Promise.all(milestoneTemplateTaskPromises),
                models.milestone.insertMany(milestones),
            ]);
            await assignGuideNotification(me, mentee, userCurriculum, createdMilestones);
            // console.log('createdMilestones', createdMilestones);
            const createTasksPromise = [];
            createdMilestones.forEach((createdMilestone, i) => {
                if (milestoneTemplateTask[i] && milestoneTemplateTask[i].length > 0)
                    createTasksPromise.push(
                        createTasks(
                            models,
                            curriculumId,
                            userCurriculum,
                            createdMilestone._id,
                            programId,
                            me,
                            milestoneTemplateTask[i],
                            role,
                            mentee
                        )
                    );
            });
            await Promise.all(createTasksPromise);
            resolve(true);
        } catch (error) {
            // console.log('error', error)
            resolve(true);
        }
    });

export const setActiveProgramOfTheMentee = (models, curriculumId, programId, me, mentee) =>
    new Promise(async (resolve) => {
        try {
            // await models.userCurriculum.updateMany({ userId: mentee._id }, { $set: { activeCurriculum: false } });
            const curriculum = await models.templateCurriculum.findById(curriculumId, {
                title: 1,
                description: 1,
                licenseRequired: 1,
                evidenceBased: 1,
                pointsPerTask: 1,
                guidecategoryId: 1,
                gradeId: 1,
                ageGrpId: 1,
                programTypeId: 1,
                parentOrganizationId: 1,
            });
            const [userCurriculum] = await Promise.all([
                new models.userCurriculum({
                    title: curriculum.title,
                    description: curriculum.description,
                    licenseRequired: curriculum.licenseRequired,
                    evidenceBased: curriculum.evidenceBased,
                    pointsPerTask: curriculum.pointsPerTask,
                    guidecategoryId: curriculum.guidecategoryId,
                    gradeId: curriculum.gradeId,
                    ageGrpId: curriculum.ageGrpId,
                    programTypeId: curriculum.programTypeId,
                    userId: mentee.id,
                    curriculumId,
                    childOrganizationId: mentee.enrolledInPrograms[0].organizationId,
                    parentOrganizationId: curriculum.parentOrganizationId,
                    programId,
                    pinned: false,
                    createdBy: me.id,
                }).save(),
                // setActiveCurriculum({ menteeId: mentee._id, curriculumId, programId }),
            ]);
            resolve(userCurriculum);
        } catch (error) {
            resolve(true);
        }
    });

/* export const getDueDate = (models,mentee,task,relativeDueDateOption,curriculumDetails) =>{
    try{
    let methods={
        "After start of mentoring connection":()=>new Promise((resolve)=>{
            try{
            return mentee.enrolledInPrograms.createDate
        }catch(error){
            console.log("Relative task not found")
            resolve()
        }   
        }),
        "Before end of mentoring connection":()=>new Promise((resolve)=>{
            try{
            return curriculumDetails.dueDate
            }catch(error){
                     resolve()
                 }
        }),
        "After completion of a task":()=>{
            return models.task.findById(relativeDueDateOption.taskId,{dueDate:1})
        }
    }
    return methods[curriculumDetails.title]()

}catch(error){
    console.log("Relative task not found")
    resolve()
}
} */

export const setProgramIds = (curriculum, me, programId) => {
    const assignedPgmIds = curriculum.assignedPgmIds.length > 0 ? curriculum.assignedPgmIds : [];
    const mssIds = curriculum.mssIds.length > 0 ? curriculum.mssIds : [];
    switch (me.role[0]) {
        case 'programManager':
            assignedPgmIds.push(programId);
            break;
        case 'matchSupportSpecialist':
            mssIds.push(me.id);
            break;
        default:
            break;
    }

    return {
        assignedPgmIds: uniq(assignedPgmIds.map((pgmId) => pgmId.toString())),
        mssIds: uniq(mssIds.map((mssId) => mssId.toString())),
    };
};

export const getUpdateObject = (me, programId) => {
    let updateObject = {};
    switch (me.role[0]) {
        case 'programManager':
            updateObject = {
                $addToSet: {
                    allPgmIds: mongoose.Types.ObjectId(programId),
                    assignedPgmIds: mongoose.Types.ObjectId(programId),
                },
            };
            break;
        case 'matchSupportSpecialist':
            updateObject = {
                $addToSet: { allPgmIds: mongoose.Types.ObjectId(programId), mssIds: mongoose.Types.ObjectId(me.id) },
            };
            break;
        default:
            break;
    }

    return updateObject;
};
