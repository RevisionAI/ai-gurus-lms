/**
 * GradebookCell Component Tests
 * Story: 2.1 - Gradebook Grid View Implementation
 * AC: 2.1.3, 2.1.4, 2.1.8
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GradebookCell } from '@/components/gradebook/GradebookCell';
import { GradebookCellProps, CellStatus } from '@/components/gradebook/types';

// Helper to create cell props
function createCellProps(
  status: CellStatus,
  score: number | null = null,
  maxPoints: number = 100,
  onClick?: () => void
): GradebookCellProps {
  return {
    cell: {
      assignmentId: 'assignment-1',
      score,
      status,
      submissionId: score !== null ? 'submission-1' : null,
    },
    maxPoints,
    onClick,
  };
}

describe('GradebookCell', () => {
  describe('Display', () => {
    it('displays score when graded', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('graded', 85, 100)} />
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('/100')).toBeInTheDocument();
    });

    it('displays dash when missing (not submitted)', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('missing', null, 100)} />
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('displays clock icon when pending grade', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('pending', null, 100)} />
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    it('displays warning icon for late submission', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('late', null, 100)} />
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('applies green color for graded status', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('graded', 85, 100)} />
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveClass('bg-green-100');
      expect(cell).toHaveClass('text-green-800');
    });

    it('applies yellow color for pending status', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('pending', null, 100)} />
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveClass('bg-yellow-100');
      expect(cell).toHaveClass('text-yellow-800');
    });

    it('applies orange color for late status', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('late', null, 100)} />
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveClass('bg-orange-100');
      expect(cell).toHaveClass('text-orange-800');
    });

    it('applies red color for missing status', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('missing', null, 100)} />
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveClass('bg-red-100');
      expect(cell).toHaveClass('text-red-800');
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('graded', 85, 100, handleClick)} />
            </tr>
          </tbody>
        </table>
      );

      fireEvent.click(screen.getByRole('gridcell'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard Enter key', () => {
      const handleClick = jest.fn();
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('graded', 85, 100, handleClick)} />
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByRole('gridcell');
      fireEvent.keyDown(cell, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard Space key', () => {
      const handleClick = jest.fn();
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('graded', 85, 100, handleClick)} />
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByRole('gridcell');
      fireEvent.keyDown(cell, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA role', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('graded', 85, 100)} />
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByRole('gridcell')).toBeInTheDocument();
    });

    it('has accessible label for graded cell', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('graded', 85, 100)} />
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveAttribute(
        'aria-label',
        expect.stringContaining('score: 85 out of 100')
      );
    });

    it('has accessible label for pending cell', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('pending', null, 100)} />
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Pending grade')
      );
    });

    it('is focusable with tabIndex', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('graded', 85, 100)} />
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero score', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('graded', 0, 100)} />
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles perfect score', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('graded', 100, 100)} />
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('handles different max points', () => {
      render(
        <table>
          <tbody>
            <tr>
              <GradebookCell {...createCellProps('graded', 45, 50)} />
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('/50')).toBeInTheDocument();
    });
  });
});
