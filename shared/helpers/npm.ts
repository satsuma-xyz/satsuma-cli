import * as fs from 'fs';
import axios from 'axios';
import * as path from 'path';

export const checkForNpmUpdates = async () => {
    const packageJsonRaw = fs.readFileSync(path.join(__dirname, '../../package.json')).toString();
    const packageJson = JSON.parse(packageJsonRaw);
    const packageName = packageJson.name;
    const currentVersion = packageJson.version;

    axios.get(`https://registry.npmjs.org/${packageName}`)
        .then(response => {
            const latestVersion = response.data['dist-tags'].latest;
            if (currentVersion === latestVersion) {
                console.log(`You're using the latest version of ${packageName} (${currentVersion}).`);
            } else {
                console.log(`There's a newer version of ${packageName} available (${latestVersion}).`);
            }
        })
        .catch(error => {
            console.error(`Error checking ${packageName} version: ${error}`);
        });
}