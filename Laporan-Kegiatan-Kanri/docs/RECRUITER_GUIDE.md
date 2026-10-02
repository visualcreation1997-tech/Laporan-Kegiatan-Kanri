# Technical Recruiter Guide

## How the CV maps to the code

**HTML / CSS / JavaScript**
→ `app/`

**Supabase / PostgreSQL**
→ `database/schema.sql` and queries in `app/app.js`

**Authentication**
→ Supabase Auth calls in `app/app.js`

**RLS / authorization**
→ `database/rls-policies.sql`

**Cloudinary**
→ photo upload flow in `app/app.js`

**Document automation**
→ `docx.js` and the Word generation functions in `app/app.js`

**Business process automation**
→ employee submission → admin review → approve/revision → Word output

## Interview explanation

> I built a web application to replace a manual monthly reporting workflow. The frontend uses HTML, CSS and JavaScript. Supabase handles authentication and PostgreSQL data, while Row Level Security controls access. Cloudinary stores activity and attendance photos. The application generates Word reports with docx.js and includes an admin review workflow where submitted reports can be approved or returned for revision.

The project should be evaluated as a practical serverless/business application, not as a custom backend or trained AI system.
