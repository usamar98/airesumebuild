import OpenAI from 'openai';

interface ProposalGenerationParams {
  jobTitle: string;
  jobDescription: string;
  jobSkills: string[];
  jobBudget?: string;
  clientInfo?: {
    name?: string;
    rating?: number;
    location?: string;
  };
  userResume?: {
    name?: string;
    email?: string;
    phone?: string;
    summary?: string;
    experience?: any[];
    education?: any[];
    skills?: string[];
    certifications?: any[];
  };
  userProfile?: {
    name?: string;
    title?: string;
    bio?: string;
    skills?: string[];
  };
}

interface GeneratedProposal {
  content: string;
  tone: 'professional' | 'friendly' | 'confident';
  estimated_hours?: number;
  proposed_rate?: number;
  key_points: string[];
  call_to_action: string;
}

class OpenAIService {
  private openai: OpenAI | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('DEBUG: OpenAI API Key check:', {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      startsWithSk: apiKey?.startsWith('sk-') || false,
      value: apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined'
    });
    
    if (apiKey && apiKey !== 'your-openai-api-key-here') {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
      this.isConfigured = true;
      console.log('DEBUG: OpenAI service configured successfully');
    } else {
      console.warn('OpenAI API key not configured. Proposal generation will use mock responses.');
    }
  }

  async generateProposal(params: ProposalGenerationParams): Promise<GeneratedProposal> {
    try {
      // If OpenAI is not configured, return mock proposal
      if (!this.isConfigured || !this.openai) {
        return this.getMockProposal(params);
      }

      const prompt = this.buildProposalPrompt(params);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert freelance proposal writer. Generate compelling, personalized proposals for freelance job applications. The proposal should be professional, concise, and highlight relevant experience and skills. Always include a clear call to action and demonstrate understanding of the client's needs.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      const proposalContent = completion.choices[0]?.message?.content || '';
      
      return this.parseProposalResponse(proposalContent, params);
    } catch (error) {
      console.error('Error generating proposal with OpenAI:', error);
      
      // Fallback to mock proposal if API fails
      console.log('Falling back to mock proposal due to API error');
      return this.getMockProposal(params);
    }
  }

  private buildProposalPrompt(params: ProposalGenerationParams): string {
    let prompt = `Generate a freelance job proposal for the following job:\n\n`;
    
    prompt += `Job Title: ${params.jobTitle}\n`;
    prompt += `Job Description: ${params.jobDescription}\n`;
    prompt += `Required Skills: ${params.jobSkills.join(', ')}\n`;
    
    if (params.jobBudget) {
      prompt += `Budget: ${params.jobBudget}\n`;
    }
    
    if (params.clientInfo?.name) {
      prompt += `Client: ${params.clientInfo.name}`;
      if (params.clientInfo.location) {
        prompt += ` (${params.clientInfo.location})`;
      }
      prompt += `\n`;
    }
    
    prompt += `\n--- Freelancer Information ---\n`;
    
    if (params.userProfile?.name) {
      prompt += `Name: ${params.userProfile.name}\n`;
    }
    
    if (params.userProfile?.title) {
      prompt += `Title: ${params.userProfile.title}\n`;
    }
    
    if (params.userProfile?.bio) {
      prompt += `Bio: ${params.userProfile.bio}\n`;
    }
    
    if (params.userProfile?.skills && params.userProfile.skills.length > 0) {
      prompt += `Skills: ${params.userProfile.skills.join(', ')}\n`;
    }
    
    if (params.userResume?.experience && params.userResume.experience.length > 0) {
      prompt += `\nRelevant Experience:\n`;
      params.userResume.experience.slice(0, 3).forEach((exp: any, index: number) => {
        prompt += `${index + 1}. ${exp.title || exp.position} at ${exp.company} (${exp.duration || exp.period})\n`;
        if (exp.description) {
          prompt += `   ${exp.description.substring(0, 200)}...\n`;
        }
      });
    }
    
    prompt += `\n--- Instructions ---\n`;
    prompt += `Write a compelling proposal that:\n`;
    prompt += `1. Addresses the client by name if provided\n`;
    prompt += `2. Shows understanding of the project requirements\n`;
    prompt += `3. Highlights relevant skills and experience\n`;
    prompt += `4. Demonstrates value proposition\n`;
    prompt += `5. Includes a clear call to action\n`;
    prompt += `6. Is professional but personable\n`;
    prompt += `7. Is concise (300-500 words)\n`;
    prompt += `\nFormat the response as a complete proposal ready to copy and paste.`;
    
    return prompt;
  }

  private parseProposalResponse(content: string, params: ProposalGenerationParams): GeneratedProposal {
    // Extract key information from the generated proposal
    const keyPoints = this.extractKeyPoints(content);
    const callToAction = this.extractCallToAction(content);
    
    return {
      content: content.trim(),
      tone: 'professional',
      key_points: keyPoints,
      call_to_action: callToAction
    };
  }

  private extractKeyPoints(content: string): string[] {
    const points: string[] = [];
    
    // Look for bullet points or numbered lists
    const bulletRegex = /[•\-\*]\s*(.+)/g;
    const numberRegex = /\d+\.\s*(.+)/g;
    
    let match;
    while ((match = bulletRegex.exec(content)) !== null) {
      points.push(match[1].trim());
    }
    
    while ((match = numberRegex.exec(content)) !== null) {
      points.push(match[1].trim());
    }
    
    // If no bullet points found, extract sentences that seem like key points
    if (points.length === 0) {
      const sentences = content.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (sentence.length > 20 && sentence.length < 150) {
          const trimmed = sentence.trim();
          if (trimmed.includes('experience') || trimmed.includes('skill') || 
              trimmed.includes('deliver') || trimmed.includes('expertise')) {
            points.push(trimmed);
          }
        }
      });
    }
    
    return points.slice(0, 5); // Limit to 5 key points
  }

  private extractCallToAction(content: string): string {
    const sentences = content.split(/[.!?]+/);
    
    // Look for sentences that contain call-to-action phrases
    const ctaKeywords = ['contact', 'discuss', 'chat', 'call', 'message', 'reach out', 'get started', 'schedule'];
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i].trim();
      if (sentence.length > 10 && ctaKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword))) {
        return sentence;
      }
    }
    
    return "I'd love to discuss this project further. Please feel free to reach out!";
  }

  private getMockProposal(params: ProposalGenerationParams): GeneratedProposal {
    const clientName = params.clientInfo?.name || 'there';
    const skills = params.jobSkills.slice(0, 3).join(', ');
    
    const mockContent = `Hi ${clientName},

I'm excited about your ${params.jobTitle} project! With my extensive experience in ${skills}, I'm confident I can deliver exactly what you're looking for.

What makes me the right fit for this project:

• Proven expertise in ${params.jobSkills[0] || 'web development'} with 5+ years of hands-on experience
• Strong track record of delivering high-quality projects on time and within budget
• Excellent communication skills and commitment to client satisfaction
• Deep understanding of modern development practices and industry standards

I've carefully reviewed your project requirements and understand you need ${params.jobDescription.substring(0, 100)}... I have successfully completed similar projects and can bring that experience to ensure your project's success.

My approach would be to:
1. Start with a detailed project analysis and planning phase
2. Implement the solution using best practices and clean, maintainable code
3. Provide regular updates and maintain open communication throughout
4. Deliver thoroughly tested, production-ready results

I'm available to start immediately and can dedicate the necessary time to ensure timely delivery. I'd love to discuss your project in more detail and answer any questions you might have.

Looking forward to working with you!

Best regards`;

    return {
      content: mockContent,
      tone: 'professional',
      key_points: [
        `Proven expertise in ${params.jobSkills[0] || 'web development'}`,
        'Strong track record of delivering projects on time',
        'Excellent communication and client satisfaction focus',
        'Deep understanding of modern development practices',
        'Available to start immediately'
      ],
      call_to_action: "I'd love to discuss your project in more detail and answer any questions you might have."
    };
  }

  // Method to test OpenAI connection
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured || !this.openai) {
        console.log('OpenAI API key not configured');
        return false;
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 5
      });

      return !!response.choices[0]?.message;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  // Generate multiple proposal variations
  async generateProposalVariations(params: ProposalGenerationParams, count: number = 3): Promise<GeneratedProposal[]> {
    const proposals: GeneratedProposal[] = [];
    
    for (let i = 0; i < count; i++) {
      const proposal = await this.generateProposal({
        ...params,
        // Add slight variation to get different results
      });
      proposals.push(proposal);
      
      // Add small delay between requests to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return proposals;
  }
}

let openaiServiceInstance: OpenAIService | null = null;

export const getOpenAIService = (): OpenAIService => {
  if (!openaiServiceInstance) {
    openaiServiceInstance = new OpenAIService();
  }
  return openaiServiceInstance;
};

// Export a proxy object that lazily initializes the service
export const openaiService = {
  generateProposal: (params: ProposalGenerationParams) => getOpenAIService().generateProposal(params),
  testConnection: () => getOpenAIService().testConnection(),
  generateProposalVariations: (params: ProposalGenerationParams, count?: number) => getOpenAIService().generateProposalVariations(params, count)
};

export default openaiService;