import os
import glob
import platform
from flask import Flask, request, send_file, jsonify
from diffusers.pipelines.stable_diffusion.pipeline_stable_diffusion import StableDiffusionPipeline
import torch
import requests
from PIL import Image

def get_default_model_dir():
    """Get the default model directory based on the platform"""
    if platform.system() == "Windows":
        appdata = os.environ.get('APPDATA', os.path.expanduser('~'))
        return os.path.join(appdata, 'StableDiffusionBackend', 'models')
    else:
        # For Linux/Mac, use ~/.local/share
        home = os.path.expanduser('~')
        return os.path.join(home, '.local', 'share', 'stable-diffusion-backend', 'models')

MODEL_DIR = os.environ.get('SD_MODEL_DIR', get_default_model_dir())
os.makedirs(MODEL_DIR, exist_ok=True)

app = Flask(__name__)
pipe = None
current_model = None
current_model_path = None

def list_models():
    """List all available models in the current model directory"""
    return [os.path.basename(f) for f in glob.glob(f"{MODEL_DIR}/*.safetensors")]

def download_model(url, filename, model_dir=None):
    """Download a model from URL to specified directory"""
    if model_dir is None:
        model_dir = MODEL_DIR
    local_path = os.path.join(model_dir, filename)
    if not os.path.exists(local_path):
        print(f"Downloading model from {url}...")
        r = requests.get(url, stream=True)
        with open(local_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return local_path

def load_model(model_name, model_path=None):
    """Load a model from the specified path or model directory"""
    global pipe, current_model, current_model_path

    if model_path:
        # Load from custom path
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model path {model_path} not found.")
        full_model_path = model_path
    else:
        # Load from model directory
        full_model_path = os.path.join(MODEL_DIR, model_name)
        if not os.path.exists(full_model_path):
            raise FileNotFoundError(f"Model {model_name} not found in {MODEL_DIR}.")

    pipe = StableDiffusionPipeline.from_single_file(
        full_model_path,
        torch_dtype=torch.float16,
        use_safetensors=True
    ).to("cuda")
    current_model = model_name
    current_model_path = full_model_path

@app.route('/models', methods=['GET'])
def models():
    """Get list of available models and current model directory info"""
    return jsonify({
        "models": list_models(),
        "current": current_model,
        "model_dir": MODEL_DIR,
        "current_model_path": current_model_path
    })

@app.route('/set_model_dir', methods=['POST'])
def set_model_dir():
    """Set a custom model directory"""
    global MODEL_DIR
    data = request.get_json()
    new_dir = data.get("directory")

    if not new_dir:
        return jsonify({"error": "No directory provided"}), 400

    # Create directory if it doesn't exist
    os.makedirs(new_dir, exist_ok=True)
    MODEL_DIR = new_dir

    return jsonify({
        "status": "updated",
        "model_dir": MODEL_DIR,
        "message": f"Model directory updated to {MODEL_DIR}"
    })

@app.route('/download', methods=['POST'])
def download():
    """Download a model from URL to the current model directory"""
    data = request.get_json()
    url = data.get("url")
    filename = data.get("filename")
    custom_dir = data.get("directory")  # Optional custom directory

    if not url or not filename:
        return jsonify({"error": "Missing url or filename"}), 400

    try:
        local_path = download_model(url, filename, custom_dir)
        return jsonify({
            "status": "downloaded",
            "path": local_path,
            "directory": custom_dir or MODEL_DIR
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/select', methods=['POST'])
def select():
    """Select and load a model from the current model directory"""
    data = request.get_json()
    model_name = data.get("model")
    try:
        load_model(model_name)
        return jsonify({"status": "loaded", "model": model_name})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/load_from_path', methods=['POST'])
def load_from_path():
    """Load a model from a custom file path"""
    data = request.get_json()
    model_path = data.get("path")
    model_name = data.get("name", os.path.basename(model_path))

    if not model_path:
        return jsonify({"error": "No model path provided"}), 400

    try:
        load_model(model_name, model_path)
        return jsonify({
            "status": "loaded",
            "model": model_name,
            "path": model_path
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/generate', methods=['POST'])
def generate():
    if pipe is None:
        return jsonify({"error": "No model loaded"}), 400
    data = request.get_json()
    prompt = data.get('prompt', '')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400
    
    image_path = 'output.png'
    result = pipe(prompt)
    if isinstance(result, tuple):
        image = result[0]
    else:
        image = result
    
    # Convert to PIL Image
    try:
        if hasattr(image, 'save'):
            # Already PIL Image
            pass
        elif hasattr(image, 'cpu'):
            # PyTorch tensor
            image = image.cpu().numpy()  # type: ignore
            image = Image.fromarray(image.astype('uint8'))  # type: ignore
        else:
            # Numpy array
            image = Image.fromarray(image.astype('uint8'))  # type: ignore
    except Exception as e:
        # Fallback: try to convert directly
        image = Image.fromarray(image)  # type: ignore
    
    image.save(image_path)  # type: ignore
    return send_file(image_path, mimetype='image/png')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)