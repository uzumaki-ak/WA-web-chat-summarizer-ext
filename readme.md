# WA-web-chat-summarizer-ext ![Build Status](https://img.shields.io/github/actions/workflow/status/uzumaki-ak/WA-web-chat-summarizer-ext/build.yml?branch=main) ![License](https://img.shields.io/github/license/uzumaki-ak/WA-web-chat-summarizer-ext) ![Version](https://img.shields.io/badge/version-1.0.0-blue)

---
#demo : https://youtu.be/co4GStCRRYw

# Introduction

**WA-web-chat-summarizer-ext** is a sophisticated browser extension designed to enhance your WhatsApp Web experience by providing AI-powered chat summaries. Built with modern web technologies, it seamlessly integrates into WhatsApp Web to extract chat messages, process them using AI, and generate concise summaries, enabling users to quickly grasp lengthy conversations without scrolling through endless messages.

Leveraging TypeScript, Webpack, Tailwind CSS, and the Google Generative AI API, this extension offers a smooth user interface, background processing, and reliable data extraction from WhatsApp Web's DOM. Whether for personal review or professional analysis, WA-web-chat-summarizer-ext streamlines conversation understanding for users on Chrome browsers.

---

# ✨ Features

- **Automatic Chat Extraction:** Parses WhatsApp Web DOM to extract messages, sender info, timestamps, and message direction.
- **AI-Powered Summarization:** Uses Google Generative AI (via @google/generative-ai) with a custom prompt to generate concise, structured summaries of chat history.
- **User-Friendly UI:** Popup interface with customizable message count, time range selectors, and API key management.
- **Secure API Key Storage:** Stores Gemini API keys securely in Chrome local storage, with prompts and setup guidance.
- **Background Processing:** Handles summarization requests in the background, ensuring smooth UX and minimal disruption.
- **Extension Settings & Notifications:** Easily access settings and receive notifications about API key status or errors.
- **Manifest-based Content Script:** Injects message extraction logic directly into WhatsApp Web to reliably parse messages.
- **Modular Architecture:** Clear separation of background, content, and popup logic for maintainability and extensibility.

---

# 🛠️ Tech Stack

| Library/Tool                     | Purpose                                              | Version             |
|----------------------------------|------------------------------------------------------|---------------------|
| **TypeScript**                   | Main language for development                        | 5.3.0               |
| **Webpack**                      | Bundling and build tooling                           | 5.89.0              |
| **Tailwind CSS**                 | Styling for popup UI                                 | 3.3.5               |
| **css-loader & style-loader**    | Processing CSS files                                 | 6.8.1 / 3.3.3       |
| **fs-extra**                     | File system operations during build                  | 11.3.2              |
| **@google/generative-ai**        | AI API client for Google Generative AI             | ^0.1.3              |
| **@types/chrome**                | TypeScript typings for Chrome extensions             | 0.0.258             |
| **webpack-cli**                  | CLI interface for Webpack                            | 5.1.4               |
| **TypeScript**                   | Type definitions and language features               | 5.3.0               |

---

# 🚀 Quick Start / Installation

```bash
# Clone the repository from GitHub
git clone https://github.com/uzumaki-ak/WA-web-chat-summarizer-ext.git

# Navigate into the project directory
cd WA-web-chat-summarizer-ext

# Install dependencies
npm install

# Build the extension (bundles and copies necessary files)
npm run build

# Load the extension into Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the 'dist' folder
```

*Alternatively, if you prefer to download a ZIP package, download from the repository and extract the contents, then load the 'dist' folder as above.*

---

# 📁 Project Structure

```plaintext
/
├── dist/                         # Built extension files (auto-generated)
│   ├── background.js             # Background service worker
│   ├── content.js                # Content script for message extraction
│   ├── popup.html                # Popup UI HTML
│   ├── popup.js                  # Popup script
│   └── icons/                    # Extension icons
├── public/                       # Static assets (icons, styles)
├── src/                          # Source files
│   ├── background/               # Background logic (background.ts)
│   ├── content/                  # Content script to extract messages
│   ├── popup/                    # Popup UI (popup.ts, styles.css)
│   └── utils/                    # Utility functions (messageProcessor.ts, gemini.ts, types.ts)
├── copy-files.js                 # Script to copy static files to dist
├── tailwind.config.js            # Tailwind CSS configuration
├── webpack.config.js             # Build configuration for bundling
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── manifest.json                 # Chrome extension manifest
└── README.md                     # This documentation
```

---

# 🔧 Configuration

### Environment Variables & API Keys

- **Gemini API Key:** Managed via extension popup UI. The key is stored securely in Chrome local storage under `gemini_api_key`.
- **Setup:** Click the "Set API Key" button in the popup, enter your Google Generative AI API key, and save. No environment variables are required outside this setup.

### Build & Development

- **Builds:** Run `npm run build` to bundle the extension for production.
- **Watch Mode:** Use `npm run dev` for development with hot reloading and watch mode.

### Customization

- You can modify `tailwind.config.js` to customize styling.
- Update `manifest.json` for icon changes or permissions.

---

# 📄 API Reference

### Background Script (`background.ts`)

- Listens for messages from content or popup
- Handles commands: `SUMMARIZE_CHAT`, `SET_API_KEY`, `CHECK_API_KEY`, `OPEN_SUMMARIZER`
- Manages GeminiSummarizer instance and API key setup

### Content Script (`contentScript.ts`)

- Extracts chat messages from WhatsApp Web DOM
- Uses multiple selectors to reliably parse message text, sender, timestamp, and direction
- Sends extracted messages to background for summarization

### Utility (`gemini.ts`)

- Manages Google Generative AI interactions
- Formats conversation and prompts AI for summary
- Handles API key storage and retrieval

---

# 🤝 Contributing

Contributions are welcome! Please fork the repository and submit pull requests.

- Report issues or feature requests on [GitHub Issues](https://github.com/uzumaki-ak/WA-web-chat-summarizer-ext/issues)
- Join discussions on [GitHub Discussions](https://github.com/uzumaki-ak/WA-web-chat-summarizer-ext/discussions)
- Review contribution guidelines at [Contributing Guide](https://github.com/uzumaki-ak/WA-web-chat-summarizer-ext/blob/main/CONTRIBUTING.md)

---

# 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

# 🙏 Acknowledgments

- Thanks to the open-source community for Chrome extension best practices
- Inspired by the need for quick WhatsApp chat summaries
- Special thanks to Google Generative AI API for enabling AI-powered features

---

**This project is actively maintained. For questions or support, open an issue or contact the maintainer.**
