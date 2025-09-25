# LLM Configuration Guide

The Smart QA Browser now supports multiple ways to configure LLM providers for intelligent visual change mapping. Choose the method that works best for your workflow.

## 🎯 **Configuration Priority Order**

The app checks for API keys in this order:
1. **Config File** (`llm-config.js`)
2. **Environment Variables**
3. **Hardcoded in Code** (for quick testing)
4. **UI Settings** (fallback)

## 📝 **Method 1: Config File (Recommended)**

1. **Edit `llm-config.js`:**
   ```javascript
   module.exports = {
     // OpenAI Configuration
     openai: {
       apiKey: 'sk-your-actual-openai-key-here',
       enabled: true
     },
     
     // Anthropic Claude Configuration  
     claude: {
       apiKey: 'sk-ant-your-actual-claude-key-here', 
       enabled: false // Set to true if you want to use Claude instead
     },
     
     preferredProvider: 'openai', // Which to use when both are available
   };
   ```

2. **Get API Keys:**
   - **OpenAI**: https://platform.openai.com/api-keys
   - **Claude**: https://console.anthropic.com/

3. **Test it:**
   ```bash
   pnpm dev
   # Look for: "🤖 Using OpenAI provider (from config file)"
   ```

## 🌍 **Method 2: Environment Variables**

1. **Set environment variables:**
   ```bash
   export OPENAI_API_KEY="sk-your-actual-openai-key-here"
   # OR
   export ANTHROPIC_API_KEY="sk-ant-your-actual-claude-key-here"
   ```

2. **Or create a `.env` file:**
   ```bash
   cp env.example .env
   # Edit .env and add your keys
   ```

3. **Start the app:**
   ```bash
   pnpm dev
   # Look for: "🤖 Using OpenAI provider (from environment variable)"
   ```

## ⚡ **Method 3: Hardcoded (Quick Testing)**

1. **Edit `apps/desktop/electron/main.ts`:**
   ```typescript
   const openaiKey = process.env.OPENAI_API_KEY || 
                     'sk-your-actual-openai-key-here' ||  // <- Uncomment and add key
                     null;
   ```

2. **Rebuild and test:**
   ```bash
   cd apps/desktop && pnpm build:electron-main
   pnpm dev
   ```

## 🖥️ **Method 4: UI Settings (Fallback)**

1. Start the app: `pnpm dev`
2. Click ⚙️ → "LLM Settings" tab
3. Select provider and enter API key
4. Save configuration

## 🧪 **Testing Your Configuration**

### **Quick Test:**
```bash
node debug-llm-mapping.js
```

### **Full Test:**
1. Start app: `pnpm dev`
2. Navigate to any website
3. Click 📐 to inject overlay
4. Switch to "Edit" mode
5. Make a visual change
6. Click "Record Edit"
7. Click "Confirm"

**Look for these console messages:**
```
🤖 Using OpenAI provider (from config file)
🧠 Using LLM to analyze visual change and find source files...
🤖 Sending analysis request to LLM...
🎯 LLM mapped to: src/app/page.tsx (confidence: 0.85)
💡 LLM reasoning: The root URL path and paragraph element...
```

## 🔧 **Configuration Examples**

### **OpenAI Only:**
```javascript
// llm-config.js
module.exports = {
  openai: {
    apiKey: 'sk-proj-your-key-here',
    enabled: true
  },
  claude: {
    enabled: false
  }
};
```

### **Claude Only:**
```javascript
// llm-config.js
module.exports = {
  openai: {
    enabled: false
  },
  claude: {
    apiKey: 'sk-ant-your-key-here',
    enabled: true
  }
};
```

### **Both with Preference:**
```javascript
// llm-config.js
module.exports = {
  openai: {
    apiKey: 'sk-proj-your-openai-key',
    enabled: true
  },
  claude: {
    apiKey: 'sk-ant-your-claude-key', 
    enabled: true
  },
  preferredProvider: 'claude' // Will use Claude when both available
};
```

## 🐛 **Troubleshooting**

### **"Using Mock provider" message:**
- Check that your API key is correctly set
- Verify the key format (OpenAI: `sk-proj-...`, Claude: `sk-ant-...`)
- Make sure `enabled: true` in config file

### **"LLM mapping failed" errors:**
- Check your API key has sufficient credits
- Verify internet connection
- Look at the full error message in console

### **Still using UI settings:**
- Config file and environment variables take priority
- Check console message to see which source is being used
- Restart the app after changing configuration

## 💡 **Pro Tips**

1. **Use config file for development** - Easy to toggle providers
2. **Use environment variables for production** - More secure
3. **Start with OpenAI** - Generally more reliable for code analysis
4. **Monitor API usage** - LLM calls are made for each visual edit
5. **Check console logs** - They show exactly which provider is active

## 🔒 **Security Notes**

- Never commit API keys to version control
- Use environment variables in production
- The `llm-config.js` file is gitignored for safety
- UI settings store keys in system keychain (most secure)

---

**Need help?** Check the console output - it shows exactly which LLM provider is being used and from which source!
