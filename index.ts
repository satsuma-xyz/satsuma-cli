#!/usr/bin/env node

import * as fs from 'fs';
import * as yargs from 'yargs';
import v1Cli from './versions/v1';
import {run} from "./shared/helpers/cli";
import {CliFnArgs, CliVersion, RunServerArgs, SupportedVersions, WithDeployKey} from "./shared/types";
import {checkForNpmUpdates} from "./shared/helpers/npm";
import * as child_process from "child_process";

const versions: Record<SupportedVersions, CliVersion> = {
    [SupportedVersions.v1]: v1Cli,
}

interface SatsumaJson {
    version: string;
}

const checkVersion = (version: string): version is SupportedVersions => {
    return Object.values(SupportedVersions).includes(version as SupportedVersions);
}

// Read the default version from the satsuma.json file
const DEFAULT_VERSION = (() => {
    try {
        const {version} = JSON.parse(fs.readFileSync('./.satsuma.json', 'utf8')) as SatsumaJson;
        return version;
    } catch (err) {
        return null;
    }
})();

const NEWEST_VERSION = 'v1';

const cliOptions = yargs
    .option('cli-version', {
        alias: 'v',
        describe: 'Version of the script to run',
        type: 'string',
        choices: ['v1'],
        default: DEFAULT_VERSION || NEWEST_VERSION,
    })
    .option('deploy-key', {
        alias: 'k',
        describe: 'Your Satsuma deploy key',
        type: 'string',
        demandOption: false,
    })
    .command({
        command: 'init',
        describe: 'Initialize the satsuma project',
        handler: (args) => {
        },
    })
    .command({
        command: 'deploy',
        describe: 'Deploy to Satsuma.xyz 🍊',
        handler: (args) => {

        },
    })
    .command({
        command: 'validate',
        describe: 'Validate your custom queries.',
        handler: (args) => {

        },
    })
    .command({
        command: 'local',
        describe: 'Run a local graphql server.',
        handler: (args) => {

        },
    })
    .command({
        command: 'codegen',
        describe: 'Generate the graphql schema & types.',
        handler: (args) => {

        },
    })
    .command({
        command: 'ignore',
        describe: '',
        handler: (args) => {
        },
    })
    .command({
        command: 'selfupdate',
        describe: 'Update the Satsuma CLI',
        handler: (args) => {

        },
    })
    .parseSync();

if (require.main === module) {
    run(async () => {
        console.log('🍊 Satsuma CLI version:', NEWEST_VERSION);
        await checkForNpmUpdates();

        const cmd = cliOptions._[0];

        switch (cmd) {
            case 'init':
                if (checkVersion(cliOptions.cliVersion)) {
                    await versions[cliOptions.cliVersion].init(cliOptions as unknown as CliFnArgs)
                } else {
                    throw new Error(`Unsupported version: ${cliOptions.cliVersion}`);
                }
                break;
            case 'deploy':
                if (checkVersion(cliOptions.cliVersion)) {
                    await versions[cliOptions.cliVersion].deploy(cliOptions as unknown as WithDeployKey)
                } else {
                    throw new Error(`Unsupported version: ${cliOptions.cliVersion}`);
                }
                break;
            case 'validate':
                if (checkVersion(cliOptions.cliVersion)) {
                    await versions[cliOptions.cliVersion].validate(cliOptions as unknown as WithDeployKey)
                } else {
                    throw new Error(`Unsupported version: ${cliOptions.cliVersion}`);
                }
                break;
            case 'local':
                if (checkVersion(cliOptions.cliVersion)) {
                    await versions[cliOptions.cliVersion].local(cliOptions as unknown as RunServerArgs)
                } else {
                    throw new Error(`Unsupported version: ${cliOptions.cliVersion}`);
                }
                break;
            case 'codegen':
                if (checkVersion(cliOptions.cliVersion)) {
                    await versions[cliOptions.cliVersion].codegen(cliOptions as unknown as WithDeployKey)
                } else {
                    throw new Error(`Unsupported version: ${cliOptions.cliVersion}`);
                }
                break;
            case 'selfupdate':
                console.log('Updating Satsuma CLI...');
                try {
                    child_process.execSync('npx --yes clear-npx-cache; npx --yes @satsuma/cli ignore', {
                        shell: '/bin/bash',
                        stdio: 'pipe'
                    });
                } catch {
                }
                console.log('Done!');
                break;
        }

    });
}

export {};
