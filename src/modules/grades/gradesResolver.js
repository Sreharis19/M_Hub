/* eslint-disable no-console */
import { combineResolvers } from 'graphql-resolvers';
import { isAuthenticated } from '../auth';

export default {
    Query: {
        listGrades: combineResolvers(isAuthenticated, (parent, args, { models }) =>
            models.grades.find({ status: true }, { _id: 1, title: 1 }).sort({ order: 1 })
        ),
    },
    // Mutation: {
    //     addGrades: async (parent, { title }, { models }) => {
    //         const newGrade = await new models.grades({ title }).save();
    //         console.log('new Grade', newGrade);
    //         return newGrade;
    //     },
    //     addGrades(title: String!): dropDownDataReturn
    // },
};
