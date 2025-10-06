# Security Maintenance Guide

This document provides comprehensive guidance for ongoing security monitoring and maintenance of the TaxProNG application.

## Table of Contents
1. [Security Architecture Overview](#security-architecture-overview)
2. [Daily Security Monitoring](#daily-security-monitoring)
3. [Weekly Security Tasks](#weekly-security-tasks)
4. [Monthly Security Audits](#monthly-security-audits)
5. [Incident Response](#incident-response)
6. [Security Tools & Functions](#security-tools--functions)

## Security Architecture Overview

### Multi-Layer Security Approach
TaxProNG implements a defense-in-depth strategy with multiple security layers:

1. **Authentication Layer**
   - Leaked password protection enabled
   - Strong password requirements (Zod validation)
   - Session management with automatic token refresh

2. **Authorization Layer**
   - Role-based access control (admin, pro, owner, staff)
   - Row-Level Security (RLS) on all sensitive tables
   - Organization-based data isolation

3. **Rate Limiting Layer**
   - Profile access: 100 requests/hour
   - Marketplace browsing: 100 requests/hour
   - Professional services: 50 requests/hour
   - Reviews: 100 requests/hour

4. **Audit Logging Layer**
   - All sensitive operations logged
   - Automatic severity classification
   - Real-time alerts for high-severity events

5. **Data Protection Layer**
   - Encrypted backup credentials (pgsodium)
   - TIN access auditing
   - Secure data export process

## Daily Security Monitoring

### Morning Security Checklist (5 minutes)

1. **Check Security Dashboard Summary**
   ```sql
   SELECT * FROM security_dashboard_summary;
   ```
   - Review events_24h (normal: < 5000)
   - Check critical_events_24h (acceptable: 0-5)
   - Monitor rate_limits_24h (increasing = possible attack)

2. **Scan for Suspicious Activity**
   - Navigate to Admin → Security Monitor
   - Click "Scan for Suspicious Activity"
   - Investigate any patterns with >100 requests/hour

3. **Review High-Severity Alerts**
   - Check for real-time toast notifications
   - Filter audit logs by severity: "high" or "critical"
   - Take immediate action on any critical alerts

### Evening Security Review (10 minutes)

1. **Generate Daily Report**
   - Click "Generate Report" in Security Monitor
   - Review event summary and top users
   - Archive report for compliance

2. **Check Rate Limit Effectiveness**
   ```sql
   SELECT * FROM get_security_metrics(1);
   ```
   - Verify rate limits are blocking excessive requests
   - Adjust limits if legitimate users are being blocked

## Weekly Security Tasks

### Every Monday (30 minutes)

1. **Run Comprehensive Health Check**
   ```sql
   SELECT * FROM run_security_health_check();
   ```
   - Address any "fail" status checks immediately
   - Create tickets for "warning" status items
   - Document resolutions

2. **Review Admin Access**
   ```sql
   SELECT 
     p.email, 
     p.name, 
     ur.role, 
     ur.created_at
   FROM user_roles ur
   JOIN profiles p ON ur.user_id = p.id
   WHERE ur.role = 'admin'::app_role
   ORDER BY ur.created_at DESC;
   ```
   - Verify all admins should have access
   - Remove inactive admin accounts
   - Audit admin activity for unusual patterns

3. **Check Backup Status**
   ```sql
   SELECT 
     o.name as org_name,
     bs.enabled,
     bs.provider,
     br.status as last_backup_status,
     br.finished_at as last_backup_date
   FROM orgs o
   LEFT JOIN backup_settings bs ON o.id = bs.org_id
   LEFT JOIN LATERAL (
     SELECT status, finished_at
     FROM backup_runs
     WHERE org_id = o.id
     ORDER BY finished_at DESC
     LIMIT 1
   ) br ON true
   WHERE o.deleted_at IS NULL;
   ```
   - Ensure all production orgs have backups enabled
   - Verify recent backup success
   - Test backup restoration quarterly

### Every Friday (20 minutes)

1. **Analyze Suspicious Patterns**
   ```sql
   SELECT * FROM detect_suspicious_access_patterns();
   ```
   - Investigate users flagged as suspicious
   - Contact users if behavior is concerning
   - Update rate limits if needed

2. **Review Data Exports**
   ```sql
   SELECT 
     p.email,
     o.name as org_name,
     der.created_at,
     der.status
   FROM data_export_requests der
   JOIN profiles p ON der.requested_by = p.id
   JOIN orgs o ON der.org_id = o.id
   WHERE der.created_at > NOW() - INTERVAL '7 days'
   ORDER BY der.created_at DESC;
   ```
   - Flag unusual export patterns (>3 exports/week)
   - Verify exports were legitimate
   - Check file sizes for anomalies

## Monthly Security Audits

### First Monday of Each Month (2 hours)

1. **Run Full Security Report**
   ```sql
   SELECT generate_security_report(
     NOW() - INTERVAL '30 days',
     NOW()
   );
   ```
   - Analyze trends month-over-month
   - Present findings to leadership
   - Create action items for improvements

2. **Review RLS Policies**
   - Check for tables without RLS:
   ```sql
   SELECT tablename
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename NOT IN ('schema_migrations')
   AND NOT EXISTS (
     SELECT 1
     FROM pg_policies
     WHERE tablename = pg_tables.tablename
   );
   ```
   - Test RLS policies with different user roles
   - Update policies for new feature releases

3. **Password & Authentication Review**
   - Verify leaked password protection is enabled
   - Check for failed authentication attempts:
   ```sql
   SELECT 
     DATE_TRUNC('day', time) as date,
     COUNT(*) as failed_attempts
   FROM audit_logs
   WHERE entity LIKE '%auth%'
     AND payload_hash = 'rate_limited'
     AND time > NOW() - INTERVAL '30 days'
   GROUP BY DATE_TRUNC('day', time)
   ORDER BY date DESC;
   ```
   - Review and update password requirements if needed

4. **Sensitive Data Access Audit**
   - Review TIN access logs:
   ```sql
   SELECT 
     p.email,
     al.time,
     al.entity_id as business_id
   FROM audit_logs al
   JOIN profiles p ON al.user_id = p.id
   WHERE al.entity LIKE '%_tin'
     AND al.time > NOW() - INTERVAL '30 days'
   ORDER BY al.time DESC;
   ```
   - Verify all accesses were legitimate
   - Investigate any suspicious patterns

5. **Update Security Documentation**
   - Document new threats encountered
   - Update incident response procedures
   - Train team on new security features

## Incident Response

### Severity Classification

**Critical (P0)** - Immediate response required
- Data breach confirmed
- Unauthorized admin access
- SQL injection detected
- Credential compromise

**High (P1)** - Response within 2 hours
- Rate limit bypass attempt
- Unusual bulk data access
- Suspicious admin activity
- Failed backup restoration

**Medium (P2)** - Response within 24 hours
- Multiple failed login attempts
- Unusual export patterns
- Profile enumeration attempts

**Low (P3)** - Response within 1 week
- Minor RLS policy improvements
- Rate limit tuning
- Documentation updates

### Incident Response Procedure

1. **Detect & Classify**
   - Use Security Monitor alerts
   - Check audit logs for context
   - Classify severity level

2. **Contain**
   - **Critical**: Immediately disable affected accounts
   - **High**: Implement temporary access restrictions
   - **Medium/Low**: Monitor and prepare mitigation

3. **Investigate**
   - Run suspicious pattern detection
   - Review relevant audit logs
   - Identify root cause
   - Document findings

4. **Remediate**
   - Fix security vulnerability
   - Update RLS policies if needed
   - Deploy security patches
   - Verify fix effectiveness

5. **Communicate**
   - Notify affected users (if required)
   - Update security team
   - Document in incident log
   - File regulatory reports (if required)

6. **Post-Mortem**
   - Conduct review meeting
   - Update security procedures
   - Implement preventive measures
   - Train team on lessons learned

## Security Tools & Functions

### Admin-Only Security Functions

All security functions require admin role. Call them via:
```typescript
import { supabase } from "@/integrations/supabase/client";

// Example
const { data, error } = await supabase.rpc('function_name', { params });
```

### Available Functions

1. **`run_security_health_check()`**
   - No parameters
   - Returns comprehensive health status
   - Checks: RLS, auth, backups, exports, sensitive data access

2. **`detect_suspicious_access_patterns()`**
   - No parameters
   - Returns users with >50 requests/hour
   - Includes severity classification

3. **`get_security_metrics(_days: integer)`**
   - Default: 30 days
   - Returns key metrics with trends
   - Metrics: daily events, rate limits, active users, incidents

4. **`generate_security_report(_start_date: timestamp, _end_date: timestamp)`**
   - Returns JSON report
   - Includes event summary, top users, incidents
   - Automatically logs report generation

5. **`get_security_summary(_days_back: integer)`**
   - Default: 7 days
   - Returns quick summary for dashboard
   - Counts: total events, high severity, unique users, rate limits

### Rate-Limited Access Functions

These functions enforce rate limits and log access:

1. **`get_professional_services_requests(_limit: integer)`**
   - Max 50 queries/hour per user
   - Admins see all, users see own

2. **`get_pros_list(_limit: integer, _offset: integer)`**
   - Max 100 queries/hour per user
   - Max 50 results per query

3. **`get_pro_reviews(_pro_id: uuid, _limit: integer)`**
   - Max 100 queries/hour per user
   - Max 20 reviews per query

4. **`get_pro_safely(_pro_id: uuid)`**
   - Max 200 queries/hour per user
   - Use for single pro profile access

### Automated Triggers

1. **`trigger_bulk_access_alert`**
   - Fires on every audit_logs insert
   - Detects >10 accesses in 5 minutes
   - Automatically escalates severity to "high"

2. **`audit_tin_update`**
   - Fires on businesses table TIN updates
   - Logs with "high" severity
   - Tracks who changed TIN data

### Security Views

1. **`security_events`**
   - Admin-only access
   - Joins audit_logs with profiles
   - Shows user-friendly event details

2. **`security_dashboard_summary`**
   - Quick 24-hour metrics
   - Used by SecurityMonitor component
   - Includes: events, critical incidents, active users, rate limits

## Best Practices

### Development
- Never hardcode credentials
- Use environment variables via secrets
- Always validate user input with Zod
- Test RLS policies with different roles
- Log sensitive operations

### Deployment
- Run security linter before deploy
- Review migration security impact
- Test in staging first
- Monitor alerts post-deploy
- Keep rollback plan ready

### Monitoring
- Check Security Monitor daily
- Run health checks weekly
- Generate reports monthly
- Respond to alerts immediately
- Document all incidents

### User Management
- Review admin access monthly
- Remove inactive accounts quarterly
- Audit high-privilege operations
- Enforce strong passwords
- Enable 2FA for admins (future)

## Emergency Contacts

**Security Incidents:**
- Primary: [Your Security Team Email]
- Secondary: [Backup Contact]
- Escalation: [Leadership Contact]

**Compliance Issues:**
- Data Protection Officer: [Email]
- Legal Team: [Email]

**External Resources:**
- Supabase Security Docs: https://supabase.com/docs/guides/auth/security-faq
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Nigeria Data Protection Regulation: [Link to NDPR]

## Version History

- **v1.0** - 2025-10-06: Initial security implementation
  - Phase 1: Critical fixes (leaked passwords, profile RLS, QA citations)
  - Phase 2: Rate limiting, anti-scraping measures
  - Phase 3: Monitoring, health checks, automated reports

---

**Last Updated:** 2025-10-06  
**Next Review:** 2025-11-06  
**Owner:** Security Team