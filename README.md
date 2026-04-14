# Slack Vision — Partner Cloud

A Slack-style prototype shell for **Partner Cloud** and **channel manager** experiences (forked from the Slack App Shell boilerplate).

> **⚠️ This is a read-only template repository.** To make changes, please **fork** this repository and work in your own fork.

## 🎯 What This Is

This is a **boilerplate template** that provides a fully functional Slack-like UI shell with:
- ✅ Complete sidebar navigation (Today, Home, DMs, Activity, Files, Later, Agentforce)
- ✅ Interactive chat surfaces with message input
- ✅ Today view with focus prompts, agenda, highlights, and replies
- ✅ Generic placeholder data ready for your concepts
- ✅ All interactions working (sidebar clicks, hover states, animations)

**Perfect for:** Designers who want to prototype new Slack app experiences without building the shell from scratch.

## 🚀 Quick Start

**Prerequisites:**
- Node.js 18+ 
- npm or yarn

### For Designers (GitSoma)

**Step 1: Fork the repository**
- Go to: `https://git.soma.salesforce.com/prantik-banerjee/slack-app-shell-template`
- Click the **"Fork"** button (top right)
- This creates your own copy

**Step 2: Clone your fork**
```bash
git clone https://github.com/YOUR-USERNAME/slack-vision-partner-cloud.git
cd slack-vision-partner-cloud
```

**Step 3: Install & Run**
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the Slack App Shell with Today view loaded.

**Step 4: Make changes**
- Edit files in `src/` folder
- Changes appear instantly in your browser
- Commit and push to your fork when ready

## 📁 Project Structure

```
src/
├── app/
│   └── page.tsx              # Main entry point - renders SlackAppShell
├── components/
│   ├── presentation/
│   │   ├── SlackAppShell.tsx  # Core shell component
│   │   ├── SlackTodayView.tsx # Today view with focus prompts & agenda
│   │   └── TemplateViews.tsx  # Generic template views (Home, Activity, Files, etc.)
│   └── shared/
│       ├── UniversalChatSurface.tsx  # Reusable chat interface
│       └── ChatMessage.tsx           # Message component
└── context/
    └── DemoDataContext.tsx   # Mock data for channels, DMs, files
```

## GitHub Pages

Static export uses **`basePath` `/slack-vision-partner-cloud`** (`next.config.mjs`). For assets to load on GitHub Pages, your repository name should be **`slack-vision-partner-cloud`** (URL: `https://<user>.github.io/slack-vision-partner-cloud/`). If your repo slug differs, set `publishBasePath` in `next.config.mjs` to `/<repo-name>` and run `npm run build:pages`.

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React** (with hooks)
- **Framer Motion** (animations)

## 📄 License

This is a template for internal use. Customize as needed for your projects.
