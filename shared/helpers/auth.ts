<<<<<<< HEAD
import {getMetadata} from "./metadata";
import axios, {AxiosRequestHeaders} from "axios";
import {stringify} from "query-string";
import colors from 'colors/safe';
import ora from "ora";
=======
import axios, { AxiosRequestHeaders } from "axios";
import colors from "colors/safe";
import { stringify } from "query-string";
>>>>>>> 50be0f0f4dae6e62c840a72e8c1254e30cda21c5

import { getMetadata } from "./metadata";

interface SatsumaMetadata {
  dbUri: string;
  metadataDBUri: string;
  queryHost: string;
  entitySchema: string;
  nonPartitionedTables: string[];
  partitionedTables: string[];
  nonPartitionedTablesBR: string[];
  entityTablesWithBR: string[];
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

export const getSatsumaMetadata = async (
  subgraphName?: string,
  versionName?: string,
  deployKey?: string
): Promise<SatsumaMetadata | undefined> => {
  if (!deployKey) {
    const md = getMetadata(".satsuma.json");
    if (md.deployKey) {
      deployKey = md.deployKey;
    }
  }

  try {
    const headers: AxiosRequestHeaders["headers"] = {
      Authorization: `Bearer ${deployKey}`,
    };
    const url = `https://app.satsuma.xyz/api/cli/data?${stringify({
      subgraphName,
      versionName,
    })}`;
    const result = await axios.get(url, {
      headers,
    });

<<<<<<< HEAD
const isErrorResponse = (response: CliDataResponse): response is ErrorResponse => {
    return (response as ErrorResponse).message !== undefined;
}

export const getSatsumaMetadata = async (subgraphName?: string, versionName?: string, deployKey?: string): Promise<SatsumaMetadata | undefined> => {
    const spinner = ora({text: 'Fetching data from Satsuma API', spinner: "moon"}).start();

    if (!deployKey) {
        const md = getMetadata('.satsuma.json');
        if (md.deployKey) {
            deployKey = md.deployKey;
=======
    if (isErrorResponse(result.data)) {
      console.log("Error response from Satsuma API:");
      console.log(colors.red(result.data.message));
      if (result.data.availableSubgraphs) {
        console.log("- Available subgraphs:");
        for (const subgraph of result.data.availableSubgraphs) {
          console.log("\t-", subgraph);
>>>>>>> 50be0f0f4dae6e62c840a72e8c1254e30cda21c5
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

<<<<<<< HEAD
    try {
        const headers: AxiosRequestHeaders['headers'] = {
            Authorization: `Bearer ${deployKey}`
        };
        const url = `https://app.satsuma.xyz/api/cli/data?${stringify({subgraphName, versionName})}`
        const result = await axios.get(url, {
            headers
        });

        if (isErrorResponse(result.data)) {
            spinner.fail("Error response from Satsuma API:")
            console.log(colors.red(result.data.message))
            if (result.data.availableSubgraphs) {
                console.log("- Available subgraphs:")
                for (const subgraph of result.data.availableSubgraphs) {
                    console.log("\t-", subgraph)
                }
            }
            if (result.data.availableVersions) {
                console.log("- Available subgraph versions:")
                for (const version of result.data.availableVersions) {
                    console.log("\t-", version)
                }
            }

            return;
        }

        spinner.succeed()
        return result.data;
    } catch (e) {
        console.error(e);
    }
}
=======
    return result.data;
  } catch (e) {
    console.error(e);
  }
};
>>>>>>> 50be0f0f4dae6e62c840a72e8c1254e30cda21c5
