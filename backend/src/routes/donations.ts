import { Router, Request, Response } from 'express';
import Donation from '../models/Donation';
import auth from '../middleware/auth';
import authorize from '../middleware/rbac';
import logAudit from '../utils/auditLogger';
import mongoose, { Types } from 'mongoose';
import { mockDonations, mockUsers, mockShelters, logMockAudit } from '../utils/mockStore';

const router = Router();

const populateMockDonation = (donation: any) => {
  const donor = mockUsers.find(u => u._id === donation.donorId);
  const dropoff = mockShelters.find(s => s._id === donation.dropoffPointId);
  return {
    ...donation,
    donorId: donor ? { _id: donor._id, name: donor.name, email: donor.email } : null,
    dropoffPointId: dropoff ? { _id: dropoff._id, name: dropoff.name, location: dropoff.location } : null
  };
};

// ---------------------------------------------------------------------------
// GET /api/donations — List donations
// ---------------------------------------------------------------------------
router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const { status, type } = req.query;
      let list = [...mockDonations];

      if (status) list = list.filter(d => d.status === status);
      if (type) list = list.filter(d => d.type === type);

      // Citizens only see their own donations
      if (req.user!.role === 'citizen') {
        list = list.filter(d => d.donorId === req.user!._id.toString());
      }

      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      res.json({ donations: list.map(populateMockDonation) });
      return;
    }

    const { status, type } = req.query;
    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    // Citizens only see their own donations
    if (req.user!.role === 'citizen') {
      filter.donorId = req.user!._id;
    }

    const donations = await Donation.find(filter)
      .populate('donorId', 'name email')
      .populate('dropoffPointId', 'name location')
      .sort({ createdAt: -1 });

    res.json({ donations });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/donations — Create donation (citizen)
// ---------------------------------------------------------------------------
router.post('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, description, dropoffPointId } = req.body;

    if (!type || !description) {
      res.status(400).json({ error: 'Type and description are required' });
      return;
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const donation: any = {
        _id: new Types.ObjectId().toString(),
        donorId: req.user!._id.toString(),
        type,
        description,
        dropoffPointId: dropoffPointId || undefined,
        status: 'pledged',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDonations.push(donation);

      logMockAudit(req.user!._id.toString(), 'CREATE', 'Donation', donation._id, `New ${type} donation`);

      res.status(201).json({ donation: populateMockDonation(donation) });
      return;
    }

    const donation = await Donation.create({
      donorId: req.user!._id,
      type,
      description,
      dropoffPointId: dropoffPointId || undefined,
    });

    await logAudit(req.user!._id, 'CREATE', 'Donation', donation._id, `New ${type} donation`);

    res.status(201).json({ donation });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ error: 'Failed to create donation' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/donations/:id — Update donation status (admin)
// ---------------------------------------------------------------------------
router.put('/:id', auth, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!status || !['pledged', 'collected', 'distributed'].includes(status)) {
      res.status(400).json({ error: 'Valid status is required' });
      return;
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      const idx = mockDonations.findIndex(d => d._id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Donation not found' });
        return;
      }

      mockDonations[idx].status = status as any;
      mockDonations[idx].updatedAt = new Date();

      logMockAudit(req.user!._id.toString(), 'UPDATE', 'Donation', req.params.id, `Status changed to: ${status}`);

      res.json({ donation: populateMockDonation(mockDonations[idx]) });
      return;
    }

    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('donorId', 'name email')
      .populate('dropoffPointId', 'name location');

    if (!donation) {
      res.status(404).json({ error: 'Donation not found' });
      return;
    }

    await logAudit(req.user!._id, 'UPDATE', 'Donation', donation._id, `Status changed to: ${status}`);

    res.json({ donation });
  } catch (error) {
    console.error('Update donation error:', error);
    res.status(500).json({ error: 'Failed to update donation' });
  }
});

export default router;
