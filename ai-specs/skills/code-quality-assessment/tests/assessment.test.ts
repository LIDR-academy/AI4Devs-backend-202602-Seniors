# Tests for code-quality-assessment skill

import { describe, it, expect } from 'vitest';
import { assess } from '../../src/code-quality-assessment';

describe('code-quality-assessment skill', () => {
  it('should produce an A-grade report for high-quality codebase', () => {
    const input = {
      target: './samples/high-quality',
      depth: 'module'
    };
    const result = assess(input);
    expect(result.grade).toBe('A');
    expect(result.overall_score).toBeGreaterThanOrEqual(90);
    expect(result.dimensions.metrics.score).toBeGreaterThanOrEqual(90);
  });

  it('should produce a C-grade report for medium-quality codebase', () => {
    const input = {
      target: './samples/medium-quality',
      depth: 'module'
    };
    const result = assess(input);
    expect(result.grade).toBe('C');
    expect(result.overall_score).toBeGreaterThanOrEqual(70);
    expect(result.overall_score).toBeLessThan(80);
  });

  it('should detect God class as critical issue', () => {
    const input = {
      target: './samples/god-class',
      depth: 'module'
    };
    const result = assess(input);
    const godClass = result.top_5_issues.find(i => i.issue.includes('God class'));
    expect(godClass).toBeDefined();
    expect(godClass.severity).toBe('critical');
  });

  it('should not flag LCOM >0.5 for utility classes', () => {
    const input = {
      target: './samples/utility-class',
      depth: 'file'
    };
    const result = assess(input);
    const lcomViolation = result.dimensions.patterns.violations.find(
      v => v.includes('LCOM') || v.includes('cohesion')
    );
    expect(lcomViolation).toBeUndefined();
  });

  it('should flag AHA-style duplication separately from DRY violations', () => {
    const input = {
      target: './samples/aha-duplication',
      depth: 'module'
    };
    const result = assess(input);
    const ahaStyle = result.dimensions.principles.findings.find(
      f => f.includes('AHA') || f.includes('intentional')
    );
    expect(ahaStyle).toBeDefined();
  });
});
