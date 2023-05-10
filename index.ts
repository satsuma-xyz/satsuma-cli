// Just call `npx ts-node run.ts` with all the args

import * as child_process from "child_process";
import path from "path";

const location = path.resolve(process.cwd(), "run.ts");

child_process.execSync(`npx ts-node ${location} ` + process.argv.slice(2).join(" "));