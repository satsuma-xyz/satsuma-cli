import { CreateServerConfig } from "@satsuma/codegen/versions/v1/template/types";

export interface CliFnArgs {
  cliVersion: string;
  [p: string]: any;
}

export type InitArgs = CliFnArgs & {
    path: string;
    reset?: boolean;
}

export type WithSubgraphData = CliFnArgs & {
    deployKey: string
    subgraphName?: string;
    versionName?: string;
    cliDataEndpoint?: string;
}

export type RunServerArgs = WithSubgraphData & {
  port: string;
} & CreateServerConfig;

type CliFunction<T extends CliFnArgs = CliFnArgs> = (args: T) => Promise<void>;

export interface CliVersion {
    init: CliFunction<InitArgs>;
    deploy: CliFunction<WithSubgraphData>;
    validate: CliFunction<WithSubgraphData>;
    local: CliFunction<RunServerArgs>;
    codegen: CliFunction<WithSubgraphData>;
    upgrade: CliFunction;
}

export enum SupportedVersions {
  v1 = "v1",
}

export const NEWEST_VERSION = SupportedVersions.v1;
