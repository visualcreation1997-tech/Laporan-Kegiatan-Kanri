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
Select year/month
  ↓
Review dashboard
  ↓
Submitted report
  ├── Approve → approved
  └── Revision → revision
                    ↓
              employee fixes
                    ↓
                resubmits
                    ↓
                submitted
```

The workflow is designed around the actual administrative process rather than a generic CRUD demo.
