import * as path from "path";
import {getSatsumaMetadata} from "../../shared/helpers/auth";
import {CreateServerConfig, Database} from "@satsuma/codegen/versions/v1/template/types";

import {getMetadata} from "../../shared/helpers/metadata";
import type {Server} from 'http';
import type {AddressInfo} from 'net';
import {format} from 'url';
import {SupportedVersions} from "../../shared/types";

export const getFilePath = (fileName: string) => {
  const cwd = process.cwd();
  const metaData = getMetadata(path.join(cwd, ".satsuma.json"));
  return path.resolve(cwd, metaData?.projectPathPrefix || "", fileName);
};

export const loadCustomerCode = async () => {
  const resolverFile = getFilePath("resolvers");
  let resolvers = {};
  try {
    resolvers = (await import(resolverFile)).resolvers;
  } catch {
    // Do nothing.
  }
  const typeDefsFile = getFilePath("typeDefs");
  let typeDefs = "";
  try {
    typeDefs = (await import(typeDefsFile)).typeDefs;
  } catch {
    // Do nothing.
  }
  let helpersFile: string | undefined = getFilePath(
    "helpers"
  );
  let helpers = {};
  try {
    helpers = (await import(helpersFile)).helpers;
  } catch {
    helpersFile = undefined;
  }

    return {
        resolvers, typeDefs, helpers,
        resolverFile, typeDefsFile, helpersFile
    }
}

export const satsumaMetadataConfig = async (cliVersion: SupportedVersions, deployKey: string, subgraphName?: string, versionName?: string) => {
    const cliData = await getSatsumaMetadata(cliVersion, subgraphName, versionName, deployKey);
    if (!cliData) {
        return;
    }

    return {
        ...cliData,
        subgraphName,
        versionName,
        deployKey,
    }
}

export function urlForHttpServer(httpServer: Server): string {
    const { address, port } = httpServer.address() as AddressInfo;

    // Convert IPs which mean "any address" (IPv4 or IPv6) into localhost
    // corresponding loopback ip. Note that the url field we're setting is
    // primarily for consumption by our test suite. If this heuristic is wrong for
    // your use case, explicitly specify a frontend host (in the `host` option
    // when listening).
    const hostname = address === '' || address === '::' ? 'localhost' : address;

    return format({
        protocol: 'http',
        hostname,
        port,
        pathname: '/',
    });
}
