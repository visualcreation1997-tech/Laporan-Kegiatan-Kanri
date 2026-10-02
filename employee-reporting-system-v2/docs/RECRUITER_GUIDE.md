# Recruiter / Technical Review Guide

This file explains where a technical recruiter can verify the claims made in the CV.

## 1. "Built a real web application"

Check:
- `src/index.html`
- `src/styles.css`
- `src/app.js`

The project contains real UI, state handling, authentication, CRUD, admin review, uploads, and document generation.

## 2. "Supabase / PostgreSQL"

Check:
- `database/schema.sql`
- `docs/DATABASE.md`
- Supabase queries in `src/app.js`

## 3. "Authentication"

Check the Auth integration in `src/app.js`:
- sign-in
- session handling
- password recovery
- password update

## 4. "RLS / authorization"

Check:
- `database/rls-policies.sql`
- `docs/ARCHITECTURE.md`

The design distinguishes employee ownership from admin authorization.

## 5. "Cloudinary"

Check the upload flow in `src/app.js`.

The application uploads photos to Cloudinary and stores the returned URL in the relational data.

## 6. "Document automation"

Check the Word generation functions in `src/app.js`.

The implementation uses docx.js and embeds fetched image bytes into `ImageRun` objects.

## 7. "Business process automation"

The project is not only a form.

It represents a complete process:
- employee input
- monthly report grouping
- attendance
- evidence photos
- admin review
- approval/revision
- Word output

## 8. Interview-ready explanation

> I built a web application to replace a manual monthly reporting workflow. The frontend is HTML, CSS, and JavaScript. Supabase handles authentication and PostgreSQL data, while RLS controls access. Cloudinary stores activity and attendance photos. The application generates Word reports with docx.js and supports an admin review flow where submitted reports can be approved or returned for revision.

## 9. Important honesty boundary

The repository should be evaluated as a practical serverless/business application. It should not be described as a custom backend, microservices platform, or trained AI system unless those components are added later.
