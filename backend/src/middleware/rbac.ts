import { Request, Response, NextFunction } from 'express';

/**
 * Role-based access control middleware.
 * Usage: authorize('admin', 'volunteer') — allows only those roles through.
 */
const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        required: roles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

export default authorize;
