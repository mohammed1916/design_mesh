## About

This project has been created with _@adobe/create-ccweb-add-on_. As an example, this Add-on demonstrates how to get started with Add-on development using React and TypeScript with Document Sandbox Runtime.

## Features

### 🎨 Design Tools

- Shape creation and manipulation
- SVG conversion and editing
- Canvas-based design interface
- Inventory management system
- Theme switching (Light/Dark/Acrylic)

### 🤖 AI Image Generation

- **Stable Diffusion Integration**: Generate images using AI
- **Custom Model Support**: Load models from any directory
- **APPDATA Storage**: Platform-specific automatic storage
- **Model Downloading**: Download from Hugging Face URLs
- **Real-time Generation**: Interactive parameter control

## Tools

- HTML
- CSS
- React
- TypeScript
- Stable Diffusion Backend (Python/Flask)

## Setup

1. To install the dependencies, run `npm install`.
2. To build the application, run `npm run build`.
3. To start the application, run `npm run start`.

### 🚀 AI Backend Setup

To use the AI image generation features:

1. **Install Python Dependencies**:

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start the Backend Server**:

   ```bash
   cd backend
   python run.py
   ```

3. **Access AI Features**:
   - Open the Design Mesh application
   - Click the **🤖 AI** button in the header
   - The Stable Diffusion panel will appear

## Usage

### Basic Design Workflow

1. Use shape controls to create and modify design elements
2. Add items to inventory for reuse
3. Convert designs to SVG format
4. Export or save your work

### AI Image Generation

1. Ensure the backend server is running (`python run.py`)
2. Click the **🤖 AI** button to open the AI panel
3. Select or download a Stable Diffusion model
4. Enter a text prompt and adjust parameters
5. Click **"Generate Image"** to create AI images

## Project Structure

```
design_mesh/
├── src/
│   ├── ui/
│   │   ├── components/
│   │   │   ├── App.tsx                 # Main application component
│   │   │   ├── StableDiffusionPanel.tsx # AI image generation panel
│   │   │   ├── ShapeControls.tsx       # Shape manipulation tools
│   │   │   ├── CanvasSection.tsx       # Design canvas
│   │   │   └── ...
│   │   ├── store/
│   │   │   └── appStore.ts            # Redux state management
│   │   └── styles/
│   │       └── themes.css             # Theme definitions
│   └── models/
│       └── DocumentSandboxApi.ts      # Adobe API integration
├── backend/                           # Python Stable Diffusion server
│   ├── run.py                        # Flask backend server
│   ├── test_backend.py               # API testing script
│   └── requirements.txt              # Python dependencies
└── README.md
```

## API Integration

The application integrates with Adobe's Creative Cloud APIs through the Document Sandbox Runtime, allowing seamless interaction with design documents and assets.

## Development

### Adding New Features

- Components are located in `src/ui/components/`
- State management uses Redux (see `src/ui/store/`)
- Styling follows Adobe Spectrum design system
- Backend API endpoints are documented in `backend/README.md`

### AI Integration

- Backend server runs on `http://localhost:5000`
- Models are stored in platform-specific directories
- API supports custom model paths and directories
- Real-time parameter adjustment and generation

## License

This project is for educational and research purposes.
