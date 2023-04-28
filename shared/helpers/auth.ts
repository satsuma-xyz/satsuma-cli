import {getMetadata} from "./metadata";
import axios, {AxiosRequestHeaders} from "axios";
import {stringify} from "query-string";

type SatsumaMetadata = {
    dbUri: string;
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

export const getSatsumaMetadata = async (subgraphName?: string, versionName?: string, deployKey?: string) => {
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

        const result = await axios.get(`http://localhost:3000/api/cli/data?${stringify({subgraphName, versionName})}`, {
            headers
        });
        return result.data;
    } catch (e) {
        console.error(e);
    }
}
