# Security Deployment Guide

This guide provides instructions for deploying the security enhancements implemented in TaxProNG.

## Phase 3: Security Hardening - Deployment Steps

### 1. Enable Leaked Password Protection

**CRITICAL**: This must be enabled in your Supabase backend:

1. Go to your Lovable Cloud dashboard:
   ```
   Navigate to: Backend → Authentication → Settings
   ```

2. Find the "Password Protection" section

3. Enable "Leaked Password Protection"
   - This checks passwords against known data breaches
   - Users with compromised passwords will be required to change them

### 2. Deploy Security Headers

Security headers protect against XSS, clickjacking, and other attacks. They **must be configured at the hosting/CDN level**.

#### For Vercel Deployment

Create `vercel.json` in your project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=(), payment=()"
        }
      ]
    }
  ]
}
```

#### For Netlify Deployment

Create `_headers` file in the `public/` directory:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
```

#### For Cloudflare Deployment

Configure in Cloudflare Dashboard:

1. Go to: `Rules → Transform Rules → Modify Response Header`
2. Add each header manually:
   - Click "Create rule"
   - Set: "When incoming requests match" → "All incoming requests"
   - Add each security header with its value

#### For Other Hosting Platforms

Reference the configuration in `src/lib/security-headers.ts` for your platform's specific syntax.

### 3. Configure HTTPS/SSL

**CRITICAL**: The application MUST be served over HTTPS in production.

- Vercel/Netlify: Automatic SSL (free)
- Custom domain: Use Let's Encrypt or your hosting provider's SSL
- Cloudflare: Enable "Always Use HTTPS" and "Automatic HTTPS Rewrites"

### 4. Security Monitoring Setup

#### For Administrators

1. Navigate to Admin Panel → Security Monitor tab
2. Review:
   - Security event summary
   - High severity alerts
   - Rate limit violations
   - TIN access logs
   - Data export activity

#### Set Up Alerts

The Security Monitor automatically displays real-time toasts for high-severity events when:
- Multiple failed authentication attempts occur
- Rate limits are exceeded
- Sensitive data (TINs) are accessed
- Admin operations are performed

### 5. Regular Security Maintenance

#### Weekly Tasks
- Review Security Monitor dashboard
- Check for high-severity events
- Verify no unusual rate limit patterns

#### Monthly Tasks
- Run full security scan
- Review audit logs for anomalies
- Update dependencies (`npm update`)
- Check for new Supabase security advisories

#### Quarterly Tasks
- Comprehensive security audit
- Review and update RLS policies
- Test disaster recovery procedures
- Update security documentation

### 6. Application-Level Security

#### TIN Access Auditing

When displaying business TIN data, use the audit hook:

```typescript
import { useAuditTINAccess } from "@/hooks/useSecurityMonitor";

function BusinessDetails({ businessId }: Props) {
  const { auditAccess } = useAuditTINAccess();

  useEffect(() => {
    // Audit when TIN is viewed
    auditAccess(businessId);
  }, [businessId, auditAccess]);

  // ... render business data including TIN
}
```

#### Rate Limiting

Critical operations automatically use rate limiting:
- Data exports: 5 per hour
- Admin operations: 100 per hour
- Profile queries: 50 per hour

No additional configuration needed - implemented via `useRateLimit` hook.

### 7. Database Security Verification

Run these queries to verify security is properly configured:

```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
-- Should return no rows

-- Verify audit logs are being created
SELECT COUNT(*), entity, severity 
FROM audit_logs 
WHERE time > NOW() - INTERVAL '1 day'
GROUP BY entity, severity
ORDER BY COUNT(*) DESC;

-- Check for any high-severity events
SELECT * FROM security_events 
WHERE severity IN ('high', 'critical') 
ORDER BY time DESC 
LIMIT 10;
```

### 8. Security Incident Response

If a security incident is detected:

1. **Immediate Actions**:
   - Review Security Monitor for details
   - Check audit_logs for the affected user/resource
   - If necessary, disable the affected user account

2. **Investigation**:
   - Query `security_events` view for related events
   - Check `audit_logs` for access patterns
   - Review rate limit violations

3. **Remediation**:
   - Reset passwords if credentials compromised
   - Update RLS policies if authorization bypass detected
   - Add additional rate limits if abuse detected

4. **Documentation**:
   - Log incident details
   - Document response actions
   - Update security procedures if needed

## Security Checklist

- [ ] Leaked password protection enabled in Supabase
- [ ] Security headers configured in hosting platform
- [ ] HTTPS/SSL certificate active
- [ ] Security Monitor accessible to admins
- [ ] Audit logging verified working
- [ ] Rate limiting tested
- [ ] Incident response plan documented
- [ ] Regular security reviews scheduled

## Testing Security

### Test Rate Limiting
```bash
# Attempt 6 data exports rapidly (should block after 5)
for i in {1..6}; do
  curl -X POST https://your-app.com/api/export \
    -H "Authorization: Bearer YOUR_TOKEN"
  sleep 1
done
```

### Test Input Validation
```bash
# Try SQL injection in form
curl -X POST https://your-app.com/api/business \
  -H "Content-Type: application/json" \
  -d '{"name": "Test'; DROP TABLE businesses;--"}'
# Should be rejected with validation error
```

### Test Anonymous Access
```bash
# Try accessing profiles without auth
curl https://your-app.com/api/profiles
# Should return 401 Unauthorized
```

## Support and Resources

- **Security Headers Reference**: https://securityheaders.com/
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Supabase Security**: https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive
- **CSP Evaluator**: https://csp-evaluator.withgoogle.com/

## Contact

For security concerns or to report vulnerabilities:
- Review audit logs in Security Monitor
- Check security warnings in backend dashboard
- Follow responsible disclosure practices
