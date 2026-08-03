"""
Wend Puzzle Solver - Word path finder for grid-based word puzzles.

Finds valid word paths through orthogonally-adjacent grid cells.
Two strategies: dictionary-pruned search and exhaustive enumeration.
Returns paths as letter strings with cell coordinates.
"""

import time
from typing import Set, List, Tuple, Generator, Optional


class WendSolver:
    """Solver for finding word paths in a grid puzzle."""

    def __init__(self, grid: List[List[str]]):
        """
        Initialize solver with a grid.
        
        Args:
            grid: 2D list where each cell is a letter string or '#' for walls.
                  '#' marks blocked/invalid cells.
        """
        self.grid = grid
        self.rows = len(grid)
        self.cols = len(grid[0]) if grid else 0

    def _is_valid_cell(self, r: int, c: int, visited: Set[Tuple[int, int]]) -> bool:
        """Check if a cell is valid and not visited."""
        return (
            0 <= r < self.rows
            and 0 <= c < self.cols
            and self.grid[r][c] != '#'
            and (r, c) not in visited
        )

    def _get_neighbors(self, r: int, c: int) -> List[Tuple[int, int]]:
        """Get orthogonally adjacent cell coordinates (up, down, left, right)."""
        neighbors = []
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < self.rows and 0 <= nc < self.cols and self.grid[nr][nc] != '#':
                neighbors.append((nr, nc))
        return neighbors

    def find_words_pruned(
        self,
        start: Tuple[int, int],
        length: int,
        word_set: Set[str],
        prefix_set: Set[str],
    ) -> Generator[Tuple[str, List[Tuple[int, int]]], None, None]:
        """
        Find valid dictionary words of exact length via DFS with prefix pruning.
        
        Before exploring further from a cell, checks if the current path prefix
        is valid (exists in prefix_set). Abandons branches immediately if prefix
        doesn't match any word, cutting search space dramatically.
        
        Args:
            start: (row, col) starting cell.
            length: Exact path length in cells.
            word_set: Set of valid words to match against.
            prefix_set: Set of valid prefixes (any string that begins a word).
                       Include all words and all their proper prefixes.
        
        Yields:
            (word_string, path_coordinates) tuples for valid words found.
        """
        r, c = start
        if not self._is_valid_cell(r, c, set()):
            return

        visited: Set[Tuple[int, int]] = set()
        path: List[Tuple[int, int]] = []
        current_word = ""

        def dfs(r: int, c: int) -> Generator[Tuple[str, List[Tuple[int, int]]], None, None]:
            nonlocal current_word, path, visited

            # Mark cell as visited
            visited.add((r, c))
            path.append((r, c))
            current_word += self.grid[r][c]

            # Check if current prefix is valid before continuing
            if current_word not in prefix_set:
                # Invalid prefix — prune this branch
                visited.remove((r, c))
                path.pop()
                current_word = current_word[:-1]
                return

            # If we've reached the target length, check if it's a valid word
            if len(path) == length:
                if current_word in word_set:
                    yield (current_word, path[:])  # Yield a copy of the path
            else:
                # Recursively explore neighbors
                for nr, nc in self._get_neighbors(r, c):
                    if (nr, nc) not in visited:
                        yield from dfs(nr, nc)

            # Backtrack
            visited.remove((r, c))
            path.pop()
            current_word = current_word[:-1]

        yield from dfs(r, c)

    def find_all_paths(
        self, start: Tuple[int, int], length: int
    ) -> Generator[Tuple[str, List[Tuple[int, int]]], None, None]:
        """
        Find all simple paths of exact length via DFS (no dictionary checking).
        
        Exhaustively enumerates every possible path of the given length starting
        from the given cell, regardless of whether it spells a real word.
        Useful for complete analysis or custom filtering.
        
        Args:
            start: (row, col) starting cell.
            length: Exact path length in cells.
        
        Yields:
            (letter_string, path_coordinates) tuples for all paths found.
        """
        r, c = start
        if not self._is_valid_cell(r, c, set()):
            return

        visited: Set[Tuple[int, int]] = set()
        path: List[Tuple[int, int]] = []
        current_word = ""

        def dfs(r: int, c: int) -> Generator[Tuple[str, List[Tuple[int, int]]], None, None]:
            nonlocal current_word, path, visited

            # Mark cell as visited
            visited.add((r, c))
            path.append((r, c))
            current_word += self.grid[r][c]

            # If we've reached the target length, yield the path
            if len(path) == length:
                yield (current_word, path[:])  # Yield a copy of the path
            else:
                # Recursively explore neighbors
                for nr, nc in self._get_neighbors(r, c):
                    if (nr, nc) not in visited:
                        yield from dfs(nr, nc)

            # Backtrack
            visited.remove((r, c))
            path.pop()
            current_word = current_word[:-1]

        yield from dfs(r, c)


# ============================================================================
# Test Grid and Word List
# ============================================================================

# 5x5 test grid with some wall cells (#)
TEST_GRID = [
    ['c', 'a', 't', 's', 'r'],
    ['a', '#', 'r', 'e', 'a'],
    ['r', 'd', 'o', 'g', 's'],
    ['s', 'u', 'n', '#', 'd'],
    ['h', 'e', 'y', 'b', 't'],
]

# Small word list: 3-6 letter words
TEST_WORDS = {
    # 3-letter words
    'cat', 'car', 'art', 'rat', 'are', 'ate', 'tar', 'red', 'dog', 'god',
    'sun', 'ray', 'era', 'say', 'day', 'sea', 'hey', 'yet',
    # 4-letter words
    'care', 'card', 'dare', 'dear', 'read', 'rays', 'arts', 'rats', 'tars',
    'drag', 'rude', 'dune', 'rune', 'drat', 'star',
    # 5-letter words
    'cared', 'cards', 'dares', 'dears', 'reads', 'rated', 'darts',
    # 6-letter words
    'sacred', 'shared',
}

# Build prefix set from word list (includes all proper prefixes)
def build_prefix_set(word_set: Set[str]) -> Set[str]:
    """Generate all prefixes from a word set."""
    prefixes = set()
    for word in word_set:
        for i in range(1, len(word) + 1):
            prefixes.add(word[:i])
    return prefixes


TEST_PREFIX_SET = build_prefix_set(TEST_WORDS)


# ============================================================================
# Main Benchmark
# ============================================================================

if __name__ == '__main__':
    print("=" * 70)
    print("WEND PUZZLE SOLVER - BENCHMARK")
    print("=" * 70)
    print(f"\nTest Grid (5x5):")
    for row in TEST_GRID:
        print("  " + " ".join(f"{cell:>2}" for cell in row))

    print(f"\nWord List: {len(TEST_WORDS)} words")
    print(f"Prefix Set: {len(TEST_PREFIX_SET)} prefixes")
    print(f"Target length: 4 cells")
    print("\n" + "-" * 70)

    solver = WendSolver(TEST_GRID)
    
    # Find all valid starting cells (not walls)
    start_cells = [
        (r, c) for r in range(len(TEST_GRID))
        for c in range(len(TEST_GRID[0]))
        if TEST_GRID[r][c] != '#'
    ]

    # ---- Test 1: find_words_pruned ----
    print("\n[1] find_words_pruned() - Dictionary-pruned DFS")
    print("-" * 70)
    
    start_time = time.perf_counter()
    pruned_results = []
    for start in start_cells:
        for word, coords in solver.find_words_pruned(start, 4, TEST_WORDS, TEST_PREFIX_SET):
            pruned_results.append((word, coords, start))
    elapsed_pruned = time.perf_counter() - start_time

    print(f"Found {len(pruned_results)} valid 4-letter words")
    print(f"Time: {elapsed_pruned * 1000:.2f} ms")
    
    # Show first 10 results
    print("\nFirst 10 results:")
    for word, coords, start in pruned_results[:10]:
        coord_str = " → ".join([f"({r},{c})" for r, c in coords])
        print(f"  {word.upper():>6}  |  {coord_str}")
    if len(pruned_results) > 10:
        print(f"  ... and {len(pruned_results) - 10} more")

    # ---- Test 2: find_all_paths ----
    print("\n" + "-" * 70)
    print("\n[2] find_all_paths() - Exhaustive enumeration (no pruning)")
    print("-" * 70)
    
    start_time = time.perf_counter()
    all_paths = []
    for start in start_cells:
        for word, coords in solver.find_all_paths(start, 4):
            all_paths.append((word, coords, start))
    elapsed_all = time.perf_counter() - start_time

    print(f"Found {len(all_paths)} total paths (all combinations)")
    print(f"Time: {elapsed_all * 1000:.2f} ms")
    
    # Show first 10 results
    print("\nFirst 10 results:")
    for word, coords, start in all_paths[:10]:
        coord_str = " → ".join([f"({r},{c})" for r, c in coords])
        in_dict = "✓" if word in TEST_WORDS else " "
        print(f"  [{in_dict}] {word.upper():>6}  |  {coord_str}")
    if len(all_paths) > 10:
        print(f"  ... and {len(all_paths) - 10} more")

    # ---- Summary ----
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Pruned (dictionary):  {len(pruned_results):5d} words in {elapsed_pruned * 1000:7.2f} ms")
    print(f"All paths (exhaustive): {len(all_paths):5d} paths  in {elapsed_all * 1000:7.2f} ms")
    pruning_ratio = len(pruned_results) / len(all_paths) if all_paths else 0
    print(f"Pruning ratio: {pruning_ratio * 100:5.1f}% of exhaustive search")
    print("=" * 70)
