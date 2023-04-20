import fs from 'fs';
import yargs from 'yargs';
import v1Cli from './versions/v1';
import {CliFnArgs, CliVersion, RunServerArgs, SupportedVersions} from "./shared/types";

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


if (require.main === module) {
    console.log('Entry');
    const cliOptions = yargs
        .option('cli-version', {
            alias: 'v',
            describe: 'Version of the script to run',
            type: 'string',
            choices: ['v1'],
            default: DEFAULT_VERSION || NEWEST_VERSION,
        })
        .command({
            command: 'init',
            describe: 'Initialize the satsuma project',
            handler: (args) => {
                if (checkVersion(args.cliVersion)) {
                    versions[args.cliVersion].init(args as unknown as CliFnArgs)
                } else {
                    throw new Error(`Unsupported version: ${args.cliVersion}`);
                }
            },
        })
        .command({
            command: 'deploy',
            describe: 'Deploy to Satsuma.xyz 🍊',
            handler: (args) => {
                if (checkVersion(args.cliVersion)) {
                    versions[args.cliVersion].deploy(args as unknown as CliFnArgs)
                } else {
                    throw new Error(`Unsupported version: ${args.cliVersion}`);
                }
            },
        })
        .command({
            command: 'validate',
            describe: 'Validate your custom queries.',
            handler: (args) => {
                if (checkVersion(args.cliVersion)) {
                    versions[args.cliVersion].validate(args as unknown as CliFnArgs)
                } else {
                    throw new Error(`Unsupported version: ${args.cliVersion}`);
                }
            },
        })
        .command({
            command: 'local',
            describe: 'Run a local graphql server.',
            handler: (args) => {
                if (checkVersion(args.cliVersion)) {
                    versions[args.cliVersion].local(args as unknown as RunServerArgs)
                } else {
                    throw new Error(`Unsupported version: ${args.cliVersion}`);
                }
            },
        })
        .command({
            command: 'codegen',
            describe: 'Generate the graphql schema & types.',
            handler: (args) => {
                if (checkVersion(args.cliVersion)) {
                    versions[args.cliVersion].codegen(args as unknown as CliFnArgs)
                } else {
                    throw new Error(`Unsupported version: ${args.cliVersion}`);
                }
            },
        }).parseSync();

    console.log('Exit', cliOptions);
}
