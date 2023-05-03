import spinners from "cli-spinners";
import * as fs from "fs";
import ora from "ora";
import * as path from "path";

export const checkProjectNotExists = () => {
  // Check if .satsuma.json exists in cwd
  if (fs.existsSync(path.resolve(process.cwd(), ".satsuma.json"))) {
    console.error(
      "Project already exists in this directory. You must remove `.satsuma.json` before initializing"
    );
    process.exit(1);
  }
};

export const validateFiles = () => {
  const typeDefsPath = "./custom-queries/typeDefs.ts";
  const resolversPath = "./custom-queries/resolvers.ts";

  const typeDefsExist = fs.existsSync(typeDefsPath);
  const resolversExist = fs.existsSync(resolversPath);

  if (!typeDefsExist && !resolversExist) {
    console.error(
      "No graphql types or resolvers found. Please run `init` to get started"
    );
    process.exit(1);
  }

  if (!resolversExist) {
    console.error("Missing resolvers. Please run `init` to get started");
    process.exit(1);
  }

  if (!typeDefsExist) {
    console.error("Missing graphql types. Please run `init` to get started");
    process.exit(1);
  }
};

export const validateExports = async () => {
  const resolverPath = "./custom-queries/resolvers.ts";
  const resolverFile = path.resolve(resolverPath);
  let error = false;

  let spinner = ora({
    text: "Checking Resolvers",
    spinner: spinners.moon,
  }).start();
  try {
    if ((await import(resolverFile)).resolvers === undefined) {
      spinner.fail(`Missing export \`resolvers\` from ${resolverPath}.`);
      error = true;
    }
  } catch (e) {
    spinner.fail(`Missing export \`resolvers\` from ${resolverPath}.`);
    error = true;
  }
  spinner.succeed("Resolvers found");

  spinner = ora({
    text: "Checking Typedefs",
    spinner: spinners.moon,
  }).start();
  const typeDefsPath = "./custom-queries/typeDefs.ts";
  const typeDefsFile = path.resolve(typeDefsPath);
  try {
    if ((await import(typeDefsFile)).typeDefs === undefined) {
      spinner.fail(`Missing export \`typeDefs\` from ${typeDefsPath}.`);
      error = true;
    }
  } catch {
    spinner.fail(`Missing export \`typeDefs\` from ${typeDefsPath}.`);
    error = true;
  }
  spinner.succeed("TypeDefs found");

  spinner = ora({
    text: "Checking helpers",
    spinner: spinners.moon,
  }).start();
  const helpersPath = "./custom-queries/helpers.ts";
  const helpersFile = path.resolve(helpersPath);
  try {
    if (fs.existsSync(helpersFile)) {
      if ((await import(helpersFile)).helpers === undefined) {
        spinner.fail(`Missing export \`helpers\` from ${helpersPath}.`);
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
