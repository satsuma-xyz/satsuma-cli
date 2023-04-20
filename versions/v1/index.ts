import {CliVersion, SupportedVersions} from "../../shared/types";
import {download} from "../../shared/helpers/download-repo";

const v1: CliVersion = {
    init: (args) => {
        download(SupportedVersions.v1);
    },
    deploy: (args) => {
        console.log('deploy v1', args);
    },
    validate: (args) => {
        console.log('validate v1', args);
    },
    local: (args) => {
        console.log('local v1', args);
    },
    codegen: (args) => {
        console.log('codegen v1', args);
    }
}

export default v1;
