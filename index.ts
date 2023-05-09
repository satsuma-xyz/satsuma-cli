// Just call `npx ts-node run.ts` with all the args

import * as child_process from "child_process";

child_process.execSync("npx ts-node run.ts " + process.argv.slice(2).join(" "));