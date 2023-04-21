import * as fs from 'fs';
import axios from 'axios';
import * as path from 'path';
import * as colors from 'colors/safe';

export const checkForNpmUpdates = async () => {
    const packageJsonRaw = fs.readFileSync(path.join(__dirname, '../../package.json')).toString();
    const packageJson = JSON.parse(packageJsonRaw);
    const packageName = packageJson.name;
    const currentVersion = packageJson.version;

    try {
        const response = await axios.get(`https://registry.npmjs.org/${packageName}`)
        const latestVersion = response.data['dist-tags'].latest;
        if (currentVersion !== latestVersion) {
            console.log(colors.red(`\nThere's a newer version of ${(packageName)} available (${latestVersion}).`))
            console.log(colors.red('Upgrade with: ') + colors.bold(`npx ${packageName}@latest\n\n`));
        }
    } catch (err) {}
}