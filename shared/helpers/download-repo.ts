import * as fs from 'fs';
import * as unzipper from 'unzipper';
import * as path from 'path';
import * as _ from 'lodash';
import { SupportedVersions } from "../types";
import { addMetadata, createMetadataFile } from "./metadata";
import axios from 'axios';

const TEMP_ZIP_FILE = 'satsuma-project-skeleton.zip';

const createFileFromEntry = (entry: any, filePath: string) => {
    if (fs.existsSync(filePath)) {
        console.log(`\tFile already exists, skipping...`);
        entry.autodrain();
        return;
    }
    entry.pipe(fs.createWriteStream(filePath));
}

export const download = async (versionFolder: SupportedVersions, projectPathPrefix: string | null = 'custom-queries', repoOwner = 'satsuma-xyz', repoName = 'custom-query-skeleton', branch = 'main', metadataFile = '.satsuma.json') => {
    const repoUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/${branch}.zip`
    const rootZipFolder = `${repoName}-${branch}`;
    const versionFolderPath = `${rootZipFolder}/${versionFolder}/`;

    if (projectPathPrefix && !projectPathPrefix.endsWith('/')) {
        projectPathPrefix += '/'
    }

    if (projectPathPrefix) {
        fs.mkdirSync(projectPathPrefix);
    }

    const downloadedFiles: string[] = [];

    try {
        await new Promise<void>((resolve, reject) => {
            axios({
                url: repoUrl,
                method: 'get',
                responseType: 'stream'
            })
                .then(response => {
                    createMetadataFile(metadataFile);
                    const file = fs.createWriteStream(TEMP_ZIP_FILE);
                    response.data.pipe(file);

                    file.on("finish", () => {
                        fs.createReadStream(TEMP_ZIP_FILE)
                            .pipe(unzipper.Parse())
                            .on("entry", (entry) => {
                                const fileName = entry.path;
                                const filePath = path.join(process.cwd(), fileName);
                                if (!fileName.startsWith(versionFolderPath)) {
                                    entry.autodrain();
                                    return;
                                }

                                if (fileName.endsWith("/") || fileName.endsWith("\\")) {
                                    fs.mkdirSync(filePath.replace(versionFolderPath, './'), {recursive: true});
                                } else {
                                    const subPath = fileName.replace(versionFolderPath, '');
                                    const relativePath: string[] = [
                                        projectPathPrefix,
                                        subPath
                                    ].filter(_.identity);
                                    const builtPath = path.join(...relativePath);
                                    console.log(`📄 ${builtPath}`);
                                    downloadedFiles.push(builtPath);
                                    const fullPath = path.join(...[
                                        process.cwd(),
                                        ...relativePath
                                    ]);
                                    createFileFromEntry(entry, fullPath);
                                }
                            })
                            .on("close", () => {
                                addMetadata(metadataFile, {version: versionFolder, downloadedFiles: downloadedFiles});
                                const versionFolderPath = path.join(process.cwd(), versionFolder);
                                if (fs.existsSync(versionFolderPath)) {
                                    fs.rmdirSync(versionFolderPath, {recursive: true});
                                }
                                fs.unlinkSync(TEMP_ZIP_FILE);
                                resolve();
                            })
                            .on("error", (error) => {
                                reject(error);
                            });
                    });
                })
                .catch(error => {
                    reject(error);
                });
        });
    } catch (error) {
        throw `Error downloading repository from GitHub: ${error}`;
    }
}
