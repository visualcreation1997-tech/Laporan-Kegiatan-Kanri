# Employee Activity & Attendance Reporting System — V2

A practical internal reporting application built to replace a manual spreadsheet + document workflow for monthly employee activity and attendance reporting.

## Portfolio case study

**Problem**
- Employees submitted activity/attendance evidence through a manual process.
- Admins had to collect files, organize employee reports, place photos into documents, and prepare Word reports manually.

**Solution**
A browser-based application with:
- employee authentication
- monthly report records
- activity and attendance CRUD workflows
- Cloudinary photo uploads
- Supabase/PostgreSQL relational data
- Row Level Security (RLS)
- admin review workflow
- Approve / Revision status flow
- automated `.docx` generation with embedded photos

## Architecture

![Architecture](assets/architecture/architecture-v2.png)

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the technical explanation.

## Repository structure

```text
employee-reporting-system-v2/
├── README.md
├── ARCHITECTURE.md
├── SECURITY.md
├── .gitignore
├── src/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── assets/
│   ├── architecture/
│   │   └── architecture-v2.png
│   └── screenshots/
│       └── README.md
├── database/
│   ├── schema.sql
│   └── rls-policies.sql
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── WORKFLOW.md
│   ├── USER_GUIDE.md
│   └── RECRUITER_GUIDE.md
└── deployment/
    └── VERCEL.md
```

## Tech stack

- HTML5
- CSS3
- JavaScript
- Supabase Auth
- Supabase PostgreSQL
- PostgreSQL Row Level Security
- Cloudinary
- docx.js
- Git / GitHub
- Vercel

## Important note about this public repository

The source code is a sanitized portfolio copy.

Do **not** commit:
- Supabase service-role keys
- Cloudinary API secrets
- passwords
- employee data
- production database exports
- private screenshots

The client-side Supabase anon key is not a substitute for database security; access is protected through RLS policies.

Configuration values in `src/app.js` are placeholders and must be supplied for a private deployment.

## Resume alignment

This project demonstrates the following resume claims:

| Resume claim | Evidence |
|---|---|
| HTML / CSS / JavaScript | `src/` |
| Supabase / PostgreSQL | `database/` + `src/app.js` |
| Authentication | Supabase Auth integration |
| RLS / authorization | `database/rls-policies.sql` |
| Cloudinary | photo upload implementation |
| CRUD | reports, activities, attendance |
| Document automation | `docx.js` Word generation |
| Business process automation | end-to-end reporting workflow |
| Admin workflow | submitted → approved / revision |

For a recruiter-focused explanation, read [`docs/RECRUITER_GUIDE.md`](docs/RECRUITER_GUIDE.md).

## Live application

The live application is maintained separately from this sanitized portfolio repository.

Portfolio: https://miftahularif.vercel.app
GitHub: https://github.com/1997miftahularif/miftahul-arif-portfolio

