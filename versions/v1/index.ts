import v1Codegen from "@satsuma/codegen/versions/v1";
import {createServer} from "@satsuma/codegen/versions/v1/template/server";
import {getSatsumaMetadata} from "../../shared/helpers/auth";
import {CreateServerConfig, Database} from "@satsuma/codegen/versions/v1/template/types";
import {loadCustomerCode, satsumaMetadataConfig} from "./utils";
import {checkProjectNotExists, validateExports, validateFiles} from "./validations";
import {getDeployKey, getMetadata} from "../../shared/helpers/metadata";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";
import spinners from "cli-spinners";
import ora from "ora";
import {ApolloServer} from 'apollo-server';
import {download} from "../../shared/helpers/download-repo";
import {CliVersion, SupportedVersions} from "../../shared/types";

const MD_PATH = path.resolve(process.cwd(), ".satsuma.json");

interface DownloadedFile {
    fileName: string;
    fileContents: string;
}

const v1: CliVersion = {
    init: async (args) => {
        const spinner = ora({
            text: 'Downloading files',
            spinner: spinners.moon
        }).start();

        await download({
            versionFolder: SupportedVersions.v1,
            spinner,
            reset: Boolean(args.reset)
        });
    },
    deploy: async (args) => {

        validateFiles();
        await validateExports();
        const deployKey = args.deployKey || getDeployKey(MD_PATH);
        const md = await getMetadata(MD_PATH);

        const spinner = ora({
            text: "Deploying",
            spinner: spinners.moon,
        }).start();

        const cliData = await getSatsumaMetadata(
            args.subgraphName,
            args.versionName,
            deployKey
        );
        if (!cliData) {
            spinner.fail(); // The error message is logged in getSatsumaMetadata
            return;
        }

        const {resolverFile, typeDefsFile, helpersFile} =
            await loadCustomerCode();
        const downloadedFiles: DownloadedFile[] = (
            [resolverFile, typeDefsFile, helpersFile].filter(Boolean) as string[]
        ).map((file) => ({
            fileName: path.basename(file),
            fileContents: fs.readFileSync(file, "utf8"),
        }));

        try {
            await axios.post("https://app.satsuma.xyz/api/cli/upload", {
                files: downloadedFiles,
            });
            spinner.succeed("Uploaded files successfully");
        } catch (error) {
            spinner.fail("Error uploading files");
            process.exit(1);
        }
    },
    validate: async (args) => {
        validateFiles();
        await validateExports();
        const spinner = ora({
            text: 'Validating',
            spinner: spinners.moon
        });

        const deployKey = args.deployKey || getDeployKey(MD_PATH);

        spinner.text = "Getting metadata";
        const cliData = await satsumaMetadataConfig(deployKey, args.subgraphName, args.versionName);
        if (!cliData) {
            spinner.fail();
            return;
        }
        spinner.succeed();

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
            spinner.fail(`Validation Failed ${e}`);
            process.exit(1);
        }

        spinner.succeed("Validation Passed")
    },
    local: async (args) => {
        validateFiles();
        await validateExports();
        let spinner = ora({
            spinner: spinners.moon
        });
        const deployKey = args.deployKey || getDeployKey(MD_PATH);

        spinner.text = "Getting metadata";
        const cliData = await satsumaMetadataConfig(deployKey, args.subgraphName, args.versionName);
        if (!cliData) {
            spinner.fail();
            return;
        }
        spinner.succeed();

        let server: ApolloServer;

        const shutdownServer = () => {
            return new Promise<void>(async (resolve) => {
                spinner.text = 'Shutting down server...';
                if (server) {
                    server.stop().then(() => {
                        spinner.info("Server shut down");
                        resolve();
                    });
                } else {
                    spinner.info("Server shut down");
                }
                resolve();
            });
        };

        const {resolverFile, typeDefsFile, helpersFile} = await loadCustomerCode();

        const startServer = async (reload = false) => {
            try {
                spinner = ora({text: `${reload ? "Loading" : "Reloading"} code`, spinner: spinners.moon}).start();
                const {databases, graphql} = cliData;
                const {typeDefs, resolvers, helpers} = await loadCustomerCode();
                const config: CreateServerConfig = {
                    databases,
                    graphql,
                    resolverFile,
                    typeDefsFile,
                    helpersFile,
                };
                spinner.succeed();

                server = await createServer(config, typeDefs, resolvers, helpers);

                return new Promise(async (resolve,) => {
                    spinner = ora({
                        text: 'Starting server',
                        spinner: spinners.runner
                    }).start();

                    const {url} = await server.listen();
                    spinner.text = `Running server at ${url}`;

                    process.on('SIGINT', () => {
                        shutdownServer().then(() => process.exit(0));
                    });

                    process.on('SIGTERM', () => {
                        shutdownServer().then(() => process.exit(0));
                    });
                });
            } catch (e) {
            }
        }

        const fileChangedHandler = (fileName: string) => async (curr: fs.Stats, prev: fs.Stats) => {
            console.log(`\n${fileName} file changed`);
            await shutdownServer();
            await startServer();
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
        await v1Codegen.types(args);
    },
    upgrade: async (args) => {
        console.log('Not possible to update TO v1. Perhaps you mixed up the arguments?')
    }
};

export default v1;
