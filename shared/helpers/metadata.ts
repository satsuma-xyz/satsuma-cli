import fs from "fs";

export const createMetadataFile = (metadataPath: string) => {
    try {
        fs.utimesSync(metadataPath, new Date(), new Date());
    } catch (e) {
        let fd = fs.openSync(metadataPath, 'a');
        fs.closeSync(fd);
    }
}

export const addMetadata = (metadataPath: string, newMetadata: Record<string, any>) => {
    const metadata = fs.readFileSync(metadataPath, 'utf8');
    let metadataObj = metadata ? JSON.parse(metadata) : {};
    metadataObj = {
        ...metadataObj,
        ...newMetadata
    }
    fs.writeFileSync(metadataPath, JSON.stringify(metadataObj, null, 2));
}