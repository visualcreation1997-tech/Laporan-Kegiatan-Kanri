# Security

- Authentication: Supabase Auth
- Authorization: Supabase Row Level Security
- Admin role: `app_metadata.role`
- Media: Cloudinary URLs
- No service-role key should be placed in frontend code.

The client-side Supabase anon key is designed for browser use; actual authorization must be enforced by RLS policies.

Do not upload real employee data, passwords, private tokens, or production database dumps to this public repository.
