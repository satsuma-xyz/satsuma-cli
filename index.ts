#!/usr/bin/env satsuma

// Keep this one at the top to suppress warnings about fetch API
import 'suppress-experimental-warnings';

import * as fs from 'fs';
import * as yargs from 'yargs';
import v1Cli from './versions/v1';
import {run} from "./shared/helpers/cli";
import {CliVersion, InitArgs, RunServerArgs, SupportedVersions, WithSubgraphData} from "./shared/types";
import {checkForNpmUpdates, getCurrentPackage} from "./shared/helpers/npm";
import { exec } from 'child_process';
import * as util from 'util';
import ora from "ora";
import spinners from "cli-spinners";
import {sleepAwait} from "sleep-await";

const versions: Record<SupportedVersions, CliVersion> = {
    [SupportedVersions.v1]: v1Cli,
};

interface SatsumaJson {
    version: string;
}

const checkVersion = (version: string): version is SupportedVersions => {
    return Object.values(SupportedVersions).includes(
        version as SupportedVersions
    );
};

// Read the default version from the satsuma.json file
const DEFAULT_VERSION = (() => {
    try {
        const {version} = JSON.parse(
            fs.readFileSync("./.satsuma.json", "utf8")
        ) as SatsumaJson;
        return version;
    } catch (err) {
        return null;
    }
})();

const NEWEST_VERSION = "v1";

const cliOptions = yargs
    .option("cli-version", {
        alias: "v",
        describe: "Version of the script to run",
        type: "string",
        choices: ["v1"],
        default: DEFAULT_VERSION || NEWEST_VERSION,
    })
    .option("deploy-key", {
        alias: "k",
        describe: "Your Satsuma deploy key",
        type: "string",
        demandOption: false,
    })
    .option("subgraphName", {
        describe: "The name of the subgraph",
        type: "string",
        demandOption: false,
    })
    .option("versionName", {
        describe: "The name of the version you want to deploy to",
        type: "string",
        demandOption: false,
    })
    .command({
        command: "init",
        describe: "Initialize the satsuma project",
        handler: () => {},
    })
    .command({
        command: "deploy",
        describe: "Deploy to Satsuma.xyz 🍊",
        handler: () => {},
    })
    .command({
        command: "validate",
        describe: "Validate your custom queries.",
        handler: () => {},
    })
    .command({
        command: "local",
        describe: "Run a local graphql server.",
        handler: () => {},
    })
    .command({
        command: "codegen",
        describe: "Generate the graphql schema & types.",
        handler: () => {},
    })
    .command({
        command: "ignore",
        describe: "",
        handler: () => {},
    })
    .command({
        command: "selfupdate",
        describe: "Update the Satsuma CLI",
        handler: () => {},
    })
    .parseSync();

if (require.main === module) {
    run(async () => {
        const { currentVersion } = getCurrentPackage();
        console.log(`🍊 Satsuma CLI version ${currentVersion}. Project Version: ${cliOptions.cliVersion}.`);

        const cmd = cliOptions._[0];

        if (cmd !== "selfupdate") {
            await checkForNpmUpdates();
        }

        switch (cmd) {
            case "init":
                if (checkVersion(cliOptions.cliVersion)) {
                    await versions[cliOptions.cliVersion].init(
                        cliOptions as unknown as InitArgs
                    );
                } else {
                    throw new Error(`Unsupported version: ${cliOptions.cliVersion}`);
                }
                break;
            case "deploy":
                if (checkVersion(cliOptions.cliVersion)) {
                    await versions[cliOptions.cliVersion].deploy(
                        cliOptions as unknown as WithSubgraphData
                    );
                } else {
                    throw new Error(`Unsupported version: ${cliOptions.cliVersion}`);
                }
                break;
            case "validate":
                if (checkVersion(cliOptions.cliVersion)) {
                    await versions[cliOptions.cliVersion].validate(
                        cliOptions as unknown as WithSubgraphData
                    );
                } else {
                    throw new Error(`Unsupported version: ${cliOptions.cliVersion}`);
                }
                break;
            case "local":
                if (checkVersion(cliOptions.cliVersion)) {
                    await versions[cliOptions.cliVersion].local(
                        cliOptions as unknown as RunServerArgs
                    );
                } else {
                    throw new Error(`Unsupported version: ${cliOptions.cliVersion}`);
                }
                break;
            case 'codegen':
                if (checkVersion(cliOptions.cliVersion)) {
                    await versions[cliOptions.cliVersion].codegen(cliOptions as unknown as WithSubgraphData)
                } else {
                    throw new Error(`Unsupported version: ${cliOptions.cliVersion}`);
                }
                break;
            case 'selfupdate':
                const onCurrentVersion = await checkForNpmUpdates(true);
                if (onCurrentVersion){
                    ora().succeed('Satsuma CLI is already up to date!');
                    return;
                }

                let { currentVersion } = getCurrentPackage();
                const spinner = ora({text: `Updating Satsuma CLI from ${currentVersion}...`, spinner: "moon"}).start();
                try {
                    await util.promisify(exec)('npx --yes clear-npx-cache; npx --yes @satsuma/cli ignore', {shell: '/bin/bash'});
                    currentVersion = getCurrentPackage().currentVersion;
                    spinner.succeed(`Updated Satsuma CLI to ${currentVersion}!`);
                } catch {
                    spinner.fail(`Error!`);
                }
                break;
        }
    });
}

export {};
