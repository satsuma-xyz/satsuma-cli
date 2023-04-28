import {CliVersion, SupportedVersions} from "../../shared/types";
import {download} from "../../shared/helpers/download-repo";
import v1Codegen from "@satsuma/codegen/versions/v1";
import {getSatsumaMetadata} from "../../shared/helpers/auth";
import * as path from "path";
import * as colors from 'colors/safe';
import * as child_process from "child_process";

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
            },
            {
                uri: cliData.metadataDBUri,
                type: "pg" as "pg",
                name: "metadata",
                search_path: "public"
            },
        ];
        const graphql = [
            {
                uri: cliData.queryHost,
            }
        ]

        const resolverFile = path.resolve("./custom-queries/resolvers.ts")
        const typeDefsFile = path.resolve("./custom-queries/typeDefs.ts")
        const helpersFile = path.resolve("./custom-queries/helpers.ts")

        console.log({databases, graphql, resolverFile, typeDefsFile, helpersFile});

        // This will output `./satsuma-server.tmp.ts`
        const outPath = await v1Codegen.server({
            databases,
            graphql,
            tables: {},
            outputPath: __dirname,
            resolverFile,
            typeDefsFile,
            helpersFile,
        });

        console.log('Built', outPath);
        // @ts-ignore. This file is created by the above command
        let s: any;
        try {
            s = await import('./satsuma-server.tmp');
        } catch (e) {
            console.error("Got error", e);
        }

        console.log({s});
        const server = await s.createServer();

        console.log({server});

        return new Promise(async (resolve,) => {
            const {url} = await server.listen();
            console.log(`🍊Satsuma server listening at ${url}`);

            const shutdownServer = () => {
                console.log('Shutting down server...');
                server.stop();
            };

            process.on('SIGINT', () => {
                shutdownServer();
            });

            process.on('SIGTERM', () => {
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
