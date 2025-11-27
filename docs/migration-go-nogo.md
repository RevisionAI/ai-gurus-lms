# Production Migration Go/No-Go Criteria

## Overview

This document defines the criteria for approving the SQLite to PostgreSQL production migration. All GO criteria must be met, and no NO-GO criteria can be present before proceeding with production migration.

**Decision Authority:** Development Team Lead
**Review Date:** Prior to production migration
**Status:** [ ] GO / [ ] NO-GO / [ ] PENDING

---

## GO Criteria

**All of the following criteria MUST be TRUE to proceed with migration:**

### 1. Data Integrity Validation (Required)

| Criterion | Target | Status |
|-----------|--------|--------|
| Row count validation | 100% match (all 10 models) | [ ] Pass |
| Checksum validation | 100% match (critical fields) | [ ] Pass |
| Foreign key integrity | Zero orphaned records | [ ] Pass |
| Data type preservation | All types preserved correctly | [ ] Pass |

**Validation Command:**
```bash
npm run validate:migration
```

**Evidence Required:**
- [ ] Validation report shows "OVERALL: PASS"
- [ ] JSON report saved to `/docs/validation-results-[date].json`
- [ ] Manual spot-check of 10 random records confirms accuracy

---

### 2. Performance Baseline (Required)

| Query Type | Target (p95) | Actual | Status |
|------------|--------------|--------|--------|
| Course List | < 100ms | ___ ms | [ ] Pass |
| Gradebook | < 100ms | ___ ms | [ ] Pass |
| Assignment Detail | < 100ms | ___ ms | [ ] Pass |
| Discussion Thread | < 100ms | ___ ms | [ ] Pass |
| User Enrollments | < 100ms | ___ ms | [ ] Pass |

**Performance Command:**
```bash
npm run validate:performance
```

**Evidence Required:**
- [ ] Performance report shows all queries < 100ms (p95)
- [ ] JSON report saved to `/docs/performance-baseline-[date].json`
- [ ] No query shows > 50% regression vs SQLite baseline (if measured)

---

### 3. Rollback Procedure Tested (Required)

| Test | Expected Result | Actual Result | Status |
|------|-----------------|---------------|--------|
| SQLite backup exists | File in /backups/ | ___ | [ ] Pass |
| Backup integrity verified | sqlite3 query succeeds | ___ | [ ] Pass |
| Rollback executed | Completed < 30 min | ___ min | [ ] Pass |
| App functional after rollback | All critical flows work | ___ | [ ] Pass |

**Evidence Required:**
- [ ] Rollback test report saved to `/docs/rollback-test-results-[date].md`
- [ ] Rollback completed within 30-minute target
- [ ] Post-rollback application verification passed

---

### 4. Database Connection Stability (Required)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Health check uptime | 100% for 24 hours | ___ % | [ ] Pass |
| Connection errors | Zero | ___ | [ ] Pass |
| Query timeouts | Zero | ___ | [ ] Pass |

**Evidence Required:**
- [ ] Health endpoint (`/api/health`) monitored for 24 hours
- [ ] No connection failures logged
- [ ] Prisma client stable (no reconnection errors)

---

### 5. Documentation Complete (Required)

| Document | Location | Status |
|----------|----------|--------|
| Rollback procedures | `/docs/rollback-procedures.md` | [ ] Complete |
| Validation results | `/docs/validation-results-[date].md` | [ ] Complete |
| Performance baseline | `/docs/performance-baseline-[date].json` | [ ] Complete |
| Go/No-Go decision | This document | [ ] Complete |

---

## NO-GO Criteria

**If ANY of the following criteria are TRUE, migration MUST be halted:**

### 1. Data Loss Detected (Critical)

- [ ] Any records missing from PostgreSQL that exist in SQLite
- [ ] Row count mismatch for any model
- [ ] Corrupted data detected (checksum mismatch)
- [ ] Truncated string fields
- [ ] Lost precision in numeric fields

**Action if detected:** HALT migration, investigate root cause, document findings.

---

### 2. Foreign Key Violations Present (Critical)

- [ ] Orphaned enrollment records (user/course doesn't exist)
- [ ] Orphaned assignment records (course doesn't exist)
- [ ] Orphaned submission records (assignment/student doesn't exist)
- [ ] Orphaned grade records (assignment/student/grader doesn't exist)
- [ ] Any foreign key constraint violation detected

**Action if detected:** HALT migration, fix data relationships, re-validate.

---

### 3. Performance Regression > 50% (Severe)

- [ ] Any critical query p95 > 150ms
- [ ] Overall p95 latency > 50% higher than SQLite baseline
- [ ] Query timeouts occurring
- [ ] Connection pool exhaustion

**Action if detected:** HALT migration, optimize queries/indexes, re-test performance.

---

### 4. Rollback Procedure Fails (Critical)

- [ ] SQLite backup corrupted or missing
- [ ] Rollback exceeds 30-minute target
- [ ] Application non-functional after rollback
- [ ] Data loss occurs during rollback

**Action if detected:** HALT migration, fix rollback procedure, create new backups, re-test.

---

### 5. PostgreSQL Connection Unstable (Severe)

- [ ] Frequent disconnections (> 1 per hour)
- [ ] Health check failures
- [ ] SSL/TLS certificate errors
- [ ] Connection pool failures

**Action if detected:** HALT migration, resolve connection issues, establish stability for 24 hours.

---

## Contingency Plan

If a NO-GO condition is detected:

### Immediate Actions
1. **Stop migration immediately**
2. **Document the failure** - Record exact error, timestamp, affected data
3. **Execute rollback** - Follow `/docs/rollback-procedures.md`
4. **Notify stakeholders** - Development team, product owner

### Investigation Phase (Within 48 hours)
1. **Analyze root cause** - Review logs, validation reports, error messages
2. **Document findings** - Create issue in project tracker
3. **Develop fix** - Address root cause, not just symptoms
4. **Update validation script** - Add checks for discovered issue

### Retry Phase
1. **Test fix in isolation** - Verify fix works on test data
2. **Re-run full validation** - All criteria must pass
3. **Create fresh backup** - New SQLite backup before retry
4. **Schedule retry migration** - With team availability

---

## Approval Sign-Off

### Pre-Migration Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Development Lead | _______________ | _____________ | __________ |
| Technical Reviewer | _______________ | _____________ | __________ |

### Decision

**Based on the criteria above, the migration decision is:**

- [ ] **GO** - All GO criteria met, no NO-GO criteria present. Proceed with production migration.
- [ ] **NO-GO** - One or more criteria not met. Migration halted. See contingency plan.
- [ ] **CONDITIONAL GO** - Minor issues exist but can be addressed during migration. Proceed with caution.

**Decision Date:** _______________

**Decision Rationale:**
```
[Document the reasoning for the GO/NO-GO decision here]
```

---

## Checklist Summary

### GO Criteria (All must be checked)
- [ ] Data integrity: 100% validated
- [ ] Foreign keys: Zero violations
- [ ] Performance: All queries < 100ms (p95)
- [ ] Rollback: Tested successfully (< 30 min)
- [ ] Connection: Stable for 24 hours
- [ ] Documentation: Complete

### NO-GO Criteria (None can be checked)
- [ ] Data loss detected
- [ ] Foreign key violations
- [ ] Performance regression > 50%
- [ ] Rollback procedure fails
- [ ] Connection unstable

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-25 | Dev Agent | Initial go/no-go criteria |

---

## Related Documents

- [Rollback Procedures](./rollback-procedures.md)
- [Database Architecture](./architecture.md#Data-Architecture)
- [Tech Spec Epic 1](./tech-spec-epic-1.md)
