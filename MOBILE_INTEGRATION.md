"""
MOBILE INTEGRATION GUIDE - Wend Puzzle Solver

Three integration paths for iOS and Android:
1. Remote API (Flask server)
2. Native module compilation (PyBridge, React Native)
3. WebAssembly (browser-based)
"""

# ============================================================================
# OPTION 1: Remote API (Recommended for MVP)
# ============================================================================

"""
OPTION 1: Remote API Server

Best for:
- MVP / proof of concept
- Scalable multi-user backend
- Easy iteration without recompiling app

Setup:
  1. Deploy api_server.py to a cloud server (AWS, GCP, Heroku, etc.)
  2. Mobile apps make HTTP POST requests to the server

iOS Example (Swift):
"""

SWIFT_EXAMPLE = """
import Foundation

struct SolverRequest: Codable {
    let grid: [[String]]
    let start: [Int]
    let length: Int
    let words: [String]
    let generate_prefixes: Bool = true
}

struct SolverResult: Codable {
    let success: Bool
    let results: [WordPath]
    let count: Int
    let elapsed_ms: Double
}

struct WordPath: Codable {
    let word: String
    let path: [[Int]]
}

class WendSolverClient {
    let baseURL = "https://your-server.com/api"
    
    func findWords(grid: [[String]], start: (Int, Int), length: Int, words: [String]) async throws -> [WordPath] {
        let request = SolverRequest(
            grid: grid,
            start: [start.0, start.1],
            length: length,
            words: words
        )
        
        var urlRequest = URLRequest(url: URL(string: "\(baseURL)/solve/pruned")!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = try JSONEncoder().encode(request)
        
        let (data, _) = try await URLSession.shared.data(for: urlRequest)
        let result = try JSONDecoder().decode(SolverResult.self, from: data)
        
        return result.results
    }
}
"""

"""
Android Example (Kotlin):
"""

KOTLIN_EXAMPLE = """
import retrofit2.http.POST
import retrofit2.http.Body
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class SolverRequest(
    val grid: List<List<String>>,
    val start: List<Int>,
    val length: Int,
    val words: List<String>,
    val generate_prefixes: Boolean = true
)

data class SolverResult(
    val success: Boolean,
    val results: List<WordPath>,
    val count: Int,
    val elapsed_ms: Double
)

data class WordPath(
    val word: String,
    val path: List<List<Int>>
)

interface WendSolverApi {
    @POST("/api/solve/pruned")
    suspend fun findWords(@Body request: SolverRequest): SolverResult
}

class WendSolverRepository(private val api: WendSolverApi) {
    suspend fun solveWords(
        grid: List<List<String>>,
        start: Pair<Int, Int>,
        length: Int,
        words: List<String>
    ): List<WordPath> = withContext(Dispatchers.IO) {
        val request = SolverRequest(
            grid = grid,
            start = listOf(start.first, start.second),
            length = length,
            words = words
        )
        api.findWords(request).results
    }
}
"""

# ============================================================================
# OPTION 2: Native Python Module Bridge
# ============================================================================

"""
OPTION 2: Native Python Module (React Native / iOS)

Best for:
- On-device solving (no network needed)
- Offline play
- Lower latency / no server costs
- Privacy-first approach

Approaches:

A) React Native with Python Module:
   - Use react-native-python (RNPython) or PyBridge
   - Bundle Python interpreter + module into app
   - Call directly from JavaScript

   Installation:
   npm install react-native-python

   React Native Code:
"""

REACT_NATIVE_EXAMPLE = """
import { PythonModule } from 'react-native-python';

const WendSolver = async () => {
  const python = await PythonModule.import('wend_solver');
  
  const grid = [
    ['c', 'a', 't', 's', 'r'],
    ['a', '#', 'r', 'e', 'a'],
    ['r', 'd', 'o', 'g', 's'],
    ['s', 'u', 'n', '#', 'd'],
    ['h', 'e', 'y', 'b', 't'],
  ];
  
  const solver = python.WendSolver(grid);
  const results = solver.find_words_pruned(
    [0, 0],
    4,
    new Set(['card', 'care', 'dear']),
    new Set(['c', 'ca', 'car', 'card', ...])
  );
  
  return Array.from(results);
};
"""

"""
B) iOS with Swift-Python Bridge:
   - Use PyObjC (macOS) or custom ctypes wrapper
   - Embed Python runtime in Xcode project
   - Call via native bridging layer

   More complex; recommend Option 1 or 3 for iOS.
"""

# ============================================================================
# OPTION 3: WebAssembly (Web + Hybrid Apps)
# ============================================================================

"""
OPTION 3: WebAssembly Compilation

Best for:
- Web version (any browser)
- Hybrid apps (Electron, Flutter WebView, Capacitor)
- Full offline support
- Single codebase for all platforms

Tools:
- Pyodide: Python → WebAssembly
- PyScript: Python in HTML
- Brython: Browser Python

WebAssembly Setup:
"""

HTML_PYODIDE_EXAMPLE = """
<!DOCTYPE html>
<html>
<head>
    <script defer src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"></script>
</head>
<body>
    <h1>Wend Solver</h1>
    <button onclick="solvePuzzle()">Solve</button>
    <pre id="output"></pre>

    <script>
        async function solvePuzzle() {
            let pyodide = await loadPyodide();
            
            // Load the Python module
            await pyodide.runPythonAsync(`
                import sys
                sys.path.append('/')
                from wend_solver import WendSolver
                
                grid = [
                    ['c', 'a', 't', 's', 'r'],
                    ['a', '#', 'r', 'e', 'a'],
                    ['r', 'd', 'o', 'g', 's'],
                    ['s', 'u', 'n', '#', 'd'],
                    ['h', 'e', 'y', 'b', 't'],
                ]
                
                solver = WendSolver(grid)
                results = list(solver.find_words_pruned(
                    (0, 0), 4,
                    {'card', 'care', 'dear'},
                    {'c', 'ca', 'car', 'card', ...}
                ))
                
                for word, coords in results:
                    print(f"{word}: {coords}")
            `);
            
            document.getElementById('output').textContent = 
                pyodide.globals.get('results');
        }
    </script>
</body>
</html>
"""

"""
Pyodide + React Example:
"""

REACT_WASM_EXAMPLE = """
import { useEffect, useState } from 'react';

export default function WendSolverWeb() {
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    (async () => {
      // Load Pyodide
      const pyodide = await window.loadPyodide();
      
      // Fetch and run the Python module
      const wendModuleCode = await fetch('/wend_solver.py').then(r => r.text());
      await pyodide.runPython(wendModuleCode);
      
      // Call the solver
      const gridData = JSON.stringify([
        ['c', 'a', 't', 's', 'r'],
        ['a', '#', 'r', 'e', 'a'],
        ['r', 'd', 'o', 'g', 's'],
        ['s', 'u', 'n', '#', 'd'],
        ['h', 'e', 'y', 'b', 't'],
      ]);
      
      const res = await pyodide.runPythonAsync(`
        from wend_solver import WendSolver, build_prefix_set
        import json
        
        grid = json.loads('${gridData}')
        words = {'card', 'care', 'dear', 'dare', 'read'}
        prefix_set = build_prefix_set(words)
        
        solver = WendSolver(grid)
        output = [
            {'word': w, 'path': p} 
            for w, p in solver.find_words_pruned((0,0), 4, words, prefix_set)
        ]
        json.dumps(output)
      `);
      
      setResults(JSON.parse(res));
    })();
  }, []);
  
  return (
    <div>
      <h1>Wend Solver</h1>
      <ul>
        {results.map(r => (
          <li key={r.word}>{r.word.toUpperCase()} - {r.path.join(' → ')}</li>
        ))}
      </ul>
    </div>
  );
}
"""

# ============================================================================
# COMPARISON TABLE
# ============================================================================

COMPARISON = """
┌─────────────────┬──────────────┬──────────────┬──────────────┐
│ Feature         │ API (Option1)│ Native(Opt2) │ WASM (Opt3)  │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ Implementation  │ Easy         │ Medium       │ Easy-Medium  │
│ Server Cost     │ Yes          │ No           │ No           │
│ Offline Play    │ No           │ Yes          │ Yes          │
│ Latency         │ 50-200ms     │ <10ms        │ <20ms        │
│ App Size        │ Smaller      │ +100MB       │ +10MB        │
│ Cross-Platform  │ Yes          │ No           │ Yes          │
│ Development     │ Fast         │ Slow         │ Medium       │
│ Update Speed    │ Instant      │ Via App      │ Instant      │
│ Privacy         │ Risky        │ Great        │ Great        │
│ iOS Support     │ ✓            │ ✗✗           │ ✓            │
│ Android Support │ ✓            │ ✓            │ ✓            │
│ Web Support     │ ✓            │ ✗            │ ✓✓           │
└─────────────────┴──────────────┴──────────────┴──────────────┘

RECOMMENDATION: Start with Option 1 (API) for MVP launch.
Move to Option 3 (WASM) for web + hybrid apps once proven.
Option 2 (Native) is niche—use only if offline + no network needed.
"""

# ============================================================================
# GRID ENCODING OPTIMIZATION
# ============================================================================

"""
GRID ENCODING TIPS FOR MOBILE

1. Compact Representation:
   Instead of: [["c", "a", "t"], ["a", "#", "r"], ...]
   Use:        "cat,a#r,..." (comma-separated per row)
   
   Python decode:
   def decode_grid(encoded):
       return [list(row) for row in encoded.split(',')]

2. Wall Marker:
   Use '#' for walls (or any char not in your alphabet)
   Reducer function confirms via is_valid_cell()

3. Coordinate Encoding:
   Instead of: [[0,0], [0,1], [1,1]]
   Use:        "001011" (base64 encode for even more compression)
   
   Python decode:
   def decode_path(encoded):
       return [(int(encoded[i]), int(encoded[i+1])) for i in range(0, len(encoded), 2)]

Example Compression:
   Before: {"grid": [["c","a","t"],["a","#","r"]], ...}  ~50 bytes
   After:  {"g": "cat,a#r", ...}                          ~15 bytes
   Savings: ~70%
"""

# ============================================================================
# DEPLOYMENT OPTIONS
# ============================================================================

"""
QUICK START - LOCAL TESTING:

1. Install Flask:
   pip install flask

2. Run API server:
   python api_server.py
   # Server runs on http://localhost:5000

3. Test from mobile emulator:
   iOS/Android emulator can access localhost via 10.0.2.2 (Android)
                                        or 127.0.0.1 (iOS simulator)

PRODUCTION DEPLOYMENT (Option 1 - API Server):

Docker:
"""

DOCKERFILE = """
FROM python:3.11-slim
WORKDIR /app
COPY wend_solver.py api_server.py ./
RUN pip install flask
EXPOSE 5000
CMD ["python", "api_server.py"]

# Build: docker build -t wend-solver:latest .
# Run:   docker run -p 5000:5000 wend-solver:latest
"""

"""
Heroku Deployment:
"""

PROCFILE = """
web: python api_server.py
"""

REQUIREMENTS_TXT = """
flask==2.3.0
"""

"""
Commands:
  heroku create wend-solver-api
  git push heroku main
  # API available at https://wend-solver-api.herokuapp.com
"""

"""
AWS Lambda:
"""

LAMBDA_HANDLER = """
from wend_solver import WendSolver, build_prefix_set
import json

def lambda_handler(event, context):
    body = json.loads(event['body'])
    grid = body['grid']
    start = tuple(body['start'])
    length = body['length']
    words = set(body['words'])
    prefix_set = build_prefix_set(words)
    
    solver = WendSolver(grid)
    results = [
        {'word': w, 'path': p}
        for w, p in solver.find_words_pruned(start, length, words, prefix_set)
    ]
    
    return {
        'statusCode': 200,
        'body': json.dumps({'results': results})
    }
"""

"""
For serverless: Use AWS Lambda with API Gateway
- Zero fixed costs, pay per request
- Scales automatically
- Deploy via AWS SAM CLI
"""

print(__doc__)
print(COMPARISON)
print("\nFor detailed code examples, see the inline strings in this file.")
