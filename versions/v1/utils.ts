import * as path from "path";
import * as fs from "fs";
import {getSatsumaMetadata} from "../../shared/helpers/auth";

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
    const resolverFile = getFilePath("resolvers.ts");
    let resolvers = {};
    try {
        try {
            delete require.cache[require.resolve(resolverFile)];
        } catch (err) {
        }
        resolvers = (await import(resolverFile)).resolvers;
    } catch {
    }

    const typeDefsFile = getFilePath("typeDefs.ts");
    let typeDefs = "";
    try {
        try {
            delete require.cache[require.resolve(typeDefsFile)];
        } catch (err) {
        }
        typeDefs = (await import(typeDefsFile)).typeDefs;
    } catch {
    }

    const gqlSchemaFile = getFilePath("schema.graphql");
    let gqlSchema = "";
    try {
        gqlSchema = fs.readFileSync(gqlSchemaFile, "utf-8");
    } catch {
    }

    let helpersFile: string | undefined = getFilePath(
        "helpers.ts"
    );
    let helpers = {};
    try {
        try {
            delete require.cache[require.resolve(helpersFile)];
        } catch (err) {
        }
        helpers = (await import(helpersFile)).helpers;
    } catch {
        helpersFile = undefined;
    }

    let schemaFile: string | undefined = getFilePath(
        "schema.ts"
    );
    if (!fs.existsSync(schemaFile)) {
        schemaFile = undefined;
    }

    return {
        resolvers, typeDefs, helpers,
        resolverFile, typeDefsFile, helpersFile, schemaFile,
        gqlSchema, gqlSchemaFile
    }
}

export const satsumaMetadataConfig = async (cliVersion: SupportedVersions, deployKey: string, subgraphName?: string, versionName?: string, cliDataEndpoint?: string, debug: boolean = false) => {
    const cliData = await getSatsumaMetadata(cliVersion, subgraphName, versionName, deployKey, cliDataEndpoint);
    if (!cliData) {
        return;
    }

    if (debug) {
        console.log("cliData", cliData);
    }

    return {
        ...cliData,
        subgraphName,
        versionName,
        deployKey,
    }
}

export function urlForHttpServer(httpServer: Server): string {
    const {address, port} = httpServer.address() as AddressInfo;

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
