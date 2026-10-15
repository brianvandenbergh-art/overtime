import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, requireCompanyAccess } from '../middleware/auth.js';
import { decrypt, monthlyToHourly } from '../utils/encryption.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate, requireCompanyAccess);

/**
 * POST /api/overtime
 * Employee logs overtime
 */
router.post('/', requireRole('employee', 'manager', 'company_admin', 'hr'), async (req, res) => {
  try {
    const { date, startTime, endTime, hours, multiplier = 1.5, task, notes } = req.body;

    if (!date || !startTime || !endTime || !hours || !task) {
      return res.status(400).json({ error: 'date, startTime, endTime, hours and task are required' });
    }

    // Get user's hourly rate
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    let hourlyRate = user.hourlyRate;
    if (!hourlyRate && user.salaryEncrypted) {
      const salary = parseFloat(decrypt(user.salaryEncrypted));
      hourlyRate = monthlyToHourly(salary);
    }
    hourlyRate = hourlyRate || 0;

    const amount = Number((hours * hourlyRate * multiplier).toFixed(2));

    const entry = await prisma.overtimeEntry.create({
      data: {
        companyId: req.user.companyId,
        userId: req.user.id,
        date: new Date(date),
        startTime,
        endTime,
        hours: Number(hours),
        multiplier: Number(multiplier),
        task,
        notes,
        status: 'pending',
        amount
      }
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create overtime entry' });
  }
});

/**
 * GET /api/overtime
 * List entries (own for employee, team for manager, all for admin/hr)
 */
router.get('/', async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const where = { companyId: req.user.companyId };

    if (status) where.status = status;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    // Role-based filtering
    if (req.user.role === 'employee') {
      where.userId = req.user.id;
    } else if (req.user.role === 'manager') {
      // Managers see their own + direct reports
      const reports = await prisma.user.findMany({
        where: { managerId: req.user.id },
        select: { id: true }
      });
      const ids = [req.user.id, ...reports.map(r => r.id)];
      where.userId = { in: ids };
    }
    // company_admin and hr see all company entries

    const entries = await prisma.overtimeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvals: {
          include: { manager: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

/**
 * PATCH /api/overtime/:id/approve
 * Manager / Admin / HR approve or reject
 */
router.patch('/:id/approve', requireRole('manager', 'company_admin', 'hr'), async (req, res) => {
  try {
    const { status, comment } = req.body; // status: approved | rejected
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or rejected' });
    }

    const entry = await prisma.overtimeEntry.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId }
    });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const updated = await prisma.$transaction(async (tx) => {
      const e = await tx.overtimeEntry.update({
        where: { id: entry.id },
        data: { status }
      });
      await tx.approvalLog.create({
        data: {
          entryId: entry.id,
          managerId: req.user.id,
          status,
          comment
        }
      });
      return e;
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Approval failed' });
  }
});

/**
 * GET /api/overtime/export/csv
 * Export approved entries for a date range
 */
router.get('/export/csv', requireRole('manager', 'company_admin', 'hr'), async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {
      companyId: req.user.companyId,
      status: 'approved'
    };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const entries = await prisma.overtimeEntry.findMany({
      where,
      include: { user: true },
      orderBy: { date: 'asc' }
    });

    const header = 'Employee,Email,Date,Start,End,Hours,Multiplier,Amount (ZAR),Task,Notes\n';
    const rows = entries.map(e => {
      const name = `${e.user.firstName} ${e.user.lastName}`;
      return `"${name}","${e.user.email}","${e.date.toISOString().slice(0,10)}","${e.startTime}","${e.endTime}",${e.hours},${e.multiplier},${e.amount || 0},"${e.task}","${e.notes || ''}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=overtime-export.csv');
    res.send(header + rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
