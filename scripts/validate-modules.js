#!/usr/bin/env node
/* scripts/validate-modules.js
   Lightweight text-based validator for src/modules structure.
   Emits a JSON report and exits 0 on success, 1 on failure.
*/
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// Delegate to the CommonJS validator so Node can execute the logic reliably
require("./validate-modules.cjs");
