// debug-api-routes.mjs (note the .mjs extension)
// Run with: node debug-api-routes.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkApiRoutes(dir = "./server/api") {
  const issues = [];

  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);

      if (item.isDirectory()) {
        scanDirectory(fullPath);
      } else if (
        item.isFile() &&
        (item.name.endsWith(".ts") || item.name.endsWith(".js"))
      ) {
        try {
          const content = fs.readFileSync(fullPath, "utf8");

          // Check if file is empty
          if (content.trim() === "") {
            issues.push({
              file: fullPath,
              issue:
                "File is empty - needs to export a default handler function",
            });
            continue;
          }

          // Check if it exports a default function
          const hasDefaultExport =
            content.includes("export default") ||
            content.includes("module.exports");
          const hasDefineEventHandler = content.includes("defineEventHandler");

          if (!hasDefaultExport) {
            issues.push({
              file: fullPath,
              issue: "Missing default export",
            });
          }

          if (!hasDefineEventHandler && hasDefaultExport) {
            issues.push({
              file: fullPath,
              issue: "Should use defineEventHandler for Nuxt 3 compatibility",
            });
          }

          console.log(`✓ ${fullPath} - Looks good`);
        } catch (error) {
          issues.push({
            file: fullPath,
            issue: `Error reading file: ${error.message}`,
          });
        }
      }
    }
  }

  if (!fs.existsSync(dir)) {
    console.log(`❌ API directory ${dir} doesn't exist`);
    return;
  }

  scanDirectory(dir);

  if (issues.length > 0) {
    console.log("\n❌ Issues found:");
    issues.forEach(({ file, issue }) => {
      console.log(`   ${file}: ${issue}`);
    });
  } else {
    console.log("\n✅ All API routes look good!");
  }
}

// Run the check
checkApiRoutes();
