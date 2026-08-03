"""Unit tests for the Wend Puzzle Solver."""

import unittest
from wend_solver import WendSolver, build_prefix_set


class TestWendSolver(unittest.TestCase):
    """Test cases for WendSolver class."""

    def setUp(self):
        """Set up test fixtures."""
        self.grid = [
            ['c', 'a', 't', 's', 'r'],
            ['a', '#', 'r', 'e', 'a'],
            ['r', 'd', 'o', 'g', 's'],
            ['s', 'u', 'n', '#', 'd'],
            ['h', 'e', 'y', 'b', 't'],
        ]
        self.solver = WendSolver(self.grid)

    def test_grid_initialization(self):
        """Test that grid is properly initialized."""
        self.assertEqual(self.solver.rows, 5)
        self.assertEqual(self.solver.cols, 5)

    def test_valid_cell_check(self):
        """Test _is_valid_cell method."""
        visited = set()
        # Valid cell
        self.assertTrue(self.solver._is_valid_cell(0, 0, visited))
        # Wall cell
        self.assertFalse(self.solver._is_valid_cell(1, 1, visited))
        # Out of bounds
        self.assertFalse(self.solver._is_valid_cell(10, 10, visited))
        # Visited cell
        visited.add((0, 0))
        self.assertFalse(self.solver._is_valid_cell(0, 0, visited))

    def test_get_neighbors(self):
        """Test _get_neighbors method."""
        # Corner cell (0,0) should have 2 neighbors
        neighbors = self.solver._get_neighbors(0, 0)
        self.assertEqual(len(neighbors), 2)
        self.assertIn((1, 0), neighbors)
        self.assertIn((0, 1), neighbors)
        
        # Interior cell (2,2) should have 4 neighbors
        neighbors = self.solver._get_neighbors(2, 2)
        self.assertEqual(len(neighbors), 4)
        
        # Adjacent to wall (1,0) has wall to the right
        neighbors = self.solver._get_neighbors(1, 0)
        self.assertNotIn((1, 1), neighbors)  # Wall

    def test_find_words_pruned_simple(self):
        """Test find_words_pruned with a simple word list."""
        words = {'cat', 'card', 'care', 'dear', 'read'}
        prefix_set = build_prefix_set(words)
        
        results = list(self.solver.find_words_pruned((0, 0), 3, words, prefix_set))
        
        # Should find 'cat'
        self.assertTrue(any(word == 'cat' for word, _ in results))

    def test_find_words_pruned_length_constraint(self):
        """Test that find_words_pruned respects length constraint."""
        words = {'card', 'care', 'cat'}
        prefix_set = build_prefix_set(words)
        
        # Search for length 4
        results = list(self.solver.find_words_pruned((0, 0), 4, words, prefix_set))
        
        # All results should have length 4
        for word, coords in results:
            self.assertEqual(len(word), 4)
            self.assertEqual(len(coords), 4)

    def test_find_words_pruned_no_revisit(self):
        """Test that paths don't revisit cells."""
        words = {'care', 'card', 'cat', 'arc'}
        prefix_set = build_prefix_set(words)
        
        results = list(self.solver.find_words_pruned((0, 0), 4, words, prefix_set))
        
        for word, coords in results:
            # Check no duplicate coordinates
            self.assertEqual(len(coords), len(set(coords)))

    def test_find_all_paths_count(self):
        """Test that find_all_paths returns multiple paths."""
        results = list(self.solver.find_all_paths((0, 0), 4))
        
        # Should find multiple 4-letter paths from (0,0)
        self.assertGreater(len(results), 3)
        
        # All should have length 4
        for word, coords in results:
            self.assertEqual(len(word), 4)
            self.assertEqual(len(coords), 4)

    def test_find_all_paths_no_revisit(self):
        """Test that find_all_paths doesn't revisit cells."""
        results = list(self.solver.find_all_paths((0, 0), 4))
        
        for word, coords in results:
            # Check no duplicate coordinates
            self.assertEqual(len(coords), len(set(coords)))

    def test_build_prefix_set(self):
        """Test prefix set generation."""
        words = {'cat', 'car', 'card'}
        prefixes = build_prefix_set(words)
        
        # Should include all single letters from word starts
        self.assertIn('c', prefixes)
        
        # Should include all prefixes
        self.assertIn('ca', prefixes)
        self.assertIn('car', prefixes)
        self.assertIn('card', prefixes)
        self.assertIn('cat', prefixes)
        
        # Should only have 5 unique prefixes (duplicates removed)
        self.assertEqual(len(prefixes), 5)

    def test_pruning_effectiveness(self):
        """Test that pruning reduces search space."""
        words = {'card', 'care', 'dear', 'read', 'dare', 'darn', 'dart'}
        prefix_set = build_prefix_set(words)
        
        # With pruning
        pruned_count = len(list(
            self.solver.find_words_pruned((0, 0), 4, words, prefix_set)
        ))
        
        # Without pruning (all paths of length 4)
        all_count = len(list(self.solver.find_all_paths((0, 0), 4)))
        
        # Pruned should be much smaller
        self.assertLess(pruned_count, all_count)
        ratio = pruned_count / all_count if all_count > 0 else 0
        self.assertLess(ratio, 0.5)  # Pruning should eliminate >50%


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and boundary conditions."""

    def test_single_cell_grid(self):
        """Test with 1x1 grid."""
        grid = [['a']]
        solver = WendSolver(grid)
        
        results = list(solver.find_all_paths((0, 0), 1))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0][0], 'a')

    def test_all_walls(self):
        """Test with grid that's mostly walls."""
        grid = [
            ['a', '#', '#'],
            ['#', '#', '#'],
            ['#', '#', 'b'],
        ]
        solver = WendSolver(grid)
        
        results = list(solver.find_all_paths((0, 0), 2))
        # Can't reach anywhere from 'a', only paths of length 1
        results_1 = list(solver.find_all_paths((0, 0), 1))
        self.assertEqual(len(results_1), 1)

    def test_isolated_cells(self):
        """Test with isolated cell (surrounded by walls)."""
        grid = [
            ['#', '#', '#'],
            ['#', 'a', '#'],
            ['#', '#', '#'],
        ]
        solver = WendSolver(grid)
        
        results = list(solver.find_all_paths((1, 1), 2))
        # Should only find paths of length 1
        self.assertEqual(len(results), 0)
        
        results_1 = list(solver.find_all_paths((1, 1), 1))
        self.assertEqual(len(results_1), 1)

    def test_invalid_start(self):
        """Test starting from wall cell."""
        grid = [
            ['a', 'b'],
            ['c', '#'],
        ]
        solver = WendSolver(grid)
        
        # Starting from wall should return empty
        results = list(solver.find_all_paths((1, 1), 2))
        self.assertEqual(len(results), 0)

    def test_length_longer_than_grid(self):
        """Test searching for paths longer than grid size."""
        grid = [
            ['a', 'b'],
            ['c', 'd'],
        ]
        solver = WendSolver(grid)
        
        # Maximum path in 2x2 is 4
        results = list(solver.find_all_paths((0, 0), 5))
        self.assertEqual(len(results), 0)


if __name__ == '__main__':
    unittest.main()
