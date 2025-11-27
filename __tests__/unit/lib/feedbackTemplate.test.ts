/**
 * Feedback Template Utility Function Tests
 * Story: 2.7 - Feedback Templates for Instructors
 * AC: 2.7.4, 2.7.6
 */

import {
  replacePlaceholders,
  extractPlaceholders,
  isSupportedPlaceholder,
  getUnsupportedPlaceholders,
  validatePlaceholders,
  generatePreview,
  countPlaceholders,
  hasPlaceholders,
  SUPPORTED_PLACEHOLDERS,
  PlaceholderData,
} from '@/lib/feedbackTemplate';

describe('replacePlaceholders', () => {
  const baseData: PlaceholderData = {
    studentName: 'John Doe',
    assignmentTitle: 'Assignment 1',
    score: 95,
    customNote: 'Keep up the great work!',
  };

  it('replaces all placeholders with provided values', () => {
    const template = 'Hi {student_name}, your score on {assignment_title} is {score}. {custom_note}';
    const result = replacePlaceholders(template, baseData);

    expect(result).toBe('Hi John Doe, your score on Assignment 1 is 95. Keep up the great work!');
  });

  it('replaces multiple occurrences of the same placeholder', () => {
    const template = '{student_name} did well. Congratulations {student_name}!';
    const result = replacePlaceholders(template, baseData);

    expect(result).toBe('John Doe did well. Congratulations John Doe!');
  });

  it('handles missing optional data', () => {
    const template = 'Hi {student_name}, score: {score}. {custom_note}';
    const result = replacePlaceholders(template, {
      studentName: 'Jane',
      assignmentTitle: 'Test',
    });

    expect(result).toBe('Hi Jane, score: . ');
  });

  it('returns empty string for empty template', () => {
    const result = replacePlaceholders('', baseData);
    expect(result).toBe('');
  });

  it('returns original template when no placeholders present', () => {
    const template = 'No placeholders here.';
    const result = replacePlaceholders(template, baseData);

    expect(result).toBe('No placeholders here.');
  });

  it('handles score of 0 correctly', () => {
    const template = 'Score: {score}';
    const result = replacePlaceholders(template, {
      studentName: 'Test',
      assignmentTitle: 'Test',
      score: 0,
    });

    expect(result).toBe('Score: 0');
  });
});

describe('extractPlaceholders', () => {
  it('extracts all unique placeholders from template', () => {
    const template = 'Hi {student_name}, your {assignment_title} score is {score}.';
    const result = extractPlaceholders(template);

    expect(result).toEqual(['student_name', 'assignment_title', 'score']);
  });

  it('returns unique placeholders only', () => {
    const template = '{student_name} did well. Congratulations {student_name}!';
    const result = extractPlaceholders(template);

    expect(result).toEqual(['student_name']);
  });

  it('returns empty array for template without placeholders', () => {
    const template = 'No placeholders here.';
    const result = extractPlaceholders(template);

    expect(result).toEqual([]);
  });

  it('returns empty array for empty template', () => {
    const result = extractPlaceholders('');
    expect(result).toEqual([]);
  });

  it('extracts unsupported placeholders too', () => {
    const template = '{student_name} {unknown_placeholder}';
    const result = extractPlaceholders(template);

    expect(result).toEqual(['student_name', 'unknown_placeholder']);
  });
});

describe('isSupportedPlaceholder', () => {
  it('returns true for supported placeholders without braces', () => {
    expect(isSupportedPlaceholder('student_name')).toBe(true);
    expect(isSupportedPlaceholder('assignment_title')).toBe(true);
    expect(isSupportedPlaceholder('score')).toBe(true);
    expect(isSupportedPlaceholder('custom_note')).toBe(true);
  });

  it('returns true for supported placeholders with braces', () => {
    expect(isSupportedPlaceholder('{student_name}')).toBe(true);
    expect(isSupportedPlaceholder('{assignment_title}')).toBe(true);
    expect(isSupportedPlaceholder('{score}')).toBe(true);
    expect(isSupportedPlaceholder('{custom_note}')).toBe(true);
  });

  it('returns false for unsupported placeholders', () => {
    expect(isSupportedPlaceholder('unknown')).toBe(false);
    expect(isSupportedPlaceholder('{unknown}')).toBe(false);
    expect(isSupportedPlaceholder('student')).toBe(false);
  });
});

describe('getUnsupportedPlaceholders', () => {
  it('returns empty array when all placeholders are supported', () => {
    const template = '{student_name} scored {score} on {assignment_title}.';
    const result = getUnsupportedPlaceholders(template);

    expect(result).toEqual([]);
  });

  it('returns unsupported placeholders', () => {
    const template = '{student_name} {unknown} {another_unknown}';
    const result = getUnsupportedPlaceholders(template);

    expect(result).toEqual(['unknown', 'another_unknown']);
  });

  it('returns empty array for template without placeholders', () => {
    const result = getUnsupportedPlaceholders('No placeholders');
    expect(result).toEqual([]);
  });
});

describe('validatePlaceholders', () => {
  it('returns valid for template with only supported placeholders', () => {
    const template = 'Hi {student_name}, score: {score}.';
    const result = validatePlaceholders(template);

    expect(result.isValid).toBe(true);
    expect(result.unsupported).toEqual([]);
  });

  it('returns invalid for template with unsupported placeholders', () => {
    const template = '{student_name} {invalid_placeholder}';
    const result = validatePlaceholders(template);

    expect(result.isValid).toBe(false);
    expect(result.unsupported).toContain('invalid_placeholder');
  });

  it('returns valid for template without any placeholders', () => {
    const result = validatePlaceholders('Plain text only.');

    expect(result.isValid).toBe(true);
    expect(result.unsupported).toEqual([]);
  });
});

describe('generatePreview', () => {
  it('generates preview with sample data', () => {
    const template = 'Hi {student_name}, your {assignment_title} score is {score}.';
    const result = generatePreview(template);

    expect(result).toContain('Jane Smith');
    expect(result).toContain('Sample Assignment');
    expect(result).toContain('85');
  });

  it('includes sample custom note placeholder', () => {
    const template = 'Note: {custom_note}';
    const result = generatePreview(template);

    expect(result).toContain('[Your note here]');
  });
});

describe('countPlaceholders', () => {
  it('counts occurrences of each placeholder', () => {
    const template = '{student_name} scored well. {student_name} did great on {assignment_title}.';
    const result = countPlaceholders(template);

    expect(result).toEqual({
      student_name: 2,
      assignment_title: 1,
    });
  });

  it('returns empty object for template without placeholders', () => {
    const result = countPlaceholders('No placeholders');
    expect(result).toEqual({});
  });

  it('returns empty object for empty template', () => {
    const result = countPlaceholders('');
    expect(result).toEqual({});
  });
});

describe('hasPlaceholders', () => {
  it('returns true when template has placeholders', () => {
    expect(hasPlaceholders('{student_name}')).toBe(true);
    expect(hasPlaceholders('Text {score} more text')).toBe(true);
  });

  it('returns false when template has no placeholders', () => {
    expect(hasPlaceholders('No placeholders here')).toBe(false);
    expect(hasPlaceholders('')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(hasPlaceholders('{')).toBe(false);
    expect(hasPlaceholders('}')).toBe(false);
    expect(hasPlaceholders('{}')).toBe(false); // Empty braces don't match - need content inside
  });
});

describe('SUPPORTED_PLACEHOLDERS', () => {
  it('contains all expected placeholders', () => {
    expect(SUPPORTED_PLACEHOLDERS).toHaveProperty('{student_name}');
    expect(SUPPORTED_PLACEHOLDERS).toHaveProperty('{assignment_title}');
    expect(SUPPORTED_PLACEHOLDERS).toHaveProperty('{score}');
    expect(SUPPORTED_PLACEHOLDERS).toHaveProperty('{custom_note}');
  });

  it('has descriptions for all placeholders', () => {
    Object.values(SUPPORTED_PLACEHOLDERS).forEach((description) => {
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });
  });
});
