import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserModel } from '../models/userModel';
import jwt from 'jsonwebtoken';

const router = Router();

const generateTokenAndSetCookie = (res: any, user: any) => {
  const secret = process.env.JWT_SECRET || 'super_secure_jwt_secret_key_2026';
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    secret,
    { expiresIn: '1d' }
  );

  res.cookie('token', token, {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return { id: user.id, email: user.email, name: user.name, role: user.role };
};

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
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ loggedIn: false, error: 'Not authenticated' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'super_secure_jwt_secret_key_2026';
    const user = jwt.verify(token, secret);
    return res.json({ loggedIn: true, user });
  } catch (error) {
    return res.status(401).json({ loggedIn: false, error: 'Invalid or expired token' });
  }
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

    const sessionUser = generateTokenAndSetCookie(res, user);
    res.status(201).json({ message: 'Registered successfully', user: sessionUser });
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

    const sessionUser = generateTokenAndSetCookie(res, user);
    res.json({ message: 'Logged in successfully', user: sessionUser });
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

    const sessionUser = generateTokenAndSetCookie(res, user);
    res.json({ message: 'Guest session created', user: sessionUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create guest session' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
});

export default router;
