/**
 * Gradebook Validation Unit Tests
 *
 * Tests for grade validation schemas and functions.
 * Story: 2.2 - Gradebook Inline Editing with Confirmation
 * Story: 2.3 - Gradebook Filtering & CSV Export
 */

import {
  gradeUpdateSchema,
  gradebookFiltersSchema,
  parseGradebookFilters,
  hasActiveFilters,
  gradeStatusValues,
  BulkGradeUpdateInput,
} from '@/validators/gradebook';

describe('gradeUpdateSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid grade with valid CUID submission ID', () => {
      // Arrange
      const input = {
        submissionId: 'cjld2cjxh0000qzrmn831i7rn',
        grade: 85,
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionId).toBe('cjld2cjxh0000qzrmn831i7rn');
        expect(result.data.grade).toBe(85);
      }
    });

    it('accepts grade of 0', () => {
      // Arrange
      const input = {
        submissionId: 'cjld2cjxh0000qzrmn831i7rn',
        grade: 0,
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('accepts decimal grades', () => {
      // Arrange
      const input = {
        submissionId: 'cjld2cjxh0000qzrmn831i7rn',
        grade: 85.5,
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(85.5);
      }
    });

    it('accepts high grades (100+)', () => {
      // Arrange - Extra credit scenario
      const input = {
        submissionId: 'cjld2cjxh0000qzrmn831i7rn',
        grade: 110,
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects negative grades', () => {
      // Arrange
      const input = {
        submissionId: 'cjld2cjxh0000qzrmn831i7rn',
        grade: -5,
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('rejects non-numeric grade', () => {
      // Arrange
      const input = {
        submissionId: 'cjld2cjxh0000qzrmn831i7rn',
        grade: 'A',
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('rejects missing grade', () => {
      // Arrange
      const input = {
        submissionId: 'cjld2cjxh0000qzrmn831i7rn',
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('rejects invalid CUID format', () => {
      // Arrange
      const input = {
        submissionId: 'invalid-id',
        grade: 85,
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('rejects missing submissionId', () => {
      // Arrange
      const input = {
        grade: 85,
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('rejects null submissionId', () => {
      // Arrange
      const input = {
        submissionId: null,
        grade: 85,
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('rejects NaN grade', () => {
      // Arrange
      const input = {
        submissionId: 'cjld2cjxh0000qzrmn831i7rn',
        grade: NaN,
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('rejects Infinity grade', () => {
      // Arrange
      const input = {
        submissionId: 'cjld2cjxh0000qzrmn831i7rn',
        grade: Infinity,
      };

      // Act
      const result = gradeUpdateSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('gradebookFiltersSchema', () => {
  describe('valid inputs', () => {
    it('accepts empty filter object', () => {
      // Arrange
      const input = {};

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('all');
        expect(result.data.studentFilter).toBeUndefined();
        expect(result.data.assignmentId).toBeUndefined();
      }
    });

    it('accepts valid student filter string', () => {
      // Arrange
      const input = { studentFilter: 'John' };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.studentFilter).toBe('John');
      }
    });

    it('accepts valid assignment ID (CUID)', () => {
      // Arrange
      const input = { assignmentId: 'cjld2cjxh0000qzrmn831i7rn' };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assignmentId).toBe('cjld2cjxh0000qzrmn831i7rn');
      }
    });

    it('accepts valid date range', () => {
      // Arrange
      const input = {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dateFrom).toBe('2024-01-01');
        expect(result.data.dateTo).toBe('2024-12-31');
      }
    });

    it('accepts valid status filter', () => {
      // Arrange - Test all valid status values
      for (const status of gradeStatusValues) {
        const result = gradebookFiltersSchema.safeParse({ status });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      }
    });

    it('accepts all filters combined', () => {
      // Arrange
      const input = {
        studentFilter: 'Smith',
        assignmentId: 'cjld2cjxh0000qzrmn831i7rn',
        dateFrom: '2024-01-01',
        dateTo: '2024-06-30',
        status: 'graded' as const,
      };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('transforms empty strings to undefined', () => {
      // Arrange
      const input = {
        studentFilter: '',
        assignmentId: '',
        dateFrom: '',
        dateTo: '',
      };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.studentFilter).toBeUndefined();
        expect(result.data.assignmentId).toBeUndefined();
        expect(result.data.dateFrom).toBeUndefined();
        expect(result.data.dateTo).toBeUndefined();
      }
    });

    it('accepts dateFrom only', () => {
      // Arrange
      const input = { dateFrom: '2024-01-01' };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('accepts dateTo only', () => {
      // Arrange
      const input = { dateTo: '2024-12-31' };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects student filter exceeding 200 characters', () => {
      // Arrange
      const input = { studentFilter: 'a'.repeat(201) };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('rejects invalid assignment ID format', () => {
      // Arrange
      const input = { assignmentId: 'invalid-id' };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      // Arrange
      const input = { dateFrom: 'not-a-date' };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('rejects invalid status value', () => {
      // Arrange
      const input = { status: 'invalid-status' };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('rejects dateFrom > dateTo', () => {
      // Arrange
      const input = {
        dateFrom: '2024-12-31',
        dateTo: '2024-01-01',
      };

      // Act
      const result = gradebookFiltersSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('parseGradebookFilters', () => {
  it('parses valid query parameters', () => {
    // Arrange
    const params = new URLSearchParams();
    params.set('studentFilter', 'John');
    params.set('status', 'graded');

    // Act
    const result = parseGradebookFilters(params);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.studentFilter).toBe('John');
      expect(result.data.status).toBe('graded');
    }
  });

  it('handles empty query parameters', () => {
    // Arrange
    const params = new URLSearchParams();

    // Act
    const result = parseGradebookFilters(params);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('all');
    }
  });

  it('returns error for invalid parameters', () => {
    // Arrange
    const params = new URLSearchParams();
    params.set('status', 'invalid');

    // Act
    const result = parseGradebookFilters(params);

    // Assert
    expect(result.success).toBe(false);
  });

  it('parses date parameters correctly', () => {
    // Arrange
    const params = new URLSearchParams();
    params.set('dateFrom', '2024-01-01');
    params.set('dateTo', '2024-12-31');

    // Act
    const result = parseGradebookFilters(params);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dateFrom).toBe('2024-01-01');
      expect(result.data.dateTo).toBe('2024-12-31');
    }
  });
});

describe('hasActiveFilters', () => {
  it('returns false for default filters', () => {
    // Arrange
    const filters = { status: 'all' as const };

    // Act
    const result = hasActiveFilters(filters);

    // Assert
    expect(result).toBe(false);
  });

  it('returns true when studentFilter is set', () => {
    // Arrange
    const filters = {
      studentFilter: 'John',
      status: 'all' as const,
    };

    // Act
    const result = hasActiveFilters(filters);

    // Assert
    expect(result).toBe(true);
  });

  it('returns true when assignmentId is set', () => {
    // Arrange
    const filters = {
      assignmentId: 'cjld2cjxh0000qzrmn831i7rn',
      status: 'all' as const,
    };

    // Act
    const result = hasActiveFilters(filters);

    // Assert
    expect(result).toBe(true);
  });

  it('returns true when status is not "all"', () => {
    // Arrange
    const filters = { status: 'graded' as const };

    // Act
    const result = hasActiveFilters(filters);

    // Assert
    expect(result).toBe(true);
  });

  it('returns true when dateFrom is set', () => {
    // Arrange
    const filters = {
      dateFrom: '2024-01-01',
      status: 'all' as const,
    };

    // Act
    const result = hasActiveFilters(filters);

    // Assert
    expect(result).toBe(true);
  });

  it('returns true when dateTo is set', () => {
    // Arrange
    const filters = {
      dateTo: '2024-12-31',
      status: 'all' as const,
    };

    // Act
    const result = hasActiveFilters(filters);

    // Assert
    expect(result).toBe(true);
  });
});

describe('Grade Validation Helper (conceptual)', () => {
  /**
   * Helper function that mirrors the validation in EditableGradeCell
   */
  function validateGrade(value: string, maxPoints: number): { isValid: boolean; error: string | null } {
    if (value.trim() === '') {
      return { isValid: false, error: 'Grade is required' };
    }

    const numericRegex = /^-?\d*\.?\d*$/;
    if (!numericRegex.test(value)) {
      return { isValid: false, error: 'Grade must be a number' };
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return { isValid: false, error: 'Grade must be a number' };
    }

    if (numValue < 0) {
      return { isValid: false, error: 'Grade cannot be negative' };
    }

    if (numValue > maxPoints) {
      return { isValid: false, error: `Grade cannot exceed ${maxPoints}` };
    }

    return { isValid: true, error: null };
  }

  describe('valid inputs', () => {
    it('accepts valid grade within max points', () => {
      expect(validateGrade('85', 100).isValid).toBe(true);
    });

    it('accepts grade equal to max points', () => {
      expect(validateGrade('100', 100).isValid).toBe(true);
    });

    it('accepts grade of 0', () => {
      expect(validateGrade('0', 100).isValid).toBe(true);
    });

    it('accepts decimal grades', () => {
      expect(validateGrade('85.5', 100).isValid).toBe(true);
    });

    it('does not accept whitespace-padded input (strict parsing)', () => {
      // The validation function checks numeric regex first before parsing
      // Whitespace-padded input fails the regex check
      expect(validateGrade('  85  ', 100).isValid).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty string', () => {
      const result = validateGrade('', 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Grade is required');
    });

    it('rejects whitespace-only string', () => {
      const result = validateGrade('   ', 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Grade is required');
    });

    it('rejects non-numeric string', () => {
      const result = validateGrade('abc', 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Grade must be a number');
    });

    it('rejects negative grade', () => {
      const result = validateGrade('-5', 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Grade cannot be negative');
    });

    it('rejects grade exceeding max points', () => {
      const result = validateGrade('105', 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Grade cannot exceed 100');
    });

    it('rejects mixed input like "5a"', () => {
      const result = validateGrade('5a', 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Grade must be a number');
    });
  });

  describe('edge cases', () => {
    it('handles very small decimal grades', () => {
      expect(validateGrade('0.001', 100).isValid).toBe(true);
    });

    it('handles grades at exact boundary', () => {
      expect(validateGrade('100', 100).isValid).toBe(true);
      expect(validateGrade('100.001', 100).isValid).toBe(false);
    });

    it('handles different max points', () => {
      expect(validateGrade('50', 50).isValid).toBe(true);
      expect(validateGrade('51', 50).isValid).toBe(false);
    });
  });
});
