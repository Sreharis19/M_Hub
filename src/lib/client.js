import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import fetch from 'cross-fetch';

const link = new HttpLink({
    uri: `${process.env.VIDEO_SERVER_URL}/video-server`,
    fetch,
    headers: {
        'mh-token': process.env.VIDEO_SERVER_TOKEN || '',
    },
});

const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
});

export default client;
