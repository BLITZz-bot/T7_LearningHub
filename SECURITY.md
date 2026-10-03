# 🛡️ Security Policy & Intellectual Property Notice

## 👤 Author & Ownership Notice

**T7 Learning Hub (USEReady Edition)** is designed, architected, and built by **M M Bharath**.

All rights reserved. The architecture, source code, user interfaces, branding, custom prompts, algorithms, and integration pipelines are the proprietary intellectual property of **M M Bharath**.

---

## 🚫 Copyright Protection & Anti-Plagiarism Warning

> ### ⚠️ STRICT NOTICE TO CLONERS, SCRAPERS, AND COPYCATS
> **Unauthorized copying, distribution, reproduction, re-hosting, modifying, selling, or reverse-engineering of this project (in whole or in part) without explicit prior written consent from M M Bharath is strictly prohibited.**
>
> Any individual, organization, or platform found:
> 1. Forking/cloning and republishing this code as their own work,
> 2. Removing authorship attribution, license notices, or watermarks,
> 3. Utilizing this project for academic dishonesty or uncredited submissions,
> 4. Deploying commercial clones or unauthorized public mirrors,
>
> **will face immediate action, including:**
> - 🚨 **DMCA Takedown Notices** filed directly with GitHub, hosting providers (Vercel, Render, Supabase), and domain registrars.
> - 🚫 **Account Reporting & Suspension/Ban** requests escalated to GitHub Trust & Safety.
> - ⚖️ **Legal remedies** under applicable Intellectual Property, Copyright, and Computer Misuse laws.

---

## 🔒 Supported Versions

Only the latest release on the primary development branch (`V3-Lang-version` / `main`) receives active security updates and vulnerability patches.

| Version / Branch | Supported          |
| ---------------- | ------------------ |
| `V3-Lang-version` | :white_check_mark: |
| `main`           | :white_check_mark: |
| `< 2.0.0`        | :x:                |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability or exploit within T7 Learning Hub, please disclose it responsibly. Do **NOT** disclose vulnerabilities publicly in open GitHub issues or discussion boards.

### How to Report:
1. **Direct Communication**: Contact the lead developer and author, **M M Bharath**, directly.
2. **Details to Include**:
   - Description and scope of the vulnerability.
   - Step-by-step reproduction steps or Proof of Concept (PoC).
   - Potential impact (e.g., privilege escalation, token exposure, injection).
   - Proposed mitigation or patch (if available).
3. **Response Window**:
   - Acknowledgment: within **24–48 hours**.
   - Triage and mitigation plan: within **3–5 business days**.

---

## 🛡️ Security Guidelines for Contributors & Users

1. **Environment Variables & Secrets**:
   - Never commit `.env` or files containing secret keys (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, JWT secrets, etc.).
   - Use `.env.example` as a template for public reference.
2. **API Protection**:
   - Ensure backend endpoints (Render / Vercel Serverless) validate incoming payloads and sanitize queries to prevent prompt injection or SQL injection.
3. **Client-Side Storage**:
   - Do not store sensitive credentials or service-role keys in browser `localStorage` or `sessionStorage`.

---

## 📜 Legal & Copyright Notice

```
Copyright (c) 2024-2026 M M Bharath. All Rights Reserved.

This software and associated documentation files are proprietary and confidential.
No permission is granted to reproduce, publish, sublicense, or distribute copies
of the Software without express written authorization from M M Bharath.
```
