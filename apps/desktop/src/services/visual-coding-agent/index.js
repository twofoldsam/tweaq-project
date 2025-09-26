"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeUserExplainer = exports.ClaudeCodeGenerator = exports.FileSystemRepositoryAnalyzer = exports.ClaudeNaturalLanguageInterpreter = exports.VisualCodingAgent = exports.createVisualCodingAgent = void 0;
// Main exports for the visual coding agent
var agent_1 = require("./packages/core/agent");
Object.defineProperty(exports, "createVisualCodingAgent", { enumerable: true, get: function () { return agent_1.createVisualCodingAgent; } });
Object.defineProperty(exports, "VisualCodingAgent", { enumerable: true, get: function () { return agent_1.VisualCodingAgent; } });
var interpreter_1 = require("./packages/core/interpreter");
Object.defineProperty(exports, "ClaudeNaturalLanguageInterpreter", { enumerable: true, get: function () { return interpreter_1.ClaudeNaturalLanguageInterpreter; } });
var analyzer_1 = require("./packages/core/analyzer");
Object.defineProperty(exports, "FileSystemRepositoryAnalyzer", { enumerable: true, get: function () { return analyzer_1.FileSystemRepositoryAnalyzer; } });
var generator_1 = require("./packages/core/generator");
Object.defineProperty(exports, "ClaudeCodeGenerator", { enumerable: true, get: function () { return generator_1.ClaudeCodeGenerator; } });
var explainer_1 = require("./packages/core/explainer");
Object.defineProperty(exports, "ClaudeUserExplainer", { enumerable: true, get: function () { return explainer_1.ClaudeUserExplainer; } });
//# sourceMappingURL=index.js.map