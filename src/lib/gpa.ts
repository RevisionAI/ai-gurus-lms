/**
 * GPA Calculation Utilities
 *
 * Provides functions for calculating Grade Point Averages
 * from assignment grades with optional weighting.
 *
 * Uses a 12-point granular grading scale with plus/minus variations:
 * - 93-100% = A (4.0)
 * - 90-92.9% = A- (3.7)
 * - 87-89.9% = B+ (3.3)
 * - 83-86.9% = B (3.0)
 * - 80-82.9% = B- (2.7)
 * - 77-79.9% = C+ (2.3)
 * - 73-76.9% = C (2.0)
 * - 70-72.9% = C- (1.7)
 * - 67-69.9% = D+ (1.3)
 * - 63-66.9% = D (1.0)
 * - 60-62.9% = D- (0.7)
 * - Below 60% = F (0.0)
 *
 * @module lib/gpa
 */

/**
 * Grade input for GPA calculation
 */
export interface GradeInput {
  /** Points earned on the assignment */
  points: number;
  /** Maximum possible points for the assignment */
  maxPoints: number;
  /** Weight of this assignment (default: 1) */
  weight?: number;
  /** Whether this grade is finalized (default: true) */
  isGraded?: boolean;
}

/**
 * GPA calculation result
 */
export interface GPAResult {
  /** GPA on configured scale (default: 4.0) */
  gpa: number;
  /** Percentage score (0-100) */
  percentage: number;
  /** Letter grade equivalent */
  letterGrade: string;
  /** Number of graded assignments included */
  gradedCount: number;
  /** Total weight of included assignments */
  totalWeight: number;
}

/**
 * Validates and returns the GPA scale from environment or default.
 * Falls back to 4.0 if the environment variable is invalid or not set.
 *
 * @returns The validated GPA scale (positive number)
 */
function getValidatedGPAScale(): number {
  const envScale = process.env.GPA_SCALE;

  if (!envScale) {
    return 4.0;
  }

  const parsed = parseFloat(envScale);

  // Validate: must be a positive finite number
  if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) {
    console.warn(
      `Invalid GPA_SCALE value "${envScale}". Falling back to default 4.0`
    );
    return 4.0;
  }

  return parsed;
}

/**
 * GPA scale configuration
 * Default is 4.0 scale, can be configured via GPA_SCALE environment variable.
 * Supports common scales: 4.0, 5.0, 10.0, 100.0
 */
const GPA_SCALE = getValidatedGPAScale();

/**
 * Grade threshold definitions for the 12-point grading scale.
 * Each entry maps a minimum percentage to its GPA multiplier (relative to scale)
 * and letter grade.
 */
const GRADE_THRESHOLDS = [
  { minPercent: 93, multiplier: 1.0, letter: 'A' }, // 93-100% = 4.0
  { minPercent: 90, multiplier: 0.925, letter: 'A-' }, // 90-92.9% = 3.7
  { minPercent: 87, multiplier: 0.825, letter: 'B+' }, // 87-89.9% = 3.3
  { minPercent: 83, multiplier: 0.75, letter: 'B' }, // 83-86.9% = 3.0
  { minPercent: 80, multiplier: 0.675, letter: 'B-' }, // 80-82.9% = 2.7
  { minPercent: 77, multiplier: 0.575, letter: 'C+' }, // 77-79.9% = 2.3
  { minPercent: 73, multiplier: 0.5, letter: 'C' }, // 73-76.9% = 2.0
  { minPercent: 70, multiplier: 0.425, letter: 'C-' }, // 70-72.9% = 1.7
  { minPercent: 67, multiplier: 0.325, letter: 'D+' }, // 67-69.9% = 1.3
  { minPercent: 63, multiplier: 0.25, letter: 'D' }, // 63-66.9% = 1.0
  { minPercent: 60, multiplier: 0.175, letter: 'D-' }, // 60-62.9% = 0.7
  { minPercent: 0, multiplier: 0, letter: 'F' }, // Below 60% = 0.0
] as const;

/**
 * Convert percentage to GPA points on the configured scale.
 *
 * Uses a 12-point granular grading scale with standard academic thresholds.
 * Percentages above 100% (extra credit) are capped at the maximum GPA.
 * Negative percentages return 0.0.
 *
 * @param percentage - The percentage score (0-100+)
 * @param scale - The GPA scale to use (default: GPA_SCALE from env or 4.0)
 * @returns The GPA value rounded to 2 decimal places
 *
 * @example
 * ```typescript
 * percentageToGPA(95); // Returns 4.0 (A)
 * percentageToGPA(91); // Returns 3.7 (A-)
 * percentageToGPA(85); // Returns 3.0 (B)
 * percentageToGPA(110); // Returns 4.0 (capped at max)
 * ```
 */
export function percentageToGPA(
  percentage: number,
  scale: number = GPA_SCALE
): number {
  // Handle edge cases
  if (percentage < 0) {
    return 0;
  }

  // Cap at 100% to handle extra credit scenarios
  const cappedPercentage = Math.min(percentage, 100);

  // Find the matching threshold
  for (const threshold of GRADE_THRESHOLDS) {
    if (cappedPercentage >= threshold.minPercent) {
      const gpa = scale * threshold.multiplier;
      return Math.round(gpa * 100) / 100; // Round to 2 decimal places
    }
  }

  // Fallback (should not reach here due to 0% threshold)
  return 0;
}

/**
 * Get letter grade from percentage using the 12-point scale.
 *
 * Returns one of: A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F
 *
 * @param percentage - The percentage score (0-100+)
 * @returns The corresponding letter grade
 *
 * @example
 * ```typescript
 * percentageToLetterGrade(95); // Returns 'A'
 * percentageToLetterGrade(91); // Returns 'A-'
 * percentageToLetterGrade(88); // Returns 'B+'
 * percentageToLetterGrade(50); // Returns 'F'
 * ```
 */
export function percentageToLetterGrade(percentage: number): string {
  // Handle edge cases
  if (percentage < 0) {
    return 'F';
  }

  // Cap at 100% to handle extra credit scenarios
  const cappedPercentage = Math.min(percentage, 100);

  // Find the matching threshold
  for (const threshold of GRADE_THRESHOLDS) {
    if (cappedPercentage >= threshold.minPercent) {
      return threshold.letter;
    }
  }

  // Fallback
  return 'F';
}

/**
 * Get GPA value from a letter grade.
 *
 * Useful for converting letter grades back to GPA for calculations.
 *
 * @param letterGrade - The letter grade (A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F)
 * @param scale - The GPA scale to use (default: GPA_SCALE from env or 4.0)
 * @returns The corresponding GPA value
 *
 * @example
 * ```typescript
 * letterGradeToGPA('A'); // Returns 4.0
 * letterGradeToGPA('B+'); // Returns 3.3
 * letterGradeToGPA('F'); // Returns 0.0
 * ```
 */
export function letterGradeToGPA(
  letterGrade: string,
  scale: number = GPA_SCALE
): number {
  const threshold = GRADE_THRESHOLDS.find((t) => t.letter === letterGrade);

  if (threshold) {
    return Math.round(scale * threshold.multiplier * 100) / 100;
  }

  // Unknown letter grade defaults to F
  return 0;
}

/**
 * Calculate GPA from an array of grades using weighted averaging.
 *
 * The algorithm:
 * 1. Filters out ungraded assignments (isGraded === false) and zero maxPoints
 * 2. Returns null if no valid grades remain
 * 3. Calculates weighted average: weightedSum = Σ(points × weight) / Σ(maxPoints × weight)
 * 4. Converts percentage to GPA using the 12-point threshold scale
 * 5. Rounds to 2 decimal places
 *
 * @param grades - Array of grade inputs with points, maxPoints, and optional weight
 * @returns GPAResult object with gpa, percentage, letterGrade, gradedCount, totalWeight
 *          Returns null if no valid grades provided
 *
 * @example
 * ```typescript
 * // Equal weight grades
 * const grades = [
 *   { points: 90, maxPoints: 100, weight: 1 },
 *   { points: 85, maxPoints: 100, weight: 1 },
 * ];
 * const result = calculateGPA(grades);
 * // result.percentage = 87.5%
 * // result.gpa = 3.3 (B+ on 4.0 scale)
 *
 * // Weighted grades
 * const weighted = [
 *   { points: 85, maxPoints: 100, weight: 0.3 },  // 30% weight
 *   { points: 92, maxPoints: 100, weight: 0.4 },  // 40% weight
 *   { points: 78, maxPoints: 100, weight: 0.3 },  // 30% weight
 * ];
 * const result = calculateGPA(weighted);
 * // result.percentage = 85.7%
 * // result.gpa = 3.0 (B on 4.0 scale)
 * ```
 */
export function calculateGPA(grades: GradeInput[]): GPAResult | null {
  // Handle empty grades array
  if (!grades || grades.length === 0) {
    return null;
  }

  // Filter to only graded assignments (isGraded defaults to true)
  const gradedAssignments = grades.filter(
    (grade) => grade.isGraded !== false && grade.maxPoints > 0
  );

  // No graded assignments
  if (gradedAssignments.length === 0) {
    return null;
  }

  // Calculate weighted average
  let totalWeightedPoints = 0;
  let totalWeightedMaxPoints = 0;
  let totalWeight = 0;

  for (const grade of gradedAssignments) {
    const weight = grade.weight ?? 1;
    totalWeightedPoints += grade.points * weight;
    totalWeightedMaxPoints += grade.maxPoints * weight;
    totalWeight += weight;
  }

  // Calculate percentage
  const percentage = (totalWeightedPoints / totalWeightedMaxPoints) * 100;

  // Convert to GPA using 12-point scale
  const gpa = percentageToGPA(percentage);

  // Get letter grade
  const letterGrade = percentageToLetterGrade(percentage);

  return {
    gpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
    percentage: Math.round(percentage * 100) / 100,
    letterGrade,
    gradedCount: gradedAssignments.length,
    totalWeight: Math.round(totalWeight * 100) / 100,
  };
}

/**
 * Calculate simple average GPA without weighting.
 *
 * This is a convenience function that treats all assignments equally
 * regardless of their original weight values.
 *
 * @param grades - Array of grade inputs
 * @returns GPA value or null if no valid grades
 *
 * @example
 * ```typescript
 * const grades = [
 *   { points: 90, maxPoints: 100, weight: 10 },  // weight ignored
 *   { points: 80, maxPoints: 100, weight: 1 },   // weight ignored
 * ];
 * const gpa = calculateSimpleGPA(grades);
 * // gpa = 3.3 (average = 85%, which is B+)
 * ```
 */
export function calculateSimpleGPA(grades: GradeInput[]): number | null {
  const result = calculateGPA(grades.map((g) => ({ ...g, weight: 1 })));
  return result?.gpa ?? null;
}

/**
 * Calculate overall GPA from multiple course GPAs.
 *
 * This averages all valid course GPAs (excludes null values).
 *
 * @param courseGPAs - Array of course GPA values (may include null for courses without grades)
 * @returns Overall GPA or null if no valid course GPAs
 *
 * @example
 * ```typescript
 * const courseGPAs = [4.0, 3.0, 3.5, null];  // null for course with no grades
 * const overall = calculateOverallGPA(courseGPAs);
 * // overall = 3.5 (average of 4.0, 3.0, 3.5)
 * ```
 */
export function calculateOverallGPA(
  courseGPAs: (number | null)[]
): number | null {
  // Filter out null values
  const validGPAs = courseGPAs.filter((gpa): gpa is number => gpa !== null);

  if (validGPAs.length === 0) {
    return null;
  }

  // Calculate simple average
  const sum = validGPAs.reduce((acc, gpa) => acc + gpa, 0);
  const average = sum / validGPAs.length;

  return Math.round(average * 100) / 100; // Round to 2 decimal places
}

/**
 * Get the current GPA scale being used.
 *
 * Useful for displaying the scale to users or validating calculations.
 *
 * @returns The current GPA scale value
 */
export function getGPAScale(): number {
  return GPA_SCALE;
}
