import urllib.request
import os

print("Downloading Tesseract dependencies for MV3...")
os.makedirs("tesseract", exist_ok=True)

files = {
    "tesseract.min.js": "https://cdn.jsdelivr.net/npm/tesseract.js@5.0.0/dist/tesseract.min.js",
    "worker.min.js": "https://cdn.jsdelivr.net/npm/tesseract.js@5.0.0/dist/worker.min.js",
    "tesseract-core-simd.wasm.js": "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core-simd.wasm.js",
    "tesseract-core.wasm.js": "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core.wasm.js",
    "eng.traineddata.gz": "https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz"
}

for name, url in files.items():
    print(f"Downloading {name}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(os.path.join("tesseract", name), 'wb') as out_file:
            out_file.write(response.read())
    except Exception as e:
        print(f"Failed to download {name}: {e}")

print("\nDone! Tesseract dependencies downloaded successfully.")
print("You can now reload your extension in chrome://extensions")
