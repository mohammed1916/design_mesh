import React, { useState, useEffect } from 'react';
import './StableDiffusionPanel.css';

interface Model {
  name: string;
  size?: string;
  description?: string;
}

interface StableDiffusionPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const StableDiffusionPanel: React.FC<StableDiffusionPanelProps> = ({ isOpen, onToggle }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [currentModelDir, setCurrentModelDir] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [customModelPath, setCustomModelPath] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [steps, setSteps] = useState<number>(20);
  const [guidance, setGuidance] = useState<number>(7.5);
  const [width, setWidth] = useState<number>(512);
  const [height, setHeight] = useState<number>(512);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const API_BASE = 'http://localhost:5000';

  const loadModels = async () => {
    try {
      setStatus({ message: 'Loading models...', type: 'info' });
      const response = await fetch(`${API_BASE}/models`);
      const data = await response.json();

      setModels(data.models.map((model: string) => ({ name: model })));
      setCurrentModelDir(data.model_dir || 'Not set');
      setStatus({ message: 'Models loaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error loading models:', error);
      setStatus({ message: `Error loading models: ${error}`, type: 'error' });
    }
  };

  const changeModelDir = async () => {
    const newDir = window.prompt('Enter new model directory path:');
    if (!newDir) return;

    try {
      setStatus({ message: 'Updating model directory...', type: 'info' });
      const response = await fetch(`${API_BASE}/set_model_dir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: newDir })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update directory');
      }

      const result = await response.json();
      setCurrentModelDir(result.model_dir);
      setStatus({ message: result.message, type: 'success' });
      loadModels();
    } catch (error) {
      console.error('Error updating directory:', error);
      setStatus({ message: `Error updating directory: ${error}`, type: 'error' });
    }
  };

  const loadModelFromPath = async () => {
    if (!customModelPath.trim()) {
      setStatus({ message: 'Please enter a model path.', type: 'error' });
      return;
    }

    try {
      setStatus({ message: 'Loading model from path...', type: 'info' });
      const response = await fetch(`${API_BASE}/load_from_path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: customModelPath,
          name: customModelPath.split('/').pop() || customModelPath.split('\\').pop()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load model');
      }

      const result = await response.json();
      setStatus({ message: `Model loaded successfully: ${result.model}`, type: 'success' });
    } catch (error) {
      console.error('Error loading model:', error);
      setStatus({ message: `Error loading model: ${error}`, type: 'error' });
    }
  };

  const downloadModel = async () => {
    if (!downloadUrl.trim() || !downloadFilename.trim()) {
      setStatus({ message: 'Please enter both URL and filename.', type: 'error' });
      return;
    }

    try {
      setStatus({ message: 'Downloading model...', type: 'info' });
      const response = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: downloadUrl,
          filename: downloadFilename
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const result = await response.json();
      setStatus({ message: `Model downloaded successfully to: ${result.path}`, type: 'success' });
      loadModels();
    } catch (error) {
      console.error('Error downloading model:', error);
      setStatus({ message: `Error downloading model: ${error}`, type: 'error' });
    }
  };

  const selectModel = async (modelName: string) => {
    try {
      const response = await fetch(`${API_BASE}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      });

      if (!response.ok) {
        throw new Error('Failed to select model');
      }

      return await response.json();
    } catch (error) {
      console.error('Error selecting model:', error);
      throw error;
    }
  };

  const generateImage = async () => {
    if (!selectedModel) {
      setStatus({ message: 'Please select a model first.', type: 'error' });
      return;
    }

    if (!prompt.trim()) {
      setStatus({ message: 'Please enter a prompt.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // First select the model
      setStatus({ message: 'Selecting model...', type: 'info' });
      await selectModel(selectedModel);

      // Then generate the image
      setStatus({ message: 'Generating image...', type: 'info' });
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          negative_prompt: negativePrompt || undefined,
          num_inference_steps: steps,
          guidance_scale: guidance,
          width: width,
          height: height
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const result = await response.json();
      setGeneratedImage(`data:image/png;base64,${result.image}`);
      setStatus({ message: 'Image generated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error generating image:', error);
      setStatus({ message: `Error: ${error}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
  }, [isOpen]);

  return (
    <div className={`stable-diffusion-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="panel-header" onClick={onToggle}>
        <h3>AI Image Generation</h3>
        <button className="toggle-btn">
          {isOpen ? '▼' : '▶'}
        </button>
      </div>

      {isOpen && (
        <div className="panel-content">
          {/* Model Selection */}
          <div className="form-group">
            <label htmlFor="modelSelect">Available Models:</label>
            <select
              id="modelSelect"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              title="Select a Stable Diffusion model"
            >
              <option value="">Select a model...</option>
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            <button onClick={loadModels} className="refresh-btn">
              Refresh
            </button>
          </div>

          {/* Current Directory */}
          <div className="form-group">
            <label>Current Model Directory:</label>
            <div className="directory-controls">
              <input
                type="text"
                value={currentModelDir}
                readOnly
                placeholder="Current model directory"
                title="Current model directory path"
              />
              <button onClick={changeModelDir}>Change</button>
            </div>
          </div>

          {/* Custom Model Path */}
          <div className="form-group">
            <label>Load Model from Custom Path:</label>
            <div className="directory-controls">
              <input
                type="text"
                value={customModelPath}
                onChange={(e) => setCustomModelPath(e.target.value)}
                placeholder="Enter full path to .safetensors file"
                title="Full path to Stable Diffusion model file"
              />
              <button onClick={loadModelFromPath}>Load</button>
            </div>
          </div>

          {/* Download Model */}
          <div className="form-group">
            <label>Download Model from URL:</label>
            <input
              type="text"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://huggingface.co/model.safetensors"
              title="URL to download Stable Diffusion model from"
            />
          </div>

          <div className="form-group">
            <label>Download Filename:</label>
            <div className="directory-controls">
              <input
                type="text"
                value={downloadFilename}
                onChange={(e) => setDownloadFilename(e.target.value)}
                placeholder="model.safetensors"
                title="Filename to save the downloaded model as"
              />
              <button onClick={downloadModel}>Download</button>
            </div>
          </div>

          {/* Generation Parameters */}
          <div className="form-group">
            <label>Prompt:</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Negative Prompt (optional):</label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="What you don't want in the image..."
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Steps:</label>
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(parseInt(e.target.value))}
                min="1"
                max="50"
                title="Number of inference steps (1-50)"
              />
            </div>

            <div className="form-group">
              <label>Guidance:</label>
              <input
                type="number"
                value={guidance}
                onChange={(e) => setGuidance(parseFloat(e.target.value))}
                min="1"
                max="20"
                step="0.5"
                title="Guidance scale for prompt adherence (1-20)"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Width:</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                min="256"
                max="1024"
                step="64"
                title="Image width in pixels (256-1024)"
              />
            </div>

            <div className="form-group">
              <label>Height:</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value))}
                min="256"
                max="1024"
                step="64"
                title="Image height in pixels (256-1024)"
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateImage}
            disabled={isLoading}
            className="generate-btn"
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>

          {/* Status */}
          {status && (
            <div className={`status ${status.type}`}>
              {status.message}
            </div>
          )}

          {/* Generated Image */}
          {generatedImage && (
            <div className="image-container">
              <h4>Generated Image:</h4>
              <img src={generatedImage} alt="Generated" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StableDiffusionPanel;
