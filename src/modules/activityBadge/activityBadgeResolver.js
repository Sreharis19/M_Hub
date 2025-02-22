/* eslint-disable no-console */
import { combineResolvers } from 'graphql-resolvers';
import mongoose from 'mongoose';
import { intersection } from 'ramda';
import { isAuthenticated, isRoleWithAccessOrganizationalTemplate, accessToEditActivityBadge } from '../auth';
import { getOrg } from './getOrg';

export default {
    Query: {
        listActivityBadge: combineResolvers(
            isRoleWithAccessOrganizationalTemplate,
            async (parent, { skip, limit, orgId }, { models, me }) => {
                try {
                    const skipDocs = skip || 0;
                    const limitDocs = limit || 10;
                    const adminRoles = ['admin', 'manager', 'administrator'];
                    const pipeline = [];
                    const orCond = [{ createdByRole: { $in: adminRoles } }];

                    if (intersection(me.role, ['organizationAdmin', 'childOrganizationAdmin']).length > 0) {
                        if (!orgId) throw new Error('orgId is required');
                        orCond.push({ childOrgId: mongoose.Types.ObjectId(orgId) });
                    }

                    pipeline.push(
                        { $match: { $or: orCond } },
                        { $sort: { createdDate: -1 } },
                        { $skip: skipDocs },
                        { $limit: limitDocs },
                        {
                            $lookup: {
                                from: 'BadgeCategory',
                                let: { badgeCategoryId: '$badgeCategoryId' },
                                pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$badgeCategoryId'] } } }],
                                as: 'badgeCategoryData',
                            },
                        },
                        { $unwind: '$badgeCategoryData' },
                        {
                            $project: {
                                badgeDescription: 1,
                                badgeCategoryId: 1,
                                badgeCategory: '$badgeCategoryData.title',
                                badgeImage: 1,
                            },
                        }
                    );
                    const [activityBadge, count] = await Promise.all([
                        models.activityBadge.aggregate(pipeline),
                        models.activityBadge.countDocuments({ $or: orCond }),
                    ]);
                    return {
                        count,
                        data: activityBadge,
                    };
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),

        listActivityBadgeByCategory: combineResolvers(
            isAuthenticated,
            async (parent, { badgeCategoryIds, orgId }, { models, me }) => {
                try {
                    const categoryIds = badgeCategoryIds.map((id) => mongoose.Types.ObjectId(id));
                    const orCond = [];
                    const organizationId = getOrg(me, orgId);

                    const adminRoles = ['admin', 'manager', 'administrator'];

                    if (organizationId) {
                        orCond.push(
                            {
                                $and: [
                                    { badgeCategoryId: { $in: categoryIds } },
                                    { createdByRole: { $in: adminRoles } },
                                ],
                            },
                            {
                                $and: [
                                    { badgeCategoryId: { $in: categoryIds } },
                                    { childOrgId: mongoose.Types.ObjectId(organizationId) },
                                ],
                            }
                        );
                    } else {
                        orCond.push({
                            $and: [{ badgeCategoryId: { $in: categoryIds } }, { createdByRole: { $in: adminRoles } }],
                        });
                    }

                    const [count, activityBadges] = await Promise.all([
                        models.activityBadge.countDocuments({ $or: orCond }),
                        models.activityBadge.aggregate([
                            { $match: { $or: orCond } },
                            {
                                $lookup: {
                                    from: 'BadgeCategory',
                                    let: { badgeCategoryId: '$badgeCategoryId' },
                                    pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$badgeCategoryId'] } } }],
                                    as: 'badgeCategoryData',
                                },
                            },
                            { $unwind: '$badgeCategoryData' },
                            {
                                $project: {
                                    title: 1,
                                    badgeDescription: 1,
                                    badgeCategoryId: 1,
                                    badgeCategory: '$badgeCategoryData.title',
                                    badgeImage: 1,
                                },
                            },
                            { $sort: { badgeCategory: 1 } },
                        ]),
                    ]);

                    return {
                        count,
                        data: activityBadges,
                    };
                } catch (error) {
                    console.log(error);
                    throw new Error(error.message);
                }
            }
        ),
    },

    Mutation: {
        createBadge: combineResolvers(
            isAuthenticated,
            async (parent, { badgeDescription, badgeCategoryId, badgeImage, orgId }, { models, me, loaders }) => {
                try {
                    const getBadgeCategory = await models.badgeCategory.exists({ _id: badgeCategoryId });
                    if (!getBadgeCategory) throw new Error('Badge Category not found');
                    let childOrgId = null;
                    let parentOrgId = null;
                    if (intersection(me.role, ['organizationAdmin', 'childOrganizationAdmin']).length > 0) {
                        if (!orgId) throw new Error('Organization Id is required');
                        childOrgId = orgId;
                        const organization = await loaders.organization.load(orgId);
                        parentOrgId = organization.parentOrganizationId;
                    }
                    const newActivityBadge = await new models.activityBadge({
                        badgeDescription,
                        badgeCategoryId,
                        badgeImage,
                        childOrgId,
                        parentOrgId,
                        createdBy: me.id,
                        createdByRole: me.role[0],
                    }).save();
                    return newActivityBadge;
                } catch (err) {
                    throw new Error(err.message);
                }
            }
        ),

        editBadge: combineResolvers(
            accessToEditActivityBadge,
            async (parent, { badgeId, badgeDescription, badgeCategoryId, badgeImage }, { models }) => {
                const getBadge = await models.activityBadge.findById(badgeId);
                if (!getBadge) throw new Error('Badge not found');
                if (badgeDescription) getBadge.badgeDescription = badgeDescription;
                if (badgeCategoryId) getBadge.badgeCategoryId = badgeCategoryId;
                if (badgeImage) getBadge.badgeImage = badgeImage;
                getBadge.updatedDate = new Date();
                await getBadge.save();
                return getBadge;
            }
        ),
    },
};
