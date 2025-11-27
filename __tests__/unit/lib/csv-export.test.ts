/**
 * CSV Export Utility Unit Tests
 *
 * Tests for the CSV export utilities.
 * Story: 2.3 - Gradebook Filtering & CSV Export
 */

import {
  escapeCSV,
  generateGradebookCSV,
  generateCSVFilename,
  validateExportData,
  getExportStats,
  CSVGradebookMatrix,
} from '@/lib/csv-export';

describe('escapeCSV', () => {
  describe('basic values', () => {
    it('returns string as-is when no special characters', () => {
      expect(escapeCSV('John Smith')).toBe('John Smith');
    });

    it('returns number as string', () => {
      expect(escapeCSV(85)).toBe('85');
      expect(escapeCSV(85.5)).toBe('85.5');
    });

    it('returns "N/A" for null', () => {
      expect(escapeCSV(null)).toBe('N/A');
    });

    it('returns "N/A" for undefined', () => {
      expect(escapeCSV(undefined)).toBe('N/A');
    });
  });

  describe('special character escaping', () => {
    it('wraps values containing commas in quotes', () => {
      expect(escapeCSV('Smith, John')).toBe('"Smith, John"');
    });

    it('wraps values containing quotes in quotes and doubles embedded quotes', () => {
      expect(escapeCSV('John "Johnny" Smith')).toBe('"John ""Johnny"" Smith"');
    });

    it('wraps values containing newlines in quotes', () => {
      expect(escapeCSV('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    });

    it('wraps values containing carriage returns in quotes', () => {
      expect(escapeCSV('Line 1\rLine 2')).toBe('"Line 1\rLine 2"');
    });

    it('handles multiple special characters', () => {
      expect(escapeCSV('Smith, John "Johnny"\nStudent')).toBe(
        '"Smith, John ""Johnny""\nStudent"'
      );
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(escapeCSV('')).toBe('');
    });

    it('handles zero', () => {
      expect(escapeCSV(0)).toBe('0');
    });

    it('handles negative numbers', () => {
      expect(escapeCSV(-5)).toBe('-5');
    });
  });
});

describe('generateGradebookCSV', () => {
  const createTestMatrix = (overrides?: Partial<CSVGradebookMatrix>): CSVGradebookMatrix => ({
    students: [
      {
        id: 'student1',
        name: 'John Smith',
        email: 'john@test.com',
        grades: [
          { assignmentId: 'assign1', score: 90, status: 'graded' },
          { assignmentId: 'assign2', score: 85, status: 'graded' },
        ],
        totalPoints: 175,
        percentage: 87.5,
        gpa: 3.0,
      },
    ],
    assignments: [
      { id: 'assign1', title: 'Assignment 1', maxPoints: 100 },
      { id: 'assign2', title: 'Assignment 2', maxPoints: 100 },
    ],
    courseCode: 'CS101',
    courseTitle: 'Intro to CS',
    ...overrides,
  });

  it('generates valid CSV with header row', () => {
    // Arrange
    const matrix = createTestMatrix();

    // Act
    const csv = generateGradebookCSV(matrix);

    // Assert - Check header (after BOM)
    const lines = csv.split('\n');
    expect(lines[0]).toContain('Student Name');
    expect(lines[0]).toContain('Email');
    expect(lines[0]).toContain('Assignment 1 (100)');
    expect(lines[0]).toContain('Total Points');
    expect(lines[0]).toContain('Percentage');
    expect(lines[0]).toContain('GPA');
  });

  it('includes UTF-8 BOM at start', () => {
    // Arrange
    const matrix = createTestMatrix();

    // Act
    const csv = generateGradebookCSV(matrix);

    // Assert - BOM is \uFEFF
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('includes student data rows', () => {
    // Arrange
    const matrix = createTestMatrix();

    // Act
    const csv = generateGradebookCSV(matrix);
    const lines = csv.split('\n');

    // Assert
    expect(lines[1]).toContain('John Smith');
    expect(lines[1]).toContain('john@test.com');
    expect(lines[1]).toContain('90');
    expect(lines[1]).toContain('85');
    expect(lines[1]).toContain('175/200');
    expect(lines[1]).toContain('87.5%');
    expect(lines[1]).toContain('3.00');
  });

  it('handles null GPA', () => {
    // Arrange
    const matrix = createTestMatrix({
      students: [
        {
          id: 'student1',
          name: 'Jane Doe',
          email: 'jane@test.com',
          grades: [],
          totalPoints: 0,
          percentage: 0,
          gpa: null,
        },
      ],
      assignments: [],
    });

    // Act
    const csv = generateGradebookCSV(matrix);
    const lines = csv.split('\n');

    // Assert
    expect(lines[1]).toContain('N/A');
  });

  it('handles null scores (status instead)', () => {
    // Arrange
    const matrix = createTestMatrix({
      students: [
        {
          id: 'student1',
          name: 'Jane Doe',
          email: 'jane@test.com',
          grades: [{ assignmentId: 'assign1', score: null, status: 'missing' }],
          totalPoints: 0,
          percentage: 0,
          gpa: null,
        },
      ],
      assignments: [{ id: 'assign1', title: 'Test', maxPoints: 100 }],
    });

    // Act
    const csv = generateGradebookCSV(matrix);
    const lines = csv.split('\n');

    // Assert
    expect(lines[1]).toContain('missing');
  });

  it('handles multiple students', () => {
    // Arrange
    const matrix = createTestMatrix({
      students: [
        {
          id: 'student1',
          name: 'John Smith',
          email: 'john@test.com',
          grades: [],
          totalPoints: 90,
          percentage: 90,
          gpa: 4.0,
        },
        {
          id: 'student2',
          name: 'Jane Doe',
          email: 'jane@test.com',
          grades: [],
          totalPoints: 80,
          percentage: 80,
          gpa: 3.0,
        },
      ],
      assignments: [],
    });

    // Act
    const csv = generateGradebookCSV(matrix);
    const lines = csv.split('\n');

    // Assert
    expect(lines.length).toBe(3); // Header + 2 students
    expect(lines[1]).toContain('John Smith');
    expect(lines[2]).toContain('Jane Doe');
  });

  it('escapes special characters in student names', () => {
    // Arrange
    const matrix = createTestMatrix({
      students: [
        {
          id: 'student1',
          name: 'Smith, John "Johnny"',
          email: 'john@test.com',
          grades: [],
          totalPoints: 0,
          percentage: 0,
          gpa: null,
        },
      ],
      assignments: [],
    });

    // Act
    const csv = generateGradebookCSV(matrix);

    // Assert
    expect(csv).toContain('"Smith, John ""Johnny"""');
  });
});

describe('generateCSVFilename', () => {
  it('generates filename with course code and date', () => {
    // Arrange
    const courseCode = 'CS101';

    // Act
    const filename = generateCSVFilename(courseCode);

    // Assert
    expect(filename).toMatch(/^CS101_grades_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('sanitizes course code with special characters', () => {
    // Arrange
    const courseCode = 'CS 101/A';

    // Act
    const filename = generateCSVFilename(courseCode);

    // Assert
    expect(filename).toMatch(/^CS_101_A_grades_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(filename).not.toContain(' ');
    expect(filename).not.toContain('/');
  });

  it('preserves hyphens and underscores', () => {
    // Arrange
    const courseCode = 'CS-101_Fall';

    // Act
    const filename = generateCSVFilename(courseCode);

    // Assert
    expect(filename).toMatch(/^CS-101_Fall_grades_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

describe('validateExportData', () => {
  it('returns valid for matrix with students', () => {
    // Arrange
    const matrix: CSVGradebookMatrix = {
      students: [{ id: '1', name: 'Test', email: 'test@test.com', grades: [], totalPoints: 0, percentage: 0, gpa: null }],
      assignments: [],
      courseCode: 'CS101',
      courseTitle: 'Test',
    };

    // Act
    const result = validateExportData(matrix);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns invalid for empty students array', () => {
    // Arrange
    const matrix: CSVGradebookMatrix = {
      students: [],
      assignments: [],
      courseCode: 'CS101',
      courseTitle: 'Test',
    };

    // Act
    const result = validateExportData(matrix);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('No students');
  });

  it('returns valid for students with no assignments', () => {
    // Arrange
    const matrix: CSVGradebookMatrix = {
      students: [{ id: '1', name: 'Test', email: 'test@test.com', grades: [], totalPoints: 0, percentage: 0, gpa: null }],
      assignments: [],
      courseCode: 'CS101',
      courseTitle: 'Test',
    };

    // Act
    const result = validateExportData(matrix);

    // Assert
    expect(result.isValid).toBe(true);
  });
});

describe('getExportStats', () => {
  it('returns correct statistics', () => {
    // Arrange
    const matrix: CSVGradebookMatrix = {
      students: [
        { id: '1', name: 'Student 1', email: 's1@test.com', grades: [], totalPoints: 0, percentage: 0, gpa: null },
        { id: '2', name: 'Student 2', email: 's2@test.com', grades: [], totalPoints: 0, percentage: 0, gpa: null },
      ],
      assignments: [
        { id: 'a1', title: 'Assignment 1', maxPoints: 100 },
        { id: 'a2', title: 'Assignment 2', maxPoints: 100 },
        { id: 'a3', title: 'Assignment 3', maxPoints: 100 },
      ],
      courseCode: 'CS101',
      courseTitle: 'Test',
    };

    // Act
    const stats = getExportStats(matrix);

    // Assert
    expect(stats.studentCount).toBe(2);
    expect(stats.assignmentCount).toBe(3);
    // totalCells = 2 students * (3 assignments + 5 extra columns)
    expect(stats.totalCells).toBe(16);
    expect(stats.estimatedSize).toBeGreaterThan(0);
  });

  it('handles empty matrix', () => {
    // Arrange
    const matrix: CSVGradebookMatrix = {
      students: [],
      assignments: [],
      courseCode: 'CS101',
      courseTitle: 'Test',
    };

    // Act
    const stats = getExportStats(matrix);

    // Assert
    expect(stats.studentCount).toBe(0);
    expect(stats.assignmentCount).toBe(0);
    expect(stats.totalCells).toBe(0);
  });
});
