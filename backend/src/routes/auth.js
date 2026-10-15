import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { encrypt, monthlyToHourly } from '../utils/encryption.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/register-company
 * First user becomes company_admin and creates the company
 */
router.post('/register-company', async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      registrationNumber,
      firstName,
      lastName,
      email,
      password,
      phone
    } = req.body;

    if (!companyName || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email already used
    const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create company + admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: (companyEmail || email).toLowerCase(),
          registrationNumber,
          plan: 'basic',
          planStatus: 'trial',
          planExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
          maxUsers: 20
        }
      });

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          role: 'company_admin',
          phone,
          companyId: company.id
        }
      });

      return { company, user };
    });

    const token = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        companyId: result.company.id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        companyId: result.company.id,
        companyName: result.company.name
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        plan: result.company.plan,
        planStatus: result.company.planStatus,
        planExpiresAt: result.company.planExpiresAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), isActive: true },
      include: { company: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name
      },
      company: {
        id: user.company.id,
        name: user.company.name,
        plan: user.company.plan,
        planStatus: user.company.planStatus,
        planExpiresAt: user.company.planExpiresAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: true, department: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
      department: user.department?.name,
      hourlyRate: user.hourlyRate,
      plan: user.company.plan,
      planStatus: user.company.planStatus
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
