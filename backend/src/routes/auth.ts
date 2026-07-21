import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserModel } from '../models/userModel';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// GET /api/auth/me - Check current session
router.get('/me', (req, res) => {
  const session = req.session as any;
  if (session && session.user) {
    return res.json({ loggedIn: true, user: session.user });
  }
  return res.status(401).json({ loggedIn: false, error: 'Not authenticated' });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      email,
      password: hashedPassword,
      name
    });

    const session = req.session as any;
    session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    res.status(201).json({ message: 'Registered successfully', user: session.user });
  } catch (error) {
    res.status(400).json({ error: 'Invalid data', details: error });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await UserModel.findByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const session = req.session as any;
    session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    res.json({ message: 'Logged in successfully', user: session.user });
  } catch (error) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// POST /api/auth/guest
router.post('/guest', async (req, res) => {
  try {
    const guestId = `guest_${Math.random().toString(36).substr(2, 9)}`;
    const guestEmail = `${guestId}@guest.local`;

    const user = await UserModel.create({
      email: guestEmail,
      name: 'Guest User',
      password: null,
      role: 'GUEST'
    });

    const session = req.session as any;
    session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    res.json({ message: 'Guest session created', user: session.user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create guest session' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  if (!req.session) {
    return res.json({ message: 'No active session' });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully' });
  });
});

export default router;
