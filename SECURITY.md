# Security Guidelines for PyAirtable Frontend

## Critical Security Incident Response - August 17, 2025

**RESOLVED**: Exposed credentials have been completely removed from git history and PR #12.

### What Happened
- Sensitive Airtable API tokens and JIRA credentials were accidentally committed to the repository
- These credentials were exposed in `.env.local` and `.jira-config` files
- The credentials were present in PR #12 and multiple commits in git history

### What Was Done
1. **Complete History Cleanup**: Used `git-filter-repo` to remove sensitive files from entire git history
2. **Branch Sanitization**: Force-pushed cleaned branch to remove credentials from PR #12
3. **Template Creation**: Created `.env.example` and `.jira-config.example` with placeholder values
4. **Gitignore Enhancement**: Added comprehensive patterns to prevent future credential commits
5. **Security Documentation**: Created this security guide and recommendations

### Immediate Action Required
🚨 **ROTATE ALL EXPOSED CREDENTIALS IMMEDIATELY**

1. **Airtable Token**: `patYH31WYtE9fnm3M.[REDACTED_40_CHARS]` - ROTATE AT: https://airtable.com/create/tokens
2. **JIRA API Token**: `ATATT3xFfGF03j7C6cf_6vQyA1TMoi[REDACTED_REMAINDER]` - ROTATE AT: https://id.atlassian.com/manage-profile/security/api-tokens

## Security Best Practices

### Environment Variables
- ✅ Use `.env.local` for local development (gitignored)
- ✅ Use `.env.example` for documentation (safe to commit)
- ❌ NEVER commit `.env.local`, `.env.production.local`, or any file with real credentials
- ✅ Use environment variables in CI/CD pipelines
- ✅ Rotate credentials regularly (quarterly minimum)

### Credential Management
```bash
# Good - Template file
AIRTABLE_TOKEN="patXXXXXXXXXXXXXX.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Bad - Real credentials
AIRTABLE_TOKEN="patYH31WYtE9fnm3M.3d628ed8162ab4f8ec0ec9d23784234ce1af0a054daa8d8318a2b8cd11256e5a"
```

### Git Security
- ✅ Review all commits before pushing
- ✅ Use pre-commit hooks to scan for credentials
- ✅ Regular audit of git history for sensitive data
- ❌ NEVER use `git add .` without reviewing changes
- ✅ Use `git diff --cached` before committing

## Pre-Commit Hook Setup

### Installation
```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: package.lock.json
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: check-added-large-files
      - id: check-case-conflict
      - id: check-merge-conflict
      - id: check-yaml
      - id: end-of-file-fixer
      - id: trailing-whitespace
      - id: no-commit-to-branch
        args: ['--branch', 'main']
  - repo: local
    hooks:
      - id: check-env-files
        name: Check for exposed credentials in env files
        entry: bash -c 'if find . -name "*.env*" -not -name "*.example" | grep -v node_modules | head -1; then echo "ERROR: .env files detected. Use .env.example instead."; exit 1; fi'
        language: system
        pass_filenames: false
EOF

# Install the hooks
pre-commit install
```

### Manual Credential Detection
```bash
# Scan for potential secrets
git diff --cached | grep -E "(token|key|secret|password|api)" || echo "No potential secrets found"

# Check for common credential patterns
git diff --cached | grep -E "(pat[A-Za-z0-9]{40,}|ATATT[A-Za-z0-9]{40,})" || echo "No API tokens found"
```

## Security Headers Configuration

### Next.js Security Headers
Add to `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.airtable.com https://3vantage.atlassian.net;
    `.replace(/\\s{2,}/g, ' ').trim()
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## Incident Response Checklist

### If Credentials Are Exposed
1. **Immediate Response** (within 15 minutes)
   - [ ] Stop all deployments
   - [ ] Rotate exposed credentials
   - [ ] Assess impact scope
   - [ ] Document the incident

2. **Cleanup** (within 1 hour)
   - [ ] Remove credentials from git history
   - [ ] Force push cleaned branches
   - [ ] Update all affected PRs
   - [ ] Notify team members

3. **Prevention** (within 24 hours)
   - [ ] Review and update .gitignore
   - [ ] Install pre-commit hooks
   - [ ] Conduct security training
   - [ ] Create template files

4. **Monitoring** (ongoing)
   - [ ] Monitor for unauthorized access
   - [ ] Review access logs
   - [ ] Update security documentation
   - [ ] Schedule regular security audits

## Security Contacts

- **Security Lead**: Development Team
- **Incident Response**: Immediate rotation and cleanup
- **Documentation**: Update security procedures

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Airtable API Security](https://airtable.com/developers/web/api/authentication)
- [Atlassian API Security](https://developer.atlassian.com/cloud/jira/platform/security-overview/)

---

**Last Updated**: August 17, 2025  
**Next Review**: September 17, 2025