import { CreateServerConfig } from "@satsuma/codegen/versions/v1/template/types";

export type CliFnArgs = {
    cliVersion: string;
    [p: string]: any;
}

export type WithDeployKey = CliFnArgs & {
    deployKey: string
}

export type RunServerArgs = WithDeployKey & {port: string} & CreateServerConfig;

type CliFunction<T extends CliFnArgs = CliFnArgs> = (args: T) => Promise<void>;

export interface CliVersion {
    init: CliFunction;
    deploy: CliFunction<WithDeployKey>;
    validate: CliFunction<WithDeployKey>;
    local: CliFunction<RunServerArgs>;
    codegen: CliFunction<WithDeployKey>;
    upgrade: CliFunction;
}

export enum SupportedVersions {
    v1 = 'v1',
}

export const NEWEST_VERSION = SupportedVersions.v1