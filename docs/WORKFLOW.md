# Business Workflow

## Employee

```text
Login
 ↓
Select month
 ↓
Load report
 ↓
Add activities + photos
 ↓
Add attendance + photos
 ↓
Review
 ↓
Submit
```

## Admin

```text
Admin login
 ↓
Dashboard
 ↓
Select month
 ↓
Review submitted report
 ├── Approve → approved
 └── Revision → revision
                   ↓
               employee fixes
                   ↓
                 resubmit
                   ↓
                submitted
```
