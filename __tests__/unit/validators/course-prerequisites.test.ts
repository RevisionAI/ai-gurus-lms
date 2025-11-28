/**
 * Course Prerequisites Validation Unit Tests
 *
 * Tests for course prerequisites and learning objectives validation schemas.
 * Story: 2.8 - Course Prerequisites & Learning Objectives Display
 */

import {
  createCourseSchema,
  updateCourseSchema,
  coursePrerequisitesSchema,
} from '@/validators/course';

describe('coursePrerequisitesSchema', () => {
  describe('prerequisites field', () => {
    it('accepts valid prerequisites string', () => {
      const input = {
        prerequisites: 'Basic understanding of programming concepts',
      };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prerequisites).toBe('Basic understanding of programming concepts');
      }
    });

    it('accepts empty prerequisites as optional', () => {
      const input = {};
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('accepts null prerequisites', () => {
      const input = { prerequisites: null };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects prerequisites exceeding 2000 characters', () => {
      const input = { prerequisites: 'a'.repeat(2001) };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2000');
      }
    });

    it('accepts prerequisites at exactly 2000 characters', () => {
      const input = { prerequisites: 'a'.repeat(2000) };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('learningObjectives field', () => {
    it('accepts valid array of learning objectives', () => {
      const input = {
        learningObjectives: [
          'Understand basic programming concepts',
          'Write simple programs',
        ],
      };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.learningObjectives).toHaveLength(2);
      }
    });

    it('accepts empty array for learning objectives', () => {
      const input = { learningObjectives: [] };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.learningObjectives).toEqual([]);
      }
    });

    it('defaults to empty array when not provided', () => {
      const input = {};
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.learningObjectives).toEqual([]);
      }
    });

    it('rejects more than 20 learning objectives', () => {
      const input = {
        learningObjectives: Array(21).fill('Objective'),
      };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('20');
      }
    });

    it('accepts exactly 20 learning objectives', () => {
      const input = {
        learningObjectives: Array(20).fill('Objective'),
      };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects learning objective exceeding 500 characters', () => {
      const input = {
        learningObjectives: ['a'.repeat(501)],
      };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('500');
      }
    });

    it('accepts learning objective at exactly 500 characters', () => {
      const input = {
        learningObjectives: ['a'.repeat(500)],
      };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('targetAudience field', () => {
    it('accepts valid target audience string', () => {
      const input = {
        targetAudience: 'Students with some programming experience',
      };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.targetAudience).toBe('Students with some programming experience');
      }
    });

    it('accepts null target audience', () => {
      const input = { targetAudience: null };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects target audience exceeding 1000 characters', () => {
      const input = { targetAudience: 'a'.repeat(1001) };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('1000');
      }
    });

    it('accepts target audience at exactly 1000 characters', () => {
      const input = { targetAudience: 'a'.repeat(1000) };
      const result = coursePrerequisitesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});

describe('createCourseSchema with prerequisites fields', () => {
  const validCourseBase = {
    title: 'Introduction to Programming',
    code: 'CS-101',
    semester: 'Fall',
    year: 2025,
  };

  it('accepts course creation with all prerequisites fields', () => {
    const input = {
      ...validCourseBase,
      prerequisites: 'Basic math skills',
      learningObjectives: ['Learn variables', 'Learn functions'],
      targetAudience: 'Beginners with no prior experience',
    };
    const result = createCourseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prerequisites).toBe('Basic math skills');
      expect(result.data.learningObjectives).toHaveLength(2);
      expect(result.data.targetAudience).toBe('Beginners with no prior experience');
    }
  });

  it('accepts course creation without prerequisites fields', () => {
    const input = { ...validCourseBase };
    const result = createCourseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prerequisites).toBeUndefined();
      expect(result.data.learningObjectives).toEqual([]);
      expect(result.data.targetAudience).toBeUndefined();
    }
  });

  it('accepts course creation with partial prerequisites fields', () => {
    const input = {
      ...validCourseBase,
      learningObjectives: ['Objective 1'],
    };
    const result = createCourseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.learningObjectives).toEqual(['Objective 1']);
    }
  });

  it('rejects course creation with invalid prerequisites', () => {
    const input = {
      ...validCourseBase,
      prerequisites: 'a'.repeat(2001),
    };
    const result = createCourseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('updateCourseSchema with prerequisites fields', () => {
  it('accepts update with only prerequisites field', () => {
    const input = {
      prerequisites: 'Updated prerequisites',
    };
    const result = updateCourseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prerequisites).toBe('Updated prerequisites');
    }
  });

  it('accepts update with only learningObjectives field', () => {
    const input = {
      learningObjectives: ['New objective 1', 'New objective 2'],
    };
    const result = updateCourseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.learningObjectives).toHaveLength(2);
    }
  });

  it('accepts update with only targetAudience field', () => {
    const input = {
      targetAudience: 'Updated target audience',
    };
    const result = updateCourseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetAudience).toBe('Updated target audience');
    }
  });

  it('accepts clearing prerequisites by setting to null', () => {
    const input = {
      prerequisites: null,
    };
    const result = updateCourseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prerequisites).toBeNull();
    }
  });

  it('accepts clearing learning objectives with empty array', () => {
    const input = {
      learningObjectives: [],
    };
    const result = updateCourseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.learningObjectives).toEqual([]);
    }
  });

  it('rejects empty update object', () => {
    const input = {};
    const result = updateCourseSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one field');
    }
  });

  it('rejects update with invalid prerequisites length', () => {
    const input = {
      prerequisites: 'a'.repeat(2001),
    };
    const result = updateCourseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects update with too many learning objectives', () => {
    const input = {
      learningObjectives: Array(21).fill('Objective'),
    };
    const result = updateCourseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects update with learning objective too long', () => {
    const input = {
      learningObjectives: ['a'.repeat(501)],
    };
    const result = updateCourseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
