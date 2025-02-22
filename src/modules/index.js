import { gql } from 'apollo-server-express';
import templateCurriculum from './templateCurriculum';
import templateMilestone from './templateMilestone';
import templateTasks from './templateTasks';
import milestone from './milestone';
import tasks from './tasks';
import taskComments from './taskComments';
import goals from './goals';
import grades from './grades';
import ageGroup from './ageGroups';
import program from './program';
import organization from './organization';
import userCurriculum from './userCurriculum';
import activityBadge from './activityBadge';
import badgeCategory from './badgeCategory';
import guideCategory from './guideCategory';
import user from './users';
import programType from './programType';
import reports from './reports';
// import relativeDateOption from './relativeDateOptions';

const linkSchema = gql`
    directive @auth(requires: [String]) on OBJECT | FIELD_DEFINITION

    type Query {
        _: Boolean
    }

    type Mutation {
        _: Boolean
    }

    type Subscription {
        _: Boolean
    }
`;
const models = {
    templateCurriculum: templateCurriculum.TemplateCurriculumModel,
    templateMilestone: templateMilestone.TemplateMilestoneModel,
    templateTasks: templateTasks.TemplateTasksModel,
    milestone: milestone.MilestoneModel,
    tasks: tasks.TasksModel,
    taskComments: taskComments.TaskCommentsModel,
    goals: goals.GoalsModel,
    grades: grades.GradesModel,
    ageGroup: ageGroup.AgeGroupModel,
    program: program.programModel,
    userCurriculum: userCurriculum.UserCurriculumModel,
    activityBadge: activityBadge.ActivityBadgeModel,
    badgeCategory: badgeCategory.BadgeCategoryModel,
    guideCategory: guideCategory.GuideCategoryModel,
    programType: programType.ProgramTypeModel,
    // relativeDateOption: relativeDateOption.relativeDateOptionsModel,
};

export default {
    models,
    schema: [
        linkSchema,
        templateCurriculum.TemplateCurriculumSchema,
        grades.GradesSchema,
        ageGroup.AgeGroupSchema,
        templateMilestone.TemplateMilestoneSchema,
        templateTasks.TemplateTasksSchema,
        program.programSchema,
        taskComments.TaskCommentsSchema,
        userCurriculum.UserCurriculumSchema,
        tasks.TasksSchema,
        milestone.MilestoneSchema,
        activityBadge.ActivityBadgeSchema,
        badgeCategory.BadgeCategorySchema,
        goals.GoalsSchema,
        guideCategory.GuideCategorySchema,
        programType.ProgramTypSchema,
        reports.reportsSchema,
        // relativeDateOption.relativeDateOptionSchema,
    ],
    resolvers: [
        templateCurriculum.TemplateCurriculumResolver,
        grades.GradesResolver,
        ageGroup.AgeGroupResolver,
        templateMilestone.TemplateMilestoneResolver,
        templateTasks.TemplateTasksResolver,
        program.programResolver,
        taskComments.TaskCommentsResolver,
        userCurriculum.UserCurriculumResolver,
        tasks.TasksResolver,
        milestone.MilestoneResolver,
        activityBadge.ActivityBadgeResolver,
        badgeCategory.BadgecategoryResolver,
        goals.GoalsResolver,
        guideCategory.GuideCategoryResolver,
        programType.ProgramTypResolver,
        reports.reportsResolver,
        // relativeDateOption.relativeDateOptionsResolver,
    ],
    loaders: {
        user: (keys) => user.userLoader.batchUsers(keys, models),
        program: (keys) => program.programLoader.batchProgram(keys, models),
        organization: (keys) => organization.organizationLoader.batchOrganization(keys, models),
        curriculumTemplate: (keys) =>
            templateCurriculum.TemplateCurriculumLoader.batchCurriculumTemplates(keys, models),
        goals: (keys) => goals.GoalsLoader.batchGoals(keys, models),
        userCurriculum: (keys) => userCurriculum.UserCurriculumLoader.batchUserCurriculum(keys, models),
        milestone: (keys) => milestone.MilestoneLoader.batchMilestone(keys, models),
        ageGroup: (keys) => ageGroup.AgeGroupLoader.batchAgeGroup(keys, models),
        grades: (keys) => grades.GradesLoader.batchGrades(keys, models),
        guideCategory: (keys) => guideCategory.GuideCategoryLoader.batchGuideCategory(keys, models),
        programType: (keys) => programType.ProgramTypeLoader.batchProgramType(keys, models),
    },
};
