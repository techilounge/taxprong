# Security View Architecture

## Overview
This document explains the security architecture for database views in TaxProNG, addressing the "Security Definer View" warnings and explaining why certain design decisions were made.

## Understanding Security Definer vs Security Invoker

### SECURITY DEFINER (PostgreSQL Default)
- View executes with privileges of the **view creator**
- Can bypass Row Level Security (RLS) policies
- Useful for controlled aggregation across multiple tables
- **Risk**: If not properly protected, can expose unauthorized data

### SECURITY INVOKER
- View executes with privileges of the **querying user**
- Respects RLS policies of underlying tables
- Follows principle of least privilege
- **Best for**: Views that should respect user permissions

## Our View Security Strategy

### Category 1: User-Accessible Views (SECURITY INVOKER)

#### `backup_settings_safe`
```sql
CREATE VIEW backup_settings_safe 
WITH (security_invoker=true, security_barrier=true)
```

**Why security_invoker?**
- Users should only see backup settings for their own organizations
- Respects the underlying `backup_settings` table RLS policies
- Org owners can access, others cannot

**Security Barrier**: Prevents query optimizer from leaking information through pushed-down predicates

### Category 2: Admin-Only Views (SECURITY DEFINER with Access Control)

These views aggregate sensitive security data across the entire system. They use SECURITY DEFINER but have **direct access revoked**, forcing access through SECURITY DEFINER functions that enforce admin-only authorization.

#### `security_events`
```sql
CREATE VIEW security_events WITH (security_barrier=true)
REVOKE ALL ON security_events FROM authenticated, anon;
```

**Access Method**: `get_security_events()` function
- Function checks `has_role(auth.uid(), 'admin')` before returning data
- Direct view access is blocked
- Admin-only via explicit permission check

**Why SECURITY DEFINER?**
- Needs to aggregate audit logs across ALL users
- If it used security_invoker, it would only show the querying user's logs
- Controlled access via function provides security

#### `security_dashboard_summary` & `security_dashboard_enhanced`
```sql
CREATE VIEW security_dashboard_*
WITH (security_barrier=true)
REVOKE ALL FROM authenticated, anon;
```

**Access Method**: 
- `get_security_dashboard_summary()` 
- `get_security_dashboard_enhanced()`

**Why SECURITY DEFINER?**
- Aggregates metrics across entire system (all users, all orgs)
- Counts admin roles, backup configurations, etc.
- Cannot respect individual user permissions

**Security Control**: 
- Direct access revoked
- Only accessible via functions with admin checks

#### `scheduled_jobs_status`
```sql
CREATE VIEW scheduled_jobs_status
WITH (security_barrier=true)
REVOKE ALL FROM authenticated, anon;
```

**Access Method**: System-only
**Why SECURITY DEFINER?**
- Queries `cron.job` system table
- Reveals system configuration
- Admin-only information

## Security Layers

### Layer 1: View Configuration
- ✅ `security_invoker=true` for user views
- ✅ `security_barrier=true` for all views (prevents information leakage)
- ✅ Explicit access revocation where needed

### Layer 2: Function-Based Access Control
```sql
CREATE FUNCTION get_security_events()
SECURITY DEFINER
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM security_events;
END;
$$;
```

- Explicit authorization checks
- Cannot be bypassed
- Audit logged

### Layer 3: Underlying Table RLS
- All base tables have RLS policies
- Views inherit protection when using security_invoker
- Double protection layer

## Why Not All security_invoker?

**Problem with security_invoker for admin views:**

If `security_events` used `security_invoker=true`:
```sql
-- User A queries security_events
SELECT * FROM security_events;
-- Would only see their own audit_logs due to RLS on audit_logs table
-- Admin couldn't see system-wide events!
```

**Solution: SECURITY DEFINER + Access Control Function**
```sql
-- Admin queries via function
SELECT * FROM get_security_events();
-- Function checks admin role, then view aggregates ALL events
-- Non-admins get "Unauthorized" exception
```

## Security Linter Compliance

### ✅ Resolved Issues
1. **User-accessible views**: Now use `security_invoker=true`
2. **Admin views**: Use SECURITY DEFINER but with revoked direct access
3. **Security barriers**: Applied to all views
4. **Documentation**: All views documented in `security_view_documentation` table

### Remaining Linter Warnings (By Design)

The linter may still show warnings for admin-only views because they use SECURITY DEFINER. This is **intentional and secure** because:

1. ✅ Direct access is revoked (REVOKE ALL)
2. ✅ Access only via SECURITY DEFINER functions
3. ✅ Functions have explicit admin checks
4. ✅ All access is audit logged
5. ✅ Security barrier prevents information leakage

### Verification Function

Use this function to verify view security:
```sql
SELECT * FROM get_view_security_status();
```

Returns:
- View name
- Security mode (invoker/definer)
- Direct access allowed (yes/no)
- Access control method
- Security status

## Best Practices Going Forward

### When Creating New Views

**User-facing data?** → Use `security_invoker=true`
```sql
CREATE VIEW user_data_view
WITH (security_invoker=true, security_barrier=true)
AS SELECT * FROM user_table;
```

**System-wide aggregation?** → Use SECURITY DEFINER + Function
```sql
-- View
CREATE VIEW system_metrics WITH (security_barrier=true)
AS SELECT COUNT(*) ... FROM system_tables;

REVOKE ALL ON system_metrics FROM authenticated, anon;

-- Function
CREATE FUNCTION get_system_metrics()
SECURITY DEFINER
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM system_metrics;
END;
$$;
```

### Testing View Security

1. **Test as regular user**: Should not see sensitive data
2. **Test as org owner**: Should see only their org's data
3. **Test as admin**: Should see aggregated system data
4. **Test direct view access**: Should be blocked for admin views

## Common Mistakes to Avoid

❌ **DON'T**: Create admin views without access control
```sql
-- BAD: Anyone can query this
CREATE VIEW admin_data AS SELECT * FROM sensitive_table;
```

✅ **DO**: Create controlled access
```sql
-- GOOD: Revoke direct access, provide function
CREATE VIEW admin_data WITH (security_barrier=true) AS ...
REVOKE ALL ON admin_data FROM authenticated, anon;

CREATE FUNCTION get_admin_data()
SECURITY DEFINER AS $$
  -- Check permissions first
END;
$$;
```

❌ **DON'T**: Use security_invoker for cross-user aggregations
```sql
-- BAD: Would only show current user's data
CREATE VIEW all_users_summary 
WITH (security_invoker=true)
AS SELECT COUNT(*) FROM users;
```

✅ **DO**: Use security_definer with function-based access
```sql
-- GOOD: Aggregates all users, admin-only access
CREATE VIEW all_users_summary 
WITH (security_barrier=true)
AS SELECT COUNT(*) FROM users;

REVOKE ALL ON all_users_summary FROM authenticated, anon;
-- Access via get_all_users_summary() function
```

## Security Audit Checklist

When reviewing database views:

- [ ] Does the view contain sensitive data?
- [ ] Should users see only their own data? → `security_invoker=true`
- [ ] Does it aggregate across multiple users? → `security_definer` + function
- [ ] Is `security_barrier=true` set?
- [ ] For admin views, is direct access revoked?
- [ ] Are SECURITY DEFINER functions documented?
- [ ] Do functions have explicit permission checks?
- [ ] Is the view documented in `security_view_documentation`?

## References

- PostgreSQL Docs: [Security Invoker Views](https://www.postgresql.org/docs/current/sql-createview.html)
- Supabase Guide: [Security Definer Views](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- Project Docs: `SECURITY_MAINTENANCE.md`, `PHASE1_SECURITY_FIXES.md`

---

**Last Updated**: 2025-01-06  
**Security Review**: Approved  
**Compliance Status**: ✅ All critical issues resolved