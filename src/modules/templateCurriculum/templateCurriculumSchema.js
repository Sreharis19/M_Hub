import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        listCurriculumTemplates(
            limit: Int
            skip: Int
            search: String
            gradeId: String
            ageGrpId: String
            guidecategoryId: String
            programTypeId: String
            master: Boolean
            pgmId: String
            organizationId: String
        ): curriculumData

        listMasterTemplates(
            limit: Int
            skip: Int
            search: String
            gradeId: String
            ageGrpId: String
            guidecategoryId: String
            programTypeId: String
            pgmId: String
            childOrgId: String
        ): curriculumData

        listOrganizationTemplates(
            limit: Int
            skip: Int
            search: String
            gradeId: String
            ageGrpId: String
            guidecategoryId: String
            programTypeId: String
            pgmId: String
            orgId: String
        ): curriculumData
        listProgramTemplates(
            limit: Int
            skip: Int
            search: String
            gradeId: String
            ageGrpId: String
            guidecategoryId: String
            programTypeId: String
            pgmId: String!
        ): curriculumData
        listLessonPlan(curriculumId: String!): [lessonPlanReturn]
        listLessonPlanMentee(curriculumId: String!, menteeId: String!): listLessonPlanMentee
        listAvailableGuides(
            menteeId: String!
            gradeId: String
            ageGrpId: String
            guidecategoryId: String
            badgeCategoryId: String
            programTypeId: String
            search: String
            myAgeGrp: Boolean
        ): [availableGuides]

        getTemplateCurriculamWithStartDate(startDate: String!): [ThisTemplateCurriculumIds]
        getThisCirriculamTemplate(curriculumId: String!): ThisTemplateCurriculum
    }

    type curriculumData {
        length: Int
        data: [TemplateCurriculum]
    }

    type availableGuides @cacheControl(maxAge: 10) {
        _id: String
        title: String
        description: String
        ageGroup: dropDownDataReturn @cacheControl(maxAge: 240)
        grade: dropDownDataReturn @cacheControl(maxAge: 240)
        guideCategory: dropDownDataReturn @cacheControl(maxAge: 240)
        programType: dropDownDataReturn @cacheControl(maxAge: 240)
        milestoneImages: [String]
    }

    type listLessonPlanMentee {
        _id: String
        title: String
        milestone: [milestoneDataMentee]
    }

    type milestoneDataMentee {
        _id: String
        title: String
        description: String
        badgeImage: String
        favourite: Boolean
        isBadgeGranted: Boolean
        order: Int
        activityBadgeId: String
        badgeCategoryId: String
        tasks: [tasksDataMentee]
    }

    type tasksDataMentee {
        _id: String
        title: String
        attachments: [attachmentData]
        goalId: String
        description: String
        completed: Boolean
        dueDate: String
        assignedTo: String
        assignedToData: assignedToData
        unreadCommentsCount: Int
        createdBy: String
    }

    type assignedToData {
        _id: String
        firstName: String
        lastName: String
        profileImage: String
    }

    type attachmentData {
        s3URL: String
        type: String
        status: Boolean
        order: Int
    }

    type lessonPlanReturn {
        _id: String
        title: String
        description: String
        badgeImage: String
        order: Int
        activityBadgeId: String
        badgeCategoryId: String
        tasks: [tasksData]
    }

    type tasksData {
        _id: String
        title: String
        description: String
        attachments: [attachmentData]
        assignedTo: String
        milestoneId: String
        dueDate: String
    }

    type curriculumReturn {
        _id: String
        title: String
        description: String
        masterTemplate: Boolean
        masterTemplateId: String
        programId: String
        parentOrganizationId: String
        childOrganizationId: String
        licenseRequired: Boolean
        evidenceBased: Boolean
        pointsPerTask: Int
        createdDate: String
    }

    type masterTemplateData @cacheControl(maxAge: 240) {
        _id: String
        title: String
    }

    type programData @cacheControl(maxAge: 240) {
        _id: ID
        programName: String
    }

    type organizationData @cacheControl(maxAge: 240) {
        _id: ID
        organizationName: String
    }

    extend type Mutation {
        addCurriculumTemplate(
            title: String!
            description: String
            masterTemplate: Boolean!
            masterTemplateId: String
            programId: String
            organizationId: String
            licenseRequired: Boolean!
            evidenceBased: Boolean!
            pointsPerTask: Int!
            gradeId: String
            ageGrpId: String!
            guidecategoryId: String!
            programTypeId: String!
            startDate: String
        ): curriculumReturn

        editCurriculumTemplate(
            curriculumId: String!
            title: String
            description: String
            masterTemplate: Boolean
            pointsPerTask: Int
            licenseRequired: Boolean
            evidenceBased: Boolean
            status: Boolean
            gradeId: String
            ageGrpId: String
            guidecategoryId: String
            programTypeId: String
            startDate: String
        ): curriculumReturn

        cloneCurriculumTemplate(curriculumId: String!, programId: String, organizationId: String): curriculumReturn

        deleteCurriculumTemplate(curriculumId: String!): deleteReturn

        synchMasterWithClones(curriculumId: String!): messageReturn
    }

    type TemplateCurriculum @cacheControl(maxAge: 10) {
        _id: String
        title: String
        description: String
        masterTemplate: Boolean
        masterTemplateId: String
        masterTemplateData: masterTemplateData @cacheControl(maxAge: 240)
        programId: String
        parentOrganizationId: String
        childOrganizationId: String
        gradeId: String
        ageGrpId: String
        programTypeId: String
        guidecategoryId: String
        organization: organizationData @cacheControl(maxAge: 240)
        program: programData @cacheControl(maxAge: 240)
        licenseRequired: Boolean
        evidenceBased: Boolean
        status: Boolean
        badges: Int
        activities: Int
        pointsPerTask: Int
        createdDate: String
        assignedPgmIds: [String]
        mssIds: [String]
        createdBy: String
        createdByRole: String
        createdByData: assignedToReturn @cacheControl(maxAge: 240)
        startDate: String
    }

    type ThisTemplateCurriculum @cacheControl(maxAge: 10) {
        _id: String
        title: String
        description: String
        masterTemplate: Boolean
        masterTemplateId: String
        programId: String
        parentOrganizationId: String
        childOrganizationId: String
        gradeId: String
        ageGrpId: String
        programTypeId: String
        guidecategoryId: String
        licenseRequired: Boolean
        evidenceBased: Boolean
        status: Boolean
        pointsPerTask: Int
        pinned: Boolean
        createdDate: String
        createdBy: String
        createdByRole: String
        startDate: String
    }

    type ThisTemplateCurriculumIds @cacheControl(maxAge: 10) {
        _id: String
        programId: String
        allPgmIds: [String]
    }
`;
