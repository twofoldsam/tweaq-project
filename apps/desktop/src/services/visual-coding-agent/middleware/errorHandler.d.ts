import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '../api/types';
export declare class AppError extends Error {
    code: ErrorCodes;
    message: string;
    statusCode: number;
    retryable: boolean;
    details?: any | undefined;
    constructor(code: ErrorCodes, message: string, statusCode?: number, retryable?: boolean, details?: any | undefined);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: any);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
export declare class RepositoryNotFoundError extends AppError {
    constructor(repository: string);
}
export declare class FileNotFoundError extends AppError {
    constructor(filePath: string);
}
export declare class ClaudeAPIError extends AppError {
    constructor(message: string, retryable?: boolean);
}
export declare class GitHubAPIError extends AppError {
    constructor(message: string, retryable?: boolean);
}
export declare class AnalysisFailedError extends AppError {
    constructor(message: string, details?: any);
}
export declare class CacheError extends AppError {
    constructor(message: string);
}
export declare function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void;
export declare function notFoundHandler(req: Request, res: Response): void;
export declare function asyncHandler<T extends Request = Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<any>): (req: T, res: Response, next: NextFunction) => void;
export declare function throwValidationError(message: string, details?: any): never;
export declare function throwNotFoundError(resource: string, identifier: string): never;
export declare function throwInternalError(message: string, details?: any): never;
export declare function handleClaudeError(error: any): never;
export declare function handleGitHubError(error: any, context?: string): never;
export declare function validateRequest<T>(schema: any): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map