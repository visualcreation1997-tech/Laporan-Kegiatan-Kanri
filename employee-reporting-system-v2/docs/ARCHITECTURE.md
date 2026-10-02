# Technical Architecture

## 1. High-level architecture

```text
Employee / Admin Browser
        |
        v
Vercel-hosted Frontend
HTML + CSS + JavaScript
        |
        +--> Supabase Auth
        |      - login
        |      - session
        |      - password recovery
        |
        +--> Supabase PostgreSQL
        |      - employees
        |      - reports
        |      - activities
        |      - attendance
        |      - PPK settings
        |
        +--> Row Level Security
        |      - employee ownership
        |      - admin role authorization
        |
        +--> Cloudinary
        |      - activity photos
        |      - attendance photos
        |
        +--> docx.js
               - Word document generation
               - embedded report photos
```

## 2. Frontend

The current implementation is intentionally kept as a small browser application:
- `src/index.html` — page structure
- `src/styles.css` — UI styling
- `src/app.js` — application logic

This is a portfolio extraction of the working V2 implementation. It is not presented as a framework application.

## 3. Data model

```text
employees
   |
   | 1:N
   v
reports
   |
   +------ 1:N ------> activities
   |
   +------ 1:N ------> attendance
```

A `reports` record represents one employee's report for one month.

## 4. Security

- Supabase Auth handles identity and sessions.
- RLS protects database rows.
- Employee access is ownership-based.
- Admin access uses the server-controlled `app_metadata.role`.
- No service-role key belongs in frontend code.

## 5. Media

Cloudinary stores uploaded photos. PostgreSQL stores the corresponding media URL.

## 6. Document generation

The browser:
1. reads report data;
2. fetches the stored photo;
3. converts the image bytes to `Uint8Array`;
4. creates `ImageRun` objects;
5. generates a `.docx` file using docx.js.

## 7. Review workflow

```text
draft
  |
  | submit
  v
submitted
  |   |  \ revision
  |   v
  | revision
  |   |
  |   | fix + resubmit
  |   v
  +-> submitted

submitted --approve--> approved
```

## 8. What this architecture does not claim

This project does not claim:
- a custom Node.js/Express server;
- microservices;
- AI model training;
- a custom REST API backend;
- distributed systems architecture.

Those would only be added to the portfolio if they are actually implemented.
