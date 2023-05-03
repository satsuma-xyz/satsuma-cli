import * as path from "path";

import { getMetadata } from "../../shared/helpers/metadata";

export const getFilePath = () => {
  const cwd = process.cwd();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const metaData = getMetadata(path.join(cwd, ".satsuma.json"));
};

export const loadCustomerCode = async () => {
  const resolverFile = path.resolve("./custom-queries/resolvers.ts");
  let resolvers = {};
  try {
    resolvers = (await import(resolverFile)).resolvers;
  } catch {
    // Do nothing.
  }
  const typeDefsFile = path.resolve("./custom-queries/typeDefs.ts");
  let typeDefs = "";
  try {
    typeDefs = (await import(typeDefsFile)).typeDefs;
  } catch {
    // Do nothing.
  }
  let helpersFile: string | undefined = path.resolve(
    "./custom-queries/helpers.ts"
  );
  let helpers = {};
  try {
    helpers = (await import(helpersFile)).helpers;
  } catch {
    helpersFile = undefined;
  }

  return {
    resolvers,
    typeDefs,
    helpers,
    resolverFile,
    typeDefsFile,
    helpersFile,
  };
};
