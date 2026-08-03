# Wend Solver - Browser Extension

**Automatic LinkedIn Wend puzzle solver with live overlay**

## ✨ Features

- 🔍 **Auto-detects** the Wend puzzle on LinkedIn pages
- 🧠 **Solves instantly** using prefix-pruning algorithm
- 🎯 **Shows results** as a clean overlay panel
- 📋 **Click to copy** solutions to clipboard
- 🎮 **Works live** — no page refresh needed

## 📥 Installation

### Chrome / Edge

1. **Download the extension**:
   ```bash
   # Clone or download wend-solver folder
   # Navigate to: extension/
   ```

2. **Load in browser**:
   - Open: `chrome://extensions/`
   - Enable **Developer mode** (top-right toggle)
   - Click **Load unpacked**
   - Select the `extension/` folder
   - Extension loads! 🎉

3. **Go to LinkedIn**:
   - Open any LinkedIn post with Wend puzzle
   - Overlay appears automatically with solutions

### Firefox

1. Same steps but use `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` from the `extension/` folder

## 🚀 Quick Start

**That's it!** Just:
1. Install extension (Chrome/Firefox)
2. Visit LinkedIn Wend puzzle
3. Solutions appear in overlay in ~100ms

## 📱 How It Works

1. **Scans page** for Wend game grid
2. **Extracts grid** letters and walls from DOM
3. **Runs solver** in background (same algorithm as Python version)
4. **Shows results** in side panel with cell paths
5. **Copy-to-clipboard** with one click

## 🎯 Overlay Controls

| Action | Effect |
|--------|--------|
| **Click word** | Copy to clipboard |
| **Click ✕** | Close overlay |
| **Refreshes** | When puzzle changes |

## 📦 File Structure

```
extension/
├── manifest.json      # Extension config
├── content.js         # Puzzle detection + UI
├── background.js      # Solver algorithm
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

## ⚙️ Configuration

**To adjust solver behavior**, edit `background.js`:

```javascript
// Change word lengths checked (default: 3-6)
for (let length = 3; length <= 6; length++)  // ← Modify here

// Change dictionary size
// Current: ~3000 words (3-7 letters)
```

## 🔧 Troubleshooting

### "No puzzle detected"
- Ensure LinkedIn page fully loads
- Make sure Wend puzzle is visible
- Check browser console (F12) for errors

### "Overlay not showing"
- Refresh page (Cmd+R / Ctrl+R)
- Check that extension is enabled in `chrome://extensions/`
- Try different puzzle

### "Only finding 1-2 words"
- Puzzle might be small (3x3 grid)
- Try longer search lengths by editing `background.js`

## 📊 Performance

- **Detection**: <500ms
- **Solving**: <100ms (typical)
- **Large grids**: <1s
- **Memory**: <5MB

## ⚠️ Legal / Disclaimer

This extension is for **educational purposes**. Using it on LinkedIn games may violate:
- LinkedIn Terms of Service
- Game fair play rules

**Use responsibly** — it's designed for learning, not cheating! 😊

## 🛠️ Development

**To modify solver logic**:

1. Edit `background.js` - main solver algorithm
2. Edit `content.js` - grid detection and UI
3. Save files
4. Reload extension (`chrome://extensions/` → Refresh)

**Adding words to dictionary**:
```javascript
// In background.js, add to WORD_DICTIONARY
const WORD_DICTIONARY = new Set([
  'word1', 'word2', 'word3', ...
]);
```

## 📝 Version

**v1.0.0** - Initial release
- Grid detection ✓
- Puzzle solving ✓
- Overlay UI ✓
- Multi-browser support ✓

## 🎓 Learn More

- **Python solver**: See `../wend_solver.py`
- **REST API**: See `../api_server.py`
- **Architecture**: See `../PROJECT_GUIDE.md`

## 📧 Support

For issues or questions:
1. Check browser console (F12)
2. Verify extension is loaded
3. Try reloading page
4. Reinstall extension

---

**Made with ❤️ for LinkedIn Wend lovers**

Good luck solving! 🎯
