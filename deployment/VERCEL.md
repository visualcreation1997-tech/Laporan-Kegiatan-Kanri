# Vercel Deployment

This repository is deliberately structured so that **no Root Directory setting is required**.

The deployment entry point is:

```text
index.html
```

The application files are:

```text
app/app.js
app/styles.css
```

## Deployment steps

1. Push this repository to GitHub.
2. In Vercel, import the GitHub repository.
3. Leave **Root Directory** as `./`.
4. Framework Preset: **Other**.
5. Build Command: leave empty.
6. Output Directory: leave empty / default.
7. Deploy.

Vercel will find the root `index.html` directly.

For the existing production application, keep the Supabase Auth redirect URLs configured for the live domain.
