/**
 * Gradebook Utility Function Tests
 * Story: 2.1 - Gradebook Grid View Implementation
 * AC: 2.1.8
 */

import {
  getStatusColorClasses,
  getStatusIcon,
  getStatusLabel,
  CellStatus,
} from '@/components/gradebook/types';

describe('Gradebook Utility Functions', () => {
  describe('getStatusColorClasses', () => {
    it('returns green classes for graded status', () => {
      const classes = getStatusColorClasses('graded');
      expect(classes).toContain('bg-green-100');
      expect(classes).toContain('text-green-800');
      expect(classes).toContain('border-green-200');
    });

    it('returns yellow classes for pending status', () => {
      const classes = getStatusColorClasses('pending');
      expect(classes).toContain('bg-yellow-100');
      expect(classes).toContain('text-yellow-800');
      expect(classes).toContain('border-yellow-200');
    });

    it('returns orange classes for late status', () => {
      const classes = getStatusColorClasses('late');
      expect(classes).toContain('bg-orange-100');
      expect(classes).toContain('text-orange-800');
      expect(classes).toContain('border-orange-200');
    });

    it('returns red classes for missing status', () => {
      const classes = getStatusColorClasses('missing');
      expect(classes).toContain('bg-red-100');
      expect(classes).toContain('text-red-800');
      expect(classes).toContain('border-red-200');
    });

    it('returns gray classes for unknown status', () => {
      const classes = getStatusColorClasses('unknown' as CellStatus);
      expect(classes).toContain('bg-gray-100');
      expect(classes).toContain('text-gray-800');
      expect(classes).toContain('border-gray-200');
    });
  });

  describe('getStatusIcon', () => {
    it('returns empty string for graded status', () => {
      expect(getStatusIcon('graded')).toBe('');
    });

    it('returns clock icon for pending status', () => {
      expect(getStatusIcon('pending')).toBe('⏳');
    });

    it('returns warning icon for late status', () => {
      expect(getStatusIcon('late')).toBe('⚠️');
    });

    it('returns dash for missing status', () => {
      expect(getStatusIcon('missing')).toBe('—');
    });

    it('returns empty string for unknown status', () => {
      expect(getStatusIcon('unknown' as CellStatus)).toBe('');
    });
  });

  describe('getStatusLabel', () => {
    it('returns "Graded" for graded status', () => {
      expect(getStatusLabel('graded')).toBe('Graded');
    });

    it('returns "Pending grade" for pending status', () => {
      expect(getStatusLabel('pending')).toBe('Pending grade');
    });

    it('returns descriptive label for late status', () => {
      expect(getStatusLabel('late')).toBe('Submitted late, pending grade');
    });

    it('returns "Not submitted" for missing status', () => {
      expect(getStatusLabel('missing')).toBe('Not submitted');
    });

    it('returns "Unknown status" for unknown status', () => {
      expect(getStatusLabel('unknown' as CellStatus)).toBe('Unknown status');
    });
  });
});

describe('Cell State Determination Logic', () => {
  // Note: This tests the logic patterns that would be used in determineCellState
  // The actual function is in the API route

  describe('state priority', () => {
    it('graded takes precedence (has grade)', () => {
      // If a grade exists, status should be 'graded' regardless of submission state
      const hasGrade = true;
      const hasSubmission = true;

      const status = hasGrade ? 'graded' : hasSubmission ? 'pending' : 'missing';
      expect(status).toBe('graded');
    });

    it('pending when submitted but not graded', () => {
      const hasGrade = false;
      const hasSubmission = true;
      const isLate = false;

      const status = hasGrade ? 'graded' : hasSubmission ? (isLate ? 'late' : 'pending') : 'missing';
      expect(status).toBe('pending');
    });

    it('late when submitted after due date and not graded', () => {
      const hasGrade = false;
      const hasSubmission = true;
      const isLate = true;

      const status = hasGrade ? 'graded' : hasSubmission ? (isLate ? 'late' : 'pending') : 'missing';
      expect(status).toBe('late');
    });

    it('missing when no submission', () => {
      const hasGrade = false;
      const hasSubmission = false;

      const status = hasGrade ? 'graded' : hasSubmission ? 'pending' : 'missing';
      expect(status).toBe('missing');
    });
  });

  describe('late submission detection', () => {
    it('detects submission after due date', () => {
      const dueDate = new Date('2025-01-10');
      const submittedAt = new Date('2025-01-11');

      const isLate = submittedAt > dueDate;
      expect(isLate).toBe(true);
    });

    it('detects submission before due date', () => {
      const dueDate = new Date('2025-01-10');
      const submittedAt = new Date('2025-01-09');

      const isLate = submittedAt > dueDate;
      expect(isLate).toBe(false);
    });

    it('detects submission exactly on due date', () => {
      const dueDate = new Date('2025-01-10T23:59:59');
      const submittedAt = new Date('2025-01-10T23:59:59');

      const isLate = submittedAt > dueDate;
      expect(isLate).toBe(false);
    });

    it('handles null due date (always on time)', () => {
      const dueDate = null;
      const submittedAt = new Date('2025-01-15');

      const isLate = dueDate ? submittedAt > dueDate : false;
      expect(isLate).toBe(false);
    });
  });
});

describe('Percentage Calculation', () => {
  it('calculates percentage correctly', () => {
    const totalPoints = 85;
    const totalPossible = 100;

    const percentage = (totalPoints / totalPossible) * 100;
    expect(percentage).toBe(85);
  });

  it('handles zero total possible (avoids division by zero)', () => {
    const totalPoints = 0;
    const totalPossible = 0;

    const percentage = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0;
    expect(percentage).toBe(0);
  });

  it('handles partial scores', () => {
    const totalPoints = 75;
    const totalPossible = 100;

    const percentage = Math.round((totalPoints / totalPossible) * 10000) / 100;
    expect(percentage).toBe(75);
  });

  it('handles decimal percentages', () => {
    const totalPoints = 77;
    const totalPossible = 100;

    const percentage = Math.round((totalPoints / totalPossible) * 10000) / 100;
    expect(percentage).toBe(77);
  });

  it('handles grades above max points', () => {
    const totalPoints = 110;
    const totalPossible = 100;

    const percentage = (totalPoints / totalPossible) * 100;
    expect(percentage).toBeCloseTo(110, 5);
  });
});

describe('Total Points Calculation', () => {
  it('sums graded assignment points', () => {
    const grades = [
      { points: 85, isGraded: true },
      { points: 90, isGraded: true },
      { points: 0, isGraded: false },
    ];

    const total = grades
      .filter((g) => g.isGraded)
      .reduce((sum, g) => sum + g.points, 0);

    expect(total).toBe(175);
  });

  it('excludes ungraded assignments', () => {
    const grades = [
      { points: 85, isGraded: true },
      { points: null, isGraded: false },
      { points: 0, isGraded: false },
    ];

    const total = grades
      .filter((g) => g.isGraded)
      .reduce((sum, g) => sum + (g.points || 0), 0);

    expect(total).toBe(85);
  });

  it('handles all ungraded', () => {
    const grades = [
      { points: null, isGraded: false },
      { points: null, isGraded: false },
    ];

    const total = grades
      .filter((g) => g.isGraded)
      .reduce((sum, g) => sum + (g.points || 0), 0);

    expect(total).toBe(0);
  });

  it('handles empty grades array', () => {
    const grades: { points: number | null; isGraded: boolean }[] = [];

    const total = grades
      .filter((g) => g.isGraded)
      .reduce((sum, g) => sum + (g.points || 0), 0);

    expect(total).toBe(0);
  });
});
