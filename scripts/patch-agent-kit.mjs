import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const agentKitDist = path.join(root, "node_modules", "@inngest", "agent-kit", "dist");

if (!fs.existsSync(agentKitDist)) {
  process.exit(0);
}

const filesToPatch = fs.readdirSync(agentKitDist)
  .filter((f) => f.endsWith(".js") || f.endsWith(".cjs"))
  .map((f) => path.join(agentKitDist, f));

for (const filePath of filesToPatch) {
  let content = fs.readFileSync(filePath, "utf-8");
  let modified = false;

  // 1. Preserve thoughtSignature when parsing model candidates
  if (!content.includes("thoughtSignature: thoughtSig")) {
    const target = 'else if (candidate.content.role === "model" && "functionCall" in content) {';
    const replacement =
      'else if (candidate.content.role === "model" && "functionCall" in content) {\n        const thoughtSig = content.thoughtSignature || content.thought_signature || (content.functionCall && (content.functionCall.thoughtSignature || content.functionCall.thought_signature));';
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      modified = true;
    }

    const idTarget = 'id: content.functionCall.name\n            }';
    const idReplacement = 'id: content.functionCall.id || content.functionCall.name,\n              thoughtSignature: thoughtSig\n            }';
    if (content.includes(idTarget)) {
      content = content.replace(idTarget, idReplacement);
      modified = true;
    }
  }

  // 2. Echo thought_signature back to Gemini
  if (!content.includes("part.thought_signature = sig;")) {
    const singleToolCallPattern = /case "tool_call":\s*if \(m\.tools\.length === 0\) \{\s*throw new Error\("Tool call message must have at least one tool"\);\s*\}\s*return \{\s*role: "model",\s*parts: \[\s*\{\s*functionCall: \{\s*name: m\.tools\[0\]\.name,\s*args: m\.tools\[0\]\.input\s*\}\s*\}\s*\]\s*\};/g;

    const multiToolCallReplacement = `case "tool_call":
          if (m.tools.length === 0) {
            throw new Error("Tool call message must have at least one tool");
          }
          return {
            role: "model",
            parts: m.tools.map((t) => {
              const part = {
                functionCall: {
                  name: t.name,
                  args: t.input
                }
              };
              const sig = t.thoughtSignature || t.thought_signature;
              if (sig) {
                part.thought_signature = sig;
              }
              return part;
            })
          };`;

    if (singleToolCallPattern.test(content)) {
      content = content.replace(singleToolCallPattern, multiToolCallReplacement);
      modified = true;
    }
  }

  // 3. Match tools when model prefixes namespaces (e.g. default_api:terminal)
  if (content.includes("const found = this.tools.get(tool.name);")) {
    content = content.replaceAll(
      "const found = this.tools.get(tool.name);",
      'const found = this.tools.get(tool.name) || this.tools.get(tool.name.replace(/^.*:/, ""));'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`[patch-agent-kit] Patched ${path.basename(filePath)}`);
  }
}
