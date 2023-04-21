export type CliFnArgs = {
    cliVersion: string;
}

export type RunServerArgs = CliFnArgs & {port: string}

type CliFunction<T extends CliFnArgs = CliFnArgs> = (args: T) => void;

export interface CliVersion {
    init: CliFunction;
    deploy: CliFunction;
    validate: CliFunction;
    local: CliFunction<RunServerArgs>;
    codegen: CliFunction;
    upgrade: CliFunction;
}

export enum SupportedVersions {
    v1 = 'v1',
}

export const NEWEST_VERSION = SupportedVersions.v1