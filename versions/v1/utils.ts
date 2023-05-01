import {getMetadata} from "../../shared/helpers/metadata";
import * as path from "path";

export const getFilePath = () => {
    const cwd = process.cwd();
    const metaData = getMetadata(path.join(cwd, '.satsuma.json'));
}

export const loadCustomerCode = async () => {
    const resolverFile = path.resolve("./custom-queries/resolvers.ts");
    let resolvers = {};
    try {
        resolvers = (await import(resolverFile)).resolvers
    } catch {
    }
    const typeDefsFile = path.resolve("./custom-queries/typeDefs.ts");
    let typeDefs = "";
    try {
        typeDefs = (await import(typeDefsFile)).typeDefs
    } catch {
    }
    const helpersFile = path.resolve("./custom-queries/helpers.ts");
    let helpers = {};
    try {
        helpers = (await import(helpersFile)).helpers
    } catch {
    }

    return {
        resolvers, typeDefs, helpers,
        resolverFile, typeDefsFile, helpersFile
    }
}