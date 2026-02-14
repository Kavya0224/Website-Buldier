import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import "dotenv/config"; // ✅ use .env

const platform = os.platform();
const asyncExecute = promisify(exec);

let History = [];
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// -------------------- TOOL --------------------
async function executeCommand({ command }) {
  try {
    const { stdout, stderr } = await asyncExecute(command, { windowsHide: true });

    // stderr can contain warnings; don't treat as fatal always
    const out = [stdout?.trim(), stderr?.trim()].filter(Boolean).join("\n");
    return `OK\n${out || "(no output)"}`;
  } catch (error) {
    return `ERROR\n${error?.message || String(error)}`;
  }
}

const executeCommandDeclaration = {
  name: "executeCommand",
  description:
    "Execute a single terminal/shell command. Use for mkdir, creating files, opening index.html, etc.",
  parameters: {
    type: "OBJECT",
    properties: {
      command: {
        type: "STRING",
        description: 'A single command. Example: "mkdir calculator"',
      },
    },
    required: ["command"],
  },
};

const availableTools = { executeCommand };

// -------------------- HELPERS (fix undefined) --------------------
function getFunctionCalls(resp) {
  if (resp?.functionCalls?.length) return resp.functionCalls;

  const parts = resp?.candidates?.[0]?.content?.parts || [];
  return parts.filter(p => p.functionCall).map(p => p.functionCall);
}

function getText(resp) {
  if (typeof resp?.text === "string" && resp.text.trim()) return resp.text.trim();

  const parts = resp?.candidates?.[0]?.content?.parts || [];
  const t = parts.filter(p => typeof p.text === "string").map(p => p.text).join("\n");
  return t.trim();
}

// -------------------- AGENT --------------------
async function runAgent(userProblem) {
  History.push({ role: "user", parts: [{ text: userProblem }] });

  const MAX_TURNS = 2; // keep low to reduce 429

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: History,

      // ✅ tools MUST be top-level
      tools: [{ functionDeclarations: [executeCommandDeclaration] }],

      config: {
        systemInstruction: `
You are a Website builder expert. Create a frontend website from the user request.

OS: ${platform}

CRITICAL RULES:
- DO NOT use "echo" to write code.
- Prefer minimum commands.
- Use executeCommand only.

Steps:
1) mkdir folder
2) create index.html, style.css, script.js
3) open index.html (Windows: start)

Output ONLY tool calls.
        `.trim(),
      },
    });

    const calls = getFunctionCalls(response);

    if (calls.length > 0) {
      for (const fc of calls) {
        console.log(fc);

        const { name, args } = fc;
        const tool = availableTools[name];
        const result = tool ? await tool(args) : `ERROR: Unknown tool ${name}`;

        // push tool call
        History.push({ role: "model", parts: [{ functionCall: fc }] });

        // push tool result
        History.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name,
                response: { result },
              },
            },
          ],
        });
      }
      continue;
    }

    const text = getText(response);
    console.log(text || "Done (no text).");
    History.push({ role: "model", parts: [{ text: text || "" }] });
    return;
  }

  console.log("Stopped: too many tool steps (to avoid rate limits).");
}

// -------------------- MAIN (no recursion) --------------------
async function main() {
  console.log("I am a cursor: let's create a website");
  console.log('Commands: "reset" (clear history), "exit"\n');

  while (true) {
    const userProblem = readlineSync.question("Ask me anything--> ");
    const cmd = userProblem.trim().toLowerCase();

    if (cmd === "exit") break;
    if (cmd === "reset") {
      History = [];
      console.log("History cleared.\n");
      continue;
    }

    await runAgent(userProblem);
  }
}

main();
