import { Router, Request, Response } from 'express';
import Shelter from '../models/Shelter';
import auth from '../middleware/auth';
import authorize from '../middleware/rbac';
import logAudit from '../utils/auditLogger';
import mongoose, { Types } from 'mongoose';
import { mockShelters, logMockAudit } from '../utils/mockStore';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/shelters — List all shelters
// ---------------------------------------------------------------------------
router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const { status } = req.query;
      let list = [...mockShelters];
      if (status) list = list.filter(s => s.status === status);
      list.sort((a, b) => a.name.localeCompare(b.name));
      res.json({ shelters: list });
      return;
    }

    const { status } = req.query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const shelters = await Shelter.find(filter).sort({ name: 1 });
    res.json({ shelters });
  } catch (error) {
    console.error('Get shelters error:', error);
    res.status(500).json({ error: 'Failed to fetch shelters' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/shelters/:id — Get single shelter
// ---------------------------------------------------------------------------
router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const shelter = mockShelters.find(s => s._id === req.params.id);
      if (!shelter) {
        res.status(404).json({ error: 'Shelter not found' });
        return;
      }
      res.json({ shelter });
      return;
    }

    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      res.status(404).json({ error: 'Shelter not found' });
      return;
    }
    res.json({ shelter });
  } catch (error) {
    console.error('Get shelter error:', error);
    res.status(500).json({ error: 'Failed to fetch shelter' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/shelters — Create shelter (admin only)
// ---------------------------------------------------------------------------
router.post('/', auth, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, location, totalCapacity, currentOccupancy, status, contactInfo, resourcesAvailable } = req.body;

    if (!name || !location?.lat || !location?.lng || !totalCapacity) {
      res.status(400).json({ error: 'Name, location, and totalCapacity are required' });
      return;
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const shelter: any = {
        _id: new Types.ObjectId().toString(),
        name,
        location,
        totalCapacity,
        currentOccupancy: currentOccupancy || 0,
        status: status || 'operational',
        contactInfo: contactInfo || '',
        resourcesAvailable: resourcesAvailable || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockShelters.push(shelter);

      logMockAudit(req.user!._id.toString(), 'CREATE', 'Shelter', shelter._id, `Created shelter: ${name}`);

      res.status(201).json({ shelter });
      return;
    }

    const shelter = await Shelter.create({
      name,
      location,
      totalCapacity,
      currentOccupancy: currentOccupancy || 0,
      status: status || 'operational',
      contactInfo: contactInfo || '',
      resourcesAvailable: resourcesAvailable || [],
    });

    await logAudit(req.user!._id, 'CREATE', 'Shelter', shelter._id, `Created shelter: ${name}`);

    res.status(201).json({ shelter });
  } catch (error) {
    console.error('Create shelter error:', error);
    res.status(500).json({ error: 'Failed to create shelter' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/shelters/:id — Update shelter (admin only)
// ---------------------------------------------------------------------------
router.put('/:id', auth, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const allowedUpdates = ['name', 'location', 'totalCapacity', 'currentOccupancy', 'status', 'contactInfo', 'resourcesAvailable'];
    const updates: Record<string, any> = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const idx = mockShelters.findIndex(s => s._id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Shelter not found' });
        return;
      }

      const shelter = mockShelters[idx];
      const mergedCapacity = updates.totalCapacity !== undefined ? updates.totalCapacity : shelter.totalCapacity;
      const mergedOccupancy = updates.currentOccupancy !== undefined ? updates.currentOccupancy : shelter.currentOccupancy;

      if (updates.currentOccupancy !== undefined && updates.totalCapacity !== undefined) {
        const occupancyPercent = (mergedOccupancy / mergedCapacity) * 100;
        if (occupancyPercent >= 100) updates.status = 'full';
      } else if (updates.currentOccupancy !== undefined) {
        const occupancyPercent = (mergedOccupancy / shelter.totalCapacity) * 100;
        if (occupancyPercent >= 100) updates.status = 'full';
      }

      mockShelters[idx] = {
        ...shelter,
        ...updates,
        updatedAt: new Date()
      };

      logMockAudit(req.user!._id.toString(), 'UPDATE', 'Shelter', req.params.id as string, `Updated: ${Object.keys(updates).join(', ')}`);

      res.json({ shelter: mockShelters[idx] });
      return;
    }

    // Auto-set status based on occupancy
    if (updates.currentOccupancy !== undefined && updates.totalCapacity !== undefined) {
      const occupancyPercent = (updates.currentOccupancy / updates.totalCapacity) * 100;
      if (occupancyPercent >= 100) updates.status = 'full';
    } else if (updates.currentOccupancy !== undefined) {
      const shelter = await Shelter.findById(req.params.id);
      if (shelter) {
        const occupancyPercent = (updates.currentOccupancy / shelter.totalCapacity) * 100;
        if (occupancyPercent >= 100) updates.status = 'full';
      }
    }

    const shelter = await Shelter.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!shelter) {
      res.status(404).json({ error: 'Shelter not found' });
      return;
    }

    await logAudit(req.user!._id, 'UPDATE', 'Shelter', shelter._id, `Updated: ${Object.keys(updates).join(', ')}`);

    res.json({ shelter });
  } catch (error) {
    console.error('Update shelter error:', error);
    res.status(500).json({ error: 'Failed to update shelter' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/shelters/:id — Delete shelter (admin only)
// ---------------------------------------------------------------------------
router.delete('/:id', auth, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const idx = mockShelters.findIndex(s => s._id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Shelter not found' });
        return;
      }
      const deleted = mockShelters[idx];
      mockShelters.splice(idx, 1);

      logMockAudit(req.user!._id.toString(), 'DELETE', 'Shelter', req.params.id as string, `Deleted shelter: ${deleted.name}`);

      res.json({ message: 'Shelter deleted' });
      return;
    }

    const shelter = await Shelter.findByIdAndDelete(req.params.id);

    if (!shelter) {
      res.status(404).json({ error: 'Shelter not found' });
      return;
    }

    await logAudit(req.user!._id, 'DELETE', 'Shelter', shelter._id, `Deleted shelter: ${shelter.name}`);

    res.json({ message: 'Shelter deleted' });
  } catch (error) {
    console.error('Delete shelter error:', error);
    res.status(500).json({ error: 'Failed to delete shelter' });
  }
});

export default router;
