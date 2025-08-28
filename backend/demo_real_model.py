#!/usr/bin/env python3
"""
Demo script showing how to download and use a real Stable Diffusion model
"""

import requests
import json
import base64
from PIL import Image
import io

def download_real_model():
    """Download a real Stable Diffusion model for testing"""
    base_url = "http://localhost:5000"

    print("Downloading Stable Diffusion v1.4 model...")
    print("Note: This is a large download (~4GB) and may take several minutes")

    # Download the model
    response = requests.post(f"{base_url}/download",
                           json={
                               "url": "https://huggingface.co/CompVis/stable-diffusion-v1-4/resolve/main/v1-4.ckpt",
                               "filename": "v1-4.ckpt"
                           })

    if response.status_code == 200:
        result = response.json()
        print(f"✓ Model downloaded successfully: {result['path']}")
        return True
    else:
        print(f"✗ Download failed: {response.text}")
        return False

def test_model_loading():
    """Test loading and using the downloaded model"""
    base_url = "http://localhost:5000"

    print("\nTesting model selection...")
    response = requests.post(f"{base_url}/select",
                           json={"model": "v1-4.ckpt"})

    if response.status_code == 200:
        result = response.json()
        print(f"✓ Model loaded: {result['model']}")
        return True
    else:
        print(f"✗ Model loading failed: {response.text}")
        return False

def generate_test_image():
    """Generate a test image using the loaded model"""
    base_url = "http://localhost:5000"

    print("\nGenerating test image...")
    response = requests.post(f"{base_url}/generate",
                           json={
                               "prompt": "A beautiful sunset over mountains",
                               "num_inference_steps": 20,
                               "guidance_scale": 7.5,
                               "width": 512,
                               "height": 512
                           })

    if response.status_code == 200:
        result = response.json()
        print("✓ Image generated successfully!")

        # Save the image
        image_data = base64.b64decode(result['image'])
        image = Image.open(io.BytesIO(image_data))
        image.save("generated_sunset.png")
        print("✓ Image saved as 'generated_sunset.png'")
        return True
    else:
        print(f"✗ Image generation failed: {response.text}")
        return False

def main():
    """Run the complete demo"""
    print("Stable Diffusion Backend - Real Model Demo")
    print("=" * 50)

    # Check if server is running
    try:
        response = requests.get("http://localhost:5000/models")
    except:
        print("❌ Backend server is not running!")
        print("Please start the server first with: python run.py")
        return

    print("✅ Backend server is running")

    # Ask user if they want to download the large model
    print("\n⚠️  WARNING: This will download a ~4GB model file")
    choice = input("Do you want to continue? (y/N): ").lower().strip()

    if choice != 'y':
        print("Demo cancelled. You can run the basic tests with: python test_backend.py")
        return

    # Run the demo
    if download_real_model():
        if test_model_loading():
            generate_test_image()

    print("\n" + "=" * 50)
    print("Demo completed!")

if __name__ == "__main__":
    main()
