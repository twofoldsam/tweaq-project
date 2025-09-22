# Smart QA Browser

A powerful Electron desktop application for visual code editing with GitHub integration.

## Architecture

This is a monorepo built with pnpm workspaces containing:

- **`apps/desktop`** - Electron shell with React UI (Vite + TypeScript)
- **`packages/overlay`** - Injected editor UI components (React + TypeScript → ESM bundle)
- **`packages/github`** - GitHub OAuth Device Flow + PR management (Octokit)
- **`packages/change-engine`** - Visual edits to file updates mapper

## Tech Stack

- **Runtime**: Node.js 18+, Electron 26+
- **Build**: Vite, TypeScript (strict mode), pnpm workspaces
- **UI**: React 18, CSS3
- **GitHub**: Octokit REST API, OAuth Device Flow
- **Code Quality**: ESLint, Prettier, strict TypeScript

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+ (install with `npm install -g pnpm`)

### Installation & Development

```bash
# Clone and install dependencies
git clone <repository-url>
cd smart-qa-browser
pnpm install

# Start development (Electron + Vite dev servers)
pnpm dev
```

This will:
1. Start Vite dev server for the React UI (http://localhost:5173)
2. Launch Electron with hot reload
3. Open the app window with a top app bar

### Build for Production

```bash
# Build all packages and create distributables
pnpm build
```

Distributables will be created in `dist/` directory for your platform.

## Development Commands

```bash
# Development
pnpm dev              # Start Electron + Vite concurrently
pnpm build            # Build overlay + desktop app
pnpm build:all        # Build all packages

# Code Quality
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix auto-fixable lint issues
pnpm type-check       # TypeScript type checking

# Cleanup
pnpm clean            # Clean all build outputs
```

## Package Scripts

Each workspace has its own scripts:

```bash
# Desktop app
pnpm --filter desktop dev       # Vite + Electron dev mode
pnpm --filter desktop build     # Build + create distributables

# Overlay package
pnpm --filter overlay dev       # Build in watch mode
pnpm --filter overlay build     # Build ESM bundle

# GitHub package
pnpm --filter github build     # Build TypeScript

# Change engine
pnpm --filter change-engine build  # Build TypeScript
```

## Project Structure

```
smart-qa-browser/
├── apps/
│   └── desktop/                 # Electron app
│       ├── src/
│       │   ├── App.tsx         # Main React component
│       │   ├── App.css         # App styles
│       │   ├── main.tsx        # React entry point
│       │   └── index.css       # Global styles
│       ├── main.ts             # Electron main process
│       ├── preload.ts          # Electron preload script
│       ├── index.html          # HTML template
│       ├── vite.config.ts      # Vite configuration
│       └── package.json
├── packages/
│   ├── overlay/                # Injected editor UI
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── OverlayEditor.tsx
│   │   │   │   └── CodeHighlighter.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── vite.config.ts      # ESM bundle config
│   │   └── package.json
│   ├── github/                 # GitHub integration
│   │   ├── src/
│   │   │   ├── auth.ts         # OAuth Device Flow
│   │   │   ├── pull-request.ts # PR management
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── change-engine/          # Edit mapping
│       ├── src/
│       │   ├── mapper.ts       # Visual edits → file updates
│       │   ├── updater.ts      # File system operations
│       │   ├── types.ts
│       │   └── index.ts
│       └── package.json
├── pnpm-workspace.yaml         # Workspace configuration
├── package.json                # Root package
├── tsconfig.json               # TypeScript configuration
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
├── .editorconfig              # Editor configuration
└── .gitignore
```

## Configuration

### TypeScript

- Strict mode enabled with all strict checks
- Absolute imports configured with path mapping
- Project references for optimal build performance

### ESLint + Prettier

- React and TypeScript rules
- Automatic formatting on save (configure in your editor)
- Consistent code style across all packages

### Electron

- Security: Context isolation enabled, node integration disabled
- Modern window styling with hidden title bar
- Development: Hot reload with Vite integration

## GitHub Integration

To use GitHub features:

1. Create a GitHub OAuth App at https://github.com/settings/developers
2. Set the Client ID in your app configuration
3. Use the Device Flow for authentication (no client secret needed)

## Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Use conventional commits
3. Ensure TypeScript strict mode compliance
4. Test changes in development mode before building

## License

[Your License Here]
