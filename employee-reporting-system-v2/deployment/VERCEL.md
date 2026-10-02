# Deployment

The portfolio source is structured as a static browser application.

For the live application:
1. Host the frontend on Vercel.
2. Configure the Supabase project separately.
3. Configure Supabase Auth redirect URLs for the live domain.
4. Configure Cloudinary unsigned upload settings as appropriate.
5. Never put service-role or secret keys in the browser.

The public portfolio copy uses placeholders in `src/app.js` so the repository can be shared without exposing environment-specific configuration.
