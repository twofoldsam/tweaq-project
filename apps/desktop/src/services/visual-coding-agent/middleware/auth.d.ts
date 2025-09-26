import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            apiKey?: string;
            userId?: string;
            startTime: number;
        }
    }
}
export declare function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function authenticateApiKey(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function rateLimitByApiKey(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function validateBatchSize(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function cleanupRateLimitStores(): void;
//# sourceMappingURL=auth.d.ts.map