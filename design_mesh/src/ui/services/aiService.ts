// AI Service for shape generation and modification
// Supports configurable endpoints with LLaMA as default

export interface AIServiceConfig {
  endpoint: string;
  model?: string;
  apiKey?: string;
  timeout?: number;
  maxTokens?: number;
}

export interface ShapeGenerationRequest {
  prompt: string;
  shapeType?: 'rect' | 'circle' | 'polygon';
  context?: {
    existingShapes?: Array<{
      type: string;
      properties: Record<string, any>;
    }>;
    canvasSize?: { width: number; height: number };
  };
}

export interface ShapeModificationRequest {
  prompt: string;
  targetShape: {
    type: 'rect' | 'circle' | 'polygon';
    properties: Record<string, any>;
  };
}

export interface AIShapeResponse {
  success: boolean;
  shape?: {
    type: 'rect' | 'circle' | 'polygon';
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    cornerRadius?: number; // For rectangles
    // Polygon-specific properties
    points?: string;
  };
  reasoning?: string;
  error?: string;
}

// Default LLaMA configuration
const DEFAULT_CONFIG: AIServiceConfig = {
  endpoint: 'http://localhost:11434/api/generate', // Ollama default
  model: 'llama2', // or llama3, codellama, etc.
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

  // Generate a new shape based on prompt
  async generateShape(request: ShapeGenerationRequest): Promise<AIShapeResponse> {
    try {
      const prompt = this.buildGenerationPrompt(request);
      const response = await this.callAI(prompt);
      return this.parseShapeResponse(response, 'generation');
    } catch (error) {
      return {
        success: false,
        error: `Shape generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Modify existing shape based on prompt
  async modifyShape(request: ShapeModificationRequest): Promise<AIShapeResponse> {
    try {
      const prompt = this.buildModificationPrompt(request);
      const response = await this.callAI(prompt);
      return this.parseShapeResponse(response, 'modification', request.targetShape);
    } catch (error) {
      return {
        success: false,
        error: `Shape modification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private buildGenerationPrompt(request: ShapeGenerationRequest): string {
    let prompt = `You are a helpful assistant that creates shapes for a design canvas. 

User request: "${request.prompt}"

Please create a shape based on this request. Consider the following:
- Available shape types: rectangle (rect), circle, polygon
- Canvas coordinates start at top-left (0,0)
- Typical canvas size is 800x600 pixels
- Use appropriate colors and sizes
- Provide reasoning for your choices

`;

    if (request.context?.canvasSize) {
      prompt += `Canvas size: ${request.context.canvasSize.width}x${request.context.canvasSize.height}\n`;
    }

    if (request.context?.existingShapes?.length) {
      prompt += `Existing shapes on canvas: ${JSON.stringify(request.context.existingShapes, null, 2)}\n`;
    }

    prompt += `
Respond with a JSON object in this exact format:
{
  "shape": {
    "type": "rect|circle|polygon",
    "x": number,
    "y": number,
    "width": number,
    "height": number,
    "fill": "#hexcolor",
    "stroke": "#hexcolor",
    "strokeWidth": number,
    "cornerRadius": number (only for rect),
    "points": "x1,y1 x2,y2 ..." (only for polygon)
  },
  "reasoning": "explanation of your choices"
}

Only respond with valid JSON, no other text.`;

    return prompt;
  }

  private buildModificationPrompt(request: ShapeModificationRequest): string {
    const prompt = `You are a helpful assistant that modifies shapes for a design canvas.

Current shape: ${JSON.stringify(request.targetShape, null, 2)}

User request: "${request.prompt}"

Please modify the shape based on this request. You can change:
- Position (x, y)
- Size (width, height)
- Colors (fill, stroke)
- Style properties (strokeWidth, cornerRadius for rectangles)
- Shape type (if the request implies a different shape)

Respond with a JSON object in this exact format:
{
  "shape": {
    "type": "rect|circle|polygon",
    "x": number,
    "y": number,
    "width": number,
    "height": number,
    "fill": "#hexcolor",
    "stroke": "#hexcolor",
    "strokeWidth": number,
    "cornerRadius": number (only for rect),
    "points": "x1,y1 x2,y2 ..." (only for polygon)
  },
  "reasoning": "explanation of your changes"
}

Only respond with valid JSON, no other text.`;

    return prompt;
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

      const data = await response.json();
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
    // Ollama/LLaMA format (default)
    if (this.config.endpoint.includes('ollama') || this.config.endpoint.includes('11434')) {
      return {
        model: this.config.model || 'llama2',
        prompt,
        stream: false,
        options: {
          num_predict: this.config.maxTokens || 500,
          temperature: 0.1, // Low temperature for consistent JSON output
        }
      };
    }

    // OpenAI-compatible format
    if (this.config.endpoint.includes('openai') || this.config.endpoint.includes('chat/completions')) {
      return {
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that creates and modifies shapes for design canvases.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.config.maxTokens || 500,
        temperature: 0.1,
      };
    }

    // Generic format - adjust as needed
    return {
      prompt,
      max_tokens: this.config.maxTokens || 500,
      temperature: 0.1,
    };
  }

  private extractResponseText(data: any): string {
    // Ollama format
    if (data.response) {
      return data.response;
    }

    // OpenAI format
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    // Generic format
    if (data.text) {
      return data.text;
    }

    if (typeof data === 'string') {
      return data;
    }

    throw new Error('Unable to extract response text from AI service response');
  }

  private parseShapeResponse(response: string, operation: 'generation' | 'modification', originalShape?: any): AIShapeResponse {
    try {
      // Remove markdown/code block wrappers
      let clean = response.trim();
      if (clean.startsWith('```json')) clean = clean.replace(/^```json/, '');
      if (clean.startsWith('```')) clean = clean.replace(/^```/, '');
      if (clean.endsWith('```')) clean = clean.replace(/```$/, '');
      // Find first and last curly braces for JSON
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error('No valid JSON found in AI response');
      }
      const jsonStr = clean.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonStr);
      if (!parsed.shape) {
        throw new Error('AI response missing shape data');
      }
      const shape = parsed.shape;
      // Validate required properties
      if (!shape.type || !['rect', 'circle', 'polygon'].includes(shape.type)) {
        throw new Error('Invalid or missing shape type');
      }
      // Ensure numeric properties
      const numericFields = ['x', 'y', 'width', 'height'];
      for (const field of numericFields) {
        if (typeof shape[field] !== 'number' || isNaN(shape[field])) {
          throw new Error(`Invalid ${field} value`);
        }
      }

      // Set defaults for optional properties
      shape.fill = shape.fill || '#3b82f6';
      shape.stroke = shape.stroke || '#1e40af';
      shape.strokeWidth = shape.strokeWidth || 2;

      // Validate colors
      if (!this.isValidColor(shape.fill) || !this.isValidColor(shape.stroke)) {
        throw new Error('Invalid color format');
      }

      return {
        success: true,
        shape: shape,
        reasoning: parsed.reasoning || `Shape ${operation} completed successfully`
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`
      };
    }
  }

  private isValidColor(color: string): boolean {
    // Check for hex colors (#rgb, #rrggbb, #rgba, #rrggbbaa)
    const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}([0-9A-Fa-f]{2})?$/;
    if (hexRegex.test(color)) return true;

    // Check for named colors (basic set)
    const namedColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey'];
    if (namedColors.includes(color.toLowerCase())) return true;

    // Check for rgb/rgba
    const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/;
    return rgbRegex.test(color);
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
