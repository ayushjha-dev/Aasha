import { Router, Request, Response } from 'express';
import Incident from '../models/Incident';
import Shelter from '../models/Shelter';
import User from '../models/User';
import Donation from '../models/Donation';
import AuditLog from '../models/AuditLog';
import auth from '../middleware/auth';
import authorize from '../middleware/rbac';

import mongoose from 'mongoose';
import { mockIncidents, mockShelters, mockUsers, mockDonations, mockAuditLogs } from '../utils/mockStore';

const router = Router();

// All admin routes require admin role
router.use(auth, authorize('admin'));

// ---------------------------------------------------------------------------
// GET /api/admin/stats — Dashboard statistics
// ---------------------------------------------------------------------------
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const totalIncidents = mockIncidents.length;
      const activeIncidents = mockIncidents.filter(i => ['acknowledged', 'assigned'].includes(i.status)).length;
      const reportedIncidents = mockIncidents.filter(i => i.status === 'reported').length;
      const resolvedIncidents = mockIncidents.filter(i => i.status === 'resolved').length;

      const totalShelters = mockShelters.length;
      const operationalShelters = mockShelters.filter(s => s.status === 'operational').length;
      const fullShelters = mockShelters.filter(s => s.status === 'full').length;
      
      const sheltersNearCapacity = mockShelters.filter(s => {
        return s.status === 'operational' && (s.currentOccupancy / s.totalCapacity) >= 0.85;
      }).length;

      const totalVolunteers = mockUsers.filter(u => u.role === 'volunteer').length;
      const totalCitizens = mockUsers.filter(u => u.role === 'citizen').length;

      const totalDonations = mockDonations.length;
      const pendingDonations = mockDonations.filter(d => d.status === 'pledged').length;

      res.json({
        incidents: {
          total: totalIncidents,
          active: activeIncidents,
          reported: reportedIncidents,
          resolved: resolvedIncidents,
        },
        shelters: {
          total: totalShelters,
          operational: operationalShelters,
          full: fullShelters,
          nearCapacity: sheltersNearCapacity,
        },
        users: {
          volunteers: totalVolunteers,
          citizens: totalCitizens,
        },
        donations: {
          total: totalDonations,
          pending: pendingDonations,
        },
      });
      return;
    }

    const [
      totalIncidents,
      activeIncidents,
      reportedIncidents,
      resolvedIncidents,
      totalShelters,
      operationalShelters,
      fullShelters,
      totalVolunteers,
      totalCitizens,
      totalDonations,
      pendingDonations,
    ] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ status: { $in: ['acknowledged', 'assigned'] } }),
      Incident.countDocuments({ status: 'reported' }),
      Incident.countDocuments({ status: 'resolved' }),
      Shelter.countDocuments(),
      Shelter.countDocuments({ status: 'operational' }),
      Shelter.countDocuments({ status: 'full' }),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'citizen' }),
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'pledged' }),
    ]);

    // Shelters near capacity (>85% occupied)
    const sheltersNearCapacity = await Shelter.find({
      status: 'operational',
      $expr: {
        $gte: [
          { $divide: ['$currentOccupancy', '$totalCapacity'] },
          0.85,
        ],
      },
    }).countDocuments();

    res.json({
      incidents: {
        total: totalIncidents,
        active: activeIncidents,
        reported: reportedIncidents,
        resolved: resolvedIncidents,
      },
      shelters: {
        total: totalShelters,
        operational: operationalShelters,
        full: fullShelters,
        nearCapacity: sheltersNearCapacity,
      },
      users: {
        volunteers: totalVolunteers,
        citizens: totalCitizens,
      },
      donations: {
        total: totalDonations,
        pending: pendingDonations,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/audit — Audit log
// ---------------------------------------------------------------------------
router.get('/audit', async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const page = req.query.page || '1';
      const limit = req.query.limit || '50';
      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));

      const populatedLogs = mockAuditLogs.map(log => {
        const user = mockUsers.find(u => u._id === log.actorId);
        return {
          ...log,
          actorId: user ? { _id: user._id, name: user.name, email: user.email, role: user.role } : null
        };
      });

      const logs = populatedLogs.slice((pageNum - 1) * limitNum, pageNum * limitNum);
      const total = mockAuditLogs.length;

      res.json({
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
      return;
    }

    const { page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('actorId', 'name email role')
        .sort({ timestamp: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      AuditLog.countDocuments(),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/export — Export data as JSON
// ---------------------------------------------------------------------------
router.get('/export', async (_req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      res.json({
        exportedAt: new Date().toISOString(),
        data: {
          incidents: mockIncidents,
          shelters: mockShelters,
          donations: mockDonations,
          volunteers: mockUsers.filter(u => u.role === 'volunteer'),
        },
      });
      return;
    }

    const [incidents, shelters, donations, volunteers] = await Promise.all([
      Incident.find().populate('reporterId', 'name email').lean(),
      Shelter.find().lean(),
      Donation.find().populate('donorId', 'name email').lean(),
      User.find({ role: 'volunteer' }).select('-passwordHash').lean(),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      data: {
        incidents,
        shelters,
        donations,
        volunteers,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
