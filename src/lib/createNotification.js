/* eslint-disable no-console */
/* eslint-disable import/prefer-default-export */
import { CREATE_NOTIFICATION } from './mutations';
import client from './client';

export const createNotification = async (notification) => {
    try {
        const { data } = await client.mutate({
            mutation: CREATE_NOTIFICATION,
            variables: {
                notification,
            },
        });
        return data.createNotification;
    } catch (err) {
        console.log('create notification error', err);
        throw new Error(err.message);
    }
};
