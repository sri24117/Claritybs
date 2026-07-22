class WhatsAppService {
  private isMockMode: boolean;
  private messageLog: any[] = [];

  constructor() {
    // In production, this would check if process.env.WHATSAPP_TOKEN exists
    this.isMockMode = true; 
  }

  /**
   * Simulates sending a WhatsApp Template Message (e.g. Daily Habit Reminders)
   */
  async sendTemplateMessage(userId: string, templateName: string, variables: Record<string, string>): Promise<boolean> {
    const payload = {
      to: userId,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: Object.entries(variables).map(([key, text]) => ({
              type: 'text',
              text
            }))
          }
        ]
      },
      timestamp: new Date().toISOString()
    };

    if (this.isMockMode) {
      console.log(`\n[WhatsApp MOCK] 📱 Sending Template: '${templateName}' to User: ${userId}`);
      console.log(`[WhatsApp MOCK] 📦 Variables:`, variables);
      this.messageLog.push(payload);
      return true;
    }

    // Real implementation would use axios/fetch to hit Meta Graph API
    // await axios.post(`https://graph.facebook.com/v17.0/${phone_number_id}/messages`, payload, { headers })
    return false;
  }

  /**
   * Simulates sending a standard Text Message (e.g. AI Coach replies)
   */
  async sendTextMessage(userId: string, text: string): Promise<boolean> {
    const payload = {
      to: userId,
      type: 'text',
      text: { body: text },
      timestamp: new Date().toISOString()
    };

    if (this.isMockMode) {
      console.log(`\n[WhatsApp MOCK] 💬 Sending Text to User: ${userId}`);
      console.log(`[WhatsApp MOCK] 📝 Content: "${text}"`);
      this.messageLog.push(payload);
      return true;
    }

    return false;
  }

  /**
   * Helper to retrieve mocked logs for testing endpoints
   */
  getMockLogs() {
    return this.messageLog;
  }
}

export const whatsappService = new WhatsAppService();
