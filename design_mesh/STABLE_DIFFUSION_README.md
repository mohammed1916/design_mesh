# Stable Diffusion Integration

The Stable Diffusion image generation feature has been successfully integrated into the Design Mesh application! 🎨

## 🚀 How to Use

### 1. **Start the Backend Server**
Before using the AI image generation features, make sure the Stable Diffusion backend is running:

```bash
# Navigate to the backend directory
cd backend

# Start the server
python run.py
```

The server will run on `http://localhost:5000`

### 2. **Access the AI Panel**
- Look for the **🤖 AI** button in the top-right header
- Click it to toggle the Stable Diffusion panel
- The panel will appear below the canvas area

### 3. **Generate Images**

#### **Option A: Use Pre-installed Models**
1. Click the **🤖 AI** button to open the panel
2. Select a model from the dropdown (if available)
3. Enter your prompt (e.g., "A beautiful sunset over mountains")
4. Adjust parameters as needed:
   - **Steps**: Number of generation steps (1-50)
   - **Guidance**: How closely to follow the prompt (1-20)
   - **Width/Height**: Image dimensions (256-1024px)
5. Click **"Generate Image"**

#### **Option B: Download Models**
1. In the AI panel, find the "Download Model from URL" section
2. Enter a Hugging Face model URL
3. Specify a filename (e.g., `model.safetensors`)
4. Click **"Download"**
5. Once downloaded, select it from the model dropdown

#### **Option C: Load from Custom Path**
1. Enter the full path to a `.safetensors` model file
2. Click **"Load Model"**
3. The model will be available for generation

### 4. **Manage Model Directory**
- View the current model directory path
- Click **"Change"** to set a custom directory
- All downloaded models will be saved to this location

## 📁 Default Model Locations

- **Windows**: `%APPDATA%\StableDiffusionBackend\models`
- **Linux**: `~/.local/share/stable-diffusion-backend/models`
- **Mac**: `~/Library/Application Support/stable-diffusion-backend/models`

## 🎨 Features

- ✅ **Custom Model Paths** - Load models from any directory
- ✅ **APPDATA Storage** - Automatic platform-specific storage
- ✅ **Model Downloading** - Download from Hugging Face URLs
- ✅ **Directory Management** - Change storage location at runtime
- ✅ **Parameter Control** - Adjust generation settings
- ✅ **Real-time Feedback** - Status updates during generation
- ✅ **Responsive Design** - Works on different screen sizes

## 🔧 Backend Requirements

Make sure you have the required dependencies installed:

```bash
cd backend
pip install -r requirements.txt
```

For GPU support:
```bash
pip install -r requirements-gpu.txt
```

## 🐛 Troubleshooting

### **"No connection could be made"**
- Make sure the backend server is running on port 5000
- Check that no firewall is blocking the connection

### **"No model loaded"**
- Download or load a Stable Diffusion model first
- Check that the model file exists in the specified directory

### **"CUDA out of memory"**
- Reduce image dimensions (width/height)
- Use CPU mode by installing CPU requirements
- Close other GPU-intensive applications

### **Model download fails**
- Check internet connection
- Verify the Hugging Face URL is correct
- Ensure you have sufficient disk space

## 📚 API Reference

The frontend communicates with these backend endpoints:

- `GET /models` - List available models
- `POST /download` - Download model from URL
- `POST /select` - Select active model
- `POST /generate` - Generate image
- `POST /set_model_dir` - Change model directory
- `POST /load_from_path` - Load model from custom path

## 🎯 Next Steps

1. **Download a Model**: Try downloading a small model first
2. **Generate Images**: Experiment with different prompts and settings
3. **Custom Directory**: Set up your preferred model storage location
4. **Integration**: Use generated images in your designs!

The AI image generation is now fully integrated into your Design Mesh workflow! 🚀
