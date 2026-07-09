import { Router, Request, Response } from 'express';
import Incident from '../models/Incident';
import auth from '../middleware/auth';
import authorize from '../middleware/rbac';
import logAudit from '../utils/auditLogger';
import mongoose, { Types } from 'mongoose';
import { mockIncidents, mockUsers, logMockAudit } from '../utils/mockStore';

const router = Router();

// Helper to populate incident reporter and volunteers in mock mode
const populateMockIncident = (incident: any) => {
  const reporter = mockUsers.find(u => u._id === incident.reporterId);
  const volunteers = mockUsers.filter(u => incident.assignedVolunteerIds.includes(u._id));
  return {
    ...incident,
    reporterId: reporter ? { _id: reporter._id, name: reporter.name, email: reporter.email, phone: reporter.phone } : null,
    assignedVolunteerIds: volunteers.map(v => ({ _id: v._id, name: v.name, email: v.email, phone: v.phone, skills: v.skills }))
  };
};

// ---------------------------------------------------------------------------
// GET /api/incidents — List incidents
// ---------------------------------------------------------------------------
router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const { status, category, severity, page = '1', limit = '50' } = req.query;
      let list = [...mockIncidents];

      if (status) list = list.filter(i => i.status === status);
      if (category) list = list.filter(i => i.category === category);
      if (severity) list = list.filter(i => i.severity === Number(severity));

      // Citizens only see their own incidents
      if (req.user!.role === 'citizen') {
        list = list.filter(i => i.reporterId === req.user!._id.toString());
      }

      // Sort by createdAt descending
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const total = list.length;

      const paginated = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);
      const populated = paginated.map(populateMockIncident);

      res.json({
        incidents: populated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
      return;
    }

    const { status, category, severity, page = '1', limit = '50' } = req.query;
    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = Number(severity);

    // Citizens only see their own incidents
    if (req.user!.role === 'citizen') {
      filter.reporterId = req.user!._id;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .populate('reporterId', 'name email phone')
        .populate('assignedVolunteerIds', 'name email phone skills')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Incident.countDocuments(filter),
    ]);

    res.json({
      incidents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/incidents/all — Get all incidents for map (admin/volunteer)
// ---------------------------------------------------------------------------
router.get('/all', auth, authorize('admin', 'volunteer', 'citizen'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const incidents = mockIncidents
        .filter(i => i.status !== 'resolved')
        .map(i => ({
          _id: i._id,
          category: i.category,
          severity: i.severity,
          status: i.status,
          location: i.location,
          createdAt: i.createdAt,
        }));
      res.json({ incidents });
      return;
    }

    const incidents = await Incident.find({ status: { $ne: 'resolved' } })
      .select('category severity status location createdAt')
      .lean();

    res.json({ incidents });
  } catch (error) {
    console.error('Get all incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/incidents/:id — Get single incident
// ---------------------------------------------------------------------------
router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const incident = mockIncidents.find(i => i._id === req.params.id);

      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      // Citizens can only see their own incidents
      if (req.user!.role === 'citizen' && incident.reporterId !== req.user!._id.toString()) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({ incident: populateMockIncident(incident) });
      return;
    }

    const incident = await Incident.findById(req.params.id)
      .populate('reporterId', 'name email phone')
      .populate('assignedVolunteerIds', 'name email phone skills');

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    // Citizens can only see their own incidents
    if (req.user!.role === 'citizen' && incident.reporterId._id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ incident });
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/incidents — Create new incident (citizen)
// ---------------------------------------------------------------------------
router.post('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, description, severity, location, photoUrl } = req.body;

    if (!category || !description || !location?.lat || !location?.lng) {
      res.status(400).json({ error: 'Category, description, and location are required' });
      return;
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const incident: any = {
        _id: new Types.ObjectId().toString(),
        reporterId: req.user!._id.toString(),
        category,
        description,
        severity: severity || 3,
        location,
        photoUrl: photoUrl || '',
        assignedVolunteerIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockIncidents.push(incident);

      logMockAudit(req.user!._id.toString(), 'CREATE', 'Incident', incident._id, `New ${category} incident reported`);

      res.status(201).json({ incident: populateMockIncident(incident) });
      return;
    }

    const incident = await Incident.create({
      reporterId: req.user!._id,
      category,
      description,
      severity: severity || 3,
      location,
      photoUrl: photoUrl || '',
    });

    await logAudit(req.user!._id, 'CREATE', 'Incident', incident._id, `New ${category} incident reported`);

    res.status(201).json({ incident });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/incidents/:id — Update incident (admin)
// ---------------------------------------------------------------------------
router.put('/:id', auth, authorize('admin', 'volunteer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const allowedUpdates = ['status', 'severity', 'assignedVolunteerIds', 'description', 'category'];
    const updates: Record<string, any> = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const idx = mockIncidents.findIndex(i => i._id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      mockIncidents[idx] = {
        ...mockIncidents[idx],
        ...updates,
        updatedAt: new Date()
      };

      logMockAudit(req.user!._id.toString(), 'UPDATE', 'Incident', req.params.id as string, `Updated: ${Object.keys(updates).join(', ')}`);

      res.json({ incident: populateMockIncident(mockIncidents[idx]) });
      return;
    }

    const incident = await Incident.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('reporterId', 'name email phone')
      .populate('assignedVolunteerIds', 'name email phone skills');

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    await logAudit(req.user!._id, 'UPDATE', 'Incident', incident._id, `Updated: ${Object.keys(updates).join(', ')}`);

    res.json({ incident });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/incidents/:id — Delete incident (admin only)
// ---------------------------------------------------------------------------
router.delete('/:id', auth, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const idx = mockIncidents.findIndex(i => i._id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      const deleted = mockIncidents[idx];
      mockIncidents.splice(idx, 1);

      logMockAudit(req.user!._id.toString(), 'DELETE', 'Incident', req.params.id as string, `Deleted ${deleted.category} incident`);

      res.json({ message: 'Incident deleted' });
      return;
    }

    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    await logAudit(req.user!._id, 'DELETE', 'Incident', incident._id, `Deleted ${incident.category} incident`);

    res.json({ message: 'Incident deleted' });
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ error: 'Failed to delete incident' });
  }
});

export default router;
