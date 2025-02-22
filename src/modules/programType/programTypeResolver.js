/* eslint-disable no-console */
import { combineResolvers } from 'graphql-resolvers';
import { isAuthenticated } from '../auth';

export default {
    Query: {
        listProgramTypes: combineResolvers(isAuthenticated, (parent, args, { models }) =>
            models.programType.find({}, { _id: 1, title: 1 }).sort({ title: 1 })
        ),
    },
};
