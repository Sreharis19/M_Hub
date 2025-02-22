/* eslint-disable no-console */
import { combineResolvers } from 'graphql-resolvers';
import { isAuthenticated } from '../auth';

export default {
    Query: {
        listBadgeCategories: combineResolvers(isAuthenticated, (parent, args, { models }) =>
            models.badgeCategory.find({ status: true }, { _id: 1, title: 1 }).sort({ title: 1 })
        ),
    },

    // Mutation: {
    //     addAgeGroups: async (parent, { title }, { models }) => {
    //         const newAgeGroups = await new models.ageGroup({ title }).save();
    //         return newAgeGroups;
    //     },
    //     addAgeGroups(title: String!): dropDownDataReturn
    // },
};
