# Change Engine

A TypeScript package for applying intelligent code modifications, with special support for Tailwind CSS utility class transformations in React/JSX files.

## Features

- **In-Memory Patching**: Apply code changes without touching the file system
- **Tailwind CSS Support**: Intelligent manipulation of Tailwind utility classes using AST parsing
- **Fallback Strategy**: Generates changelog entries when automatic patching isn't feasible
- **Type-Safe**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @smart-qa/change-engine
```

## Usage

### Basic Example

```typescript
import { InMemoryPatcher } from '@smart-qa/change-engine';

const patcher = new InMemoryPatcher();

const result = await patcher.prepareFilesForIntent({
  owner: 'myorg',
  repo: 'myrepo', 
  ref: 'main',
  hints: [
    {
      owner: 'myorg',
      repo: 'myrepo',
      ref: 'main',
      filePath: 'src/components/Button.tsx',
      intent: 'Make button text larger and more rounded',
      targetElement: 'button',
      tailwindChanges: {
        fontSize: 'lg',
        radius: 'lg'
      }
    }
  ]
});

console.log(result.fileUpdates); // Array of file modifications
console.log(result.changelogEntry); // Fallback changelog if needed
```

### Supported Tailwind Changes

The patcher supports the following Tailwind utility transformations:

- **fontSize**: `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, etc.
- **spacing**: Padding and margin utilities (`p-4`, `m-2`, etc.)
- **colors**: Text and background colors (`text-blue-500`, `bg-red-600`, etc.)
- **radius**: Border radius utilities (`rounded`, `rounded-lg`, `rounded-full`, etc.)
- **Custom**: Any custom Tailwind utility class

### Type Definitions

```typescript
interface SourceHint {
  owner: string;
  repo: string;
  ref: string;
  filePath: string;
  intent: string;
  targetElement?: string;
  tailwindChanges?: {
    fontSize?: string;
    spacing?: string;
    colors?: string;
    radius?: string;
    [key: string]: string | undefined;
  };
}

interface PatchResult {
  fileUpdates: Array<{
    path: string;
    newContent: string;
  }>;
  changelogEntry?: string;
}
```

## How It Works

1. **File Detection**: Identifies React/JSX files with Tailwind CSS classes
2. **AST Parsing**: Uses `ts-morph` to parse and manipulate the code structure
3. **Class Transformation**: Intelligently replaces Tailwind utility classes
4. **Fallback Strategy**: Generates changelog entries for non-compatible files

## Limitations

- Currently requires a mock implementation for file reading (you'll need to implement the `readFile` method)
- Focuses primarily on simple Tailwind class replacements
- Best suited for React/JSX files with standard className attributes

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run linting
npm run lint

# Type checking
npm run type-check
```

## License

MIT
