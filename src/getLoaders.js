import DataLoader from 'dataloader';
import modules from './modules';

const getLoaders = () => {
    let loaders = {};
    const keys = Object.keys(modules.loaders);
    keys.forEach((key) => {
        loaders = { ...loaders, [key]: new DataLoader(modules.loaders[key]) };
    });
    return loaders;
};

export default getLoaders;
