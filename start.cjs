const path = require("path");
const { existsSync } = require("fs");

const candidates = [
 path.join(process.cwd(), "dist", "app.js"),
 path.join(process.cwd(), "..", "dist", "app.js"),
];

for (const distPath of candidates) {
 if (existsSync(distPath)) {
  require(distPath);
  process.exit(0);
 }
}

console.error("Cannot find dist/app.js. Tried:");
candidates.forEach((c) => console.error(`  ${c}`));
console.error("Did you run 'npm run build' first?");
process.exit(1);
