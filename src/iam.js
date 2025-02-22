import { AuthenticationError } from 'apollo-server-express';
import { getCurrentUser } from './lib/fetch';

const userAuth = async (token) => {
    try {
        const currentUser = await getCurrentUser(token);
        // console.log("userAuth:currentUser",currentUser)
        if (currentUser._id) currentUser.username = currentUser._id;
        if (currentUser.id) currentUser.username = currentUser.id;

        return currentUser;
    } catch (e) {
        throw new AuthenticationError('User Token invalid');
    }
};

const serviceAuth = (token) => {
    if (token !== process.env.SERVICE_TOKEN) throw new AuthenticationError('Service token invalid');
    return { username: 1, _id: 1, firstName: 'systemUser', role: ['admin'] };
};

export default async (req) => {
    const usertoken = req.headers['x-token'];
    const serviceToken = req.headers[process.env.SERVICE_TOKEN_NAME];

    if (usertoken) return userAuth(usertoken);

    if (serviceToken) return serviceAuth(serviceToken);

    return null;

    // throw new AuthenticationError('AUTH ERROR');
};
