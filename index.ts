// Just call `npx ts-node run.ts` with all the args

import * as child_process from "child_process";
import path from "path";

const location = path.resolve(__dirname, "run.ts");
console.log("running ts-node", location, process.argv.slice(2).join(" "));

child_process.execSync(`npx ts-node ${location} ` + process.argv.slice(2).join(" "));