import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import auth from '../middleware/auth';
import mongoose from 'mongoose';
import { mockUsers, MockUser } from '../utils/mockStore';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role, location, languagePreference, skills } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    // Validate role
    const validRoles = ['citizen', 'volunteer', 'admin'];
    if (role && !validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const existing = mockUsers.find(u => u.email === email);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists' });
        return;
      }

      const newUser: MockUser = {
        _id: new mongoose.Types.ObjectId().toString(),
        name,
        email,
        passwordHash: '',
        role: role || 'citizen',
        phone: phone || '',
        location: location || { lat: 0, lng: 0 },
        languagePreference: languagePreference || 'en',
        skills: skills || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.push(newUser);

      const token = jwt.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          location: newUser.location,
          languagePreference: newUser.languagePreference,
          skills: newUser.skills,
        },
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      phone: phone || '',
      passwordHash,
      role: role || 'citizen',
      location: location || { lat: 0, lng: 0 },
      languagePreference: languagePreference || 'en',
      skills: skills || [],
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        languagePreference: user.languagePreference,
        skills: user.skills,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const user = mockUsers.find(u => u.email === email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const isCorrectPassword = 
        (email === 'citizen@aasha.space' && password === 'password123') ||
        (email === 'volunteer@aasha.space' && password === 'password123') ||
        (email === 'admin@aasha.space' && password === 'admin123') ||
        password === 'password123'; // allow custom mock registers to login with password123

      if (!isCorrectPassword) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
          languagePreference: user.languagePreference,
          skills: user.skills,
        },
      });
      return;
    }

    // Find user with password field included
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        languagePreference: user.languagePreference,
        skills: user.skills,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me — Get current user profile
// ---------------------------------------------------------------------------
router.get('/me', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        languagePreference: user.languagePreference,
        skills: user.skills,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/auth/me — Update current user profile
// ---------------------------------------------------------------------------
router.put('/me', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const allowedUpdates = ['name', 'phone', 'location', 'languagePreference', 'skills'];
    const updates: Record<string, any> = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const userIndex = mockUsers.findIndex(u => u._id === req.user!._id.toString());
      if (userIndex === -1) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const updatedUser = {
        ...mockUsers[userIndex],
        ...updates
      };
      mockUsers[userIndex] = updatedUser;
      res.json({
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          location: updatedUser.location,
          languagePreference: updatedUser.languagePreference,
          skills: updatedUser.skills,
        },
      });
      return;
    }

    const user = await User.findByIdAndUpdate(req.user!._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        languagePreference: user.languagePreference,
        skills: user.skills,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
