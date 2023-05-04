import * as fs from "fs";

export const createMetadataFile = (metadataPath: string) => {
  try {
    fs.utimesSync(metadataPath, new Date(), new Date());
  } catch (e) {
    const fd = fs.openSync(metadataPath, "a");
    fs.closeSync(fd);
  }
};

export const addMetadata = (
  metadataPath: string,
  newMetadata: Record<string, any>
) => {
  const metadata = fs.readFileSync(metadataPath, "utf8");
  let metadataObj = metadata ? JSON.parse(metadata) : {};
  metadataObj = {
    ...metadataObj,
    ...newMetadata,
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadataObj, null, 2));
};

export const getMetadata = (metadataPath: string) => {
  const metadata = fs.readFileSync(metadataPath, "utf8");
  return metadata ? JSON.parse(metadata) : {};
};

export const getDeployKey = (metadataPath: string) => {
  return getMetadata(metadataPath).deployKey;
};
