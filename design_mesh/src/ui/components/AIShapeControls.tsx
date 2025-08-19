import React, { useState, useEffect } from 'react';
import { Button } from "@swc-react/button";
import { useAIShape } from '../hooks/useAIShape';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/appStore';
import './AIShapeControls.css';

interface AIShapeControlsProps {
  onShapeGenerated?: () => void;
}

const AIShapeControls: React.FC<AIShapeControlsProps> = ({ onShapeGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [endpoint, setEndpoint] = useState('http://localhost:11434/api/generate');
  const [model, setModel] = useState('llama2');
  const [apiKey, setApiKey] = useState('');
  const [reasoning, setReasoning] = useState('');

  // Get existing shapes for context
  const symbols = useSelector((state: RootState) => state.app.symbols);
  
  const aiShape = useAIShape({
    onShapeGenerated: (shape) => {
      console.log('AI generated shape:', shape);
      setReasoning('');
      onShapeGenerated?.();
    },
    onError: (error) => {
      console.error('AI Shape Error:', error);
    }
  });

  // Test connection on component mount if not connected
  useEffect(() => {
    if (!aiShape.isConnected && aiShape.connectionStatus === 'disconnected') {
      aiShape.testConnection();
    }
  }, []);

  const handleConfigUpdate = () => {
    aiShape.updateAIConfig({
      endpoint,
      model,
      ...(apiKey && { apiKey }),
    });
    aiShape.testConnection();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    // Provide context about existing shapes
    const context = {
      existingShapes: symbols
        .filter(s => s.type !== 'historyIcon')
        .map(s => ({
          type: s.type,
          properties: {
            x: s.x,
            y: s.y,
            width: s.width,
            height: s.height,
          }
        })),
      canvasSize: { width: 800, height: 600 },
    };

    const result = await aiShape.generateShape(prompt, context);
    if (result.success && result.reasoning) {
      setReasoning(result.reasoning);
    }
    
    // Clear prompt after successful generation
    if (result.success) {
      setPrompt('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const getStatusText = () => {
    switch (aiShape.connectionStatus) {
      case 'connected': return `Connected (${model})`;
      case 'testing': return 'Testing...';
      case 'error': return 'Connection Error';
      default: return 'Not Connected';
    }
  };

  return (
    <div className="ai-shape-controls">
      <div className="ai-header">
        <h3>AI Shape Assistant</h3>
        <div className="ai-status">
          <div 
            className={`status-indicator status-${aiShape.connectionStatus}`}
          />
          <span className="status-text">{getStatusText()}</span>
          <button 
            className="config-button"
            onClick={() => setShowConfig(!showConfig)}
            title="Configure AI Service"
          >
            ⚙️
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="ai-config">
          <div className="config-section">
            <h4>AI Service Configuration</h4>
            <div className="config-grid">
              <div className="config-field">
                <label>Endpoint:</label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="http://localhost:11434/api/generate"
                />
              </div>
              <div className="config-field">
                <label>Model:</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="llama2, llama3, codellama..."
                />
              </div>
              <div className="config-field">
                <label>API Key (optional):</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="For services that require authentication"
                />
              </div>
            </div>
            <div className="config-actions">
              <Button size="s" variant="secondary" onClick={handleConfigUpdate}>
                Update & Test Connection
              </Button>
            </div>
          </div>
          
          <div className="config-help">
            <h5>Quick Setup:</h5>
            <ul>
              <li><strong>Ollama (Local):</strong> Install Ollama, run <code>ollama run llama2</code></li>
              <li><strong>LM Studio:</strong> Use <code>http://localhost:1234/v1/chat/completions</code></li>
              <li><strong>OpenAI:</strong> Use <code>https://api.openai.com/v1/chat/completions</code></li>
            </ul>
          </div>
        </div>
      )}

      <div className="ai-input-section">
        <div className="prompt-container">
          <textarea
            className="ai-prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the shape you want to create or modify...&#10;Examples:&#10;• 'Create a blue rectangle in the center'&#10;• 'Add a red circle in the top-right corner'&#10;• 'Make a green triangle that fits below existing shapes'"
            rows={3}
            disabled={!aiShape.isConnected}
          />
          <Button 
            size="m"
            onClick={handleGenerate}
            disabled={!aiShape.isConnected || !prompt.trim() || aiShape.isGenerating}
          >
            {aiShape.isGenerating ? '⏳ Generating...' : '✨ Generate Shape'}
          </Button>
        </div>

        {aiShape.lastError && (
          <div className="ai-error">
            <span>❌ {aiShape.lastError}</span>
          </div>
        )}

        {reasoning && (
          <div className="ai-reasoning">
            <strong>AI Reasoning:</strong>
            <p>{reasoning}</p>
          </div>
        )}
      </div>

      <div className="ai-examples">
        <h4>Example Prompts:</h4>
        <div className="example-tags">
          {[
            "Create a blue square in the center",
            "Add a red circle in the top-left",
            "Make a green triangle below other shapes",
            "Create a yellow rectangle twice as wide as it is tall",
            "Add a purple circle that doesn't overlap existing shapes"
          ].map((example, index) => (
            <button
              key={index}
              className="example-tag"
              onClick={() => setPrompt(example)}
              disabled={!aiShape.isConnected}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIShapeControls;
