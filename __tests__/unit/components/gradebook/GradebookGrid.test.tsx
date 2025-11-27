/**
 * GradebookGrid Component Tests
 * Story: 2.1 - Gradebook Grid View Implementation
 * AC: 2.1.1, 2.1.2, 2.1.5, 2.1.8
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { GradebookGrid } from '@/components/gradebook/GradebookGrid';
import {
  GradebookStudent,
  GradebookAssignment,
} from '@/components/gradebook/types';

// Helper to create test data
function createTestData(
  numStudents: number = 3,
  numAssignments: number = 2
): {
  students: GradebookStudent[];
  assignments: GradebookAssignment[];
} {
  const assignments: GradebookAssignment[] = Array.from(
    { length: numAssignments },
    (_, i) => ({
      id: `assignment-${i + 1}`,
      title: `Assignment ${i + 1}`,
      maxPoints: 100,
      dueDate: new Date('2025-01-15'),
    })
  );

  const students: GradebookStudent[] = Array.from(
    { length: numStudents },
    (_, i) => ({
      id: `student-${i + 1}`,
      name: `Student ${i + 1}`,
      email: `student${i + 1}@test.com`,
      grades: assignments.map((a, j) => ({
        assignmentId: a.id,
        score: (i + 1) * 10 + j * 5,
        status: 'graded' as const,
        submissionId: `submission-${i}-${j}`,
      })),
      totalPoints: numAssignments * 50,
      percentage: 75.5,
      gpa: 3.0,
    })
  );

  return { students, assignments };
}

describe('GradebookGrid', () => {
  describe('Rendering', () => {
    it('renders grid with correct number of rows', () => {
      const { students, assignments } = createTestData(5, 3);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      // 5 student rows
      students.forEach((student) => {
        expect(screen.getByText(student.name)).toBeInTheDocument();
      });
    });

    it('renders grid with correct number of assignment columns', () => {
      const { students, assignments } = createTestData(3, 4);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      // 4 assignment headers
      assignments.forEach((assignment) => {
        expect(screen.getByText(assignment.title)).toBeInTheDocument();
      });
    });

    it('displays student names in first column', () => {
      const { students, assignments } = createTestData(3, 2);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      expect(screen.getByText('Student 1')).toBeInTheDocument();
      expect(screen.getByText('Student 2')).toBeInTheDocument();
      expect(screen.getByText('Student 3')).toBeInTheDocument();
    });

    it('displays student emails', () => {
      const { students, assignments } = createTestData(2, 2);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      expect(screen.getByText('student1@test.com')).toBeInTheDocument();
      expect(screen.getByText('student2@test.com')).toBeInTheDocument();
    });

    it('displays assignment headers with point values', () => {
      const { students, assignments } = createTestData(2, 2);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      // Check for point values in headers
      const pointLabels = screen.getAllByText('100 pts');
      expect(pointLabels.length).toBe(2);
    });

    it('displays summary columns (Total, %, GPA)', () => {
      const { students, assignments } = createTestData(2, 2);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('%')).toBeInTheDocument();
      expect(screen.getByText('GPA')).toBeInTheDocument();
    });

    it('displays GPA values correctly', () => {
      const { students, assignments } = createTestData(2, 2);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      // Both students have GPA 3.0
      const gpaValues = screen.getAllByText('3.00');
      expect(gpaValues.length).toBe(2);
    });

    it('displays percentage values correctly', () => {
      const { students, assignments } = createTestData(2, 2);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      const percentageValues = screen.getAllByText('75.5%');
      expect(percentageValues.length).toBe(2);
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no students enrolled', () => {
      const { assignments } = createTestData(0, 3);

      render(
        <GradebookGrid
          students={[]}
          assignments={assignments}
        />
      );

      expect(
        screen.getByText('No students enrolled in this course.')
      ).toBeInTheDocument();
    });

    it('shows empty state when no assignments', () => {
      const { students } = createTestData(3, 0);

      render(
        <GradebookGrid
          students={students.map((s) => ({ ...s, grades: [] }))}
          assignments={[]}
        />
      );

      expect(
        screen.getByText('No published assignments in this course.')
      ).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows skeleton loader when loading', () => {
      const { students, assignments } = createTestData(2, 2);

      const { container } = render(
        <GradebookGrid
          students={students}
          assignments={assignments}
          isLoading={true}
        />
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('does not show skeleton when not loading', () => {
      const { students, assignments } = createTestData(2, 2);

      const { container } = render(
        <GradebookGrid
          students={students}
          assignments={assignments}
          isLoading={false}
        />
      );

      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has grid role on table', () => {
      const { students, assignments } = createTestData(2, 2);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('has region role on container', () => {
      const { students, assignments } = createTestData(2, 2);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('has aria-label on container', () => {
      const { students, assignments } = createTestData(2, 2);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      expect(screen.getByLabelText('Gradebook grid')).toBeInTheDocument();
    });

    it('container is focusable for scroll control', () => {
      const { students, assignments } = createTestData(2, 2);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Edge Cases', () => {
    it('handles N/A GPA display', () => {
      const { students, assignments } = createTestData(1, 2);
      students[0].gpa = null;

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('handles large number of students (10+)', () => {
      const { students, assignments } = createTestData(10, 3);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      expect(screen.getByText('Student 1')).toBeInTheDocument();
      expect(screen.getByText('Student 10')).toBeInTheDocument();
    });

    it('handles large number of assignments (10+)', () => {
      const { students, assignments } = createTestData(2, 10);

      render(
        <GradebookGrid
          students={students}
          assignments={assignments}
        />
      );

      expect(screen.getByText('Assignment 1')).toBeInTheDocument();
      expect(screen.getByText('Assignment 10')).toBeInTheDocument();
    });
  });
});
