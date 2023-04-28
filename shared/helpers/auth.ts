import {getMetadata} from "./metadata";
import axios, {AxiosRequestHeaders} from "axios";
import {stringify} from "query-string";
import * as colors from 'colors/safe';

type SatsumaMetadata = {
    dbUri: string;
    metadataDBUri: string;
    queryHost: string;
    entitySchema: string;
    nonPartitionedTables: string[];
    partitionedTables: string[];
};

type ErrorResponse = {
    message: string;
    availableSubgraphs?: string[];
    availableVersions?: string[];
}

type CliDataResponse =
    | SatsumaMetadata
    | ErrorResponse;

const isErrorResponse = (response: CliDataResponse): response is ErrorResponse => {
    return (response as ErrorResponse).message !== undefined;
}

export const getSatsumaMetadata = async (subgraphName?: string, versionName?: string, deployKey?: string): Promise<SatsumaMetadata | undefined> => {
    if (!deployKey) {
        const md = getMetadata('.satsuma.json');
        if (md.deployKey) {
            deployKey = md.deployKey;
        }
    }

    try {
        const headers: AxiosRequestHeaders['headers'] = {
            Authorization: `Bearer ${deployKey}`
        };
        const url = `http://localhost:3001/api/cli/data?${stringify({subgraphName, versionName})}`
        const result = await axios.get(url, {
            headers
        });

        if (isErrorResponse(result.data)) {
            console.log("Error response from Satsuma API:")
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

        return result.data;
    } catch (e) {
        console.error(e);
    }
}
