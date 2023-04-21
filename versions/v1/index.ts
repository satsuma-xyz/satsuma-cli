import {CliVersion, SupportedVersions} from "../../shared/types";
import {download} from "../../shared/helpers/download-repo";

const v1: CliVersion = {
    init: (args) => {
        download(SupportedVersions.v1);
    },
    deploy: (args) => {
        console.log('🍊deploy not implemented yet');
    },
    validate: (args) => {
        console.log('🍊validate not implemented yet');
    },
    local: (args) => {
        console.log('🍊local not implemented yet');
    },
    codegen: (args) => {
        console.log('🍊codegen not implemented yet');
    },
    upgrade: (args) => {
        console.log('🍊upgrade not implemented yet');
    }
}

export default v1;
