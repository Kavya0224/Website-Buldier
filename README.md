# Website-Buldier
🚀 Mini Website Builder (CLI AI Agent)  Mini Website Builder is a command-line AI-powered tool that generates complete frontend websites using natural language prompts.  Instead of manually creating folders, files, and writing boilerplate code, users simply describe what they want  and the system automatically:
Analyzes the request

Creates the required project folder

Generates index.html, style.css, and script.js

Writes complete frontend code

Opens the website in the browser

All directly from the terminal.

💡 How It Works

The user enters a website idea in the CLI.

The AI model processes the request.

The agent uses a controlled tool system to:

Execute safe shell commands (like mkdir)

Create and write files programmatically

The generated project runs instantly.

The architecture includes:

AI request handling using Gemini API

Tool-based command execution

File generation using Node.js

Conversation memory management

Rate-limit and quota handling logic

🛠 Tech Stack

Node.js

Google Gemini API

readline-sync (CLI interaction)

child_process (command execution)

dotenv (secure API key handling)

🔐 Key Features

Natural language → working website

Automated project structure creation

OS-aware command execution

Secure API key management

CLI-based interactive experience

Tool-driven AI execution model
