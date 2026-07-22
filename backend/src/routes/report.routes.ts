import { Router, Request, Response } from 'express';
import multer from 'multer';
import prisma from '../prisma';
import { geminiService } from '../services/gemini.service';
import { ruleEngine } from '../services/rule-engine.service';

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/upload', upload.single('report'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { mimetype, buffer } = req.file;
    const base64Data = buffer.toString('base64');
    
    // 1. AI Extraction (Only pulls numbers, no hallucination)
    const extractedData = await geminiService.extractDataFromImage(mimetype, base64Data);
    
    // 2. Rule Engine Classification (Standardized, Evidence-Based)
    const diabetesAnalysis = ruleEngine.evaluateDiabetesRisk(extractedData.hba1c, extractedData.fbs);

    // 3. Save to Proprietary Dataset (The "Secret Weapon")
    // We run this asynchronously so it doesn't block the response to the user
    prisma.labReportDataset.create({
      data: {
        ocrRawText: "Extracted via Gemini Vision", // Eventually we could log the raw text if we did a separate OCR step
        canonicalJson: extractedData as any,
        confidenceScore: 0.95, // Hardcoded for MVP, eventually returned by AI
        isHumanVerified: false
      }
    }).catch(err => console.error("Failed to save to dataset:", err));

    res.status(200).json({
      message: 'Report processed successfully',
      extractedData,
      analysis: diabetesAnalysis
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message || 'Error processing report' });
  }
});

router.get('/history', (req: Request, res: Response) => {
  res.json({ message: 'History route connected', data: [] });
});

export default router;
