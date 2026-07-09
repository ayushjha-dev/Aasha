import { Router, Request, Response } from 'express';
import VolunteerTeam from '../models/VolunteerTeam';
import auth from '../middleware/auth';
import authorize from '../middleware/rbac';
import logAudit from '../utils/auditLogger';
import mongoose, { Types } from 'mongoose';
import { mockTeams, mockUsers, mockIncidents, logMockAudit } from '../utils/mockStore';

const router = Router();

// Helper to populate members and incidents in mock teams
const populateMockTeam = (team: any) => {
  const members = mockUsers.filter(u => team.memberIds.includes(u._id));
  const incidents = mockIncidents.filter(i => team.assignedIncidentIds.includes(i._id));
  return {
    ...team,
    memberIds: members.map(m => ({ _id: m._id, name: m.name, email: m.email, skills: m.skills, phone: m.phone })),
    assignedIncidentIds: incidents.map(i => ({
      _id: i._id,
      category: i.category,
      severity: i.severity,
      status: i.status,
      location: i.location,
      description: i.description
    }))
  };
};

// ---------------------------------------------------------------------------
// GET /api/teams — List teams
// ---------------------------------------------------------------------------
router.get('/', auth, authorize('admin', 'volunteer'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const teams = mockTeams.map(populateMockTeam);
      res.json({ teams });
      return;
    }

    const teams = await VolunteerTeam.find()
      .populate('memberIds', 'name email skills')
      .populate('assignedIncidentIds', 'category severity status')
      .sort({ name: 1 });

    res.json({ teams });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/teams/:id — Get single team
// ---------------------------------------------------------------------------
router.get('/:id', auth, authorize('admin', 'volunteer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const team = mockTeams.find(t => t._id === req.params.id);
      if (!team) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }
      res.json({ team: populateMockTeam(team) });
      return;
    }

    const team = await VolunteerTeam.findById(req.params.id)
      .populate('memberIds', 'name email skills phone')
      .populate('assignedIncidentIds', 'category severity status location description');

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    res.json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/teams — Create team
// ---------------------------------------------------------------------------
router.post('/', auth, authorize('admin', 'volunteer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, specialization, memberIds } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Team name is required' });
      return;
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const team: any = {
        _id: new Types.ObjectId().toString(),
        name,
        specialization: specialization || 'general',
        memberIds: memberIds || [req.user!._id.toString()],
        assignedIncidentIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeams.push(team);

      logMockAudit(req.user!._id.toString(), 'CREATE', 'VolunteerTeam', team._id, `Created team: ${name}`);

      res.status(201).json({ team: populateMockTeam(team) });
      return;
    }

    const team = await VolunteerTeam.create({
      name,
      specialization: specialization || 'general',
      memberIds: memberIds || [req.user!._id], // Creator is auto-added
    });

    await logAudit(req.user!._id, 'CREATE', 'VolunteerTeam', team._id, `Created team: ${name}`);

    const populated = await team.populate('memberIds', 'name email skills');
    res.status(201).json({ team: populated });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/teams/:id — Update team
// ---------------------------------------------------------------------------
router.put('/:id', auth, authorize('admin', 'volunteer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const allowedUpdates = ['name', 'specialization', 'memberIds', 'assignedIncidentIds'];
    const updates: Record<string, any> = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const idx = mockTeams.findIndex(t => t._id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      mockTeams[idx] = {
        ...mockTeams[idx],
        ...updates,
        updatedAt: new Date()
      };

      logMockAudit(req.user!._id.toString(), 'UPDATE', 'VolunteerTeam', req.params.id, `Updated: ${Object.keys(updates).join(', ')}`);

      res.json({ team: populateMockTeam(mockTeams[idx]) });
      return;
    }

    const team = await VolunteerTeam.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('memberIds', 'name email skills')
      .populate('assignedIncidentIds', 'category severity status');

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    await logAudit(req.user!._id, 'UPDATE', 'VolunteerTeam', team._id, `Updated: ${Object.keys(updates).join(', ')}`);

    res.json({ team });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/teams/:id/join — Join a team
// ---------------------------------------------------------------------------
router.post('/:id/join', auth, authorize('volunteer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const idx = mockTeams.findIndex(t => t._id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      const team = mockTeams[idx];
      const userId = req.user!._id.toString();
      const alreadyMember = team.memberIds.some((id) => id === userId);

      if (alreadyMember) {
        res.status(400).json({ error: 'Already a member of this team' });
        return;
      }

      team.memberIds.push(userId);
      team.updatedAt = new Date();

      logMockAudit(req.user!._id.toString(), 'JOIN', 'VolunteerTeam', team._id, `Joined team: ${team.name}`);

      res.json({ team: populateMockTeam(team) });
      return;
    }

    const team = await VolunteerTeam.findById(req.params.id);

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const userId = req.user!._id.toString();
    const alreadyMember = team.memberIds.some((id) => id.toString() === userId);

    if (alreadyMember) {
      res.status(400).json({ error: 'Already a member of this team' });
      return;
    }

    team.memberIds.push(req.user!._id);
    await team.save();

    await logAudit(req.user!._id, 'JOIN', 'VolunteerTeam', team._id, `Joined team: ${team.name}`);

    const populated = await team.populate('memberIds', 'name email skills');
    res.json({ team: populated });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ error: 'Failed to join team' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/teams/:id/leave — Leave a team
// ---------------------------------------------------------------------------
router.post('/:id/leave', auth, authorize('volunteer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const idx = mockTeams.findIndex(t => t._id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      const team = mockTeams[idx];
      const userId = req.user!._id.toString();
      team.memberIds = team.memberIds.filter(id => id !== userId);
      team.updatedAt = new Date();

      logMockAudit(req.user!._id.toString(), 'LEAVE', 'VolunteerTeam', team._id, `Left team: ${team.name}`);

      res.json({ message: 'Left team successfully' });
      return;
    }

    const team = await VolunteerTeam.findById(req.params.id);

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const userId = req.user!._id.toString();
    team.memberIds = team.memberIds.filter((id) => id.toString() !== userId) as any;
    await team.save();

    await logAudit(req.user!._id, 'LEAVE', 'VolunteerTeam', team._id, `Left team: ${team.name}`);

    res.json({ message: 'Left team successfully' });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({ error: 'Failed to leave team' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/teams/:id — Delete team (admin only)
// ---------------------------------------------------------------------------
router.delete('/:id', auth, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const idx = mockTeams.findIndex(t => t._id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      const deleted = mockTeams[idx];
      mockTeams.splice(idx, 1);

      logMockAudit(req.user!._id.toString(), 'DELETE', 'VolunteerTeam', req.params.id, `Deleted team: ${deleted.name}`);

      res.json({ message: 'Team deleted' });
      return;
    }

    const team = await VolunteerTeam.findByIdAndDelete(req.params.id);

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    await logAudit(req.user!._id, 'DELETE', 'VolunteerTeam', team._id, `Deleted team: ${team.name}`);

    res.json({ message: 'Team deleted' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

export default router;
