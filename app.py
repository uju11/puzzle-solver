"""
Wend Puzzle Solver — REST API + PWA host.

Serves the mobile PWA from the root URL and exposes solver endpoints at /api/*.
Includes CORS, request validation, error handling, and efficient grid encoding.

Run locally:   python app.py
Production:    gunicorn app:app --bind 0.0.0.0:$PORT
"""

import json
import os
import time
from typing import Dict, Any, List
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from wend_solver import WendSolver, build_prefix_set

# ── App setup ──────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'mobile')

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='')
CORS(app)  # Allow cross-origin requests (useful if you ever split frontend/backend)


# ── PWA static files ───────────────────────────────────────────────────────────

@app.route('/')
def index():
    """Serve the PWA index — always fresh so SW updates propagate."""
    response = send_from_directory(STATIC_DIR, 'index.html')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    return response


@app.route('/sw.js')
def service_worker():
    """Serve service worker with correct Content-Type and no-cache headers."""
    response = send_from_directory(STATIC_DIR, 'sw.js')
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Cache-Control'] = 'no-cache'
    return response


@app.route('/manifest.json')
def manifest():
    """Serve the Web App Manifest."""
    return send_from_directory(STATIC_DIR, 'manifest.json')


# Catch-all for any other static files (icons, solver.js, etc.)
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)


# ── Health check ───────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint (used by Render)."""
    return jsonify({'status': 'ok', 'service': 'wend-solver'})


# ── Solver endpoints ───────────────────────────────────────────────────────────

@app.route('/api/solve/pruned', methods=['POST'])
def solve_pruned():
    """
    Find valid dictionary words via pruned DFS.

    Request JSON:
    {
        "grid": [["c", "a", "t"], ["a", "#", "r"], ...],  // 2D array of letters
        "start": [row, col],                                // Starting cell
        "length": 4,                                        // Exact path length
        "words": ["cat", "car", "art", ...],               // Valid words
        "generate_prefixes": true                           // Auto-build prefix set
    }

    Response:
    {
        "success": true,
        "results": [
            {"word": "card", "path": [[0,0], [1,0], [2,0], [2,1]]},
            ...
        ],
        "count": 5,
        "elapsed_ms": 1.23
    }
    """
    try:
        data = request.get_json()

        # Validate input
        if not data or 'grid' not in data:
            return jsonify({'error': 'Missing grid parameter'}), 400

        grid = data['grid']
        start = tuple(data.get('start', [0, 0]))
        length = int(data.get('length', 4))
        words = set(data.get('words', []))

        if length < 1 or length > 20:
            return jsonify({'error': 'Length must be 1-20'}), 400

        # Build prefix set
        prefix_set = build_prefix_set(words) if data.get('generate_prefixes', True) else set(words)

        # Solve
        solver = WendSolver(grid)
        start_time = time.perf_counter()
        results = [
            {'word': word, 'path': coords}
            for word, coords in solver.find_words_pruned(start, length, words, prefix_set)
        ]
        elapsed = (time.perf_counter() - start_time) * 1000

        return jsonify({
            'success': True,
            'results': results,
            'count': len(results),
            'elapsed_ms': elapsed
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/solve/all-paths', methods=['POST'])
def solve_all_paths():
    """
    Find all simple paths of exact length (no dictionary check).

    Request JSON:
    {
        "grid": [["c", "a", "t"], ...],
        "start": [row, col],
        "length": 4
    }

    Response:
    {
        "success": true,
        "results": [
            {"word": "cats", "path": [[0,0], [0,1], [0,2], [0,3]]},
            ...
        ],
        "count": 248,
        "elapsed_ms": 1.01
    }
    """
    try:
        data = request.get_json()

        if not data or 'grid' not in data:
            return jsonify({'error': 'Missing grid parameter'}), 400

        grid = data['grid']
        start = tuple(data.get('start', [0, 0]))
        length = int(data.get('length', 4))

        if length < 1 or length > 20:
            return jsonify({'error': 'Length must be 1-20'}), 400

        # Solve
        solver = WendSolver(grid)
        start_time = time.perf_counter()
        results = [
            {'word': word, 'path': coords}
            for word, coords in solver.find_all_paths(start, length)
        ]
        elapsed = (time.perf_counter() - start_time) * 1000

        return jsonify({
            'success': True,
            'results': results,
            'count': len(results),
            'elapsed_ms': elapsed
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/solve/batch', methods=['POST'])
def solve_batch():
    """
    Solve from multiple starting cells in one request.
    Useful for scanning the entire grid from all positions.

    Request JSON:
    {
        "grid": [...],
        "length": 4,
        "words": ["cat", ...],
        "start_cells": [[0,0], [0,1], [1,2], ...]  // or "all" for every cell
    }

    Response:
    {
        "success": true,
        "results": {
            "[0,0]": [...results...],
            "[0,1]": [...results...],
            ...
        },
        "total_count": 42,
        "elapsed_ms": 5.67
    }
    """
    try:
        data = request.get_json()

        if not data or 'grid' not in data:
            return jsonify({'error': 'Missing grid parameter'}), 400

        grid = data['grid']
        length = int(data.get('length', 4))
        words = set(data.get('words', []))
        prefix_set = build_prefix_set(words) if data.get('generate_prefixes', True) else set(words)

        # Determine start cells
        start_cells_input = data.get('start_cells', 'all')
        if start_cells_input == 'all':
            start_cells = [
                (r, c) for r in range(len(grid))
                for c in range(len(grid[0]) if grid else 0)
                if grid[r][c] != '#'
            ]
        else:
            start_cells = [tuple(cell) for cell in start_cells_input]

        solver = WendSolver(grid)
        start_time = time.perf_counter()

        results = {}
        total_count = 0
        for start in start_cells:
            cell_results = [
                {'word': word, 'path': coords}
                for word, coords in solver.find_words_pruned(start, length, words, prefix_set)
            ]
            if cell_results:
                results[str(start)] = cell_results
                total_count += len(cell_results)

        elapsed = (time.perf_counter() - start_time) * 1000

        return jsonify({
            'success': True,
            'results': results,
            'total_count': total_count,
            'cells_scanned': len(start_cells),
            'elapsed_ms': elapsed
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Wend Solver starting on http://localhost:{port}")
    print("  PWA:  GET  /")
    print("  API:  GET  /api/health")
    print("        POST /api/solve/pruned")
    print("        POST /api/solve/all-paths")
    print("        POST /api/solve/batch")
    app.run(debug=False, host='0.0.0.0', port=port)
