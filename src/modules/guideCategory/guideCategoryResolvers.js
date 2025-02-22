/* eslint-disable no-console */
import { combineResolvers } from 'graphql-resolvers';
import { isAuthenticated } from '../auth';

export default {
    Query: {
        listGuideCategories: combineResolvers(isAuthenticated, (parent, args, { models }) =>
            models.guideCategory.find({ status: true }, { _id: 1, title: 1 }).sort({ title: 1 })
        ),
    },
};
