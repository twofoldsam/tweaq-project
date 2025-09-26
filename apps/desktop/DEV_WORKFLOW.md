# Smart QA Browser - Development Workflow

## 🚀 Starting Development

### Option 1: Clean Start (Recommended)
```bash
cd /Users/samwalker/Desktop/Tweaq/apps/desktop
pnpm dev:clean
```

This will:
- ✅ Kill any existing processes using port 5173
- ✅ Clean up any stuck Electron processes  
- ✅ Start the development environment
- ✅ Handle cleanup automatically when you press Ctrl+C

### Option 2: Manual Cleanup + Start
```bash
cd /Users/samwalker/Desktop/Tweaq/apps/desktop
pnpm dev:cleanup  # Clean up first
pnpm dev          # Then start normally
```

### Option 3: Standard Start
```bash
cd /Users/samwalker/Desktop/Tweaq/apps/desktop
pnpm dev
```

## 🛑 Stopping Development

When using `pnpm dev:clean`:
- Just press **Ctrl+C** - cleanup happens automatically!

When using `pnpm dev`:
- Press **Ctrl+C** to stop
- If port 5173 is still in use next time, run: `pnpm dev:cleanup`

## 🔧 Troubleshooting

### "Port 5173 is already in use"
```bash
pnpm dev:cleanup
```

### Electron app won't start
```bash
# Kill all related processes
pkill -f "electron.*Smart QA" || true
pkill -f "vite.*5173" || true
pkill -f "concurrently.*desktop" || true
```

### Fresh restart
```bash
pnpm dev:cleanup
pnpm dev:clean
```

## 📱 What You Should See

1. **Terminal Output**: Build processes, Vite dev server, Electron startup
2. **Smart QA Browser Window**: 
   - Toolbar with navigation buttons
   - URL bar
   - Settings button (⚙️)
   - Browser view below

3. **Settings Panel** (click ⚙️):
   - GitHub Settings
   - CDP Test
   - LLM Settings
   - **Visual Agent** ← Your new integration!

## 🎯 Visual Coding Agent

The Visual Coding Agent is integrated but temporarily shows a placeholder. Once you add your `ANTHROPIC_API_KEY` to the `.env` file, you can re-enable the full functionality.

## 📝 Development Notes

- Port 5173: Vite dev server
- Port varies: Electron app
- Hot reload works for React components
- Electron main process requires restart for changes
- Use `pnpm build:electron-main` to recompile main process
