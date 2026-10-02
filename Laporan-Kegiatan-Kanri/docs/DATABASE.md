# Database Design

## Core tables

### employees
Employee identity linked to Supabase Auth.

### reports
One monthly report per employee.

Unique business key:
`(employee_id, year, month)`

### activities
Daily activities linked by `report_id`.

### attendance
Daily attendance linked by `report_id`.

Unique business key:
`(report_id, attendance_date)`

## Relationship

```text
employees 1 ---- N reports
reports   1 ---- N activities
reports   1 ---- N attendance
```
