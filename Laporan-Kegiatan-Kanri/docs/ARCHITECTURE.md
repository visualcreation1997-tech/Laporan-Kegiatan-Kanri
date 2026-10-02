# Technical Architecture

```text
Employee / Admin Browser
        |
        v
Vercel / Static Frontend
HTML + CSS + JavaScript
        |
        +--> Supabase Auth
        |      login / session / recovery
        |
        +--> Supabase PostgreSQL
        |      employees
        |      reports
        |      activities
        |      attendance
        |
        +--> Row Level Security
        |      employee ownership
        |      admin authorization
        |
        +--> Cloudinary
        |      activity / attendance photos
        |
        +--> docx.js
               generated Word reports
```

## Data model

```text
employees
    |
    +---- reports
             |
             +---- activities
             |
             +---- attendance
```

## Report state

```text
draft
  ↓ submit
submitted
  ├── approve → approved
  └── revision → revision
                    ↓ fix + resubmit
                  submitted
```

## Frontend

- `index.html`: deployment entry point
- `app/app.js`: application logic
- `app/styles.css`: styling

The `src/` folder contains the same implementation as a source snapshot for technical review.

## Backend platform

Supabase provides:
- authentication
- PostgreSQL database
- authorization through RLS

Cloudinary provides media storage.

## Document automation

`docx.js` generates the `.docx` report and embeds activity/attendance photos.

## Honest technical boundary

This repository does not claim:
- custom Node.js/Express backend
- microservices
- AI model training
- distributed architecture

Those should only be claimed if actually implemented.
