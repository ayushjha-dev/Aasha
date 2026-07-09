import { Router, Request, Response } from 'express';
import User from '../models/User';
import auth from '../middleware/auth';
import authorize from '../middleware/rbac';
import mongoose from 'mongoose';
import { mockUsers } from '../utils/mockStore';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/volunteers — List all volunteers (admin/volunteer)
// ---------------------------------------------------------------------------
router.get('/', auth, authorize('admin', 'volunteer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const { skills, page = '1', limit = '50' } = req.query;
      let list = mockUsers.filter(u => u.role === 'volunteer');

      if (skills) {
        const skillsList = (skills as string).split(',');
        list = list.filter(u => u.skills && u.skills.some(s => skillsList.includes(s)));
      }

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));

      const total = list.length;
      const paginated = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      res.json({
        volunteers: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
      return;
    }

    const { skills, page = '1', limit = '50' } = req.query;
    const filter: Record<string, any> = { role: 'volunteer' };

    if (skills) {
      filter.skills = { $in: (skills as string).split(',') };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const [volunteers, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ name: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.json({
      volunteers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/volunteers/:id — Get single volunteer
// ---------------------------------------------------------------------------
router.get('/:id', auth, authorize('admin', 'volunteer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const volunteer = mockUsers.find(u => u._id === req.params.id && u.role === 'volunteer');

      if (!volunteer) {
        res.status(404).json({ error: 'Volunteer not found' });
        return;
      }

      res.json({ volunteer });
      return;
    }

    const volunteer = await User.findOne({ _id: req.params.id, role: 'volunteer' })
      .select('-passwordHash');

    if (!volunteer) {
      res.status(404).json({ error: 'Volunteer not found' });
      return;
    }

    res.json({ volunteer });
  } catch (error) {
    console.error('Get volunteer error:', error);
    res.status(500).json({ error: 'Failed to fetch volunteer' });
  }
});

export default router;
