import { Router, Request, Response } from 'express';
import { whatsappService } from '../services/whatsapp.service';
import prisma from '../prisma';

const router = Router();

// GET /api/whatsapp/webhook
// Used by Meta to verify the webhook URL during setup
router.get('/webhook', (req: Request, res: Response) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'claritybs_local_test';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Verified successfully!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// POST /api/whatsapp/webhook
// Receives incoming messages from users (e.g. they reply to the habit reminder)
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages && change.value.messages[0]) {
            const message = change.value.messages[0];
            const from = message.from; // User's phone number
            const text = message.text?.body || '';

            console.log(`[WhatsApp Webhook] 📩 Received message from ${from}: ${text}`);

            // Mock AI Coach responding to the user's WhatsApp message
            if (text.toLowerCase().includes('dosa')) {
              await whatsappService.sendTextMessage(from, "Yes, you can eat dosa! Make sure to pair it with protein-rich sambar.");
            } else {
              await whatsappService.sendTextMessage(from, "I've recorded that. Check your ClarityBS dashboard for your updated health score!");
            }
          }
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    res.sendStatus(500);
  }
});

// POST /api/whatsapp/trigger-morning-habits
// Internal endpoint to trigger the cron job for sending morning habit reminders
router.post('/trigger-morning-habits', async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real app, this would query Prisma for all users opted into WhatsApp
    // For MVP testing, we'll mock one user
    const mockUserId = 'mock-user-123';
    
    // Simulate fetching today's habits
    const habitsCount = 4;
    
    // Send the template message
    await whatsappService.sendTemplateMessage(mockUserId, 'morning_habit_reminder', {
      '1': 'John', // Name
      '2': habitsCount.toString() // Number of habits
    });

    res.status(200).json({ 
      success: true, 
      message: 'Morning habit reminders triggered successfully',
      logs: whatsappService.getMockLogs()
    });
  } catch (error) {
    console.error('[WhatsApp Trigger] Error:', error);
    res.status(500).json({ error: 'Failed to trigger morning habits' });
  }
});

export default router;
