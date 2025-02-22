/* eslint-disable no-console */
import { combineResolvers } from 'graphql-resolvers';
import mongoose from 'mongoose';
import { getAccessiblePrograms, getAccessibleOrganizations, getUserDetail } from '../../lib/fetch';
import {
    /*  createMilestonesForAllUsers,
    createTasksForMentees,
    createTasksForMentors,
    createTasksForProgramManager,
    createTasksForMatchSupportSpecialist, */
    setActiveProgramOfTheMentee,
    createMilestonesAndTasks,
    getUpdateObject,
} from './assignToProgramMethods';

import { isRoleWithAccessOrganizationalTemplate, accessToMentee, isAuthenticated } from '../auth';

export default {
    Query: {
        getAccessiblePrograms: combineResolvers(
            isRoleWithAccessOrganizationalTemplate,
            async (parent, { userId, orgId, search }) => {
                try {
                    return getAccessiblePrograms({
                        organizationId: orgId,
                        id: userId,
                        search,
                    });
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
        getAccessibleOrganizations: combineResolvers(
            isRoleWithAccessOrganizationalTemplate,
            async (parent, { userId, search }) => {
                try {
                    const orgs = await getAccessibleOrganizations({
                        id: userId,
                        search,
                    });
                    const parentOrgs = [
                        '5fbf3eae3a6e102822b4800d',
                        '5fbf3fed3a6e102822b48010',
                        '5fd8a15c6beb66591727c348',
                        '60193fc0c7ccb77d1e045b03',
                    ];
                    const childOrgs = orgs.filter((org) => {
                        if (!parentOrgs.includes(org._id)) return org;
                        return null;
                    });
                    return childOrgs;
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
    },
    Mutation: {
        // assignToPrograms: combineResolvers(
        //     accessToProgram,
        //     async (parent, { programId, curriculumId }, { models, me }) => {
        //         try {
        //             // let curriculumDetails = await models.templateCurriculum.findById(curriculumId,{ageGrpId:1,gradeId:1,dueDate:1})
        //             const [mentees, templateMilestones] = await Promise.all([
        //                 getAllMenteesInAProgram({ pgmId: programId, ageGrpId: '', gradeId: '' }),
        //                 models.templateMilestone.find(
        //                     { curriculumId },
        //                     { title: 1, description: 1, order: 1, badgeImage: 1 }
        //                 ),
        //             ]);
        //             const promises = mentees.map((mentee) =>
        //                 Promise.all([
        //                     setActiveProgramOfTheMentee(models, curriculumId, programId, me, mentee),
        //                     createMilestonesAndTasks(
        //                         models,
        //                         curriculumId,
        //                         programId,
        //                         me,
        //                         templateMilestones,
        //                         'mentee',
        //                         mentee
        //                     ),
        //                     // createMilestonesAndTasks(
        //                     //     models,
        //                     //     curriculumId,
        //                     //     programId,
        //                     //     me,
        //                     //     templateMilestones,
        //                     //     'mentor',
        //                     //     mentee
        //                     // ),
        //                     // createMilestonesAndTasks(
        //                     //     models,
        //                     //     curriculumId,
        //                     //     programId,
        //                     //     me,
        //                     //     templateMilestones,
        //                     //     'programManager',
        //                     //     mentee
        //                     // ),
        //                     // createMilestonesAndTasks(
        //                     //     models,
        //                     //     curriculumId,
        //                     //     programId,
        //                     //     me,
        //                     //     templateMilestones,
        //                     //     'matchSupportSpecialist',
        //                     //     mentee
        //                     // ),
        //                 ])
        //             );

        //             await Promise.all(promises);
        //             return { status: true, message: 'Successfully assigned to a program' };
        //         } catch (error) {
        //             console.log(error);
        //             throw new Error(error.message);
        //         }
        //     }
        // ),
        // assignToProgram: combineResolvers(
        //     isAuthenticated,
        //     async (parent, { curriculumId, programId }, { me, models }) => {
        //         try {
        //             const curriculum = await models.templateCurriculum.findById(curriculumId);
        //             if (!curriculum) throw new Error('Guide Not Found');
        //             if (curriculum.allPgmIds.length > 0) {
        //                 const allPgmIds = curriculum.allPgmIds.map((pgmId) => pgmId.toString());
        //                 curriculum.allPgmIds = uniq([...allPgmIds, programId]);
        //             } else curriculum.allPgmIds = [programId];
        //             const programObj = setProgramIds(curriculum, me, programId);
        //             curriculum.assignedPgmIds = programObj.assignedPgmIds;
        //             curriculum.mssIds = programObj.mssIds;
        //             curriculum.save();
        //             return { status: true, message: 'Successfully assigned to program' };
        //         } catch (error) {
        //             console.log('Assign to program error', error);
        //             throw new Error(error.message);
        //         }
        //     }
        // ),
        assignToPrograms: combineResolvers(
            isAuthenticated,
            async (parent, { curriculumIds, programId }, { me, models }) => {
                try {
                    const updateObject = getUpdateObject(me, programId);
                    await models.templateCurriculum.updateMany(
                        {
                            _id: { $in: curriculumIds.map((id) => mongoose.Types.ObjectId(id)) },
                        },
                        updateObject
                    );

                    return { status: true, message: 'Successfully assigned to program' };
                } catch (error) {
                    console.log('Assign to program error', error);
                    throw new Error(error.message);
                }
            }
        ),
        unassignFromProgram: combineResolvers(
            isAuthenticated,
            async (parent, { programId, curriculumId }, { models, loaders }) => {
                try {
                    const program = await loaders.program.load(programId.toString());
                    const mssIds = program.matchSupportSpecialistIds.map((id) => mongoose.Types.ObjectId(id));
                    await models.templateCurriculum.updateOne(
                        { _id: mongoose.Types.ObjectId(curriculumId) },
                        {
                            $pull: {
                                mssIds: { $in: mssIds },
                                assignedPgmIds: mongoose.Types.ObjectId(programId),
                                allPgmIds: mongoose.Types.ObjectId(programId),
                            },
                        }
                    );
                    return { status: true, message: 'Successfully unassigned from program' };
                } catch (err) {
                    console.log('unassign from program error', err);
                    throw new Error(err.message);
                }
            }
        ),
        assignCurriculumToMentee: combineResolvers(
            accessToMentee,
            async (parent, { menteeId, curriculumId }, { models, me }) => {
                try {
                    // let curriculumDetails = await models.templateCurriculum.findById(curriculumId,{ageGrpId:1,gradeId:1,dueDate:1})
                    const [mentee, templateMilestones] = await Promise.all([
                        // getUsers({ids:menteeIds }),
                        getUserDetail({ id: menteeId }),
                        models.templateMilestone.find(
                            { curriculumId },
                            { title: 1, description: 1, order: 1, badgeImage: 1, activityBadgeId: 1 }
                        ),
                    ]);
                    // let promises = mentees.map((mentee) =>
                    const programId = mentee.activeProgram;

                    const userCurriculum = await setActiveProgramOfTheMentee(
                        models,
                        curriculumId,
                        programId,
                        me,
                        mentee
                    );
                    await createMilestonesAndTasks(
                        models,
                        curriculumId,
                        userCurriculum,
                        programId,
                        me,
                        templateMilestones,
                        'mentee',
                        mentee
                    );

                    return { status: true, message: 'Successfully assigned mentees with a curriculum' };
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
        /* assignToProgramsv2: async (parent, { programId, curriculumId }, { models }) => {
        try {
            let me = { _id: '5e4b770a2d409016d128536d' };
            //let curriculumDetails = await models.templateCurriculum.findById(curriculumId,{ageGrpId:1,gradeId:1,dueDate:1})
            let [
                mentees,
                templateMilestones
            ] = await Promise.all([
                getAllMenteesInAProgram({ pgmId: programId, ageGrpId: '', gradeId: '' }),
                models.templateMilestone.find(
                    { curriculumId: curriculumId },
                    { title: 1, description: 1, order: 1 }
                ),
                models.templateTasks.find(
                    { curriculumId: curriculumId, assignedTo: 'mentee' },
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
                ),
                models.templateTasks.find(
                    { curriculumId: curriculumId, assignedTo: 'mentor' },
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
                ),
                models.templateTasks.find(
                    { curriculumId: curriculumId, assignedTo: 'programManager' },
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
                ),
                models.templateTasks.find(
                    { curriculumId: curriculumId, assignedTo: 'matchSupportSpecialist' },
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
                ),
            ]);

            let promises = mentees.map((mentee) =>
                Promise.all([
                    setActiveProgramOfTheMentee(models, curriculumId, programId, me, mentee),
                    createMilestonesForAllUsers(models, curriculumId, programId, me, templateMilestones, mentee),
                    createTasksForMentees(models, curriculumId, programId, me, menteeTemplateTasks, mentee),
                    createTasksForMentors(models, curriculumId, programId, me, mentorTemplateTasks, mentee),
                    createTasksForProgramManager(
                        models,
                        curriculumId,
                        programId,
                        me,
                        programManagerTemplateTasks,
                        mentee
                    ),
                    createTasksForMatchSupportSpecialist(
                        models,
                        curriculumId,
                        programId,
                        me,
                        matchSupportSpecialistTemplateTasks,
                        mentee
                    ),
                ])
            );

            await Promise.all(promises);
            return { status: true, message: 'Successfully assigned to a program' };
        } catch (error) {
            console.log(error);
            throw new Error(error.message);
        }
    }, */
    },
};
