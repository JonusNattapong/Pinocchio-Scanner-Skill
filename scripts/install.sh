#!/bin/bash

# Skill-Scanner Universal Installer for Linux/macOS
# Usage: curl -sSL https://raw.githubusercontent.com/JonusNattapong/Skill-Scanner/main/scripts/install.sh | bash

set -e

echo "🔒 Skill-Scanner Universal Installer"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js (v18+) first."
    exit 1
fi

# Install the package
echo "📦 Installing skill-scanner globally via NPM..."
npm install -g skill-scanner

echo "✅ Installation complete!"
echo "🚀 Try running: skill-scanner --help"
