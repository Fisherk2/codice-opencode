#!/usr/bin/env bun
// Wrapper: npm requires bin entries to use .js extension.
// Dynamically import main() since import.meta.main is false
// when the module is loaded via import().
const mod = await import("./main.ts");
await mod.main();
