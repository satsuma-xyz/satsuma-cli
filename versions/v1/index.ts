import {CliVersion, SupportedVersions} from "../../shared/types";
import {download} from "../../shared/helpers/download-repo";
import v1Codegen from "@satsuma/codegen/versions/v1";
import {getSatsumaMetadata} from "../../shared/helpers/auth";
import * as child_process from "child_process";
import * as path from "path";
import {inspect} from "util";
import * as colors from 'colors/safe';

const v1: CliVersion = {
    init: async (args) => {
        await download(SupportedVersions.v1);
    },
    deploy: async (args) => {
        console.log('🍊deploy not implemented yet');
    },
    validate: async (args) => {
        console.log('🍊validate not implemented yet');
    },
    local: async (args) => {
        const cliData = await getSatsumaMetadata(args.subgraphName, args.versionName, args.deployKey);
        if (!cliData) {
            return;
        }

        // Convert into the format that the codegen expects
        const databases = [
            {
                uri: cliData.dbUri,
                type: "pg" as "pg",
                name: "knex",
                search_path: cliData.entitySchema
            }
        ];
        const graphql = [
            {
                uri: cliData.queryHost,
            }
        ]

        const resolverFile = path.resolve("./custom-queries/resolvers.ts")
        const typeDefsFile = path.resolve("./custom-queries/typeDefs.ts")
        const helpersFile = path.resolve("./custom-queries/helpers.ts")

        // This will output `./satsuma-server.tmp.ts`
        await v1Codegen.server({
            databases,
            graphql,
            tables: {},
            outputPath: __dirname,
            resolverFile,
            typeDefsFile,
            helpersFile,
        });

        // Run tsc against the server
        child_process.execSync(`npx tsc -p ${path.resolve(__dirname, "../../tsconfig.json")}`, {shell: '/bin/bash', stdio : 'pipe'});

        // @ts-ignore
        const s = require('./satsuma-server.tmp');
        const server = await s.createServer();

        return new Promise((resolve,) => {
            const { url } = server.listen();
            console.log(colors.green(`🍊Satsuma server listening at ${url}`));

            const shutdownServer = () => {
                console.log('Shutting down server...');
                server.stop().then(() => {
                    console.log('Server stopped.');
                    resolve();
                });
            };

            process.on('SIGINT', () => {
                console.log('Received SIGINT signal.');
                shutdownServer();
            });

            process.on('SIGTERM', () => {
                console.log('Received SIGTERM signal.');
                shutdownServer();
            });
        });
    },
    codegen: async (args) => {
        await v1Codegen.types(args);
    },
    upgrade: async (args) => {
        console.log('🍊upgrade not implemented yet');
    }
}

export default v1;
