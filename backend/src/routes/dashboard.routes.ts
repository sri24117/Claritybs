import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// In a real app, this would use req.user.id from the auth middleware
// For now, we'll mock the user ID
const MOCK_USER_ID = 'mock-user-123'; 

// GET /api/dashboard/summary
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Fetch Health Profile
    let healthProfile = await prisma.healthProfile.findUnique({
      where: { userId: MOCK_USER_ID }
    });

    // Mock initial creation if doesn't exist
    if (!healthProfile) {
      // Create a dummy user first if needed (in MVP we just return mock data if DB empty)
      healthProfile = {
        id: 'mock-profile',
        userId: MOCK_USER_ID,
        currentHealthScore: 78,
        targetHbA1c: 5.9,
        dietPreference: 'NON_VEG',
        weight: 79,
        height: 175,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // 2. Mock Habit List for Today
    const todayHabits = [
      { id: '1', title: 'High Protein Breakfast', category: 'NUTRITION', completed: true },
      { id: '2', title: 'Portion Control at Lunch', category: 'NUTRITION', completed: true },
      { id: '3', title: 'Walk 30 mins', category: 'ACTIVITY', completed: false },
      { id: '4', title: 'Drink 2.5L Water', category: 'ACTIVITY', completed: false }
    ];

    // 3. Mock Timeline Reports
    const timeline = [
      { id: 'rep1', date: '2026-01-15', hba1c: 7.2, weight: 84 },
      { id: 'rep2', date: '2026-04-10', hba1c: 6.8, weight: 82 },
      { id: 'rep3', date: '2026-07-20', hba1c: 6.4, weight: 79 }
    ];

    res.status(200).json({
      healthProfile,
      todayHabits,
      timeline
    });
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// POST /api/dashboard/habit/toggle
router.post('/habit/toggle', async (req: Request, res: Response): Promise<void> => {
  try {
    const { habitId, completed } = req.body;
    // In MVP, we just echo back success. In real app, we update the HabitLog table
    res.status(200).json({ success: true, habitId, completed });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle habit' });
  }
});

// POST /api/coach/ask (Stub for AI Coach)
router.post('/coach/ask', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question } = req.body;
    // Simple mock response based on the "Can I eat dosa?" example
    let answer = "I can help with that. Since your current HbA1c is 6.4 and you're working to lower it to 5.9, focus on portion control and pair carbohydrates with protein and fiber. ";
    
    if (question.toLowerCase().includes('dosa')) {
      answer = "Yes, you can eat dosa! To minimize the blood sugar spike, try pairing it with a protein-rich sambar or a side of eggs, and avoid sugary chutneys.";
    }

    res.status(200).json({ answer });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get coach response' });
  }
});

export default router;
