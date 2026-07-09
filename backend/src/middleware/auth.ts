import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import { mockUsers } from '../utils/mockStore';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  id: string;
  role: string;
}

/**
 * Verifies the JWT from the Authorization header and attaches the user to req.user.
 */
const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET is not defined');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Check if database is connected
    const isDbConnected = mongoose.connection.readyState === 1;
    if (!isDbConnected) {
      const existingMock = mockUsers.find(u => u._id === decoded.id);
      if (existingMock) {
        req.user = {
          _id: new mongoose.Types.ObjectId(existingMock._id),
          id: existingMock._id,
          name: existingMock.name,
          email: existingMock.email,
          role: existingMock.role,
          phone: existingMock.phone,
          location: existingMock.location,
          languagePreference: existingMock.languagePreference,
          skills: existingMock.skills,
        } as any;
      } else {
        const mockName = decoded.role === 'admin' ? 'System Admin' : decoded.role === 'volunteer' ? 'John Doe' : 'Jane Doe';
        const mockEmail = `${decoded.role}@aasha.space`;
        req.user = {
          _id: new mongoose.Types.ObjectId(decoded.id),
          id: decoded.id,
          name: mockName,
          email: mockEmail,
          role: decoded.role,
          phone: '+91 98765 00000',
          location: { lat: 28.6139, lng: 77.2090 },
          languagePreference: 'en',
          skills: decoded.role === 'volunteer' ? ['medical', 'transport', 'general'] : [],
        } as any;
      }
      next();
      return;
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'Invalid token. User not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication error' });
  }
};

export default auth;
