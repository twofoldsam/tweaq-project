import { z } from 'zod';
export declare const ElementSchema: z.ZodObject<{
    tagName: z.ZodString;
    classes: z.ZodArray<z.ZodString, "many">;
    computedStyles: z.ZodRecord<z.ZodString, z.ZodString>;
    textContent: z.ZodOptional<z.ZodString>;
    selector: z.ZodString;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    tagName: string;
    classes: string[];
    computedStyles: Record<string, string>;
    selector: string;
    attributes?: Record<string, string> | undefined;
    textContent?: string | undefined;
}, {
    tagName: string;
    classes: string[];
    computedStyles: Record<string, string>;
    selector: string;
    attributes?: Record<string, string> | undefined;
    textContent?: string | undefined;
}>;
export declare const RepositorySchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    branch: z.ZodDefault<z.ZodString>;
    filePath: z.ZodOptional<z.ZodString>;
    githubToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    owner: string;
    repo: string;
    branch: string;
    filePath?: string | undefined;
    githubToken?: string | undefined;
}, {
    owner: string;
    repo: string;
    filePath?: string | undefined;
    branch?: string | undefined;
    githubToken?: string | undefined;
}>;
export declare const DesignTokensSchema: z.ZodObject<{
    fontSize: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    colors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    spacing: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    borderRadius: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    shadows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    breakpoints: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    spacing?: Record<string, string> | undefined;
    colors?: Record<string, string> | undefined;
    shadows?: Record<string, string> | undefined;
    borderRadius?: Record<string, string> | undefined;
    breakpoints?: Record<string, string> | undefined;
    fontSize?: Record<string, string> | undefined;
}, {
    spacing?: Record<string, string> | undefined;
    colors?: Record<string, string> | undefined;
    shadows?: Record<string, string> | undefined;
    borderRadius?: Record<string, string> | undefined;
    breakpoints?: Record<string, string> | undefined;
    fontSize?: Record<string, string> | undefined;
}>;
export declare const ComponentMappingSchema: z.ZodObject<{
    componentName: z.ZodString;
    confidence: z.ZodNumber;
    filePath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    componentName: string;
    filePath?: string | undefined;
}, {
    confidence: number;
    componentName: string;
    filePath?: string | undefined;
}>;
export declare const ContextSchema: z.ZodObject<{
    framework: z.ZodEnum<["react", "vue", "svelte", "angular", "vanilla"]>;
    stylingSystem: z.ZodEnum<["tailwind", "styled-components", "emotion", "css-modules", "sass", "css"]>;
    designTokens: z.ZodOptional<z.ZodObject<{
        fontSize: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        colors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        spacing: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        borderRadius: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        shadows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        breakpoints: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        spacing?: Record<string, string> | undefined;
        colors?: Record<string, string> | undefined;
        shadows?: Record<string, string> | undefined;
        borderRadius?: Record<string, string> | undefined;
        breakpoints?: Record<string, string> | undefined;
        fontSize?: Record<string, string> | undefined;
    }, {
        spacing?: Record<string, string> | undefined;
        colors?: Record<string, string> | undefined;
        shadows?: Record<string, string> | undefined;
        borderRadius?: Record<string, string> | undefined;
        breakpoints?: Record<string, string> | undefined;
        fontSize?: Record<string, string> | undefined;
    }>>;
    componentMapping: z.ZodOptional<z.ZodObject<{
        componentName: z.ZodString;
        confidence: z.ZodNumber;
        filePath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        componentName: string;
        filePath?: string | undefined;
    }, {
        confidence: number;
        componentName: string;
        filePath?: string | undefined;
    }>>;
    librariesDetected: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    framework: "react" | "vue" | "svelte" | "angular" | "vanilla";
    stylingSystem: "tailwind" | "css-modules" | "styled-components" | "emotion" | "sass" | "css";
    designTokens?: {
        spacing?: Record<string, string> | undefined;
        colors?: Record<string, string> | undefined;
        shadows?: Record<string, string> | undefined;
        borderRadius?: Record<string, string> | undefined;
        breakpoints?: Record<string, string> | undefined;
        fontSize?: Record<string, string> | undefined;
    } | undefined;
    componentMapping?: {
        confidence: number;
        componentName: string;
        filePath?: string | undefined;
    } | undefined;
    librariesDetected?: string[] | undefined;
}, {
    framework: "react" | "vue" | "svelte" | "angular" | "vanilla";
    stylingSystem: "tailwind" | "css-modules" | "styled-components" | "emotion" | "sass" | "css";
    designTokens?: {
        spacing?: Record<string, string> | undefined;
        colors?: Record<string, string> | undefined;
        shadows?: Record<string, string> | undefined;
        borderRadius?: Record<string, string> | undefined;
        breakpoints?: Record<string, string> | undefined;
        fontSize?: Record<string, string> | undefined;
    } | undefined;
    componentMapping?: {
        confidence: number;
        componentName: string;
        filePath?: string | undefined;
    } | undefined;
    librariesDetected?: string[] | undefined;
}>;
export declare const ProcessVisualEditRequestSchema: z.ZodObject<{
    description: z.ZodString;
    element: z.ZodObject<{
        tagName: z.ZodString;
        classes: z.ZodArray<z.ZodString, "many">;
        computedStyles: z.ZodRecord<z.ZodString, z.ZodString>;
        textContent: z.ZodOptional<z.ZodString>;
        selector: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        tagName: string;
        classes: string[];
        computedStyles: Record<string, string>;
        selector: string;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
    }, {
        tagName: string;
        classes: string[];
        computedStyles: Record<string, string>;
        selector: string;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
    }>;
    repository: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        branch: z.ZodDefault<z.ZodString>;
        filePath: z.ZodOptional<z.ZodString>;
        githubToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        repo: string;
        branch: string;
        filePath?: string | undefined;
        githubToken?: string | undefined;
    }, {
        owner: string;
        repo: string;
        filePath?: string | undefined;
        branch?: string | undefined;
        githubToken?: string | undefined;
    }>;
    context: z.ZodObject<{
        framework: z.ZodEnum<["react", "vue", "svelte", "angular", "vanilla"]>;
        stylingSystem: z.ZodEnum<["tailwind", "styled-components", "emotion", "css-modules", "sass", "css"]>;
        designTokens: z.ZodOptional<z.ZodObject<{
            fontSize: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            colors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            spacing: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            borderRadius: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            shadows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            breakpoints: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        }, {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        }>>;
        componentMapping: z.ZodOptional<z.ZodObject<{
            componentName: z.ZodString;
            confidence: z.ZodNumber;
            filePath: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        }, {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        }>>;
        librariesDetected: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        framework: "react" | "vue" | "svelte" | "angular" | "vanilla";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "emotion" | "sass" | "css";
        designTokens?: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        } | undefined;
        componentMapping?: {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        } | undefined;
        librariesDetected?: string[] | undefined;
    }, {
        framework: "react" | "vue" | "svelte" | "angular" | "vanilla";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "emotion" | "sass" | "css";
        designTokens?: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        } | undefined;
        componentMapping?: {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        } | undefined;
        librariesDetected?: string[] | undefined;
    }>;
    options: z.ZodOptional<z.ZodObject<{
        includeAlternatives: z.ZodDefault<z.ZodBoolean>;
        maxAlternatives: z.ZodDefault<z.ZodNumber>;
        confidenceThreshold: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        includeAlternatives: boolean;
        maxAlternatives: number;
        confidenceThreshold: number;
    }, {
        includeAlternatives?: boolean | undefined;
        maxAlternatives?: number | undefined;
        confidenceThreshold?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    element: {
        tagName: string;
        classes: string[];
        computedStyles: Record<string, string>;
        selector: string;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
    };
    context: {
        framework: "react" | "vue" | "svelte" | "angular" | "vanilla";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "emotion" | "sass" | "css";
        designTokens?: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        } | undefined;
        componentMapping?: {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        } | undefined;
        librariesDetected?: string[] | undefined;
    };
    repository: {
        owner: string;
        repo: string;
        branch: string;
        filePath?: string | undefined;
        githubToken?: string | undefined;
    };
    options?: {
        includeAlternatives: boolean;
        maxAlternatives: number;
        confidenceThreshold: number;
    } | undefined;
}, {
    description: string;
    element: {
        tagName: string;
        classes: string[];
        computedStyles: Record<string, string>;
        selector: string;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
    };
    context: {
        framework: "react" | "vue" | "svelte" | "angular" | "vanilla";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "emotion" | "sass" | "css";
        designTokens?: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        } | undefined;
        componentMapping?: {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        } | undefined;
        librariesDetected?: string[] | undefined;
    };
    repository: {
        owner: string;
        repo: string;
        filePath?: string | undefined;
        branch?: string | undefined;
        githubToken?: string | undefined;
    };
    options?: {
        includeAlternatives?: boolean | undefined;
        maxAlternatives?: number | undefined;
        confidenceThreshold?: number | undefined;
    } | undefined;
}>;
export declare const CodeChangeSchema: z.ZodObject<{
    filePath: z.ZodString;
    oldContent: z.ZodString;
    newContent: z.ZodString;
    lineNumber: z.ZodOptional<z.ZodNumber>;
    reasoning: z.ZodString;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    oldContent: string;
    newContent: string;
    reasoning: string;
    lineNumber?: number | undefined;
}, {
    filePath: string;
    oldContent: string;
    newContent: string;
    reasoning: string;
    lineNumber?: number | undefined;
}>;
export declare const AlternativeChangeSchema: z.ZodObject<{
    description: z.ZodString;
    changes: z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        oldContent: z.ZodString;
        newContent: z.ZodString;
        lineNumber: z.ZodOptional<z.ZodNumber>;
        reasoning: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }>, "many">;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    changes: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }[];
    confidence?: number | undefined;
}, {
    description: string;
    changes: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }[];
    confidence?: number | undefined;
}>;
export declare const ProcessVisualEditResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    requestId: z.ZodString;
    changes: z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        oldContent: z.ZodString;
        newContent: z.ZodString;
        lineNumber: z.ZodOptional<z.ZodNumber>;
        reasoning: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }>, "many">;
    explanation: z.ZodString;
    alternatives: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        changes: z.ZodArray<z.ZodObject<{
            filePath: z.ZodString;
            oldContent: z.ZodString;
            newContent: z.ZodString;
            lineNumber: z.ZodOptional<z.ZodNumber>;
            reasoning: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }, {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }>, "many">;
        confidence: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        changes: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }[];
        confidence?: number | undefined;
    }, {
        description: string;
        changes: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }[];
        confidence?: number | undefined;
    }>, "many">>;
    confidence: z.ZodNumber;
    processingTime: z.ZodNumber;
    claudeTokensUsed: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    changes: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }[];
    explanation: string;
    confidence: number;
    success: boolean;
    requestId: string;
    processingTime: number;
    claudeTokensUsed: number;
    alternatives?: {
        description: string;
        changes: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }[];
        confidence?: number | undefined;
    }[] | undefined;
}, {
    changes: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }[];
    explanation: string;
    confidence: number;
    success: boolean;
    requestId: string;
    processingTime: number;
    claudeTokensUsed: number;
    alternatives?: {
        description: string;
        changes: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }[];
        confidence?: number | undefined;
    }[] | undefined;
}>;
export declare const AnalyzeRepositoryRequestSchema: z.ZodObject<{
    repository: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        branch: z.ZodDefault<z.ZodString>;
        filePath: z.ZodOptional<z.ZodString>;
        githubToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        repo: string;
        branch: string;
        filePath?: string | undefined;
        githubToken?: string | undefined;
    }, {
        owner: string;
        repo: string;
        filePath?: string | undefined;
        branch?: string | undefined;
        githubToken?: string | undefined;
    }>;
    options: z.ZodOptional<z.ZodObject<{
        forceRefresh: z.ZodDefault<z.ZodBoolean>;
        lastAnalyzedCommit: z.ZodOptional<z.ZodString>;
        changedFiles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        includeDesignTokens: z.ZodDefault<z.ZodBoolean>;
        includeComponents: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        forceRefresh: boolean;
        includeDesignTokens: boolean;
        includeComponents: boolean;
        lastAnalyzedCommit?: string | undefined;
        changedFiles?: string[] | undefined;
    }, {
        forceRefresh?: boolean | undefined;
        lastAnalyzedCommit?: string | undefined;
        changedFiles?: string[] | undefined;
        includeDesignTokens?: boolean | undefined;
        includeComponents?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    repository: {
        owner: string;
        repo: string;
        branch: string;
        filePath?: string | undefined;
        githubToken?: string | undefined;
    };
    options?: {
        forceRefresh: boolean;
        includeDesignTokens: boolean;
        includeComponents: boolean;
        lastAnalyzedCommit?: string | undefined;
        changedFiles?: string[] | undefined;
    } | undefined;
}, {
    repository: {
        owner: string;
        repo: string;
        filePath?: string | undefined;
        branch?: string | undefined;
        githubToken?: string | undefined;
    };
    options?: {
        forceRefresh?: boolean | undefined;
        lastAnalyzedCommit?: string | undefined;
        changedFiles?: string[] | undefined;
        includeDesignTokens?: boolean | undefined;
        includeComponents?: boolean | undefined;
    } | undefined;
}>;
export declare const ComponentStructureSchema: z.ZodObject<{
    name: z.ZodString;
    filePath: z.ZodString;
    type: z.ZodEnum<["component", "hook", "utility", "type", "config"]>;
    exports: z.ZodArray<z.ZodString, "many">;
    dependencies: z.ZodArray<z.ZodString, "many">;
    props: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        required: z.ZodBoolean;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        required: boolean;
        description?: string | undefined;
    }, {
        type: string;
        name: string;
        required: boolean;
        description?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "type" | "component" | "hook" | "utility" | "config";
    filePath: string;
    name: string;
    exports: string[];
    dependencies: string[];
    props?: {
        type: string;
        name: string;
        required: boolean;
        description?: string | undefined;
    }[] | undefined;
}, {
    type: "type" | "component" | "hook" | "utility" | "config";
    filePath: string;
    name: string;
    exports: string[];
    dependencies: string[];
    props?: {
        type: string;
        name: string;
        required: boolean;
        description?: string | undefined;
    }[] | undefined;
}>;
export declare const AnalyzeRepositoryResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    analysis: z.ZodObject<{
        designTokens: z.ZodObject<{
            fontSize: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            colors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            spacing: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            borderRadius: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            shadows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            breakpoints: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        }, {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        }>;
        components: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            filePath: z.ZodString;
            type: z.ZodEnum<["component", "hook", "utility", "type", "config"]>;
            exports: z.ZodArray<z.ZodString, "many">;
            dependencies: z.ZodArray<z.ZodString, "many">;
            props: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                type: z.ZodString;
                required: z.ZodBoolean;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                type: string;
                name: string;
                required: boolean;
                description?: string | undefined;
            }, {
                type: string;
                name: string;
                required: boolean;
                description?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: "type" | "component" | "hook" | "utility" | "config";
            filePath: string;
            name: string;
            exports: string[];
            dependencies: string[];
            props?: {
                type: string;
                name: string;
                required: boolean;
                description?: string | undefined;
            }[] | undefined;
        }, {
            type: "type" | "component" | "hook" | "utility" | "config";
            filePath: string;
            name: string;
            exports: string[];
            dependencies: string[];
            props?: {
                type: string;
                name: string;
                required: boolean;
                description?: string | undefined;
            }[] | undefined;
        }>, "many">;
        framework: z.ZodString;
        stylingSystem: z.ZodString;
        librariesDetected: z.ZodArray<z.ZodString, "many">;
        fileStructure: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        designTokens: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        };
        framework: string;
        stylingSystem: string;
        fileStructure: Record<string, string[]>;
        components: {
            type: "type" | "component" | "hook" | "utility" | "config";
            filePath: string;
            name: string;
            exports: string[];
            dependencies: string[];
            props?: {
                type: string;
                name: string;
                required: boolean;
                description?: string | undefined;
            }[] | undefined;
        }[];
        librariesDetected: string[];
    }, {
        designTokens: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        };
        framework: string;
        stylingSystem: string;
        fileStructure: Record<string, string[]>;
        components: {
            type: "type" | "component" | "hook" | "utility" | "config";
            filePath: string;
            name: string;
            exports: string[];
            dependencies: string[];
            props?: {
                type: string;
                name: string;
                required: boolean;
                description?: string | undefined;
            }[] | undefined;
        }[];
        librariesDetected: string[];
    }>;
    cacheInfo: z.ZodObject<{
        cached: z.ZodBoolean;
        lastUpdated: z.ZodString;
        expiresAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        cached: boolean;
        lastUpdated: string;
        expiresAt: string;
    }, {
        cached: boolean;
        lastUpdated: string;
        expiresAt: string;
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    analysis: {
        designTokens: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        };
        framework: string;
        stylingSystem: string;
        fileStructure: Record<string, string[]>;
        components: {
            type: "type" | "component" | "hook" | "utility" | "config";
            filePath: string;
            name: string;
            exports: string[];
            dependencies: string[];
            props?: {
                type: string;
                name: string;
                required: boolean;
                description?: string | undefined;
            }[] | undefined;
        }[];
        librariesDetected: string[];
    };
    cacheInfo: {
        cached: boolean;
        lastUpdated: string;
        expiresAt: string;
    };
}, {
    success: boolean;
    analysis: {
        designTokens: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        };
        framework: string;
        stylingSystem: string;
        fileStructure: Record<string, string[]>;
        components: {
            type: "type" | "component" | "hook" | "utility" | "config";
            filePath: string;
            name: string;
            exports: string[];
            dependencies: string[];
            props?: {
                type: string;
                name: string;
                required: boolean;
                description?: string | undefined;
            }[] | undefined;
        }[];
        librariesDetected: string[];
    };
    cacheInfo: {
        cached: boolean;
        lastUpdated: string;
        expiresAt: string;
    };
}>;
export declare const BatchEditSchema: z.ZodObject<{
    id: z.ZodString;
    description: z.ZodString;
    element: z.ZodObject<{
        tagName: z.ZodString;
        classes: z.ZodArray<z.ZodString, "many">;
        computedStyles: z.ZodRecord<z.ZodString, z.ZodString>;
        textContent: z.ZodOptional<z.ZodString>;
        selector: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        tagName: string;
        classes: string[];
        computedStyles: Record<string, string>;
        selector: string;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
    }, {
        tagName: string;
        classes: string[];
        computedStyles: Record<string, string>;
        selector: string;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    description: string;
    id: string;
    element: {
        tagName: string;
        classes: string[];
        computedStyles: Record<string, string>;
        selector: string;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
    };
}, {
    description: string;
    id: string;
    element: {
        tagName: string;
        classes: string[];
        computedStyles: Record<string, string>;
        selector: string;
        attributes?: Record<string, string> | undefined;
        textContent?: string | undefined;
    };
}>;
export declare const BatchProcessRequestSchema: z.ZodObject<{
    repository: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        branch: z.ZodDefault<z.ZodString>;
        filePath: z.ZodOptional<z.ZodString>;
        githubToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        repo: string;
        branch: string;
        filePath?: string | undefined;
        githubToken?: string | undefined;
    }, {
        owner: string;
        repo: string;
        filePath?: string | undefined;
        branch?: string | undefined;
        githubToken?: string | undefined;
    }>;
    edits: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        element: z.ZodObject<{
            tagName: z.ZodString;
            classes: z.ZodArray<z.ZodString, "many">;
            computedStyles: z.ZodRecord<z.ZodString, z.ZodString>;
            textContent: z.ZodOptional<z.ZodString>;
            selector: z.ZodString;
            attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            tagName: string;
            classes: string[];
            computedStyles: Record<string, string>;
            selector: string;
            attributes?: Record<string, string> | undefined;
            textContent?: string | undefined;
        }, {
            tagName: string;
            classes: string[];
            computedStyles: Record<string, string>;
            selector: string;
            attributes?: Record<string, string> | undefined;
            textContent?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        element: {
            tagName: string;
            classes: string[];
            computedStyles: Record<string, string>;
            selector: string;
            attributes?: Record<string, string> | undefined;
            textContent?: string | undefined;
        };
    }, {
        description: string;
        id: string;
        element: {
            tagName: string;
            classes: string[];
            computedStyles: Record<string, string>;
            selector: string;
            attributes?: Record<string, string> | undefined;
            textContent?: string | undefined;
        };
    }>, "many">;
    context: z.ZodOptional<z.ZodObject<{
        framework: z.ZodEnum<["react", "vue", "svelte", "angular", "vanilla"]>;
        stylingSystem: z.ZodEnum<["tailwind", "styled-components", "emotion", "css-modules", "sass", "css"]>;
        designTokens: z.ZodOptional<z.ZodObject<{
            fontSize: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            colors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            spacing: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            borderRadius: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            shadows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            breakpoints: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        }, {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        }>>;
        componentMapping: z.ZodOptional<z.ZodObject<{
            componentName: z.ZodString;
            confidence: z.ZodNumber;
            filePath: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        }, {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        }>>;
        librariesDetected: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        framework: "react" | "vue" | "svelte" | "angular" | "vanilla";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "emotion" | "sass" | "css";
        designTokens?: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        } | undefined;
        componentMapping?: {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        } | undefined;
        librariesDetected?: string[] | undefined;
    }, {
        framework: "react" | "vue" | "svelte" | "angular" | "vanilla";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "emotion" | "sass" | "css";
        designTokens?: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        } | undefined;
        componentMapping?: {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        } | undefined;
        librariesDetected?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    repository: {
        owner: string;
        repo: string;
        branch: string;
        filePath?: string | undefined;
        githubToken?: string | undefined;
    };
    edits: {
        description: string;
        id: string;
        element: {
            tagName: string;
            classes: string[];
            computedStyles: Record<string, string>;
            selector: string;
            attributes?: Record<string, string> | undefined;
            textContent?: string | undefined;
        };
    }[];
    context?: {
        framework: "react" | "vue" | "svelte" | "angular" | "vanilla";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "emotion" | "sass" | "css";
        designTokens?: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        } | undefined;
        componentMapping?: {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        } | undefined;
        librariesDetected?: string[] | undefined;
    } | undefined;
}, {
    repository: {
        owner: string;
        repo: string;
        filePath?: string | undefined;
        branch?: string | undefined;
        githubToken?: string | undefined;
    };
    edits: {
        description: string;
        id: string;
        element: {
            tagName: string;
            classes: string[];
            computedStyles: Record<string, string>;
            selector: string;
            attributes?: Record<string, string> | undefined;
            textContent?: string | undefined;
        };
    }[];
    context?: {
        framework: "react" | "vue" | "svelte" | "angular" | "vanilla";
        stylingSystem: "tailwind" | "css-modules" | "styled-components" | "emotion" | "sass" | "css";
        designTokens?: {
            spacing?: Record<string, string> | undefined;
            colors?: Record<string, string> | undefined;
            shadows?: Record<string, string> | undefined;
            borderRadius?: Record<string, string> | undefined;
            breakpoints?: Record<string, string> | undefined;
            fontSize?: Record<string, string> | undefined;
        } | undefined;
        componentMapping?: {
            confidence: number;
            componentName: string;
            filePath?: string | undefined;
        } | undefined;
        librariesDetected?: string[] | undefined;
    } | undefined;
}>;
export declare const BatchEditResultSchema: z.ZodObject<{
    editId: z.ZodString;
    success: z.ZodBoolean;
    changes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        oldContent: z.ZodString;
        newContent: z.ZodString;
        lineNumber: z.ZodOptional<z.ZodNumber>;
        reasoning: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }>, "many">>;
    explanation: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    editId: string;
    changes?: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }[] | undefined;
    explanation?: string | undefined;
    confidence?: number | undefined;
    error?: string | undefined;
}, {
    success: boolean;
    editId: string;
    changes?: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }[] | undefined;
    explanation?: string | undefined;
    confidence?: number | undefined;
    error?: string | undefined;
}>;
export declare const BatchProcessResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    results: z.ZodArray<z.ZodObject<{
        editId: z.ZodString;
        success: z.ZodBoolean;
        changes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            filePath: z.ZodString;
            oldContent: z.ZodString;
            newContent: z.ZodString;
            lineNumber: z.ZodOptional<z.ZodNumber>;
            reasoning: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }, {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }>, "many">>;
        explanation: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
        confidence: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        editId: string;
        changes?: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }[] | undefined;
        explanation?: string | undefined;
        confidence?: number | undefined;
        error?: string | undefined;
    }, {
        success: boolean;
        editId: string;
        changes?: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }[] | undefined;
        explanation?: string | undefined;
        confidence?: number | undefined;
        error?: string | undefined;
    }>, "many">;
    totalProcessingTime: z.ZodNumber;
    totalTokensUsed: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    results: {
        success: boolean;
        editId: string;
        changes?: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }[] | undefined;
        explanation?: string | undefined;
        confidence?: number | undefined;
        error?: string | undefined;
    }[];
    totalProcessingTime: number;
    totalTokensUsed: number;
}, {
    success: boolean;
    results: {
        success: boolean;
        editId: string;
        changes?: {
            filePath: string;
            oldContent: string;
            newContent: string;
            reasoning: string;
            lineNumber?: number | undefined;
        }[] | undefined;
        explanation?: string | undefined;
        confidence?: number | undefined;
        error?: string | undefined;
    }[];
    totalProcessingTime: number;
    totalTokensUsed: number;
}>;
export declare const CreatePullRequestRequestSchema: z.ZodObject<{
    repository: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        branch: z.ZodDefault<z.ZodString>;
        filePath: z.ZodOptional<z.ZodString>;
        githubToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        repo: string;
        branch: string;
        filePath?: string | undefined;
        githubToken?: string | undefined;
    }, {
        owner: string;
        repo: string;
        filePath?: string | undefined;
        branch?: string | undefined;
        githubToken?: string | undefined;
    }>;
    changes: z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        oldContent: z.ZodString;
        newContent: z.ZodString;
        lineNumber: z.ZodOptional<z.ZodNumber>;
        reasoning: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }, {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }>, "many">;
    pullRequest: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        branchName: z.ZodOptional<z.ZodString>;
        baseBranch: z.ZodDefault<z.ZodString>;
        draft: z.ZodDefault<z.ZodBoolean>;
        autoMerge: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        baseBranch: string;
        draft: boolean;
        autoMerge: boolean;
        description?: string | undefined;
        branchName?: string | undefined;
    }, {
        title: string;
        description?: string | undefined;
        branchName?: string | undefined;
        baseBranch?: string | undefined;
        draft?: boolean | undefined;
        autoMerge?: boolean | undefined;
    }>;
    options: z.ZodOptional<z.ZodObject<{
        commitMessage: z.ZodOptional<z.ZodString>;
        createBranchFromLatest: z.ZodDefault<z.ZodBoolean>;
        deleteSourceBranch: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        createBranchFromLatest: boolean;
        deleteSourceBranch: boolean;
        commitMessage?: string | undefined;
    }, {
        commitMessage?: string | undefined;
        createBranchFromLatest?: boolean | undefined;
        deleteSourceBranch?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    changes: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }[];
    repository: {
        owner: string;
        repo: string;
        branch: string;
        filePath?: string | undefined;
        githubToken?: string | undefined;
    };
    pullRequest: {
        title: string;
        baseBranch: string;
        draft: boolean;
        autoMerge: boolean;
        description?: string | undefined;
        branchName?: string | undefined;
    };
    options?: {
        createBranchFromLatest: boolean;
        deleteSourceBranch: boolean;
        commitMessage?: string | undefined;
    } | undefined;
}, {
    changes: {
        filePath: string;
        oldContent: string;
        newContent: string;
        reasoning: string;
        lineNumber?: number | undefined;
    }[];
    repository: {
        owner: string;
        repo: string;
        filePath?: string | undefined;
        branch?: string | undefined;
        githubToken?: string | undefined;
    };
    pullRequest: {
        title: string;
        description?: string | undefined;
        branchName?: string | undefined;
        baseBranch?: string | undefined;
        draft?: boolean | undefined;
        autoMerge?: boolean | undefined;
    };
    options?: {
        commitMessage?: string | undefined;
        createBranchFromLatest?: boolean | undefined;
        deleteSourceBranch?: boolean | undefined;
    } | undefined;
}>;
export declare const PullRequestInfoSchema: z.ZodObject<{
    number: z.ZodNumber;
    title: z.ZodString;
    url: z.ZodString;
    htmlUrl: z.ZodString;
    state: z.ZodEnum<["open", "closed", "merged"]>;
    branchName: z.ZodString;
    baseBranch: z.ZodString;
    draft: z.ZodBoolean;
    mergeable: z.ZodNullable<z.ZodBoolean>;
    commits: z.ZodNumber;
    additions: z.ZodNumber;
    deletions: z.ZodNumber;
    changedFiles: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    number: number;
    url: string;
    changedFiles: number;
    title: string;
    branchName: string;
    baseBranch: string;
    draft: boolean;
    htmlUrl: string;
    state: "open" | "closed" | "merged";
    mergeable: boolean | null;
    commits: number;
    additions: number;
    deletions: number;
    createdAt: string;
    updatedAt: string;
}, {
    number: number;
    url: string;
    changedFiles: number;
    title: string;
    branchName: string;
    baseBranch: string;
    draft: boolean;
    htmlUrl: string;
    state: "open" | "closed" | "merged";
    mergeable: boolean | null;
    commits: number;
    additions: number;
    deletions: number;
    createdAt: string;
    updatedAt: string;
}>;
export declare const CreatePullRequestResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    pullRequest: z.ZodObject<{
        number: z.ZodNumber;
        title: z.ZodString;
        url: z.ZodString;
        htmlUrl: z.ZodString;
        state: z.ZodEnum<["open", "closed", "merged"]>;
        branchName: z.ZodString;
        baseBranch: z.ZodString;
        draft: z.ZodBoolean;
        mergeable: z.ZodNullable<z.ZodBoolean>;
        commits: z.ZodNumber;
        additions: z.ZodNumber;
        deletions: z.ZodNumber;
        changedFiles: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        number: number;
        url: string;
        changedFiles: number;
        title: string;
        branchName: string;
        baseBranch: string;
        draft: boolean;
        htmlUrl: string;
        state: "open" | "closed" | "merged";
        mergeable: boolean | null;
        commits: number;
        additions: number;
        deletions: number;
        createdAt: string;
        updatedAt: string;
    }, {
        number: number;
        url: string;
        changedFiles: number;
        title: string;
        branchName: string;
        baseBranch: string;
        draft: boolean;
        htmlUrl: string;
        state: "open" | "closed" | "merged";
        mergeable: boolean | null;
        commits: number;
        additions: number;
        deletions: number;
        createdAt: string;
        updatedAt: string;
    }>;
    changes: z.ZodObject<{
        filesModified: z.ZodNumber;
        linesAdded: z.ZodNumber;
        linesRemoved: z.ZodNumber;
        commitSha: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filesModified: number;
        linesAdded: number;
        linesRemoved: number;
        commitSha: string;
    }, {
        filesModified: number;
        linesAdded: number;
        linesRemoved: number;
        commitSha: string;
    }>;
    processingTime: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    changes: {
        filesModified: number;
        linesAdded: number;
        linesRemoved: number;
        commitSha: string;
    };
    success: boolean;
    processingTime: number;
    pullRequest: {
        number: number;
        url: string;
        changedFiles: number;
        title: string;
        branchName: string;
        baseBranch: string;
        draft: boolean;
        htmlUrl: string;
        state: "open" | "closed" | "merged";
        mergeable: boolean | null;
        commits: number;
        additions: number;
        deletions: number;
        createdAt: string;
        updatedAt: string;
    };
}, {
    changes: {
        filesModified: number;
        linesAdded: number;
        linesRemoved: number;
        commitSha: string;
    };
    success: boolean;
    processingTime: number;
    pullRequest: {
        number: number;
        url: string;
        changedFiles: number;
        title: string;
        branchName: string;
        baseBranch: string;
        draft: boolean;
        htmlUrl: string;
        state: "open" | "closed" | "merged";
        mergeable: boolean | null;
        commits: number;
        additions: number;
        deletions: number;
        createdAt: string;
        updatedAt: string;
    };
}>;
export declare enum ErrorCodes {
    INVALID_REQUEST = "INVALID_REQUEST",
    REPOSITORY_NOT_FOUND = "REPOSITORY_NOT_FOUND",
    CLAUDE_API_ERROR = "CLAUDE_API_ERROR",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    ANALYSIS_FAILED = "ANALYSIS_FAILED",
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
    GITHUB_API_ERROR = "GITHUB_API_ERROR",
    CACHE_ERROR = "CACHE_ERROR"
}
export declare const ErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodNativeEnum<typeof ErrorCodes>;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
        requestId: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: ErrorCodes;
        message: string;
        requestId: string;
        timestamp: string;
        details?: any;
    }, {
        code: ErrorCodes;
        message: string;
        requestId: string;
        timestamp: string;
        details?: any;
    }>;
    retryable: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    error: {
        code: ErrorCodes;
        message: string;
        requestId: string;
        timestamp: string;
        details?: any;
    };
    success: false;
    retryable: boolean;
}, {
    error: {
        code: ErrorCodes;
        message: string;
        requestId: string;
        timestamp: string;
        details?: any;
    };
    success: false;
    retryable: boolean;
}>;
export declare const ServiceHealthSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
    responseTime: z.ZodOptional<z.ZodNumber>;
    lastError: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "healthy" | "degraded" | "unhealthy";
    responseTime?: number | undefined;
    lastError?: string | null | undefined;
}, {
    status: "healthy" | "degraded" | "unhealthy";
    responseTime?: number | undefined;
    lastError?: string | null | undefined;
}>;
export declare const HealthCheckResponseSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
    timestamp: z.ZodString;
    version: z.ZodString;
    uptime: z.ZodNumber;
    services: z.ZodObject<{
        claude: z.ZodObject<{
            status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
            responseTime: z.ZodOptional<z.ZodNumber>;
            lastError: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
        }, {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
        }>;
        redis: z.ZodObject<{
            status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
            responseTime: z.ZodOptional<z.ZodNumber>;
            lastError: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        } & {
            connected: z.ZodBoolean;
            memory: z.ZodOptional<z.ZodString>;
            hitRate: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            memory?: string | undefined;
            hitRate?: number | undefined;
        }, {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            memory?: string | undefined;
            hitRate?: number | undefined;
        }>;
        database: z.ZodObject<{
            status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
            responseTime: z.ZodOptional<z.ZodNumber>;
            lastError: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        } & {
            connected: z.ZodBoolean;
            activeConnections: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            activeConnections?: number | undefined;
        }, {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            activeConnections?: number | undefined;
        }>;
        github: z.ZodObject<{
            status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
            responseTime: z.ZodOptional<z.ZodNumber>;
            lastError: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        } & {
            rateLimit: z.ZodOptional<z.ZodObject<{
                remaining: z.ZodNumber;
                resetAt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                remaining: number;
                resetAt: string;
            }, {
                remaining: number;
                resetAt: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            rateLimit?: {
                remaining: number;
                resetAt: string;
            } | undefined;
        }, {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            rateLimit?: {
                remaining: number;
                resetAt: string;
            } | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        claude: {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
        };
        redis: {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            memory?: string | undefined;
            hitRate?: number | undefined;
        };
        database: {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            activeConnections?: number | undefined;
        };
        github: {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            rateLimit?: {
                remaining: number;
                resetAt: string;
            } | undefined;
        };
    }, {
        claude: {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
        };
        redis: {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            memory?: string | undefined;
            hitRate?: number | undefined;
        };
        database: {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            activeConnections?: number | undefined;
        };
        github: {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            rateLimit?: {
                remaining: number;
                resetAt: string;
            } | undefined;
        };
    }>;
    metrics: z.ZodObject<{
        requestsLastHour: z.ZodNumber;
        averageResponseTime: z.ZodNumber;
        errorRate: z.ZodNumber;
        cacheHitRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        requestsLastHour: number;
        averageResponseTime: number;
        errorRate: number;
        cacheHitRate: number;
    }, {
        requestsLastHour: number;
        averageResponseTime: number;
        errorRate: number;
        cacheHitRate: number;
    }>;
}, "strip", z.ZodTypeAny, {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
    uptime: number;
    services: {
        claude: {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
        };
        redis: {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            memory?: string | undefined;
            hitRate?: number | undefined;
        };
        database: {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            activeConnections?: number | undefined;
        };
        github: {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            rateLimit?: {
                remaining: number;
                resetAt: string;
            } | undefined;
        };
    };
    metrics: {
        requestsLastHour: number;
        averageResponseTime: number;
        errorRate: number;
        cacheHitRate: number;
    };
}, {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
    uptime: number;
    services: {
        claude: {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
        };
        redis: {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            memory?: string | undefined;
            hitRate?: number | undefined;
        };
        database: {
            status: "healthy" | "degraded" | "unhealthy";
            connected: boolean;
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            activeConnections?: number | undefined;
        };
        github: {
            status: "healthy" | "degraded" | "unhealthy";
            responseTime?: number | undefined;
            lastError?: string | null | undefined;
            rateLimit?: {
                remaining: number;
                resetAt: string;
            } | undefined;
        };
    };
    metrics: {
        requestsLastHour: number;
        averageResponseTime: number;
        errorRate: number;
        cacheHitRate: number;
    };
}>;
export declare const AgentMetricsSchema: z.ZodObject<{
    requestId: z.ZodString;
    timestamp: z.ZodString;
    repository: z.ZodString;
    description: z.ZodString;
    framework: z.ZodString;
    stylingSystem: z.ZodString;
    processingTime: z.ZodNumber;
    claudeTokensUsed: z.ZodNumber;
    cacheHit: z.ZodBoolean;
    success: z.ZodBoolean;
    changesGenerated: z.ZodNumber;
    confidence: z.ZodNumber;
    userFeedback: z.ZodOptional<z.ZodEnum<["helpful", "not_helpful"]>>;
    appliedChanges: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description: string;
    framework: string;
    stylingSystem: string;
    confidence: number;
    success: boolean;
    repository: string;
    requestId: string;
    processingTime: number;
    claudeTokensUsed: number;
    timestamp: string;
    cacheHit: boolean;
    changesGenerated: number;
    userFeedback?: "helpful" | "not_helpful" | undefined;
    appliedChanges?: boolean | undefined;
}, {
    description: string;
    framework: string;
    stylingSystem: string;
    confidence: number;
    success: boolean;
    repository: string;
    requestId: string;
    processingTime: number;
    claudeTokensUsed: number;
    timestamp: string;
    cacheHit: boolean;
    changesGenerated: number;
    userFeedback?: "helpful" | "not_helpful" | undefined;
    appliedChanges?: boolean | undefined;
}>;
export type Element = z.infer<typeof ElementSchema>;
export type Repository = z.infer<typeof RepositorySchema>;
export type DesignTokens = z.infer<typeof DesignTokensSchema>;
export type ComponentMapping = z.infer<typeof ComponentMappingSchema>;
export type Context = z.infer<typeof ContextSchema>;
export type ProcessVisualEditRequest = z.infer<typeof ProcessVisualEditRequestSchema>;
export type CodeChange = z.infer<typeof CodeChangeSchema>;
export type AlternativeChange = z.infer<typeof AlternativeChangeSchema>;
export type ProcessVisualEditResponse = z.infer<typeof ProcessVisualEditResponseSchema>;
export type AnalyzeRepositoryRequest = z.infer<typeof AnalyzeRepositoryRequestSchema>;
export type ComponentStructure = z.infer<typeof ComponentStructureSchema>;
export type AnalyzeRepositoryResponse = z.infer<typeof AnalyzeRepositoryResponseSchema>;
export type BatchEdit = z.infer<typeof BatchEditSchema>;
export type BatchProcessRequest = z.infer<typeof BatchProcessRequestSchema>;
export type BatchEditResult = z.infer<typeof BatchEditResultSchema>;
export type BatchProcessResponse = z.infer<typeof BatchProcessResponseSchema>;
export type CreatePullRequestRequest = z.infer<typeof CreatePullRequestRequestSchema>;
export type PullRequestInfo = z.infer<typeof PullRequestInfoSchema>;
export type CreatePullRequestResponse = z.infer<typeof CreatePullRequestResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
export type AgentMetrics = z.infer<typeof AgentMetricsSchema>;
export interface RequestContext {
    requestId: string;
    startTime: number;
    userId?: string;
    apiKey: string;
}
export interface CacheKey {
    type: 'repository' | 'file' | 'claude_response';
    identifier: string;
    version?: string;
}
export interface CacheEntry<T = any> {
    data: T;
    createdAt: string;
    expiresAt: string;
    version: string;
}
//# sourceMappingURL=types.d.ts.map