import {CliVersion, SupportedVersions} from "../../shared/types";
import {download} from "../../shared/helpers/download-repo";
import v1Codegen from "@satsuma/codegen/versions/v1";
import {createServer} from "@satsuma/codegen/versions/v1/template/server";
import {getSatsumaMetadata} from "../../shared/helpers/auth";
import {CreateServerConfig, Database} from "@satsuma/codegen/versions/v1/template/types";
import {loadCustomerCode} from "./utils";
import {checkProjectNotExists, validateExports, validateFiles} from "./validations";


const v1: CliVersion = {
    init: async (args) => {
        checkProjectNotExists();
        await download(SupportedVersions.v1);
    },
    deploy: async (args) => {
        validateFiles();
        await validateExports();
        console.log('🍊deploy not implemented yet');
    },
    validate: async (args) => {
        validateFiles();
        await validateExports();

        try {
            const {typeDefs, resolvers, helpers, resolverFile, typeDefsFile, helpersFile} = await loadCustomerCode();
            const config: CreateServerConfig = {
                databases: [],
                graphql: [],
                resolverFile,
                typeDefsFile,
                helpersFile,
            };

            const server = await createServer(config, typeDefs, resolvers, helpers);
            await server.listen();
            await server.stop();
        } catch (e) {
            console.error('❌ Error validating', e);
            process.exit(1);
        }

        console.log('✅ Validated successfully');
    },
    local: async (args) => {
        validateFiles();
        await validateExports();
        const cliData = await getSatsumaMetadata(args.subgraphName, args.versionName, args.deployKey);
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

        try {
            const {typeDefs, resolvers, helpers, resolverFile, typeDefsFile, helpersFile} = await loadCustomerCode();
            const config: CreateServerConfig = {
                databases,
                graphql,
                resolverFile,
                typeDefsFile,
                helpersFile,
            };

            const server = await createServer(config, typeDefs, resolvers, helpers);
            return new Promise(async (resolve,) => {
                const {url} = await server.listen();
                console.log(`🍊Satsuma server listening at ${url}`);

                const shutdownServer = () => {
                    console.log('Shutting down server...');
                    server.stop().then(() => {
                        process.exit(0);
                    });
                };

                process.on('SIGINT', () => {
                    shutdownServer();
                });

                process.on('SIGTERM', () => {
                    shutdownServer();
                });
            });
        } catch (e) {
            console.error("Got error", e);
        }
    },
    codegen: async (args) => {
        validateFiles();
        await validateExports();
        await v1Codegen.types(args);
    },
    upgrade: async (args) => {
        console.log('Not possible to update TO v1. Perhaps you mixed up the arguments?')
    }
}

export default v1;
