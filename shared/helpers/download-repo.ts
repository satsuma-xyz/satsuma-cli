import * as fs from 'fs';
import * as unzipper from 'unzipper';
import * as path from 'path';
import _ from 'lodash';
import {SupportedVersions} from "../types";
import {addMetadata, createMetadataFile} from "./metadata";
import axios from 'axios';
import ora from 'ora';
import {checkProjectNotExists} from "../../versions/v1/validations";

const TEMP_ZIP_FILE = "satsuma-project-skeleton.zip";

const createFileFromEntry = (entry: any, filePath: string, reset = false) => {
    if (fs.existsSync(filePath) && !reset) {
        entry.autodrain();
        return;
    }
    entry.pipe(fs.createWriteStream(filePath));
}

export const download = async (
    {
        versionFolder,
        projectPathPrefix = 'custom-queries',
        repoOwner = 'satsuma-xyz',
        repoName = 'custom-query-skeleton',
        branch = 'main',
        metadataFile = path.resolve(process.cwd(), '.satsuma.json'),
        spinner,
        reset = false
    }: {
        versionFolder: SupportedVersions;
        projectPathPrefix?: string;
        repoOwner?: string;
        repoName?: string;
        branch?: string;
        metadataFile?: string;
        spinner?: ora.Ora;
        reset?: boolean;
    }
) => {
    if (!reset) {
        try {
            checkProjectNotExists();
        } catch (e) {
            if (spinner) {
                spinner.fail((e as Error).message);
            }
            process.exit(1);
        }
    }


  const repoUrl = `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/${branch}.zip`;
  const rootZipFolder = `${repoName}-${branch}`;
  const versionFolderPath = `${rootZipFolder}/${versionFolder}/`;

    if (projectPathPrefix && !projectPathPrefix.endsWith('/')) {
        projectPathPrefix += '/'
    }

    if (projectPathPrefix) {
        try {
            if (spinner) {
                spinner.text = `Creating directory ./${projectPathPrefix}`;
            }
            fs.mkdirSync(projectPathPrefix, {recursive: reset});
        } catch {
            if (spinner) {
                spinner.fail(`Project already exists in this directory. You must remove the ./${projectPathPrefix} directory before initializing`);
            }
            process.exit(1);
        }
    }

    if (spinner) {
        spinner.text = `Fetching files from github: ${repoUrl}`;
    }

    const downloadedFiles: string[] = [];

  if (projectPathPrefix) {
    try {
        await new Promise<void>((resolve, reject) => {
            axios({
                url: repoUrl,
                method: 'get',
                responseType: 'stream'
            })
                .then(response => {
                    createMetadataFile(path.join(metadataFile));
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
                                    downloadedFiles.push(subPath);
                                    const fullPath = path.join(...[
                                        process.cwd(),
                                        ...relativePath
                                    ]);
                                    createFileFromEntry(entry, fullPath, reset);
                                }
                            })
                            .on("close", () => {
                                addMetadata(metadataFile, {
                                    version: versionFolder,
                                    projectPathPrefix
                                });
                                fs.unlinkSync(TEMP_ZIP_FILE);
                                if (spinner) {
                                    spinner.succeed(`Downloaded files to ./${projectPathPrefix}`);
                                }
                                resolve();
                            })
                            .on("error", (error) => {
                                reject(error);
                            });
                    });
                })
                .catch(error => {
                    if (spinner){
                        spinner.fail(`Error downloading repository from GitHub: ${error}`);
                    }
                    reject(error);
                });
        });
    } catch (error) {
        if (spinner){
            spinner.fail(`Error downloading repository from GitHub: ${error}`);
        }
    }
  }
};
