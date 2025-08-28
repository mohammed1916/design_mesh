#!/usr/bin/env python3
"""
Example script demonstrating custom model directory and path features
"""

import requests
import json
import os

def example_custom_directory():
    """Example of setting a custom model directory"""
    base_url = "http://localhost:5000"

    # Set custom directory
    custom_dir = "/path/to/your/custom/models"
    response = requests.post(f"{base_url}/set_model_dir",
                           json={"directory": custom_dir})

    if response.status_code == 200:
        result = response.json()
        print(f"Model directory updated: {result['model_dir']}")
    else:
        print(f"Error: {response.json()}")

def example_download_to_custom_dir():
    """Example of downloading a model to a custom directory"""
    base_url = "http://localhost:5000"

    # Download model to custom directory
    response = requests.post(f"{base_url}/download",
                           json={
                               "url": "https://huggingface.co/CompVis/stable-diffusion-v1-4/resolve/main/v1-4.ckpt",
                               "filename": "stable-diffusion-v1-4.ckpt",
                               "directory": "/path/to/custom/directory"
                           })

    if response.status_code == 200:
        result = response.json()
        print(f"Model downloaded to: {result['path']}")
    else:
        print(f"Error: {response.json()}")

def example_load_from_path():
    """Example of loading a model from a custom path"""
    base_url = "http://localhost:5000"

    # Load model from custom path
    custom_path = "/path/to/your/model.safetensors"
    response = requests.post(f"{base_url}/load_from_path",
                           json={
                               "path": custom_path,
                               "name": "my-custom-model"
                           })

    if response.status_code == 200:
        result = response.json()
        print(f"Model loaded: {result['model']} from {result['path']}")
    else:
        print(f"Error: {response.json()}")

def example_environment_variable():
    """Example of using environment variable for model directory"""
    print("You can also set the model directory using environment variables:")
    print("export SD_MODEL_DIR='/path/to/models'")
    print("python run.py")

def example_appdata_usage():
    """Example of how APPDATA is used on Windows"""
    print("\nOn Windows, models are stored in:")
    print("%APPDATA%\\StableDiffusionBackend\\models")
    print("Which expands to something like:")
    print("C:\\Users\\YourUsername\\AppData\\Roaming\\StableDiffusionBackend\\models")

def main():
    """Run all examples"""
    print("Stable Diffusion Backend - Custom Path Examples")
    print("=" * 50)

    print("\n1. Setting custom model directory:")
    example_custom_directory()

    print("\n2. Downloading to custom directory:")
    example_download_to_custom_dir()

    print("\n3. Loading from custom path:")
    example_load_from_path()

    print("\n4. Environment variable usage:")
    example_environment_variable()

    print("\n5. APPDATA usage on Windows:")
    example_appdata_usage()

    print("\nNote: Make sure the backend is running on http://localhost:5000")
    print("Start it with: python run.py")

if __name__ == "__main__":
    main()
