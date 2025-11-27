/**
 * GPA Calculation Unit Tests
 *
 * Tests for the GPA calculation utilities using the 12-point grading scale.
 * Follows AAA (Arrange, Act, Assert) pattern.
 *
 * Story: 2-4-gpa-calculation-implementation
 * AC: 2.4.1, 2.4.3, 2.4.8
 */

import {
  calculateGPA,
  calculateSimpleGPA,
  calculateOverallGPA,
  percentageToGPA,
  percentageToLetterGrade,
  letterGradeToGPA,
  getGPAScale,
  GradeInput,
} from '@/lib/gpa';

describe('GPA Module - 12-Point Grading Scale', () => {
  describe('percentageToGPA', () => {
    describe('A grades (93-100%)', () => {
      it('returns 4.0 for A grade (93-100%)', () => {
        expect(percentageToGPA(100)).toBe(4.0);
        expect(percentageToGPA(95)).toBe(4.0);
        expect(percentageToGPA(93)).toBe(4.0);
      });
    });

    describe('A- grades (90-92.9%)', () => {
      it('returns 3.7 for A- grade (90-92.9%)', () => {
        expect(percentageToGPA(92.9)).toBe(3.7);
        expect(percentageToGPA(91)).toBe(3.7);
        expect(percentageToGPA(90)).toBe(3.7);
      });
    });

    describe('B+ grades (87-89.9%)', () => {
      it('returns 3.3 for B+ grade (87-89.9%)', () => {
        expect(percentageToGPA(89.9)).toBe(3.3);
        expect(percentageToGPA(88)).toBe(3.3);
        expect(percentageToGPA(87)).toBe(3.3);
      });
    });

    describe('B grades (83-86.9%)', () => {
      it('returns 3.0 for B grade (83-86.9%)', () => {
        expect(percentageToGPA(86.9)).toBe(3.0);
        expect(percentageToGPA(85)).toBe(3.0);
        expect(percentageToGPA(83)).toBe(3.0);
      });
    });

    describe('B- grades (80-82.9%)', () => {
      it('returns 2.7 for B- grade (80-82.9%)', () => {
        expect(percentageToGPA(82.9)).toBe(2.7);
        expect(percentageToGPA(81)).toBe(2.7);
        expect(percentageToGPA(80)).toBe(2.7);
      });
    });

    describe('C+ grades (77-79.9%)', () => {
      it('returns 2.3 for C+ grade (77-79.9%)', () => {
        expect(percentageToGPA(79.9)).toBe(2.3);
        expect(percentageToGPA(78)).toBe(2.3);
        expect(percentageToGPA(77)).toBe(2.3);
      });
    });

    describe('C grades (73-76.9%)', () => {
      it('returns 2.0 for C grade (73-76.9%)', () => {
        expect(percentageToGPA(76.9)).toBe(2.0);
        expect(percentageToGPA(75)).toBe(2.0);
        expect(percentageToGPA(73)).toBe(2.0);
      });
    });

    describe('C- grades (70-72.9%)', () => {
      it('returns 1.7 for C- grade (70-72.9%)', () => {
        expect(percentageToGPA(72.9)).toBe(1.7);
        expect(percentageToGPA(71)).toBe(1.7);
        expect(percentageToGPA(70)).toBe(1.7);
      });
    });

    describe('D+ grades (67-69.9%)', () => {
      it('returns 1.3 for D+ grade (67-69.9%)', () => {
        expect(percentageToGPA(69.9)).toBe(1.3);
        expect(percentageToGPA(68)).toBe(1.3);
        expect(percentageToGPA(67)).toBe(1.3);
      });
    });

    describe('D grades (63-66.9%)', () => {
      it('returns 1.0 for D grade (63-66.9%)', () => {
        expect(percentageToGPA(66.9)).toBe(1.0);
        expect(percentageToGPA(65)).toBe(1.0);
        expect(percentageToGPA(63)).toBe(1.0);
      });
    });

    describe('D- grades (60-62.9%)', () => {
      it('returns 0.7 for D- grade (60-62.9%)', () => {
        expect(percentageToGPA(62.9)).toBe(0.7);
        expect(percentageToGPA(61)).toBe(0.7);
        expect(percentageToGPA(60)).toBe(0.7);
      });
    });

    describe('F grades (below 60%)', () => {
      it('returns 0.0 for F grade (below 60%)', () => {
        expect(percentageToGPA(59.9)).toBe(0.0);
        expect(percentageToGPA(50)).toBe(0.0);
        expect(percentageToGPA(0)).toBe(0.0);
      });
    });

    describe('Edge cases', () => {
      it('handles negative percentages by returning 0', () => {
        expect(percentageToGPA(-10)).toBe(0);
        expect(percentageToGPA(-100)).toBe(0);
      });

      it('caps extra credit at 100% (returns max GPA)', () => {
        expect(percentageToGPA(110)).toBe(4.0);
        expect(percentageToGPA(150)).toBe(4.0);
        expect(percentageToGPA(200)).toBe(4.0);
      });

      it('respects custom GPA scale', () => {
        // 5.0 scale
        expect(percentageToGPA(95, 5.0)).toBe(5.0);
        expect(percentageToGPA(91, 5.0)).toBe(4.63); // 5.0 * 0.925
        expect(percentageToGPA(88, 5.0)).toBe(4.13); // 5.0 * 0.825
        expect(percentageToGPA(85, 5.0)).toBe(3.75); // 5.0 * 0.75
      });

      it('rounds to 2 decimal places', () => {
        const result = percentageToGPA(91, 4.0);
        const decimalPlaces = result.toString().split('.')[1]?.length || 0;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('percentageToLetterGrade', () => {
    it('returns A for 93-100%', () => {
      expect(percentageToLetterGrade(100)).toBe('A');
      expect(percentageToLetterGrade(95)).toBe('A');
      expect(percentageToLetterGrade(93)).toBe('A');
    });

    it('returns A- for 90-92.9%', () => {
      expect(percentageToLetterGrade(92)).toBe('A-');
      expect(percentageToLetterGrade(91)).toBe('A-');
      expect(percentageToLetterGrade(90)).toBe('A-');
    });

    it('returns B+ for 87-89.9%', () => {
      expect(percentageToLetterGrade(89)).toBe('B+');
      expect(percentageToLetterGrade(88)).toBe('B+');
      expect(percentageToLetterGrade(87)).toBe('B+');
    });

    it('returns B for 83-86.9%', () => {
      expect(percentageToLetterGrade(86)).toBe('B');
      expect(percentageToLetterGrade(85)).toBe('B');
      expect(percentageToLetterGrade(83)).toBe('B');
    });

    it('returns B- for 80-82.9%', () => {
      expect(percentageToLetterGrade(82)).toBe('B-');
      expect(percentageToLetterGrade(81)).toBe('B-');
      expect(percentageToLetterGrade(80)).toBe('B-');
    });

    it('returns C+ for 77-79.9%', () => {
      expect(percentageToLetterGrade(79)).toBe('C+');
      expect(percentageToLetterGrade(78)).toBe('C+');
      expect(percentageToLetterGrade(77)).toBe('C+');
    });

    it('returns C for 73-76.9%', () => {
      expect(percentageToLetterGrade(76)).toBe('C');
      expect(percentageToLetterGrade(75)).toBe('C');
      expect(percentageToLetterGrade(73)).toBe('C');
    });

    it('returns C- for 70-72.9%', () => {
      expect(percentageToLetterGrade(72)).toBe('C-');
      expect(percentageToLetterGrade(71)).toBe('C-');
      expect(percentageToLetterGrade(70)).toBe('C-');
    });

    it('returns D+ for 67-69.9%', () => {
      expect(percentageToLetterGrade(69)).toBe('D+');
      expect(percentageToLetterGrade(68)).toBe('D+');
      expect(percentageToLetterGrade(67)).toBe('D+');
    });

    it('returns D for 63-66.9%', () => {
      expect(percentageToLetterGrade(66)).toBe('D');
      expect(percentageToLetterGrade(65)).toBe('D');
      expect(percentageToLetterGrade(63)).toBe('D');
    });

    it('returns D- for 60-62.9%', () => {
      expect(percentageToLetterGrade(62)).toBe('D-');
      expect(percentageToLetterGrade(61)).toBe('D-');
      expect(percentageToLetterGrade(60)).toBe('D-');
    });

    it('returns F for below 60%', () => {
      expect(percentageToLetterGrade(59)).toBe('F');
      expect(percentageToLetterGrade(50)).toBe('F');
      expect(percentageToLetterGrade(0)).toBe('F');
    });

    it('handles negative percentages by returning F', () => {
      expect(percentageToLetterGrade(-10)).toBe('F');
    });

    it('handles extra credit by returning A', () => {
      expect(percentageToLetterGrade(110)).toBe('A');
    });
  });

  describe('letterGradeToGPA', () => {
    it('converts all letter grades correctly on 4.0 scale', () => {
      expect(letterGradeToGPA('A')).toBe(4.0);
      expect(letterGradeToGPA('A-')).toBe(3.7);
      expect(letterGradeToGPA('B+')).toBe(3.3);
      expect(letterGradeToGPA('B')).toBe(3.0);
      expect(letterGradeToGPA('B-')).toBe(2.7);
      expect(letterGradeToGPA('C+')).toBe(2.3);
      expect(letterGradeToGPA('C')).toBe(2.0);
      expect(letterGradeToGPA('C-')).toBe(1.7);
      expect(letterGradeToGPA('D+')).toBe(1.3);
      expect(letterGradeToGPA('D')).toBe(1.0);
      expect(letterGradeToGPA('D-')).toBe(0.7);
      expect(letterGradeToGPA('F')).toBe(0.0);
    });

    it('returns 0 for unknown letter grades', () => {
      expect(letterGradeToGPA('X')).toBe(0);
      expect(letterGradeToGPA('Z')).toBe(0);
      expect(letterGradeToGPA('')).toBe(0);
    });

    it('respects custom GPA scale', () => {
      expect(letterGradeToGPA('A', 5.0)).toBe(5.0);
      expect(letterGradeToGPA('B', 5.0)).toBe(3.75);
      expect(letterGradeToGPA('C', 5.0)).toBe(2.5);
    });
  });

  describe('calculateGPA', () => {
    describe('Empty/Invalid input handling', () => {
      it('returns null for empty grades array', () => {
        const grades: GradeInput[] = [];
        expect(calculateGPA(grades)).toBeNull();
      });

      it('returns null for null/undefined input', () => {
        // @ts-expect-error Testing invalid input
        expect(calculateGPA(null)).toBeNull();
        // @ts-expect-error Testing invalid input
        expect(calculateGPA(undefined)).toBeNull();
      });

      it('returns null when all assignments are ungraded', () => {
        const grades: GradeInput[] = [
          { points: 0, maxPoints: 100, isGraded: false },
          { points: 0, maxPoints: 100, isGraded: false },
        ];
        expect(calculateGPA(grades)).toBeNull();
      });
    });

    describe('Single grade calculations', () => {
      it('calculates GPA correctly for A grade (93%+)', () => {
        const grades: GradeInput[] = [{ points: 95, maxPoints: 100 }];
        const result = calculateGPA(grades);

        expect(result).not.toBeNull();
        expect(result!.percentage).toBe(95);
        expect(result!.gpa).toBe(4.0);
        expect(result!.letterGrade).toBe('A');
        expect(result!.gradedCount).toBe(1);
      });

      it('calculates GPA correctly for A- grade (90-92.9%)', () => {
        const grades: GradeInput[] = [{ points: 91, maxPoints: 100 }];
        const result = calculateGPA(grades);

        expect(result).not.toBeNull();
        expect(result!.percentage).toBe(91);
        expect(result!.gpa).toBe(3.7);
        expect(result!.letterGrade).toBe('A-');
      });

      it('calculates GPA correctly for B+ grade (87-89.9%)', () => {
        const grades: GradeInput[] = [{ points: 88, maxPoints: 100 }];
        const result = calculateGPA(grades);

        expect(result).not.toBeNull();
        expect(result!.percentage).toBe(88);
        expect(result!.gpa).toBe(3.3);
        expect(result!.letterGrade).toBe('B+');
      });
    });

    describe('Weighted GPA calculations', () => {
      it('calculates weighted average correctly', () => {
        const grades: GradeInput[] = [
          { points: 93, maxPoints: 100, weight: 1 },
          { points: 85, maxPoints: 100, weight: 2 },
        ];
        // Expected: (93*1 + 85*2) / (100*1 + 100*2) = 263/300 = 87.67%

        const result = calculateGPA(grades);

        expect(result).not.toBeNull();
        expect(result!.percentage).toBeCloseTo(87.67, 1);
        expect(result!.gpa).toBe(3.3); // B+ grade (87-89.9%)
        expect(result!.letterGrade).toBe('B+');
        expect(result!.totalWeight).toBe(3);
      });

      it('defaults weight to 1 when not provided', () => {
        const grades: GradeInput[] = [
          { points: 100, maxPoints: 100 },
          { points: 86, maxPoints: 100 },
        ];

        const result = calculateGPA(grades);

        expect(result).not.toBeNull();
        expect(result!.totalWeight).toBe(2);
        expect(result!.percentage).toBe(93); // (100 + 86) / 200 = 93%
        expect(result!.gpa).toBe(4.0); // A grade
      });
    });

    describe('Partial grades handling', () => {
      it('skips ungraded assignments (isGraded: false)', () => {
        const grades: GradeInput[] = [
          { points: 93, maxPoints: 100, isGraded: true },
          { points: 0, maxPoints: 100, isGraded: false },
          { points: 87, maxPoints: 100, isGraded: true },
        ];

        const result = calculateGPA(grades);

        expect(result).not.toBeNull();
        expect(result!.gradedCount).toBe(2);
        expect(result!.percentage).toBe(90); // (93 + 87) / 200 = 90%
        expect(result!.gpa).toBe(3.7); // A-
      });

      it('filters out assignments with zero maxPoints', () => {
        const grades: GradeInput[] = [
          { points: 95, maxPoints: 100 },
          { points: 0, maxPoints: 0 },
        ];

        const result = calculateGPA(grades);

        expect(result).not.toBeNull();
        expect(result!.gradedCount).toBe(1);
        expect(result!.percentage).toBe(95);
      });
    });

    describe('Rounding', () => {
      it('rounds GPA to 2 decimal places', () => {
        const grades: GradeInput[] = [{ points: 91, maxPoints: 100 }];
        const result = calculateGPA(grades);

        expect(result).not.toBeNull();
        const decimalPlaces = result!.gpa.toString().split('.')[1]?.length || 0;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });

      it('rounds percentage to 2 decimal places', () => {
        const grades: GradeInput[] = [{ points: 89, maxPoints: 100 }];
        const result = calculateGPA(grades);

        expect(result).not.toBeNull();
        const decimalPlaces =
          result!.percentage.toString().split('.')[1]?.length || 0;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });

      it('rounds totalWeight to 2 decimal places', () => {
        const grades: GradeInput[] = [
          { points: 90, maxPoints: 100, weight: 0.333 },
          { points: 80, maxPoints: 100, weight: 0.667 },
        ];
        const result = calculateGPA(grades);

        expect(result).not.toBeNull();
        const decimalPlaces =
          result!.totalWeight.toString().split('.')[1]?.length || 0;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('calculateSimpleGPA', () => {
    it('calculates simple average ignoring weights', () => {
      const grades: GradeInput[] = [
        { points: 95, maxPoints: 100, weight: 5 },
        { points: 85, maxPoints: 100, weight: 1 },
      ];
      // Both treated as weight: 1, so (95 + 85) / 200 = 90%

      const result = calculateSimpleGPA(grades);

      expect(result).toBe(3.7); // A- (90-92.9%)
    });

    it('returns null for empty grades', () => {
      expect(calculateSimpleGPA([])).toBeNull();
    });

    it('returns null when all assignments are ungraded', () => {
      const grades: GradeInput[] = [
        { points: 0, maxPoints: 100, isGraded: false },
      ];
      expect(calculateSimpleGPA(grades)).toBeNull();
    });
  });

  describe('calculateOverallGPA', () => {
    it('calculates average of multiple course GPAs', () => {
      const courseGPAs = [4.0, 3.0, 3.5];
      const result = calculateOverallGPA(courseGPAs);

      expect(result).toBe(3.5); // (4.0 + 3.0 + 3.5) / 3
    });

    it('filters out null values', () => {
      const courseGPAs: (number | null)[] = [4.0, null, 3.0, null, 2.0];
      const result = calculateOverallGPA(courseGPAs);

      expect(result).toBe(3.0); // (4.0 + 3.0 + 2.0) / 3
    });

    it('returns null for empty array', () => {
      expect(calculateOverallGPA([])).toBeNull();
    });

    it('returns null when all values are null', () => {
      const courseGPAs: (number | null)[] = [null, null, null];
      expect(calculateOverallGPA(courseGPAs)).toBeNull();
    });

    it('rounds to 2 decimal places', () => {
      const courseGPAs = [4.0, 3.7, 3.3];
      // Average = 11.0 / 3 = 3.666...
      const result = calculateOverallGPA(courseGPAs);

      expect(result).toBe(3.67);
    });

    it('handles single course GPA', () => {
      const courseGPAs = [3.5];
      expect(calculateOverallGPA(courseGPAs)).toBe(3.5);
    });
  });

  describe('getGPAScale', () => {
    it('returns the current GPA scale (default 4.0)', () => {
      const scale = getGPAScale();
      expect(scale).toBe(4.0);
    });
  });

  describe('Integration scenarios', () => {
    it('handles a realistic student transcript', () => {
      const grades: GradeInput[] = [
        { points: 95, maxPoints: 100, weight: 0.2 }, // Homework 1: A
        { points: 88, maxPoints: 100, weight: 0.2 }, // Homework 2: B+
        { points: 78, maxPoints: 100, weight: 0.2 }, // Midterm: C+
        { points: 92, maxPoints: 100, weight: 0.4 }, // Final: A-
      ];

      const result = calculateGPA(grades);

      expect(result).not.toBeNull();
      // Weighted avg = (95*0.2 + 88*0.2 + 78*0.2 + 92*0.4) / (100*0.2 + 100*0.2 + 100*0.2 + 100*0.4)
      // = (19 + 17.6 + 15.6 + 36.8) / 100 = 89%
      expect(result!.percentage).toBe(89);
      expect(result!.gpa).toBe(3.3); // B+ (87-89.9%)
      expect(result!.letterGrade).toBe('B+');
    });

    it('calculates cumulative GPA across courses', () => {
      // Course 1 grades (average 92.5% = A-)
      const course1Grades: GradeInput[] = [
        { points: 95, maxPoints: 100 },
        { points: 90, maxPoints: 100 },
      ];
      const course1Result = calculateGPA(course1Grades);

      // Course 2 grades (average 82.5% = B-)
      const course2Grades: GradeInput[] = [
        { points: 85, maxPoints: 100 },
        { points: 80, maxPoints: 100 },
      ];
      const course2Result = calculateGPA(course2Grades);

      // Course 3 - no grades yet
      const course3Grades: GradeInput[] = [];
      const course3Result = calculateGPA(course3Grades);

      // Overall GPA
      const overallGPA = calculateOverallGPA([
        course1Result?.gpa ?? null,
        course2Result?.gpa ?? null,
        course3Result?.gpa ?? null,
      ]);

      // 12-point scale: 92.5% = A- (3.7), not A (4.0)
      expect(course1Result?.gpa).toBe(3.7); // 92.5% = A-
      expect(course2Result?.gpa).toBe(2.7); // 82.5% = B-
      expect(course3Result).toBeNull();
      expect(overallGPA).toBe(3.2); // (3.7 + 2.7) / 2
    });
  });
});
