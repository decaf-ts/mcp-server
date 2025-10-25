#!/usr/bin/env node
// @ts-nocheck
try {
  require("ts-node").register({ transpileOnly: true });
} catch (e) {
  // ts-node not available; fall back to running compiled lib if present
}

(async () => {
  try {
    const agg =
      await require("../src/mcp/aggregateModules.ts").aggregateModules(
        process.cwd()
      );
    if (agg.conflicts && agg.conflicts.length > 0) {
      console.error("Aggregation conflicts detected:");
      console.error(JSON.stringify(agg.conflicts, null, 2));
      process.exit(2);
    }
    console.log("Aggregation OK: no conflicts detected");
    process.exit(0);
  } catch (err) {
    console.error(
      "Error running aggregation check:",
      err && err.stack ? err.stack : err
    );
    process.exit(3);
  }
})();
