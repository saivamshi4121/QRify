# 15. Security Architecture & Compliance: Qrezo v2

## 1. Threat Modeling (STRIDE Threat Analysis)

| Threat Category | Specific System Risk | Technical Defense Mechanism |
| :--- | :--- | :--- |
| **Spoofing** | Unauthorized user attempting to view or alter another Workspace's feedback responses. | Mandatory NextAuth JWT Session verification + `WorkspaceMember` DB scoping on every API request. |
| **Tampering** | Modification of dynamic QR destination URL by malicious third party. | Session Ownership Checks (`session.user.id === qr.userId`) + Role-Based Access Control (RBAC). |
| **Repudiation** | User denies marking a negative feedback incident as "Resolved". | Audit Logging (`models/AuditLog.ts`) recording timestamp, user ID, IP, and action performed. |
| **Information Disclosure**| Publicly accessible endpoint dumping customer phone numbers or feedback comments. | BOLA/IDOR fixes: Stripping customer PII from public APIs. Enforcing session guards on `/api/v2/feedback/responses`. |
| **Denial of Service** | Bot flooding `/api/qr/upload-logo` or `/api/qr/redirect` with millions of requests. | Redis Sliding-Window Rate Limiting + Unauthenticated Upload Endpoint removal. |
| **Elevation of Privilege**| Standard `user` modifying payload to set `role = "admin"`. | Zod strict schema parsing stripping non-whitelisted payload fields (`.strip()`). |

---

## 2. OWASP Top 10 Mitigation Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                      OWASP Top 10 Defense Architecture                  │
├───────────────────────────────────┬────────────────────────────────────┤
│ Vulnerability                     │ Qrezo v2 Countermeasure Standard   │
├───────────────────────────────────┼────────────────────────────────────┤
│ **Broken Object-Level Auth**      │ Enforce workspaceId & userId match │
│ **(BOLA / IDOR)**                 │ checks on ALL DB find queries.     │
├───────────────────────────────────┼────────────────────────────────────┤
│ **Broken Authentication**         │ NextAuth JWT with httpOnly, secure │
│                                   │ sameSite cookies & bcrypt salt 10. │
├───────────────────────────────────┼────────────────────────────────────┤
│ **Injection (SQL / NoSQL)**       │ Mongoose parameterized schema types│
│                                   │ (no raw `{ $where: ... }` strings).│
├───────────────────────────────────┼────────────────────────────────────┤
│ **Cross-Site Scripting (XSS)**    │ React automatic JSX escaping + Zod │
│                                   │ HTML sanitization on comment text. │
├───────────────────────────────────┼────────────────────────────────────┤
│ **Security Misconfiguration**     │ Strict CORS rules + Helmet HTTP    │
│                                   │ security headers (HSTS, CSP).      │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 3. Data Protection & GDPR Compliance

### Data Retention & Anonymization Policy
1. **Feedback Customer PII:** Phone numbers and email addresses submitted during private feedback are automatically masked (`+1415***2671`) after **90 days** unless active incident resolution is pending.
2. **IP Address Hashing:** Raw scan IP addresses are hashed using SHA-256 with a daily rotating salt before storing in `ScanLog` to prevent user tracking while allowing unique scan counting.
3. **Right to Be Forgotten (GDPR Art. 17):** Executing `DELETE /api/v2/user/account` triggers a multi-document deletion of the User, Workspace, owned QRs, SmartPages, and associated ScanLogs.

---

## 4. Environment Secrets Security Standard

All production secrets must be managed via secure environment variables (`.env.local` / Vercel Secrets). Commit of `.env` files to git repositories is strictly blocked via pre-commit hooks.

```bash
# Production Mandatory Env Matrix Check
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MONGODB_URI=
NEXTAUTH_SECRET=
RAZORPAY_KEY_SECRET=
STRIPE_SECRET_KEY=
UPSTASH_REDIS_REST_TOKEN=
```
