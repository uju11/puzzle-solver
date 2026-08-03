"""
setup.py — One-time setup script for Wend Solver PWA.
Run this once to copy icons and verify the app works locally.

Usage:
    python setup.py
"""
import os
import sys
import shutil
import subprocess

BASE = os.path.dirname(os.path.abspath(__file__))
ICONS_DIR = os.path.join(BASE, 'mobile', 'icons')

def setup_icons():
    os.makedirs(ICONS_DIR, exist_ok=True)
    
    # Check if icons already exist
    icon192 = os.path.join(ICONS_DIR, 'icon-192.png')
    icon512 = os.path.join(ICONS_DIR, 'icon-512.png')
    
    if os.path.exists(icon192) and os.path.exists(icon512):
        print("✓ Icons already exist")
        return
    
    # Try to generate simple placeholder icons using only stdlib
    try:
        # Create a minimal valid PNG (1x1 purple pixel, scaled via CSS)
        # This is a base64-encoded 192x192 purple PNG generated inline
        import base64
        import struct
        import zlib
        
        def make_png(width, height, r, g, b):
            """Create a minimal solid-color PNG."""
            def chunk(name, data):
                c = zlib.crc32(name + data) & 0xffffffff
                return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)
            
            header = b'\x89PNG\r\n\x1a\n'
            ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
            
            # Image data: rows of RGB pixels
            raw = b''.join(b'\x00' + bytes([r, g, b] * width) for _ in range(height))
            idat = chunk(b'IDAT', zlib.compress(raw))
            iend = chunk(b'IEND', b'')
            return header + ihdr + idat + iend
        
        # Purple color #7c3aed → r=124, g=58, b=237
        png192 = make_png(192, 192, 124, 58, 237)
        png512 = make_png(512, 512, 124, 58, 237)
        
        with open(icon192, 'wb') as f:
            f.write(png192)
        with open(icon512, 'wb') as f:
            f.write(png512)
        
        print(f"✓ Generated placeholder icons in {ICONS_DIR}")
        print("  (Replace with your real icons when ready)")
    
    except Exception as e:
        print(f"⚠ Could not generate icons: {e}")
        print(f"  Please manually place icon-192.png and icon-512.png in: {ICONS_DIR}")

def install_deps():
    print("\nInstalling dependencies...")
    result = subprocess.run(
        [sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'],
        cwd=BASE, capture_output=True, text=True
    )
    if result.returncode == 0:
        print("✓ Dependencies installed")
    else:
        print(f"✗ pip install failed:\n{result.stderr}")
        sys.exit(1)

def run_server():
    print("\n" + "="*60)
    print("Starting Wend Solver at http://localhost:5000")
    print("Open your browser and navigate to http://localhost:5000")
    print("Press Ctrl+C to stop")
    print("="*60 + "\n")
    os.execv(sys.executable, [sys.executable, os.path.join(BASE, 'api_server.py')])

if __name__ == '__main__':
    print("Wend Solver Setup\n" + "="*40)
    setup_icons()
    install_deps()
    run_server()
