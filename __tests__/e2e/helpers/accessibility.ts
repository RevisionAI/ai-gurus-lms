/**
 * Accessibility Testing Helpers
 *
 * Utilities for axe-core integration with Playwright for WCAG 2.1 AA compliance testing.
 * Provides configuration, result formatting, and severity classification.
 *
 * Story: 3.4 - Accessibility Testing & Validation
 */

import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AxeResults, Result } from 'axe-core';

/**
 * Severity level mapping from axe-core to project priority
 * - critical → P0 (blocks)
 * - serious → P1 (blocks)
 * - moderate → P2 (warns)
 * - minor → P3 (warns)
 */
export enum AccessibilitySeverity {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

export interface AccessibilityViolation {
  id: string;
  impact: string;
  severity: AccessibilitySeverity;
  description: string;
  help: string;
  helpUrl: string;
  nodes: number;
  wcagTags: string[];
  summary: string;
}

export interface AccessibilityReport {
  url: string;
  pageTitle: string;
  timestamp: string;
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inaccessible: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
}

/**
 * Map axe-core impact to project severity
 */
export function mapImpactToSeverity(impact: string): AccessibilitySeverity {
  switch (impact) {
    case 'critical':
      return AccessibilitySeverity.P0;
    case 'serious':
      return AccessibilitySeverity.P1;
    case 'moderate':
      return AccessibilitySeverity.P2;
    case 'minor':
      return AccessibilitySeverity.P3;
    default:
      return AccessibilitySeverity.P3;
  }
}

/**
 * Configure axe-core for WCAG 2.1 AA compliance
 */
export function getAxeBuilder(page: Page): AxeBuilder {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('#webpack-dev-server-client-overlay') // Exclude dev overlay
    .exclude('[data-testid="playwright-debug"]') // Exclude test artifacts
    .options({
      rules: {
        // Color contrast checking (WCAG 2.1 AA)
        'color-contrast': { enabled: true },

        // Keyboard navigation
        'focus-order-semantics': { enabled: true },
        'tabindex': { enabled: true },

        // ARIA rules
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-allowed-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-required-children': { enabled: true },
        'aria-required-parent': { enabled: true },

        // Form labels
        'label': { enabled: true },
        'label-content-name-mismatch': { enabled: true },

        // Images
        'image-alt': { enabled: true },

        // Document structure
        'page-has-heading-one': { enabled: true },
        'landmark-one-main': { enabled: true },

        // Skip links
        'skip-link': { enabled: true },

        // Semantic structure
        'list': { enabled: true },
        'listitem': { enabled: true },
        'definition-list': { enabled: true },
      },
    });
}

/**
 * Format axe results into a structured violation report
 */
export function formatViolations(result: Result): AccessibilityViolation {
  const severity = mapImpactToSeverity(result.impact || 'minor');

  // Extract WCAG tags
  const wcagTags = result.tags?.filter(tag =>
    tag.startsWith('wcag') || tag.includes('level')
  ) || [];

  // Create a summary of the violation
  const nodeCount = result.nodes.length;
  const summary = `${result.id}: ${nodeCount} instance${nodeCount !== 1 ? 's' : ''} found`;

  return {
    id: result.id,
    impact: result.impact || 'unknown',
    severity,
    description: result.description,
    help: result.help,
    helpUrl: result.helpUrl,
    nodes: nodeCount,
    wcagTags,
    summary,
  };
}

/**
 * Generate comprehensive accessibility report
 */
export function generateAccessibilityReport(
  page: Page,
  results: AxeResults
): AccessibilityReport {
  const violations = results.violations.map(formatViolations);

  // Count violations by severity
  const criticalCount = violations.filter(v => v.severity === AccessibilitySeverity.P0).length;
  const seriousCount = violations.filter(v => v.severity === AccessibilitySeverity.P1).length;
  const moderateCount = violations.filter(v => v.severity === AccessibilitySeverity.P2).length;
  const minorCount = violations.filter(v => v.severity === AccessibilitySeverity.P3).length;

  return {
    url: page.url(),
    pageTitle: results.url || page.url(),
    timestamp: new Date().toISOString(),
    violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inaccessible: results.inaccessible.length,
    criticalCount,
    seriousCount,
    moderateCount,
    minorCount,
  };
}

/**
 * Format violation details for console output
 */
export function formatViolationDetails(violation: AccessibilityViolation): string {
  return `
  [${violation.severity}] ${violation.id}
  Impact: ${violation.impact}
  Description: ${violation.description}
  Help: ${violation.help}
  WCAG Tags: ${violation.wcagTags.join(', ')}
  Affected Elements: ${violation.nodes}
  Learn More: ${violation.helpUrl}
  `;
}

/**
 * Format complete report for console output
 */
export function formatReportSummary(report: AccessibilityReport): string {
  const total = report.violations.length;
  const blocking = report.criticalCount + report.seriousCount;

  let summary = `
  ========================================
  Accessibility Report: ${report.pageTitle}
  URL: ${report.url}
  Timestamp: ${report.timestamp}
  ========================================

  Summary:
  - Total Violations: ${total}
  - Blocking Issues (P0/P1): ${blocking}
  - Critical (P0): ${report.criticalCount}
  - Serious (P1): ${report.seriousCount}
  - Moderate (P2): ${report.moderateCount}
  - Minor (P3): ${report.minorCount}

  - Tests Passed: ${report.passes}
  - Incomplete: ${report.incomplete}
  - Inaccessible: ${report.inaccessible}
  `;

  if (total > 0) {
    summary += '\n  Violations:\n';
    report.violations.forEach(violation => {
      summary += formatViolationDetails(violation);
    });
  }

  summary += '\n  ========================================\n';

  return summary;
}

/**
 * Check if there are blocking accessibility issues (P0/P1)
 */
export function hasBlockingIssues(report: AccessibilityReport): boolean {
  return report.criticalCount > 0 || report.seriousCount > 0;
}

/**
 * Get list of all WCAG violations
 */
export function getWCAGViolations(report: AccessibilityReport): AccessibilityViolation[] {
  return report.violations.filter(v => v.wcagTags.length > 0);
}

/**
 * Export report to JSON (for CI/CD integration)
 */
export function exportReportJSON(report: AccessibilityReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Check color contrast ratio
 * Note: This is handled by axe-core's 'color-contrast' rule
 */
export function hasColorContrastViolations(report: AccessibilityReport): boolean {
  return report.violations.some(v => v.id === 'color-contrast');
}

/**
 * Check for keyboard navigation violations
 */
export function hasKeyboardViolations(report: AccessibilityReport): boolean {
  return report.violations.some(v =>
    v.id.includes('focus') ||
    v.id.includes('tabindex') ||
    v.id.includes('keyboard')
  );
}

/**
 * Check for ARIA violations
 */
export function hasARIAViolations(report: AccessibilityReport): boolean {
  return report.violations.some(v => v.id.startsWith('aria-'));
}

/**
 * Check for form label violations
 */
export function hasFormLabelViolations(report: AccessibilityReport): boolean {
  return report.violations.some(v => v.id.includes('label'));
}

/**
 * Check for image alt text violations
 */
export function hasImageAltViolations(report: AccessibilityReport): boolean {
  return report.violations.some(v => v.id.includes('image-alt') || v.id.includes('img-alt'));
}
