# Stable Diffusion Backend

A Flask-based backend API for generating images using Stable Diffusion models with automatic model downloading and selection.

## Features

- **Text-to-Image Generation**: Generate images from text prompts using Stable Diffusion
- **Automatic Model Downloading**: Downloads models from Hugging Face if not present locally
- **Model Selection**: Choose from different Stable Diffusion models
- **Custom Model Paths**: Support for custom model directories and APPDATA storage
- **Ollama-like Endpoints**: Simple API similar to Ollama for easy integration
- **Cross-Platform**: Works on Windows, Mac, and Linux
- **Executable Packaging**: Can be packaged as standalone executables

## Quick Start

### Option 1: Run with Python

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Run the backend:
   ```bash
   python run.py
   ```

### Option 2: Run with GPU Support

```bash
pip install -r requirements-gpu.txt
python run.py
```

### Option 3: Run as Executable

1. Package the executable:

   ```bash
   chmod +x package_exe.sh
   ./package_exe.sh
   ```

2. Run the executable:
   ```bash
   ./dist/stable-diffusion-backend-<platform>
   ```

## API Endpoints

### GET /models

List available models.

**Response:**

```json
{
  "models": [
    {
      "name": "CompVis/stable-diffusion-v1-4",
      "size": "4.27GB",
      "description": "Original Stable Diffusion v1.4"
    }
  ]
}
```

### POST /download

Download a specific model.

**Request:**

```json
{
  "model": "CompVis/stable-diffusion-v1-4"
}
```

### POST /select

Select a model for generation.

**Request:**

```json
{
  "model": "CompVis/stable-diffusion-v1-4"
}
```

### POST /generate

Generate an image from a text prompt.

**Request:**

```json
{
  "prompt": "A beautiful landscape",
  "negative_prompt": "blurry, low quality",
  "num_inference_steps": 20,
  "guidance_scale": 7.5,
  "width": 512,
  "height": 512
}
```

**Response:**

```json
{
  "image": "base64_encoded_image_data",
  "model": "CompVis/stable-diffusion-v1-4",
  "prompt": "A beautiful landscape"
}
```

### POST /set_model_dir

Set a custom model directory for storing and loading models.

**Request:**

```json
{
  "directory": "/path/to/custom/model/directory"
}
```

**Response:**

```json
{
  "status": "updated",
  "model_dir": "/path/to/custom/model/directory",
  "message": "Model directory updated to /path/to/custom/model/directory"
}
```

### POST /load_from_path

Load a model from a custom file path.

**Request:**

```json
{
  "path": "/path/to/model.safetensors",
  "name": "custom-model-name"
}
```

**Response:**

```json
{
  "status": "loaded",
  "model": "custom-model-name",
  "path": "/path/to/model.safetensors"
}
```

### Updated GET /models Response

The `/models` endpoint now includes additional information:

```json
{
  "models": ["model1.safetensors", "model2.safetensors"],
  "current": "model1.safetensors",
  "model_dir": "/current/model/directory",
  "current_model_path": "/full/path/to/current/model.safetensors"
}
```

### Updated POST /download

The download endpoint now supports custom directories:

**Request:**

```json
{
  "url": "https://huggingface.co/model.safetensors",
  "filename": "model.safetensors",
  "directory": "/optional/custom/directory"
}
```

## Configuration

### Model Directory

Models are stored in the following default locations:
- **Windows**: `%APPDATA%\StableDiffusionBackend\models`
- **Linux/Mac**: `~/.local/share/stable-diffusion-backend/models`

You can override the default directory by setting the `SD_MODEL_DIR` environment variable:

```bash
export SD_MODEL_DIR="/path/to/your/models"
python run.py
```

Or use the API to change the directory at runtime.

## Platform-Specific Requirements

- **Windows**: Use `requirements-windows.txt` or `requirements-exe-windows.txt`
- **Mac**: Use `requirements-mac.txt` or `requirements-exe-mac.txt`
- **Linux**: Use `requirements-linux.txt` or `requirements-exe-linux.txt`

## Dependencies

- Flask: Web framework
- diffusers: Stable Diffusion pipeline
- torch: PyTorch for model inference
- transformers: Hugging Face transformers
- accelerate: Model acceleration
- Pillow: Image processing
- requests: HTTP client for downloads

## Troubleshooting

1. **CUDA Issues**: If you have GPU but CUDA errors occur, use CPU requirements
2. **Model Download Failures**: Check internet connection and Hugging Face access
3. **Memory Issues**: Reduce image size or use CPU mode
4. **Executable Issues**: Ensure all dependencies are included in packaging

## License

This project is for educational and research purposes.
