import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define the expected structure for our rule engine
export interface ExtractedReportData {
  hba1c?: number;
  fbs?: number;
  ppbs?: number;
  bloodPressure?: string;
  bmi?: number;
  cholesterol?: number;
  triglycerides?: number;
  age?: number;
  weight?: number;
  height?: number;
}

export class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });
  }

  async extractDataFromImage(mimeType: string, base64Data: string): Promise<ExtractedReportData> {
    const prompt = `
      You are an expert medical data extractor. Analyze the provided blood test report image.
      Extract the following values if they exist, and return ONLY a valid JSON object matching this structure:
      {
        "hba1c": number or null, // Glycated Hemoglobin
        "fbs": number or null, // Fasting Blood Sugar
        "ppbs": number or null, // Post Prandial Blood Sugar
        "bloodPressure": string or null, // e.g. "120/80"
        "bmi": number or null,
        "cholesterol": number or null, // Total Cholesterol
        "triglycerides": number or null,
        "age": number or null,
        "weight": number or null, // in kg
        "height": number or null // in cm
      }
      If a value is not found, set it to null. Ensure numeric values are extracted as numbers (e.g., 5.6 not "5.6%").
    `;

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]);

      const responseText = result.response.text();
      return JSON.parse(responseText) as ExtractedReportData;
    } catch (error) {
      console.error('Error extracting data via Gemini:', error);
      throw new Error('Failed to extract data from report');
    }
  }

  async generateExplanation(data: ExtractedReportData, language: 'en' | 'te' = 'en') {
    const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
      You are a friendly, empathetic dietician advising an Indian patient. 
      Here are their extracted lab values:
      ${JSON.stringify(data, null, 2)}
      
      Determine if they are Normal, Prediabetic, or Diabetic based on standard criteria (HbA1c > 6.5 is diabetic, 5.7-6.4 is prediabetic).
      Explain their results in VERY SIMPLE terms (no complex medical jargon) in ${language === 'te' ? 'Telugu' : 'English'}.
      Then provide 3 basic, practical food recommendations (Indian context, e.g., brown rice, millets, reduce sweets).
      
      Return the response in this JSON format:
      {
        "overallRisk": "NORMAL" | "PREDIABETES" | "DIABETES" | "HIGH_RISK",
        "explanation": "string (the friendly explanation)",
        "recommendations": "string (bullet points of diet advice)"
      }
    `;

    try {
      const result = await textModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });
      return JSON.parse(result.response.text());
    } catch (error) {
      console.error('Error generating explanation:', error);
      throw new Error('Failed to generate explanation');
    }
  }
}

export const geminiService = new GeminiService();
