/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable import/prefer-default-export */
import _, { capitalize, find } from 'lodash';
import { aws } from '../aws-sdk';
import { createNotification } from './createNotification';
import { getEmails } from './fetch';

const sqs = new aws.SQS({ apiVersion: '2012-11-05' });
const capitalizeName = (me) => {
    let fullName = '';
    if (me.firstName) fullName = capitalize(me.firstName);
    if (me.lastName) fullName = `${fullName} ${capitalize(me.lastName)}`;
    return fullName;
};

export const assignGuideNotification = async (me, mentee, curriculum, milestones) => {
    const programData = mentee.enrolledInPrograms.find((pgm) => pgm.activeProgram === true);
    const users = [
        programData.mentorId.toString(),
        programData.programManagerId.toString(),
        programData.matchSupportSpecialistId.toString(),
        mentee.id.toString(),
    ];
    const eventData = {
        _id: curriculum._id,
        title: curriculum.title,
        menteeId: mentee.id,
        openBadgeId: milestones.length > 0 ? milestones[0]._id : null,
    };
    const userEmails = await getEmails({ ids: users });
    users.forEach((userId) => {
        let notificationInput = {
            message: `A guide has been assigned to ${capitalizeName(mentee)} by ${capitalizeName(me)}`,
            event: 'ASSIGNED_GUIDE',
            createdDate: new Date(),
            eventData: JSON.stringify(eventData),
            createdById: me.id,
        };
        let params = {
            QueueUrl: process.env.EMAIL_QUEUE_URL,
        };
        if (userId !== me.id.toString()) {
            const user = find(userEmails, ['_id', userId]);
            if (userId === mentee.id.toString()) {
                notificationInput = { ...notificationInput, message: 'You have a new guide to view' };
                params = {
                    ...params,
                    MessageBody: JSON.stringify({
                        type: 'NEW_GUIDE_VIEW',
                        fields: {
                            username: `${capitalizeName(user)}`,
                        },
                        to: user.email,
                    }),
                };
            } else {
                params = {
                    ...params,
                    MessageBody: JSON.stringify({
                        type: 'NEW_GUIDE_ASSIGNED',
                        fields: {
                            username: `${capitalizeName(user)}`,
                            assignedName: capitalizeName(mentee),
                            assigneeName: capitalizeName(me),
                        },
                        to: user.email,
                    }),
                };
            }

            notificationInput = { ...notificationInput, userId };
            createNotification(notificationInput);
            if (find(userEmails, ['_id', userId]).sendEmailNotification) {
                sqs.sendMessage(params, (err, data) => {
                    if (err) console.log('Error', err);
                    else console.log('Success', data);
                });
            }
        }
    });
};

export const commentNotification = async (me, task, loaders) => {
    const [mentee, curriculum, milestone, goal, user] = await Promise.all([
        loaders.user.load(task.assignedTo.toString()),
        task.userCurriculumId ? loaders.userCurriculum.load(task.userCurriculumId.toString()) : null,
        task.milestoneId ? loaders.milestone.load(task.milestoneId.toString()) : null,
        task.goalId ? loaders.goals.load(task.goalId.toString()) : null,
        loaders.user.load(task.menteeId.toString()),
    ]);

    const eventData = {
        curriculumId: curriculum ? curriculum._id : null,
        curriculumTitle: curriculum ? curriculum.title : null,
        goalId: task.goalId ? task.goalId : null,
        goalTitle: goal ? goal.title : null,
        milestoneId: task.milestoneId ? task.milestoneId : null,
        milestoneTitle: milestone ? milestone.title : null,
        taskTitle: task.title,
        taskId: task._id,
        menteeDetails: {
            _id: mentee._id,
            firstName: mentee.firstName,
            lastName: mentee.lastName,
            role: mentee.role,
            profileImage: mentee.profileImage,
            firestoreId: mentee.firestoreId,
        },
        userDetails: { ...user },
    };
    let notificationInput = {
        message: `A comment has been added to ${task.title} by ${capitalizeName(me)}`,
        event: 'ADDED_COMMENT',
        createdDate: new Date(),
        eventData: JSON.stringify(eventData),
        createdById: me.id,
    };
    let params = {
        QueueUrl: process.env.EMAIL_QUEUE_URL,
    };
    const userEmails = await getEmails({
        ids: [task.assignedTo.toString(), me.enrolledInPrograms[0] && me.enrolledInPrograms[0].mentorId.toString()],
    });
    let sendEmailNotification = false;
    switch (me.role[0]) {
        case 'mentor':
            if (task.assignedTo.toString() === me.id.toString()) break;
            notificationInput = { ...notificationInput, userId: task.assignedTo };
            params = {
                ...params,
                MessageBody: JSON.stringify({
                    type: 'TASK_COMMENT_ADDED',
                    fields: {
                        tasktitle: task.title,
                        name: capitalizeName(me),
                        username: capitalizeName(find(userEmails, ['_id', task.assignedTo.toString()])),
                    },
                    to: find(userEmails, ['_id', task.assignedTo.toString()]).email,
                }),
            };
            sendEmailNotification = find(userEmails, ['_id', task.assignedTo.toString()]).sendEmailNotification;
            break;
        case 'mentee':
            notificationInput = { ...notificationInput, userId: me.enrolledInPrograms[0].mentorId };
            params = {
                ...params,
                MessageBody: JSON.stringify({
                    type: 'TASK_COMMENT_ADDED',
                    fields: {
                        tasktitle: task.title,
                        name: capitalizeName(me),
                        username: capitalizeName(
                            find(userEmails, ['_id', me.enrolledInPrograms[0].mentorId.toString()])
                        ),
                    },
                    to: find(userEmails, ['_id', me.enrolledInPrograms[0].mentorId.toString()]).email,
                }),
            };
            sendEmailNotification = find(userEmails, ['_id', me.enrolledInPrograms[0].mentorId.toString()])
                .sendEmailNotification;
            break;
        default:
            notificationInput = { ...notificationInput, userId: task.assignedTo };
            params = {
                ...params,
                MessageBody: JSON.stringify({
                    type: 'TASK_COMMENT_ADDED',
                    fields: {
                        tasktitle: task.title,
                        name: capitalizeName(me),
                        username: capitalizeName(find(userEmails, ['_id', task.assignedTo.toString()])),
                    },
                    to: find(userEmails, ['_id', task.assignedTo.toString()]).email,
                }),
            };
            sendEmailNotification = find(userEmails, ['_id', task.assignedTo.toString()]).sendEmailNotification;
    }
    createNotification(notificationInput);
    if (sendEmailNotification) sqs.sendMessage(params, () => console.log('Email Sending payload pushed to queue'));
    return null;
};
