import cors from 'cors';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import dbconnect from './dbconnect';
import modules from './modules';
import Auth from './directives/Auth';
import iam from './iam';
import iamhub from './iamhub';
import getLoaders from './getLoaders';

dbconnect();
const app = express();
app.use(cors());

const server = new ApolloServer({
    typeDefs: modules.schema,
    resolvers: modules.resolvers,
    tracing: true,
    cacheControl: { defaultMaxAge: 3 },
    schemaDirectives: { auth: Auth },
    context: async ({ req }) => {
        const me = await iam(req);
        const hub = await iamhub(req);
        const loaders = getLoaders();
        return {
            me,
            hub,
            models: modules.models,
            loaders,
        };
    },
});

server.applyMiddleware({ app, path: '/curriculum-server' });
const port = process.env.PORT || 8081;
app.listen({ port }, () => {
    // eslint-disable-next-line no-console
    console.log(`Apollo Server on http://localhost:${port}/curriculum-server`);
});
