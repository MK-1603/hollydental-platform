/**
 * migrate-error-handling.mjs
 *
 * One-shot script: replaces the repetitive catch-block pattern:
 *
 *   } catch (error) {
 *     console.error("...", error);
 *     return res.status(500).json({ message: "..." });
 *   }
 *
 * with:
 *
 *   } catch (error) {
 *     next(error);
 *   }
 *
 * Rules:
 *  - Only rewrites catch blocks whose entire body is console.error + res.status(500)
 *  - Preserves any catch blocks that contain real logic (e.g. 404 checks,
 *    conditional status codes, variable assignments)
 *  - Never touches files outside src/routes/
 *  - Creates a .bak backup of every modified file
 *
 * Run: node scripts/migrate-error-handling.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.join(__dirname, "../src/routes");

// Match a catch block that contains ONLY console.error + res.status(5xx)
// (possibly with `return` prefix). Uses a simple line-by-line state machine.
function rewrite(source, filePath) {
  const lines = source.split("\n");
  const out = [];
  let i = 0;
  let totalRewrites = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Look for: } catch (error) { or } catch (err) {
    const catchMatch = /^(\s*)\}\s*catch\s*\((\w+)\)\s*\{/.exec(line);
    if (catchMatch) {
      const indent = catchMatch[1];
      const errVar = catchMatch[2];

      // Collect the catch block body
      const bodyLines = [];
      let j = i + 1;
      let depth = 1;
      while (j < lines.length && depth > 0) {
        const l = lines[j];
        if (/\{/.test(l)) depth++;
        if (/\}/.test(l)) depth--;
        if (depth > 0) bodyLines.push(l);
        j++;
      }
      const closingBrace = lines[j - 1]; // the line with the final `}`

      // Check if the body is ONLY: optional console.error + res.status(5xx).json(...)
      const nonEmpty = bodyLines.map((l) => l.trim()).filter((l) => l.length > 0);

      const isSimpleErrorBlock =
        nonEmpty.length >= 1 &&
        nonEmpty.length <= 3 &&
        nonEmpty.every(
          (l) =>
            /^console\.(error|warn)\(/.test(l) ||
            /^(return\s+)?res\.status\(5\d\d\)/.test(l)
        ) &&
        nonEmpty.some((l) => /^(return\s+)?res\.status\(5\d\d\)/.test(l));

      if (isSimpleErrorBlock) {
        // Emit the rewritten version
        out.push(line); // } catch (errVar) {
        out.push(`${indent}  next(${errVar});`);
        out.push(`${indent}}`);
        totalRewrites++;
        i = j; // skip past the original block
        continue;
      }
    }

    out.push(line);
    i++;
  }

  return { source: out.join("\n"), totalRewrites };
}

const files = fs.readdirSync(routesDir).filter((f) => f.endsWith(".js"));

let grandTotal = 0;
for (const file of files) {
  const filePath = path.join(routesDir, file);
  const original = fs.readFileSync(filePath, "utf8");
  const { source, totalRewrites } = rewrite(original, filePath);

  if (totalRewrites > 0) {
    fs.writeFileSync(filePath + ".bak", original, "utf8");
    fs.writeFileSync(filePath, source, "utf8");
    console.log(`  ✔ ${file}  (${totalRewrites} catch block(s) rewritten)`);
    grandTotal += totalRewrites;
  } else {
    console.log(`  · ${file}  (no changes)`);
  }
}

console.log(`\nDone. ${grandTotal} catch blocks rewritten across ${files.length} route files.`);
