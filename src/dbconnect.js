import mongoose from 'mongoose';

export default async () => {
    try {
        // eslint-disable-next-line no-console
        console.log(`Trying to Connect DB: ${process.env.DB_URL}`);
        mongoose.Promise = global.Promise;
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log(`error DB Connection: ${err}`);
    }
};
