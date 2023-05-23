import {getMetadata} from "./metadata";
import axios from "axios";
import {stringify} from "query-string";
import colors from 'colors/safe';
import ora from "ora";
import {Database, GraphQLServer} from "@satsuma/codegen/versions/v1/template/types";
import {SupportedVersions} from "../types";

interface SatsumaMetadata {
    databases: Database[];
    graphql: GraphQLServer[];
}

interface ErrorResponse {
  message: string;
  availableSubgraphs?: string[];
  availableVersions?: string[];
}

type CliDataResponse = SatsumaMetadata | ErrorResponse;

const isErrorResponse = (
  response: CliDataResponse
): response is ErrorResponse => {
  return (response as ErrorResponse).message !== undefined;
};

export const getSatsumaMetadata = async (cliVersion: SupportedVersions, subgraphName?: string, versionName?: string, deployKey?: string, cliDataEndpoint = "https://app.satsuma.xyz/api/cli/data"): Promise<SatsumaMetadata | undefined> => {
    const spinner = ora({text: 'Fetching data from Satsuma API', spinner: "moon"}).start();

    if (!deployKey) {
        const md = getMetadata('.satsuma.json');
        if (md.deployKey) {
            deployKey = md.deployKey;
        }
    }

    try {
        const url = `${cliDataEndpoint}?${stringify({subgraphName, versionName, cliVersion})}`
        const result = await axios.get(url, {
            headers: {
                'x-api-key': deployKey,
            }
        });

        if (isErrorResponse(result.data)) {
            spinner.fail("Error response from Satsuma API:");
            console.log(colors.red(result.data.message))
            if (result.data.availableSubgraphs) {
                console.log("- Available subgraphs:");
                for (const subgraph of result.data.availableSubgraphs) {
                    console.log("\t-", subgraph)
                }
            }
            if (result.data.availableVersions) {
                console.log("- Available subgraph versions:");
                for (const version of result.data.availableVersions) {
                    console.log("\t-", version);
                }
            }

            return;
        }

        spinner.succeed();
        return result.data;
    } catch (e) {
        console.error(e);
    }
}
