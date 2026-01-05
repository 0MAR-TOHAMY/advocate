import { describe, it, expect } from 'vitest';
import { createCaseSchema } from '../lib/validation/schemas/cases';

describe('Validation Schemas', () => {
  describe('createCaseSchema', () => {
    it('should validate a valid case', () => {
      const validCase = {
        caseNumber: '123',
        title: 'Test Case',
        status: 'open',
      };
      const result = createCaseSchema.safeParse(validCase);
      expect(result.success).toBe(true);
    });

    it('should fail with missing required fields', () => {
      const invalidCase = {
        title: 'Test Case',
      };
      const result = createCaseSchema.safeParse(invalidCase);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('caseNumber');
      }
    });

    it('should fail with unknown fields (strict)', () => {
      const invalidCase = {
        caseNumber: '123',
        title: 'Test Case',
        unknownField: 'bad',
      };
      const result = createCaseSchema.safeParse(invalidCase);
      expect(result.success).toBe(false);
    });
  });
});
