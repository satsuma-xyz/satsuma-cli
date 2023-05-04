import * as path from "path";
import {getSatsumaMetadata} from "../../shared/helpers/auth";
import {CreateServerConfig, Database} from "@satsuma/codegen/versions/v1/template/types";

import {getMetadata} from "../../shared/helpers/metadata";
import type {Server} from 'http';
import type {AddressInfo} from 'net';
import {format} from 'url';

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
        resolvers, typeDefs, helpers,
        resolverFile, typeDefsFile, helpersFile
    }
}

export const satsumaMetadataConfig = async (deployKey: string, subgraphName?: string, versionName?: string) => {
    const cliData = await getSatsumaMetadata(subgraphName, versionName, deployKey);
    if (!cliData) {
        return;
    }

    const tables: Database['tables'] = {};

    // Non-partitioned tables with block range column
    for (const table of cliData.nonPartitionedTablesBR) {
        tables[`${table}__all`] = {
            actualName: table,
        };
        tables[table] = {
            actualName: table,
            whereClause: `block_range @> 2147483647`,
        };
    }

    // Non-partitioned tables without block range column. Usually immutable.
    for (const table of cliData.nonPartitionedTables) {
        if (tables[table]) {
            // Must have been added already with block range
            continue;
        }

        // Tables with no block range column we just provide the whole thing as if it's active
        tables[table] = {
            actualName: table,
        };
    }

    // Partitioned tables always have block range column. That's what the partition is on
    for (const table of cliData.partitionedTables) {
        tables[table] = {
            actualName: `${table}_active`,
        };
        tables[`${table}__all`] = {
            actualName: `${table}_inactive`,
        };
    }

    // Convert into the format that the codegen expects
    const databases: CreateServerConfig['databases'] = [
        {
            uri: cliData.dbUri,
            type: "pg" as "pg",
            name: "knex",
            search_path: cliData.entitySchema,
            tables,
        },
    ];
    const graphql = [
        {
            uri: cliData.queryHost,
        }
    ];

    return {
        databases,
        graphql,
        tables,
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
