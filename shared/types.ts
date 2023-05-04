import { CreateServerConfig } from "@satsuma/codegen/versions/v1/template/types";

export interface CliFnArgs {
  cliVersion: string;
  [p: string]: any;
}

export type WithDeployKey = CliFnArgs & {
  deployKey: string;
};

export type WithSubgraphData = WithDeployKey & {
  subgraphName?: string;
  versionName?: string;
};

export type RunServerArgs = WithSubgraphData & {
  port: string;
} & CreateServerConfig;

type CliFunction<T extends CliFnArgs = CliFnArgs> = (args: T) => Promise<void>;

export interface CliVersion {
  init: CliFunction;
  deploy: CliFunction<WithSubgraphData>;
  validate: CliFunction<WithDeployKey>;
  local: CliFunction<RunServerArgs>;
  codegen: CliFunction<WithSubgraphData>;
  upgrade: CliFunction;
}

export enum SupportedVersions {
  v1 = "v1",
}

export const NEWEST_VERSION = SupportedVersions.v1;
