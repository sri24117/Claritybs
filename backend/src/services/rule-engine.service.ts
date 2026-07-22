export interface EducationalSnippet {
  id: string;
  category: 'DIABETES' | 'LIPIDS' | 'GENERAL';
  riskLevel: 'NORMAL' | 'PREDIABETES' | 'DIABETES' | 'HIGH_RISK';
  title: string;
  explanation: string;
  dietAdvice: string[];
  lifestyleAdvice: string[];
}

// Temporary in-memory database until Supabase is connected
const SnippetLibrary: EducationalSnippet[] = [
  {
    id: 'hba1c-normal',
    category: 'DIABETES',
    riskLevel: 'NORMAL',
    title: 'Excellent Blood Sugar Control',
    explanation: 'Your HbA1c is in the normal range. This means your body is processing sugars effectively and you have a low risk of developing diabetes in the near future.',
    dietAdvice: [
      'Continue your current balanced diet.',
      'Maintain a good mix of complex carbs, protein, and healthy fats.'
    ],
    lifestyleAdvice: [
      'Keep up your regular physical activity.',
      'Aim for 7-8 hours of sleep per night.'
    ]
  },
  {
    id: 'hba1c-prediabetes',
    category: 'DIABETES',
    riskLevel: 'PREDIABETES',
    title: 'Borderline Blood Sugar (Prediabetes)',
    explanation: 'Your HbA1c indicates Prediabetes. Your blood sugar is higher than normal, but not high enough to be classified as diabetes. This is a critical window where lifestyle changes can completely reverse the trend.',
    dietAdvice: [
      'Swap white rice for unpolished millets (like foxtail or little millet) or brown rice.',
      'Ensure every meal has a protein source (dal, paneer, eggs, or chicken).',
      'Reduce intake of refined sugars and sweets.'
    ],
    lifestyleAdvice: [
      'Take a 10-minute brisk walk immediately after lunch and dinner.',
      'Aim for at least 150 minutes of moderate exercise per week.'
    ]
  },
  {
    id: 'hba1c-diabetes',
    category: 'DIABETES',
    riskLevel: 'DIABETES',
    title: 'Elevated Blood Sugar',
    explanation: 'Your HbA1c is in the diabetic range. It is highly recommended that you consult a healthcare professional for a proper diagnosis and management plan.',
    dietAdvice: [
      'Strictly avoid sugary drinks and direct sweets.',
      'Use the plate method: 1/2 vegetables, 1/4 complex carbs, 1/4 protein.',
      'Monitor carbohydrate intake carefully.'
    ],
    lifestyleAdvice: [
      'Consult your doctor before starting any rigorous exercise program.',
      'Check your fasting blood sugar regularly as advised by your doctor.'
    ]
  }
];

export class RuleEngineService {
  public evaluateDiabetesRisk(hba1c?: number, fbs?: number): EducationalSnippet {
    // Basic clinical rules for HbA1c
    if (hba1c) {
      if (hba1c >= 6.5) {
        return SnippetLibrary.find(s => s.id === 'hba1c-diabetes')!;
      } else if (hba1c >= 5.7 && hba1c < 6.5) {
        return SnippetLibrary.find(s => s.id === 'hba1c-prediabetes')!;
      } else {
        return SnippetLibrary.find(s => s.id === 'hba1c-normal')!;
      }
    }
    
    // Fallback to Fasting Blood Sugar if HbA1c is missing
    if (fbs) {
      if (fbs >= 126) {
        return SnippetLibrary.find(s => s.id === 'hba1c-diabetes')!;
      } else if (fbs >= 100 && fbs < 126) {
        return SnippetLibrary.find(s => s.id === 'hba1c-prediabetes')!;
      } else {
        return SnippetLibrary.find(s => s.id === 'hba1c-normal')!;
      }
    }

    // Default if neither is provided
    return SnippetLibrary.find(s => s.id === 'hba1c-normal')!;
  }
}

export const ruleEngine = new RuleEngineService();
