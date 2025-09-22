import { InMemoryPatcher } from './patcher';
import type { SourceHint } from './types';

/**
 * Example usage of the InMemoryPatcher
 */
export async function exampleUsage() {
  const patcher = new InMemoryPatcher();

  // Example hint for a React component with Tailwind classes
  const hints: SourceHint[] = [
    {
      owner: 'myorg',
      repo: 'myrepo',
      ref: 'main',
      filePath: 'src/components/Button.tsx',
      intent: 'Update button styling to use larger text and rounded corners',
      targetElement: 'button',
      tailwindChanges: {
        fontSize: 'lg',
        radius: 'lg',
        colors: 'blue-600',
      },
    },
  ];

  try {
    const result = await patcher.prepareFilesForIntent({
      owner: 'myorg',
      repo: 'myrepo',
      ref: 'main',
      hints,
    });

    console.log('Patch result:', result);

    if (result.fileUpdates.length > 0) {
      console.log('Files to update:');
      result.fileUpdates.forEach(update => {
        console.log(`- ${update.path}`);
        console.log(`  New content preview: ${update.newContent.substring(0, 200)}...`);
      });
    }

    if (result.changelogEntry) {
      console.log('Changelog entry:', result.changelogEntry);
    }
  } catch (error) {
    console.error('Failed to apply patches:', error);
  }
}

// Example of what a React component with Tailwind classes might look like before patching
export const EXAMPLE_REACT_COMPONENT = `
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return (
    <button
      className="px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
`;

// Example of what it might look like after patching
export const EXAMPLE_REACT_COMPONENT_AFTER = `
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return (
    <button
      className="px-4 py-2 text-lg rounded-lg bg-blue-600 text-white hover:bg-blue-600"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
`;
