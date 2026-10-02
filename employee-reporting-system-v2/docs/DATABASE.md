# Database Design

## Core tables

### employees
Stores employee identity/profile data linked to Supabase Auth.

Key fields:
- `id`
- `user_id`
- `employee_number`
- `name`
- `department`
- `position`
- `is_active`
- timestamps

### reports
Monthly parent record.

Key fields:
- `id`
- `employee_id`
- `year`
- `month`
- `status`
- `submitted_at`
- timestamps

Unique business key:
- `(employee_id, year, month)`

### activities
Daily activity records belonging to a report.

Key fields:
- `id`
- `report_id`
- `activity_date`
- `description`
- `photo_url`
- timestamps

### attendance
Daily attendance records belonging to a report.

Key fields:
- `id`
- `report_id`
- `attendance_date`
- `check_in_photo`
- `check_out_photo`
- timestamps

Unique business key:
- `(report_id, attendance_date)`

## Relationship

```text
employees 1 ---- N reports
reports   1 ---- N activities
reports   1 ---- N attendance
```
