#!/usr/bin/env tsx
import type { DesignContext, DOMElement } from './index';
declare const testCases: {
    name: string;
    description: string;
    element: DOMElement;
}[];
declare const createDefaultContext: (stylingSystem?: "tailwind" | "mui" | "chakra") => DesignContext;
declare function runTests(): Promise<void>;
declare function runInteractiveTest(): Promise<void>;
export { runTests, runInteractiveTest, testCases, createDefaultContext };
//# sourceMappingURL=test-harness.d.ts.map