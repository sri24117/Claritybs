import { Router, Request, Response } from 'express';

const router = Router();

// Mock endpoints for MVP Setup
router.post('/signup', (req: Request, res: Response) => {
  res.json({ message: 'Signup route connected', token: 'mock-jwt-token' });
});

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'test@claritybs.com' && password === 'password123') {
    res.json({ message: 'Login successful', token: 'mock-jwt-token' });
  } else {
    res.status(401).json({ error: 'Invalid credentials. Try test@claritybs.com / password123' });
  }
});

export default router;
