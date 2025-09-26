import { z } from 'zod';
export interface VisualCodingAgent {
    processRequest(request: VisualRequest): Promise<VisualResponse>;
}
export declare const DOMElementSchema: z.ZodObject<{
    tagName: z.ZodString;
    classes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    id: z.ZodOptional<z.ZodString>;
    style: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    textContent: z.ZodOptional<z.ZodString>;
    innerHTML: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tagName: string;
    classes?: string[] | undefined;
    id?: string | undefined;
    style?: Record<string, string> | undefined;
    attributes?: Record<string, string> | undefined;
    textContent?: string | undefined;
    innerHTML?: string | undefined;
}, {
    tagName: string;
    classes?: string[] | undefined;
    id?: string | undefined;
    style?: Record<string, string> | undefined;
    attributes?: Record<string, string> | undefined;
    textContent?: string | undefined;
    innerHTML?: string | undefined;
}>;
export declare const DesignContextSchema: z.ZodObject<{
    designTokens: z.ZodRecord<z.ZodString, z.ZodAny>;
    framework: z.ZodEnum<["react", "vue", "svelte"]>;
    stylingSystem: z.ZodEnum<["tailwind", "css-modules", "styled-components", "vanilla-css", "mui", "chakra", "ant-design"]>;
    fileStructure: z.ZodArray<z.ZodString, "many">;
    componentPatterns: z.ZodRecord<z.ZodString, z.ZodAny>;
    existingCode: z.ZodOptional<z.ZodString>;
    filePath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    designTokens: Record<string, any>;
    framework: "react" | "vue" | "svelte";
    stylingSystem: "tailwind" | "css-modules" | "styled-components" | "vanilla-css" | "mui" | "chakra" | "ant-design";
    fileStructure: string[];
    componentPatterns: Record<string, any>;
    existingCode?: string | undefined;
    filePath?: string | undefined;
}, {
    designTokens: Record<string, any>;
    framework: "react" | "vue" | "svelte";
    stylingSystem: "tailwind" | "css-modules" | "styled-components" | "vanilla-css" | "mui" | "chakra" | "ant-design";
    fileStructure: string[];
    componentPatterns: Record<string, any>;
    existingCode?: string | undefined;
    filePath?: string | undefined;
}>;
export declare const VisualRequestSchema: z.ZodObject<{
    description: z.ZodString;
    element: z.ZodObject<{
        tagName: z.ZodString;
        classes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        id: z.ZodOptional<z.ZodString>;
        style: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        textContent: z.ZodOptional<z.ZodString>;
        innerHTML: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tagName: string;
        classes?: string[] | undefined;
        id?: string | undefined;
        style?: Record<string, string> | undefined;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
        innerHTML?: string | undefined;
    }, {
        tagName: string;
        classes?: string[] | undefined;
        id?: string | undefined;
        style?: Record<string, string> | undefined;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
        innerHTML?: string | undefined;
    }>;
    context: z.ZodObject<{
        designTokens: z.ZodRecord<z.ZodString, z.ZodAny>;
        framework: z.ZodEnum<["react", "vue", "svelte"]>;
        stylingSystem: z.ZodEnum<["tailwind", "css-modules", "styled-components", "vanilla-css", "mui", "chakra", "ant-design"]>;
        fileStructure: z.ZodArray<z.ZodString, "many">;
        componentPatterns: z.ZodRecord<z.ZodString, z.ZodAny>;
        existingCode: z.ZodOptional<z.ZodString>;
        filePath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        designTokens: Record<string, any>;
        framework: "react" | "vue" | "svelte";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "vanilla-css" | "mui" | "chakra" | "ant-design";
        fileStructure: string[];
        componentPatterns: Record<string, any>;
        existingCode?: string | undefined;
        filePath?: string | undefined;
    }, {
        designTokens: Record<string, any>;
        framework: "react" | "vue" | "svelte";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "vanilla-css" | "mui" | "chakra" | "ant-design";
        fileStructure: string[];
        componentPatterns: Record<string, any>;
        existingCode?: string | undefined;
        filePath?: string | undefined;
    }>;
    framework: z.ZodEnum<["react", "vue", "svelte"]>;
}, "strip", z.ZodTypeAny, {
    description: string;
    element: {
        tagName: string;
        classes?: string[] | undefined;
        id?: string | undefined;
        style?: Record<string, string> | undefined;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
        innerHTML?: string | undefined;
    };
    framework: "react" | "vue" | "svelte";
    context: {
        designTokens: Record<string, any>;
        framework: "react" | "vue" | "svelte";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "vanilla-css" | "mui" | "chakra" | "ant-design";
        fileStructure: string[];
        componentPatterns: Record<string, any>;
        existingCode?: string | undefined;
        filePath?: string | undefined;
    };
}, {
    description: string;
    element: {
        tagName: string;
        classes?: string[] | undefined;
        id?: string | undefined;
        style?: Record<string, string> | undefined;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
        innerHTML?: string | undefined;
    };
    framework: "react" | "vue" | "svelte";
    context: {
        designTokens: Record<string, any>;
        framework: "react" | "vue" | "svelte";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "vanilla-css" | "mui" | "chakra" | "ant-design";
        fileStructure: string[];
        componentPatterns: Record<string, any>;
        existingCode?: string | undefined;
        filePath?: string | undefined;
    };
}>;
export declare const CodeChangeSchema: z.ZodObject<{
    filePath: z.ZodString;
    oldContent: z.ZodString;
    newContent: z.ZodString;
    reasoning: z.ZodString;
    changeType: z.ZodEnum<["modify", "create", "delete"]>;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    oldContent: string;
    newContent: string;
    reasoning: string;
    changeType: "modify" | "create" | "delete";
}, {
    filePath: string;
    oldContent: string;
    newContent: string;
    reasoning: string;
    changeType: "modify" | "create" | "delete";
}>;
export declare const AlternativeSchema: z.ZodObject<{
    description: z.ZodString;
    changes: z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        oldContent: z.ZodString;
        newContent: z.ZodString;
        reasoning: z.ZodString;
        changeType: z.ZodEnum<["modify", "create", "delete"]>;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        changeType: "modify" | "create" | "delete";
    }, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        changeType: "modify" | "create" | "delete";
    }>, "many">;
    tradeoffs: z.ZodString;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    description: string;
    changes: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        changeType: "modify" | "create" | "delete";
    }[];
    tradeoffs: string;
    confidence: number;
}, {
    description: string;
    changes: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        changeType: "modify" | "create" | "delete";
    }[];
    tradeoffs: string;
    confidence: number;
}>;
export declare const VisualResponseSchema: z.ZodObject<{
    changes: z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        oldContent: z.ZodString;
        newContent: z.ZodString;
        reasoning: z.ZodString;
        changeType: z.ZodEnum<["modify", "create", "delete"]>;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        changeType: "modify" | "create" | "delete";
    }, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        changeType: "modify" | "create" | "delete";
    }>, "many">;
    explanation: z.ZodString;
    alternatives: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        changes: z.ZodArray<z.ZodObject<{
            filePath: z.ZodString;
            oldContent: z.ZodString;
            newContent: z.ZodString;
            reasoning: z.ZodString;
            changeType: z.ZodEnum<["modify", "create", "delete"]>;
        }, "strip", z.ZodTypeAny, {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            changeType: "modify" | "create" | "delete";
        }, {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            changeType: "modify" | "create" | "delete";
        }>, "many">;
        tradeoffs: z.ZodString;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        changes: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            changeType: "modify" | "create" | "delete";
        }[];
        tradeoffs: string;
        confidence: number;
    }, {
        description: string;
        changes: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            changeType: "modify" | "create" | "delete";
        }[];
        tradeoffs: string;
        confidence: number;
    }>, "many">>;
    confidence: z.ZodNumber;
    designPrinciples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    changes: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        changeType: "modify" | "create" | "delete";
    }[];
    explanation: string;
    confidence: number;
    alternatives?: {
        description: string;
        changes: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            changeType: "modify" | "create" | "delete";
        }[];
        tradeoffs: string;
        confidence: number;
    }[] | undefined;
    designPrinciples?: string[] | undefined;
}, {
    changes: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        changeType: "modify" | "create" | "delete";
    }[];
    explanation: string;
    confidence: number;
    alternatives?: {
        description: string;
        changes: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            changeType: "modify" | "create" | "delete";
        }[];
        tradeoffs: string;
        confidence: number;
    }[] | undefined;
    designPrinciples?: string[] | undefined;
}>;
export type DOMElement = z.infer<typeof DOMElementSchema>;
export type DesignContext = z.infer<typeof DesignContextSchema>;
export type VisualRequest = z.infer<typeof VisualRequestSchema>;
export type CodeChange = z.infer<typeof CodeChangeSchema>;
export type Alternative = z.infer<typeof AlternativeSchema>;
export type VisualResponse = z.infer<typeof VisualResponseSchema>;
export declare const DesignIntentSchema: z.ZodObject<{
    property: z.ZodEnum<["size", "color", "spacing", "typography", "layout", "emphasis", "complexity", "style"]>;
    direction: z.ZodEnum<["increase", "decrease", "change", "add", "remove"]>;
    methods: z.ZodArray<z.ZodString, "many">;
    designPrinciple: z.ZodOptional<z.ZodString>;
    urgency: z.ZodDefault<z.ZodEnum<["low", "medium", "high"]>>;
    specificity: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    property: "style" | "size" | "color" | "spacing" | "typography" | "layout" | "emphasis" | "complexity";
    direction: "increase" | "decrease" | "change" | "add" | "remove";
    methods: string[];
    urgency: "low" | "medium" | "high";
    designPrinciple?: string | undefined;
    specificity?: number | undefined;
}, {
    property: "style" | "size" | "color" | "spacing" | "typography" | "layout" | "emphasis" | "complexity";
    direction: "increase" | "decrease" | "change" | "add" | "remove";
    methods: string[];
    designPrinciple?: string | undefined;
    urgency?: "low" | "medium" | "high" | undefined;
    specificity?: number | undefined;
}>;
export type DesignIntent = z.infer<typeof DesignIntentSchema>;
export type Framework = 'react' | 'vue' | 'svelte';
export type StylingSystem = 'tailwind' | 'css-modules' | 'styled-components' | 'vanilla-css' | 'mui' | 'chakra' | 'ant-design';
export interface RepositoryAnalysis {
    designTokens: DesignTokens;
    componentPatterns: ComponentPatterns;
    stylingApproach: StylingSystem;
    framework: Framework;
    fileStructure: FileStructure;
}
export interface DesignTokens {
    colors: Record<string, string | Record<string, string>>;
    typography: {
        fontSizes: Record<string, string>;
        fontWeights: Record<string, string>;
        lineHeights: Record<string, string>;
        fontFamilies: Record<string, string>;
    };
    spacing: Record<string, string>;
    shadows: Record<string, string>;
    borderRadius: Record<string, string>;
    breakpoints: Record<string, string>;
}
export interface ComponentPatterns {
    namingConventions: string[];
    importPatterns: string[];
    propPatterns: Record<string, any>;
    stylePatterns: string[];
}
export interface FileStructure {
    components: string[];
    styles: string[];
    types: string[];
    utils: string[];
}
export declare class VisualCodingError extends Error {
    code: string;
    details?: Record<string, any> | undefined;
    constructor(message: string, code: string, details?: Record<string, any> | undefined);
}
export declare class InterpretationError extends VisualCodingError {
    constructor(message: string, details?: Record<string, any>);
}
export declare class CodeGenerationError extends VisualCodingError {
    constructor(message: string, details?: Record<string, any>);
}
export declare class RepositoryAnalysisError extends VisualCodingError {
    constructor(message: string, details?: Record<string, any>);
}
//# sourceMappingURL=types.d.ts.map