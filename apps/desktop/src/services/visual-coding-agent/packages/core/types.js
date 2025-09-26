"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryAnalysisError = exports.CodeGenerationError = exports.InterpretationError = exports.VisualCodingError = exports.DesignIntentSchema = exports.VisualResponseSchema = exports.AlternativeSchema = exports.CodeChangeSchema = exports.VisualRequestSchema = exports.DesignContextSchema = exports.DOMElementSchema = void 0;
const zod_1 = require("zod");
// Request schemas
exports.DOMElementSchema = zod_1.z.object({
    tagName: zod_1.z.string(),
    classes: zod_1.z.array(zod_1.z.string()).optional(),
    id: zod_1.z.string().optional(),
    style: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
    attributes: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
    textContent: zod_1.z.string().optional(),
    innerHTML: zod_1.z.string().optional(),
});
exports.DesignContextSchema = zod_1.z.object({
    designTokens: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
    framework: zod_1.z.enum(['react', 'vue', 'svelte']),
    stylingSystem: zod_1.z.enum(['tailwind', 'css-modules', 'styled-components', 'vanilla-css', 'mui', 'chakra', 'ant-design']),
    fileStructure: zod_1.z.array(zod_1.z.string()),
    componentPatterns: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
    existingCode: zod_1.z.string().optional(),
    filePath: zod_1.z.string().optional(),
});
exports.VisualRequestSchema = zod_1.z.object({
    description: zod_1.z.string(),
    element: exports.DOMElementSchema,
    context: exports.DesignContextSchema,
    framework: zod_1.z.enum(['react', 'vue', 'svelte']),
});
// Response schemas
exports.CodeChangeSchema = zod_1.z.object({
    filePath: zod_1.z.string(),
    oldContent: zod_1.z.string(),
    newContent: zod_1.z.string(),
    reasoning: zod_1.z.string(),
    changeType: zod_1.z.enum(['modify', 'create', 'delete']),
});
exports.AlternativeSchema = zod_1.z.object({
    description: zod_1.z.string(),
    changes: zod_1.z.array(exports.CodeChangeSchema),
    tradeoffs: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(1),
});
exports.VisualResponseSchema = zod_1.z.object({
    changes: zod_1.z.array(exports.CodeChangeSchema),
    explanation: zod_1.z.string(),
    alternatives: zod_1.z.array(exports.AlternativeSchema).optional(),
    confidence: zod_1.z.number().min(0).max(1),
    designPrinciples: zod_1.z.array(zod_1.z.string()).optional(),
});
// Design intent schemas
exports.DesignIntentSchema = zod_1.z.object({
    property: zod_1.z.enum(['size', 'color', 'spacing', 'typography', 'layout', 'emphasis', 'complexity', 'style']),
    direction: zod_1.z.enum(['increase', 'decrease', 'change', 'add', 'remove']),
    methods: zod_1.z.array(zod_1.z.string()),
    designPrinciple: zod_1.z.string().optional(),
    urgency: zod_1.z.enum(['low', 'medium', 'high']).default('medium'),
    specificity: zod_1.z.number().min(0).max(1).optional(),
});
// Error types
class VisualCodingError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'VisualCodingError';
    }
}
exports.VisualCodingError = VisualCodingError;
class InterpretationError extends VisualCodingError {
    constructor(message, details) {
        super(message, 'INTERPRETATION_ERROR', details);
        this.name = 'InterpretationError';
    }
}
exports.InterpretationError = InterpretationError;
class CodeGenerationError extends VisualCodingError {
    constructor(message, details) {
        super(message, 'CODE_GENERATION_ERROR', details);
        this.name = 'CodeGenerationError';
    }
}
exports.CodeGenerationError = CodeGenerationError;
class RepositoryAnalysisError extends VisualCodingError {
    constructor(message, details) {
        super(message, 'REPOSITORY_ANALYSIS_ERROR', details);
        this.name = 'RepositoryAnalysisError';
    }
}
exports.RepositoryAnalysisError = RepositoryAnalysisError;
//# sourceMappingURL=types.js.map