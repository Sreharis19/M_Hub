export default async (req) => {
    const usertoken = req.headers.authorization;
    if (usertoken === process.env.HUBSPIRE_TOKEN) return true;
    return null;
};
