#!/bin/bash

# Stable Diffusion Backend Packaging Script
# This script packages the Flask backend into executables for different platforms

echo "Stable Diffusion Backend Packaging Script"
echo "========================================="

# Function to package for a specific platform
package_platform() {
    local platform=$1
    local requirements_file="requirements-exe-${platform}.txt"

    echo "Packaging for ${platform}..."

    # Create virtual environment
    python -m venv venv_${platform}
    source venv_${platform}/bin/activate  # On Windows: venv_${platform}/Scripts/activate

    # Install dependencies
    pip install -r ${requirements_file}

    # Create executable with PyInstaller
    pyinstaller --onefile --name stable-diffusion-backend-${platform} run.py

    # Deactivate virtual environment
    deactivate

    echo "Packaging for ${platform} completed!"
    echo "Executable created: dist/stable-diffusion-backend-${platform}"
}

# Package for all platforms (run on respective OS)
case "$(uname -s)" in
    Linux*)
        package_platform "linux"
        ;;
    Darwin*)
        package_platform "mac"
        ;;
    CYGWIN*|MINGW32*|MSYS*|MINGW*)
        package_platform "windows"
        ;;
    *)
        echo "Unknown OS. Please run on Linux, Mac, or Windows."
        exit 1
        ;;
esac

echo "Packaging completed successfully!"
echo "Executables are available in the 'dist' directory."
