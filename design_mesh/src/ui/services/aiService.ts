// Generic AI Service for text-to-image/video generation
export interface AIServiceConfig {
  endpoint: string;
  model?: string;
  apiKey?: string;
  timeout?: number;
  maxTokens?: number;
}

// Generic request for text-to-image/video
export interface AIGenerationRequest {
  prompt: string;
}

// Generic response for text-to-image/video
export interface AIGenerationResponse {
  success: boolean;
  result?: string; // URL, base64, or file path to image/video
  error?: string;
}

const DEFAULT_CONFIG: AIServiceConfig = {
  endpoint: 'http://localhost:11434/api/generate',
  model: 'llama2',
  timeout: 30000,
  maxTokens: 500,
};

class AIService {
  private config: AIServiceConfig;

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }


  // Update configuration at runtime
  updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Generic generate method for text-to-image/video
  async generate(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      const response = await this.callAI(request.prompt);
      // For image/video, response should be a URL, base64, or file path
      return { success: true, result: response };
    } catch (error) {
      return {
        success: false,
        error: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async callAI(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      // Support different AI service formats
      const requestBody = this.buildRequestBody(prompt);
      
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}: ${response.statusText}`);
      }

      const rawText = await response.text();
      let data;
      try {
        // Handle streaming/multi-JSON (Ollama, etc.)
        const lines = rawText.split(/\r?\n/).filter(l => l.trim());
        if (lines.length > 1) {
          // Parse each line, collect 'response' fields
          let lastObj = null;
          let responses: string[] = [];
          for (const line of lines) {
            try {
              const obj = JSON.parse(line);
              if (typeof obj.response === 'string') responses.push(obj.response);
              if (obj.done) lastObj = obj;
              else lastObj = obj;
            } catch {}
          }
          if (!lastObj) throw new Error('No valid JSON objects found in response. Raw: ' + rawText);
          // Concatenate all responses
          const fullResponse = responses.join('');
          // Attach to lastObj for extraction
          data = { ...lastObj, response: fullResponse };
        } else {
          data = JSON.parse(rawText);
        }
      } catch (jsonErr) {
        throw new Error('AI service returned invalid JSON. Raw response: ' + rawText);
      }
      return this.extractResponseText(data);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  private buildRequestBody(prompt: string): any {
    // Default: just send the prompt for text-to-image/video
    return {
      prompt,
      model: this.config.model,
      max_tokens: this.config.maxTokens || 500,
      temperature: 0.1,
    };
  }

  private extractResponseText(data: any): string {
    // For text-to-image/video, expect a URL, base64, or file path
    if (data.result) return data.result;
    if (data.response) return data.response;
    if (data.text) return data.text;
    if (typeof data === 'string') return data;
    throw new Error('Unable to extract result from AI service response');
  }




  // Test connection to AI service
  async testConnection(): Promise<{ success: boolean; error?: string; model?: string }> {
    try {
      const testPrompt = 'Respond with just the word "OK" if you can understand this message.';
      const response = await this.callAI(testPrompt);
      return {
        success: true,
        model: this.config.model,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for custom instances
export { AIService };
