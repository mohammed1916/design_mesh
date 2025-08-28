#!/usr/bin/env python3
"""
Test script for Stable Diffusion Backend
Tests all API endpoints to ensure they work correctly.

Expected Results:
- Test 1 (GET /models): Should always work, shows available models and current directory
- Test 2 (POST /download): Should work, downloads a small test file
- Test 3 (POST /select): May fail if no models are downloaded yet
- Test 4 (POST /generate): Will fail if no model is loaded
- Test 5 (POST /set_model_dir): Should work, changes model directory
- Test 6 (POST /load_from_path): Will fail with invalid path (expected)
- Test 7 (POST /download custom dir): Should work, downloads to temp directory

Make sure the backend server is running on localhost:5000 before running this script.
"""

import requests
import json
import base64
import time
from PIL import Image
import io
import tempfile
import os

def test_backend():
    base_url = "http://localhost:5000"

    print("Testing Stable Diffusion Backend")
    print("=" * 40)

    # Test 1: Get models
    print("\n1. Testing GET /models")
    try:
        response = requests.get(f"{base_url}/models")
        if response.status_code == 200:
            models = response.json()
            print(f"✓ Found {len(models['models'])} models")
            for model in models['models']:
                print(f"  - {model['name']}: {model['description']}")
        else:
            print(f"✗ Failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Test 2: Download model
    print("\n2. Testing POST /download")
    try:
        # Test with a small file first (preprocessor config is small and safe to download)
        response = requests.post(f"{base_url}/download",
                               json={
                                   "url": "https://huggingface.co/CompVis/stable-diffusion-v1-4/resolve/main/feature_extractor/preprocessor_config.json",
                                   "filename": "test_config.json"
                               })
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Download result: {result}")
        else:
            print(f"✗ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Wait for download to complete
    print("Waiting for model download...")
    time.sleep(10)

    # Test 3: Select model
    print("\n3. Testing POST /select")
    try:
        # Note: This will fail if no models are available in the model directory
        response = requests.post(f"{base_url}/select",
                               json={"model": "nonexistent_model.safetensors"})
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Model selected: {result}")
        else:
            print(f"✗ Failed: {response.status_code} - {response.text}")
            print("  Note: This is expected if no models are downloaded yet")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Test 4: Generate image
    print("\n4. Testing POST /generate")
    try:
        response = requests.post(f"{base_url}/generate",
                               json={
                                   "prompt": "A simple test image of a cat",
                                   "num_inference_steps": 5,
                                   "guidance_scale": 7.5,
                                   "width": 256,
                                   "height": 256
                               })
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Image generated successfully")
            print(f"  Model: {result['model']}")
            print(f"  Prompt: {result['prompt']}")

            # Save the image
            image_data = base64.b64decode(result['image'])
            image = Image.open(io.BytesIO(image_data))
            image.save("test_generated_image.png")
            print("  ✓ Image saved as test_generated_image.png")
        else:
            print(f"✗ Failed: {response.status_code} - {response.text}")
            print("  Note: This is expected if no model is loaded")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Test 5: Set custom model directory
    print("\n5. Testing POST /set_model_dir")
    try:
        temp_dir = tempfile.mkdtemp()
        response = requests.post(f"{base_url}/set_model_dir",
                               json={"directory": temp_dir})
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Model directory updated: {result['model_dir']}")
        else:
            print(f"✗ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Test 6: Load model from custom path
    print("\n6. Testing POST /load_from_path")
    try:
        # This will fail if the path doesn't exist, but tests the endpoint
        response = requests.post(f"{base_url}/load_from_path",
                               json={
                                   "path": "/nonexistent/path/model.safetensors",
                                   "name": "test-model"
                               })
        if response.status_code == 400:
            print("✓ Endpoint responded correctly to invalid path")
            print(f"  Response: {response.text}")
        elif response.status_code == 200:
            result = response.json()
            print(f"✓ Model loaded from path: {result}")
        else:
            print(f"✗ Unexpected response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Test 7: Download model to custom directory
    print("\n7. Testing POST /download with custom directory")
    try:
        temp_dir = tempfile.mkdtemp()
        response = requests.post(f"{base_url}/download",
                               json={
                                   "url": "https://huggingface.co/CompVis/stable-diffusion-v1-4/resolve/main/feature_extractor/preprocessor_config.json",
                                   "filename": "test_config.json",
                                   "directory": temp_dir
                               })
        if response.status_code == 200:
            result = response.json()
            print(f"✓ File downloaded to custom directory: {result['path']}")
        else:
            print(f"✗ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")

    print("\n" + "=" * 40)
    print("Testing completed!")

if __name__ == "__main__":
    test_backend()
