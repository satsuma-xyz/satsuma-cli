import axios from "axios";
import * as colors from "colors/safe";
import * as fs from "fs";
import * as path from "path";

export const getCurrentPackage = () => {
    const packageJsonRaw = fs
        .readFileSync(path.join(__dirname, "../../package.json"))
        .toString();
    const packageJson = JSON.parse(packageJsonRaw);
    return {
      packageName: packageJson.name,
      currentVersion: packageJson.version,
    };
}

export const checkForNpmUpdates = async (silent = false): Promise<boolean> => {
  const { packageName, currentVersion } = getCurrentPackage();

  try {
    const response = await axios.get(
      `https://registry.npmjs.org/${packageName}`
    );
    const latestVersion = response.data["dist-tags"].latest;
    if (currentVersion !== latestVersion) {
      if (!silent) {
        console.log(
          colors.red(
            `\nThere's a newer version of ${packageName} available (${latestVersion}).`
          )
        );
        console.log(
          colors.red("Upgrade with: ") +
            colors.bold(`npx ${packageName} selfupdate\n\n`)
        );
      }
      return false;
    }
  } catch (err) {
    // Do nothing.
  }

  return true;
};
