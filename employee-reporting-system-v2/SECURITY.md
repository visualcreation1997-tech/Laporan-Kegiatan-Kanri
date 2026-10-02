# Security Notes

## Do not commit
- service-role keys
- Cloudinary API secret
- passwords
- employee personal data
- production database dumps
- private access tokens
- private screenshots

## Authorization
Authorization should be enforced by Supabase RLS, not only by hiding buttons in the frontend.

## Admin role
The application uses `app_metadata.role` for admin authorization. This metadata is server-controlled.

## Public repository
This repository is a sanitized portfolio snapshot and should not be treated as a production deployment package without configuration review.
