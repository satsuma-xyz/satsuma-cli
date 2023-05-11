import spinners from "cli-spinners";
import * as fs from "fs";
import ora from "ora";
import * as path from "path";
import {getFilePath} from "./utils";

export const checkProjectNotExists = () => {
  // Check if .satsuma.json exists in cwd
  if (fs.existsSync(path.resolve(process.cwd(), ".satsuma.json"))) {
    throw new Error(
      "Project already exists in this directory. You must remove `.satsuma.json` before initializing"
    );
  }
};

export const validateFiles = () => {
  const satsumaJson = ".satsuma.json";
  const typeDefsPath = "./custom-queries/typeDefs.ts";
  const resolversPath = "./custom-queries/resolvers.ts";

  const satsumaJsonExist = fs.existsSync(satsumaJson);
  const typeDefsExist = fs.existsSync(typeDefsPath);
  const resolversExist = fs.existsSync(resolversPath);

  if (!satsumaJsonExist && !satsumaJsonExist) {
    ora().fail(
      "No .satsuma.json metadata found. Please run `init` to get started"
    );
    process.exit(1);
  }

  if (!typeDefsExist && !resolversExist) {
    ora().fail(
      "No graphql types or resolvers found. Please run `init` to get started"
    );
    process.exit(1);
  }

  if (!resolversExist) {
    ora().fail("Missing resolvers. Please run `init` to get started");
    process.exit(1);
  }

  if (!typeDefsExist) {
    ora().fail("Missing graphql types. Please run `init` to get started");
    process.exit(1);
  }
};

export const validateExports = async () => {
  const resolverPath = getFilePath("resolvers");
  let error = false;

  let spinner = ora({
    text: "Checking Resolvers",
    spinner: spinners.moon,
  }).start();
  try {
    if ((await import(resolverPath)).resolvers === undefined) {
      spinner.fail(`Missing export \`resolvers\` from ${resolverPath}.ts.`);
      error = true;
    }
  } catch (e) {
    console.log("ERROR", e);
    spinner.fail(`Missing export \`resolvers\` from ${resolverPath}.ts. File does not exist.`);
    error = true;
  }
  if (!error) {
      spinner.succeed("Resolvers found");
  }

  spinner = ora({
    text: "Checking Typedefs",
    spinner: spinners.moon,
  }).start();

  const typeDefsPath = getFilePath("typeDefs");
  try {
    if ((await import(typeDefsPath)).typeDefs === undefined) {
      spinner.fail(`Missing export \`typeDefs\` from ${typeDefsPath}.ts.`);
      error = true;
    }
  } catch (e) {
    console.log("ERROR", e);
    spinner.fail(`Missing export \`typeDefs\` from ${typeDefsPath}.ts. File does not exist.`);
    error = true;
  }

  if (!error) {
    spinner.succeed("TypeDefs found");
  }

  spinner = ora({
    text: "Checking helpers",
    spinner: spinners.moon,
  }).start();
  const helpersPath = getFilePath("helpers");
  try {
    if (fs.existsSync(helpersPath)) {
      if ((await import(helpersPath)).helpers === undefined) {
        spinner.fail(`Missing export \`helpers\` from ${helpersPath}.ts.`);
        error = true;
      }
      spinner.succeed("Helpers found");
    } else {
      spinner.succeed("Helpers not found (optional)");
    }
  } catch {
    // Do nothing.
  }

  if (error) {
    process.exit(1);
  }
};
