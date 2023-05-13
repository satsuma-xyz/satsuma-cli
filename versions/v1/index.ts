import v1Codegen from "@satsuma/codegen/versions/v1";
import {createApolloServer, createStandaloneServer} from "@satsuma/codegen/versions/v1/template/server";
import {getSatsumaMetadata} from "../../shared/helpers/auth";
import {CreateServerConfig} from "@satsuma/codegen/versions/v1/template/types";
import {loadCustomerCode, satsumaMetadataConfig, urlForHttpServer} from "./utils";
import {validateExports, validateFiles} from "./validations";
import {getCustomQueryPath, getDeployKey} from "../../shared/helpers/metadata";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";
import ora from "ora";
import {download} from "../../shared/helpers/download-repo";
import {CliVersion, SupportedVersions} from "../../shared/types";
import * as http from "http";
import {blue} from "colors/safe";
import runner from "../../shared/custom-spinner";
import {sleepAwait} from "sleep-await";
import FormData from "form-data";

const MD_PATH = path.resolve(process.cwd(), ".satsuma.json");

interface DownloadedFile {
    fileName: string;
    fileContents: string;
}

const v1: CliVersion = {
    init: async (args) => {
        const spinner = ora({
            text: 'Downloading files',
            spinner: "moon"
        }).start();

        await download({
            versionFolder: SupportedVersions.v1,
            spinner,
            reset: Boolean(args.reset),
            projectPathPrefix: args.projectPathPrefix,
            repoOwner: args.repoOwner,
            repoName: args.repoName,
            branch: args.branch,
            metadataFile: args.metadataFile,
        });
    },
    deploy: async (args) => {
        validateFiles();
        await validateExports();
        const deployKey = args.deployKey || getDeployKey(MD_PATH);

        const cliData = await getSatsumaMetadata(
            SupportedVersions.v1,
            args.subgraphName,
            args.versionName,
            deployKey
        );
        if (!cliData) {
            return;
        }

        const formData = new FormData();
        if (args.subgraphName) {
            formData.append("subgraph", args.subgraphName);
        }
        if (args.versionName) {
            formData.append("version_name", args.versionName);
        }

        const {resolverFile, typeDefsFile, helpersFile, schemaFile} =
            await loadCustomerCode();

        (
            [
                path.resolve(process.cwd(), ".satsuma.json"),
                resolverFile,
                typeDefsFile,
                helpersFile,
                schemaFile
            ].filter(Boolean) as string[]
        ).forEach((file) => {
            formData.append(path.basename(file), fs.createReadStream(file), path.basename(file));
        });

        const spinner = ora({
            text: "Deploying",
            spinner: "moon",
        }).start();

        try {
            await axios.post("https://app.satsuma.xyz/api/satsuma-query/deploy", formData, {
                headers: {
                    'x-api-key': deployKey,
                    ...formData.getHeaders()
                },
            });
            spinner.succeed("Uploaded files successfully");
        } catch (error) {
            spinner.fail("Error uploading files");
            console.log(error);
            process.exit(1);
        }
    },
    validate: async (args) => {
        validateFiles();
        await validateExports();
        const spinner = ora({
            text: 'Validating',
            spinner: "moon"
        });

        const deployKey = args.deployKey || getDeployKey(MD_PATH);

        spinner.text = "Getting metadata";
        const cliData = await satsumaMetadataConfig(SupportedVersions.v1, deployKey, args.subgraphName, args.versionName, args.cliDataEndpoint, args.debug);
        if (!cliData) {
            spinner.fail();
            return;
        }
        spinner.succeed();

        try {
            const {typeDefs, resolvers, resolverFile, typeDefsFile, helpersFile} = await loadCustomerCode();
            const config: CreateServerConfig = {
                databases: [],
                graphql: [],
                resolverFile,
                typeDefsFile,
                helpersFile,
            };

            const server = await createApolloServer(config, typeDefs, resolvers);
            await server.start();
            await server.stop();
        } catch (e) {
            spinner.fail(`Validation Failed ${e}`);
            process.exit(1);
        }

        spinner.succeed("Validation Passed")
    },
    local: async (args) => {
        validateFiles();
        await validateExports();
        let spinner = ora({
            spinner: "moon"
        });
        const deployKey = args.deployKey || getDeployKey(MD_PATH);

        spinner.text = "Getting metadata";
        const cliData = await satsumaMetadataConfig(SupportedVersions.v1, deployKey, args.subgraphName, args.versionName, args.cliDataEndpoint, args.debug);
        if (!cliData) {
            spinner.fail();
            return;
        }
        spinner.succeed();

        let server: http.Server;

        const shutdownServer = (reason = "Server shut down") => {
            return new Promise<void>((resolve) => {
                if (server) {
                    spinner.text = "Shutting down server";

                    // We need to set the timeout super low to force all connections to end instantly.
                    server.timeout = 1;
                    server.removeAllListeners();
                    server.close(() => {
                        spinner.info(reason);
                        resolve();
                    });
                } else {
                    spinner.info(reason);
                    resolve();
                }
            });
        };

        let {resolverFile, typeDefsFile, helpersFile} = await loadCustomerCode();

        process.on('SIGINT', () => {
            shutdownServer().then(() => process.exit(0));
        });

        process.on('SIGTERM', () => {
            shutdownServer().then(() => process.exit(0));
        });

        const startServer = async (reload = false) => {
            try {
                spinner = ora({text: `${reload ? "Reloading" : "Loading"} code`, spinner: "moon"}).start();
                await sleepAwait(3000)
                const {databases, graphql} = cliData;
                const {typeDefs, resolvers, helpers, resolverFile, typeDefsFile, helpersFile} = await loadCustomerCode();
                const config: CreateServerConfig = {
                    databases,
                    graphql,
                    resolverFile,
                    typeDefsFile,
                    helpersFile,
                };

                const reservedServer = await createStandaloneServer(config, typeDefs, resolvers, helpers, args.debug);
                server = reservedServer.httpServer;

                return new Promise<void>(async (resolve,) => {
                    // Never actually resolves, in order to keep the process alive
                    spinner.succeed();
                    spinner = ora({
                        text: 'Starting server',
                        spinner: runner
                    }).start();

                    await server.listen(4000);
                    spinner.text = `Running server at ${urlForHttpServer(server)}`;
                });
            } catch (e) {
                console.log(e);
            }
        }

        const fileChangedHandler = (fileName: string) => async (curr: fs.Stats, prev: fs.Stats) => {
            await shutdownServer(`${fileName} file changed`);
            await startServer(true);
        };
        fs.watchFile(resolverFile, fileChangedHandler(resolverFile));
        fs.watchFile(typeDefsFile, fileChangedHandler(typeDefsFile));
        if (helpersFile) {
            fs.watchFile(helpersFile, fileChangedHandler(helpersFile));
        }
        await startServer();
    },
    codegen: async (args) => {
        validateFiles();
        await validateExports();

        const {resolverFile, typeDefsFile, helpersFile} = await loadCustomerCode();
        const outputPath = getCustomQueryPath(MD_PATH);
        const deployKey = args.deployKey || getDeployKey(MD_PATH);
        const cliData = await satsumaMetadataConfig(SupportedVersions.v1, deployKey, args.subgraphName, args.versionName, args.cliDataEndpoint, args.debug);
        if (!cliData) {
            return;
        }
        try {
            await v1Codegen.types({
                ...cliData,
                resolverFile,
                typeDefsFile,
                helpersFile,
                outputPath: outputPath
            });

            ora().succeed(`Generated gQL schema at ${blue(`${outputPath}schema.graphql`)}`);
            ora().succeed(`Generated typescript types at ${blue(`${outputPath}schema.ts`)}`);
        } catch (e) {
            console.trace()
            console.error(e);
        }
    },
    upgrade: async (args) => {
        console.log('Not possible to update TO v1. Perhaps you mixed up the arguments?')
    }
};

export default v1;
