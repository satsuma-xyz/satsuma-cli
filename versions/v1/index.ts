import {CliVersion, SupportedVersions} from "../../shared/types";
import {download} from "../../shared/helpers/download-repo";
import v1Codegen from "@satsuma/codegen/versions/v1";
import {createServer} from "@satsuma/codegen/versions/v1/template/server";
import {getSatsumaMetadata} from "../../shared/helpers/auth";
import {CreateServerConfig, Database} from "@satsuma/codegen/versions/v1/template/types";
import {loadCustomerCode} from "./utils";
import {checkProjectNotExists, validateExports, validateFiles} from "./validations";
import {getDeployKey, getMetadata} from "../../shared/helpers/metadata";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";
import spinners from "cli-spinners";
import ora from "ora";

const MD_PATH = path.resolve(process.cwd(), '.satsuma.json');

interface DownloadedFile {
    fileName: string;
    fileContents: string;
}

const v1: CliVersion = {
    init: async (args) => {
        checkProjectNotExists();
        await download(SupportedVersions.v1);
    },
    deploy: async (args) => {
        validateFiles();
        await validateExports();
        const deployKey = args.deployKey || getDeployKey(MD_PATH);
        const md = await getMetadata(MD_PATH);
        if (!md) {
            console.log('❌ Error: No metadata found. Did you run satsuma init?');
            process.exit(1);
        }

        const spinner = ora({
            text: 'Deploying',
            spinner: spinners.moon
        }).start();

        const cliData = await getSatsumaMetadata(args.subgraphName, args.versionName, deployKey);
        if (!cliData) {
            spinner.fail(); // The error message is logged in getSatsumaMetadata
            return;
        }

        const {resolverFile, typeDefsFile, helpersFile} = await loadCustomerCode();
        const downloadedFiles: DownloadedFile[] = ([resolverFile, typeDefsFile, helpersFile].filter(Boolean) as string[]).map((file) => ({
            fileName: path.basename(file),
            fileContents: fs.readFileSync(file, 'utf8'),
        }));

        try {
            const response = await axios.post('https://app.satsuma.xyz/api/cli/upload', {
                files: downloadedFiles,
            });
            spinner.succeed('Uploaded files successfully');
        } catch (error) {
            spinner.fail('Error uploading files');
            process.exit(1);
        }
    },
    validate: async (args) => {
        validateFiles();
        await validateExports();
        const deployKey = args.deployKey || getDeployKey(MD_PATH);

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
        const deployKey = args.deployKey || getDeployKey(MD_PATH);
        const cliData = await getSatsumaMetadata(args.subgraphName, args.versionName, deployKey);
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
