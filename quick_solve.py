#!/usr/bin/env python3
"""
Quick start: Solve a real Wend puzzle with the Python solver

Usage:
  python quick_solve.py
  # Input puzzle manually, or
  
  python quick_solve.py --grid "cat,a#r,dog,sun" --words "car,cat,arc,art,tar"
  
Grid format:
  - Letters separated by commas
  - Rows separated by commas  
  - Walls marked with '#'
  
Example:
  cat,a#r,dog  →  c a t
                   a # r
                   d o g
"""

import sys
import argparse
from typing import List, Set
from wend_solver import WendSolver, build_prefix_set


def parse_grid(grid_str: str) -> List[List[str]]:
    """Parse grid from string format: 'cat,a#r,dog' → [['c','a','t'],['a','#','r'],['d','o','g']]"""
    rows = grid_str.split(';')
    grid = []
    for row in rows:
        cells = row.strip().split(',')
        grid.append(list(''.join(cells)))
    return grid


def parse_words(words_str: str) -> Set[str]:
    """Parse word list from comma-separated string."""
    return set(w.strip().lower() for w in words_str.split(',') if w.strip())


def display_grid(grid: List[List[str]]) -> None:
    """Pretty-print the grid."""
    print("\nGrid:")
    for i, row in enumerate(grid):
        cells = [f"{cell:>2}" for cell in row]
        print(f"  Row {i}: " + " ".join(cells))


def input_puzzle() -> tuple:
    """Interactively input puzzle grid and words."""
    print("\n" + "="*60)
    print("WEND PUZZLE SOLVER - Interactive Input")
    print("="*60)
    
    # Get grid
    print("\nEnter grid (rows separated by ';', letters by ',' or direct):")
    print("Examples:")
    print("  cat,a#r,dog,sun")
    print("  c,a,t;a,#,r;d,o,g;s,u,n")
    
    while True:
        grid_input = input("\nGrid > ").strip()
        try:
            if ',' in grid_input:
                # Format: cat,a#r,dog
                if ';' in grid_input:
                    # Format: c,a,t;a,#,r;d,o,g
                    rows = grid_input.split(';')
                    grid = []
                    for row in rows:
                        cells = row.split(',')
                        grid.append(list(''.join(cells)))
                else:
                    # Format: cat,a#r,dog (auto-square)
                    cells = ''.join(grid_input.split(','))
                    size = int(len(cells) ** 0.5)
                    if size * size != len(cells):
                        raise ValueError(f"Grid must be square: {len(cells)} cells")
                    grid = [list(cells[i*size:(i+1)*size]) for i in range(size)]
            else:
                # Format: catardog
                cells = grid_input
                size = int(len(cells) ** 0.5)
                if size * size != len(cells):
                    raise ValueError(f"Grid must be square: {len(cells)} cells")
                grid = [list(cells[i*size:(i+1)*size]) for i in range(size)]
            break
        except Exception as e:
            print(f"❌ Invalid grid: {e}")
    
    display_grid(grid)
    
    # Get words
    print("\nEnter word list (comma-separated):")
    print("Example: car,cat,arc,art,rat,tar,card,care")
    words_input = input("Words > ").strip()
    words = parse_words(words_input)
    
    print(f"\nLoaded: {len(words)} words")
    if len(words) <= 20:
        print(f"Words: {', '.join(sorted(words))}")
    
    # Get target length
    length_input = input("\nTarget word length (default 4) > ").strip()
    length = int(length_input) if length_input else 4
    
    return grid, words, length


def main():
    parser = argparse.ArgumentParser(description="Quick Wend puzzle solver")
    parser.add_argument('--grid', help='Grid string (e.g., "cat,a#r,dog")')
    parser.add_argument('--words', help='Word list (e.g., "car,cat,arc")')
    parser.add_argument('--length', type=int, default=4, help='Target word length')
    
    args = parser.parse_args()
    
    # Get input
    if args.grid and args.words:
        # Command-line mode
        grid = parse_grid(args.grid)
        words = parse_words(args.words)
        length = args.length
    else:
        # Interactive mode
        grid, words, length = input_puzzle()
    
    # Validate
    if not grid or not words:
        print("❌ Error: grid and words required")
        sys.exit(1)
    
    # Solve
    print(f"\n{'='*60}")
    print(f"Solving for {length}-letter words...")
    print(f"{'='*60}")
    
    solver = WendSolver(grid)
    prefix_set = build_prefix_set(words)
    
    # Find all starting cells
    results = []
    for r in range(len(grid)):
        for c in range(len(grid[0])):
            if grid[r][c] != '#':
                for word, coords in solver.find_words_pruned((r, c), length, words, prefix_set):
                    results.append((word, coords, (r, c)))
    
    # Remove duplicates (same word found from different starts)
    seen = {}
    unique_results = []
    for word, coords, start in results:
        if word not in seen:
            seen[word] = coords
            unique_results.append((word, coords))
    
    # Display results
    if unique_results:
        print(f"\n✅ Found {len(unique_results)} valid words:\n")
        
        # Sort by word
        unique_results.sort(key=lambda x: x[0])
        
        for word, coords in unique_results:
            path = " → ".join([f"({r},{c})" for r, c in coords])
            print(f"  {word.upper():>10}  |  {path}")
    else:
        print(f"\n⚠️  No valid {length}-letter words found")
    
    # Show exhaustive count
    all_paths = []
    for r in range(len(grid)):
        for c in range(len(grid[0])):
            if grid[r][c] != '#':
                for path in solver.find_all_paths((r, c), length):
                    all_paths.append(path)
    
    print(f"\n{'='*60}")
    print(f"Statistics:")
    print(f"  Valid words: {len(unique_results)}")
    print(f"  Total paths: {len(all_paths)}")
    if len(all_paths) > 0:
        ratio = len(unique_results) / len(all_paths) * 100
        print(f"  Pruning: {ratio:.1f}% of paths are real words")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
