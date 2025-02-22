import { gql } from 'apollo-server-express';

export default gql`
    extend type Query {
        listGrades: [dropDownDataReturn]
    }

    type dropDownDataReturn {
        _id: String
        title: String
    }
`;
