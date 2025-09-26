"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemRepositoryAnalyzer = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const types_1 = require("@/core/types");
class FileSystemRepositoryAnalyzer {
    async analyzeRepository(rootPath) {
        try {
            const [framework, stylingSystem] = await Promise.all([
                this.detectFramework(rootPath),
                this.detectStylingSystem(rootPath),
            ]);
            const [designTokens, componentPatterns, fileStructure] = await Promise.all([
                this.extractDesignTokens(rootPath, stylingSystem),
                this.analyzeComponentPatterns(rootPath, framework),
                this.analyzeFileStructure(rootPath),
            ]);
            return {
                framework,
                stylingApproach: stylingSystem,
                designTokens,
                componentPatterns,
                fileStructure,
            };
        }
        catch (error) {
            throw new types_1.RepositoryAnalysisError(`Failed to analyze repository at ${rootPath}`, { rootPath, error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async detectFramework(rootPath) {
        try {
            const packageJsonPath = path.join(rootPath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
            const dependencies = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };
            // Check for React
            if (dependencies.react || dependencies['@types/react']) {
                return 'react';
            }
            // Check for Vue
            if (dependencies.vue || dependencies['@vue/core']) {
                return 'vue';
            }
            // Check for Svelte
            if (dependencies.svelte || dependencies['@sveltejs/kit']) {
                return 'svelte';
            }
            // Default to React if unclear
            return 'react';
        }
        catch {
            return 'react'; // Default fallback
        }
    }
    async detectStylingSystem(rootPath) {
        try {
            const packageJsonPath = path.join(rootPath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
            const dependencies = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };
            // Check for Tailwind
            if (dependencies.tailwindcss) {
                return 'tailwind';
            }
            // Check for Material-UI
            if (dependencies['@mui/material'] || dependencies['@material-ui/core']) {
                return 'mui';
            }
            // Check for Chakra UI
            if (dependencies['@chakra-ui/react']) {
                return 'chakra';
            }
            // Check for Ant Design
            if (dependencies.antd) {
                return 'ant-design';
            }
            // Check for styled-components
            if (dependencies['styled-components']) {
                return 'styled-components';
            }
            // Check for CSS modules
            const hasModuleCss = await this.findFiles(rootPath, /\.module\.css$/);
            if (hasModuleCss.length > 0) {
                return 'css-modules';
            }
            return 'vanilla-css';
        }
        catch {
            return 'vanilla-css';
        }
    }
    async extractDesignTokens(rootPath, stylingSystem) {
        switch (stylingSystem) {
            case 'tailwind':
                return this.extractTailwindTokens(rootPath);
            case 'mui':
                return this.extractMuiTokens(rootPath);
            case 'chakra':
                return this.extractChakraTokens(rootPath);
            case 'styled-components':
                return this.extractStyledComponentsTokens(rootPath);
            default:
                return this.extractCssTokens(rootPath);
        }
    }
    async extractTailwindTokens(rootPath) {
        const defaultTokens = this.getDefaultTailwindTokens();
        try {
            // Look for tailwind.config.js/ts
            const configFiles = await this.findFiles(rootPath, /tailwind\.config\.(js|ts)$/);
            if (configFiles.length === 0) {
                return defaultTokens;
            }
            const configPath = configFiles[0];
            if (!configPath) {
                return defaultTokens;
            }
            const configContent = await fs.readFile(configPath, 'utf-8');
            // Extract custom theme values (simplified parsing)
            const customTokens = this.parseTailwindConfig(configContent);
            return this.mergeTokens(defaultTokens, customTokens);
        }
        catch {
            return defaultTokens;
        }
    }
    getDefaultTailwindTokens() {
        return {
            colors: {
                slate: { 50: '#f8fafc', 100: '#f1f5f9', 500: '#64748b', 900: '#0f172a' },
                gray: { 50: '#f9fafb', 100: '#f3f4f6', 500: '#6b7280', 900: '#111827' },
                red: { 50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 900: '#7f1d1d' },
                blue: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 900: '#1e3a8a' },
                green: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 900: '#14532d' },
                yellow: { 50: '#fefce8', 100: '#fef3c7', 500: '#eab308', 900: '#713f12' },
            },
            typography: {
                fontSizes: {
                    xs: '0.75rem',
                    sm: '0.875rem',
                    base: '1rem',
                    lg: '1.125rem',
                    xl: '1.25rem',
                    '2xl': '1.5rem',
                    '3xl': '1.875rem',
                },
                fontWeights: {
                    thin: '100',
                    light: '300',
                    normal: '400',
                    medium: '500',
                    semibold: '600',
                    bold: '700',
                    extrabold: '800',
                },
                lineHeights: {
                    none: '1',
                    tight: '1.25',
                    snug: '1.375',
                    normal: '1.5',
                    relaxed: '1.625',
                    loose: '2',
                },
                fontFamilies: {
                    sans: 'ui-sans-serif, system-ui, sans-serif',
                    serif: 'ui-serif, Georgia, serif',
                    mono: 'ui-monospace, monospace',
                },
            },
            spacing: {
                0: '0px',
                1: '0.25rem',
                2: '0.5rem',
                3: '0.75rem',
                4: '1rem',
                5: '1.25rem',
                6: '1.5rem',
                8: '2rem',
                10: '2.5rem',
                12: '3rem',
                16: '4rem',
                20: '5rem',
                24: '6rem',
            },
            shadows: {
                sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            },
            borderRadius: {
                none: '0px',
                sm: '0.125rem',
                md: '0.375rem',
                lg: '0.5rem',
                xl: '0.75rem',
                full: '9999px',
            },
            breakpoints: {
                sm: '640px',
                md: '768px',
                lg: '1024px',
                xl: '1280px',
            },
        };
    }
    parseTailwindConfig(configContent) {
        // Simplified parsing - in a real implementation, you'd want more robust parsing
        const tokens = {};
        // Extract colors
        const colorsMatch = configContent.match(/colors:\s*{([^}]+)}/s);
        if (colorsMatch) {
            // Parse color definitions (simplified)
            tokens.colors = {};
        }
        return tokens;
    }
    async extractMuiTokens(_rootPath) {
        // Extract MUI theme tokens
        // const themeFiles = await this.findFiles(rootPath, /theme\.(js|ts)$/);
        // Return default MUI tokens for now
        return {
            colors: {
                primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
                secondary: { main: '#dc004e', light: '#f5325b', dark: '#9a0036' },
                error: { main: '#f44336', light: '#e57373', dark: '#d32f2f' },
                warning: { main: '#ff9800', light: '#ffb74d', dark: '#f57c00' },
                info: { main: '#2196f3', light: '#64b5f6', dark: '#1976d2' },
                success: { main: '#4caf50', light: '#81c784', dark: '#388e3c' },
            },
            typography: {
                fontSizes: {
                    h1: '2.125rem',
                    h2: '1.5rem',
                    h3: '1.25rem',
                    h4: '1.125rem',
                    body1: '1rem',
                    body2: '0.875rem',
                    caption: '0.75rem',
                },
                fontWeights: {
                    light: '300',
                    regular: '400',
                    medium: '500',
                    bold: '700',
                },
                lineHeights: {
                    normal: '1.5',
                    dense: '1.43',
                },
                fontFamilies: {
                    default: '"Roboto", "Helvetica", "Arial", sans-serif',
                },
            },
            spacing: {
                1: '8px',
                2: '16px',
                3: '24px',
                4: '32px',
                5: '40px',
            },
            shadows: {
                1: '0px 2px 1px -1px rgba(0,0,0,0.2)',
                2: '0px 3px 1px -2px rgba(0,0,0,0.2)',
                3: '0px 3px 3px -2px rgba(0,0,0,0.2)',
            },
            borderRadius: {
                default: '4px',
            },
            breakpoints: {
                xs: '0px',
                sm: '600px',
                md: '900px',
                lg: '1200px',
                xl: '1536px',
            },
        };
    }
    async extractChakraTokens(_rootPath) {
        // Similar implementation for Chakra UI
        return this.getDefaultTailwindTokens(); // Placeholder
    }
    async extractStyledComponentsTokens(_rootPath) {
        // Extract theme from styled-components theme provider
        return this.getDefaultTailwindTokens(); // Placeholder
    }
    async extractCssTokens(rootPath) {
        // Extract CSS custom properties
        const cssFiles = await this.findFiles(rootPath, /\.css$/);
        const tokens = {
            colors: {},
            typography: { fontSizes: {}, fontWeights: {}, lineHeights: {}, fontFamilies: {} },
            spacing: {},
            shadows: {},
            borderRadius: {},
            breakpoints: {},
        };
        for (const cssFile of cssFiles) {
            try {
                const content = await fs.readFile(cssFile, 'utf-8');
                const customProps = this.extractCssCustomProperties(content);
                this.mergeCssTokens(tokens, customProps);
            }
            catch {
                // Continue if file can't be read
            }
        }
        return tokens;
    }
    extractCssCustomProperties(cssContent) {
        const properties = {};
        const matches = cssContent.matchAll(/--([a-zA-Z-]+):\s*([^;]+);/g);
        for (const match of matches) {
            if (match[1] && match[2]) {
                properties[match[1]] = match[2].trim();
            }
        }
        return properties;
    }
    mergeCssTokens(tokens, customProps) {
        for (const [prop, value] of Object.entries(customProps)) {
            if (prop.startsWith('color-')) {
                const colorName = prop.replace('color-', '');
                tokens.colors[colorName] = value;
            }
            else if (prop.startsWith('font-size-')) {
                const sizeName = prop.replace('font-size-', '');
                tokens.typography.fontSizes[sizeName] = value;
            }
            else if (prop.startsWith('spacing-')) {
                const spaceName = prop.replace('spacing-', '');
                tokens.spacing[spaceName] = value;
            }
        }
    }
    async analyzeComponentPatterns(rootPath, framework) {
        const componentFiles = await this.findComponentFiles(rootPath, framework);
        const patterns = {
            namingConventions: [],
            importPatterns: [],
            propPatterns: {},
            stylePatterns: [],
        };
        // Analyze a sample of component files
        const sampleFiles = componentFiles.slice(0, 10);
        for (const file of sampleFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                this.extractPatternsFromFile(content, patterns, framework);
            }
            catch {
                // Continue if file can't be read
            }
        }
        return patterns;
    }
    async findComponentFiles(rootPath, framework) {
        const extensions = framework === 'vue' ? ['.vue'] :
            framework === 'svelte' ? ['.svelte'] :
                ['.tsx', '.jsx', '.ts', '.js'];
        const files = [];
        for (const ext of extensions) {
            const found = await this.findFiles(rootPath, new RegExp(`\\${ext}$`));
            files.push(...found);
        }
        return files.filter(file => !file.includes('node_modules') &&
            !file.includes('.test.') &&
            !file.includes('.spec.'));
    }
    extractPatternsFromFile(content, patterns, _framework) {
        // Extract naming conventions
        const componentNameMatch = content.match(/(?:function|const|class)\s+([A-Z][a-zA-Z0-9]*)/);
        if (componentNameMatch?.[1]) {
            patterns.namingConventions.push(componentNameMatch[1]);
        }
        // Extract import patterns
        const imports = content.match(/import\s+.*\s+from\s+['"][^'"]+['"]/g) || [];
        patterns.importPatterns.push(...imports);
        // Extract style patterns
        if (content.includes('className=')) {
            patterns.stylePatterns.push('className');
        }
        if (content.includes('styled.')) {
            patterns.stylePatterns.push('styled-components');
        }
    }
    async analyzeFileStructure(rootPath) {
        const allFiles = await this.findFiles(rootPath, /.*/);
        return {
            components: allFiles.filter(f => (f.includes('component') || f.includes('Component')) &&
                !f.includes('node_modules')),
            styles: allFiles.filter(f => f.endsWith('.css') || f.endsWith('.scss') || f.endsWith('.less')),
            types: allFiles.filter(f => f.endsWith('.d.ts') || (f.endsWith('.ts') && f.includes('type'))),
            utils: allFiles.filter(f => f.includes('util') || f.includes('helper') || f.includes('lib')),
        };
    }
    async findFiles(rootPath, pattern) {
        const files = [];
        const traverse = async (dir) => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                        await traverse(fullPath);
                    }
                    else if (entry.isFile() && pattern.test(entry.name)) {
                        files.push(fullPath);
                    }
                }
            }
            catch {
                // Ignore directories we can't read
            }
        };
        await traverse(rootPath);
        return files;
    }
    mergeTokens(base, custom) {
        return {
            colors: { ...base.colors, ...custom.colors },
            typography: {
                fontSizes: { ...base.typography.fontSizes, ...custom.typography?.fontSizes },
                fontWeights: { ...base.typography.fontWeights, ...custom.typography?.fontWeights },
                lineHeights: { ...base.typography.lineHeights, ...custom.typography?.lineHeights },
                fontFamilies: { ...base.typography.fontFamilies, ...custom.typography?.fontFamilies },
            },
            spacing: { ...base.spacing, ...custom.spacing },
            shadows: { ...base.shadows, ...custom.shadows },
            borderRadius: { ...base.borderRadius, ...custom.borderRadius },
            breakpoints: { ...base.breakpoints, ...custom.breakpoints },
        };
    }
}
exports.FileSystemRepositoryAnalyzer = FileSystemRepositoryAnalyzer;
//# sourceMappingURL=index.js.map