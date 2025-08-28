import React, { useState, useEffect } from 'react';
import { UnsplashImageGallery } from './UnsplashImageGallery';
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
  const [serviceType, setServiceType] = useState<'ollama' | 'lmstudio' | 'advanced'>('ollama');
  const [endpoint, setEndpoint] = useState('http://localhost:11434/api/generate');
  const [model, setModel] = useState('llama2');
  const [apiKey, setApiKey] = useState('');

  // Update endpoint when serviceType changes
  useEffect(() => {
    if (serviceType === 'ollama') {
      setEndpoint('http://localhost:11434/api/generate');
    } else if (serviceType === 'lmstudio') {
      setEndpoint('http://localhost:1234/v1/chat/completions');
    }
    // Advanced: keep current endpoint
  }, [serviceType]);

  const [reasoning, setReasoning] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [showUnsplash, setShowUnsplash] = useState(false);

  const aiShape = useAIShape({
    onGenerated: (res) => {
      setResult(res);
      setReasoning('');
      onShapeGenerated?.();
    },
    onError: (error) => {
      console.error('AI Generation Error:', error);
    }
  });

  // Safe property access with defaults
  const isConnected = aiShape?.isConnected ?? false;
  const isGenerating = aiShape?.isGenerating ?? false;
  const connectionStatus = aiShape?.connectionStatus ?? 'disconnected';
  const lastError = aiShape?.lastError ?? null;

  // Test connection on component mount if not connected
  useEffect(() => {
    if (!isConnected && connectionStatus === 'disconnected') {
      aiShape?.testConnection?.();
    }
  }, [isConnected, connectionStatus, aiShape]);

  const handleConfigUpdate = () => {
    if (aiShape?.updateAIConfig) {
      aiShape.updateAIConfig({
        endpoint,
        model,
        ...(apiKey && { apiKey }),
      });
      aiShape.testConnection?.();
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !aiShape?.generate) return;

    try {
      const response = await aiShape.generate(prompt);
      if (response?.success && response.result) {
        setResult(response.result);
        setPrompt('');
      }
      setShowUnsplash(true); // Show Unsplash images for the prompt
    } catch (error) {
      console.error('Generation error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
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
            className={`status-indicator status-${connectionStatus}`}
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
                <label>Service Type:</label>
                <select
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value as any)}
                  title="Select AI service type"
                >
                  <option value="ollama">Ollama (Local)</option>
                  <option value="lmstudio">LM Studio</option>
                  <option value="advanced">Advanced (Custom Endpoint)</option>
                </select>
              </div>
              <div className="config-field">
                <label>Endpoint:</label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder={serviceType === 'ollama' ? 'http://localhost:11434/api/generate' : serviceType === 'lmstudio' ? 'http://localhost:1234/v1/chat/completions' : 'Enter your API endpoint'}
                  disabled={serviceType !== 'advanced'}
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
            placeholder="Describe what you want to generate (image, video, etc)...&#10;Examples:&#10;• 'Generate a photo of a cat in a field'&#10;• 'Create a video of a rocket launch'&#10;• 'Make an abstract painting with blue and yellow'"
            rows={3}
            disabled={!isConnected}
          />
          <Button
            size="m"
            onClick={handleGenerate}
            disabled={!isConnected || !prompt.trim() || isGenerating}
          >
            {isGenerating ? '⏳ Generating...' : '✨ Generate'}
          </Button>
        </div>

        {lastError && (
          <div className="ai-error">
            <span>❌ {lastError}</span>
          </div>
        )}

        {result && (
          <div className="ai-reasoning">
            <strong>AI Result:</strong>
            {/* If result is an image URL/base64, show image. If video, show video. Otherwise, show as text. */}
            {result.match(/^data:image|^https?:\/\//) ? (
              <img src={result} alt="AI Generated" className="ai-result-media" />
            ) : result.match(/^data:video|\.mp4$/) ? (
              <video src={result} controls className="ai-result-media" />
            ) : (
              <p>{result}</p>
            )}
          </div>
        )}

        {showUnsplash && prompt.trim() && (
          <div className="unsplash-container">
            <h4>Related Unsplash Images:</h4>
            <UnsplashImageGallery query={prompt} />
          </div>
        )}
      </div>

      <div className="ai-examples">
        <h4>Example Prompts:</h4>
        <div className="example-tags">
          {[
            "Generate a photo of a cat in a field",
            "Create a video of a rocket launch",
            "Make an abstract painting with blue and yellow",
            "Generate a landscape image with mountains and lake",
            "Create a cartoon character holding a balloon"
          ].map((example, index) => (
            <button
              key={index}
              className="example-tag"
              onClick={() => setPrompt(example)}
              disabled={!isConnected}
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
