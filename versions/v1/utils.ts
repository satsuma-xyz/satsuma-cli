import {getMetadata} from "../../shared/helpers/metadata";
import * as path from "path";
import {getSatsumaMetadata} from "../../shared/helpers/auth";
import {CreateServerConfig, Database} from "@satsuma/codegen/versions/v1/template/types";

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
    let helpersFile: string | undefined = path.resolve("./custom-queries/helpers.ts");
    let helpers = {};
    try {
        helpers = (await import(helpersFile)).helpers
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
            tables: {}
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