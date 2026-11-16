# GitHub Infrastructure Directory (`.github/`)

## 1. Directory Purpose & Scope
The `.github/` directory encapsulates all GitHub-native configurations, repository metadata, continuous integration (CI) workflows, automation actions, and issue/PR templates for the Library Management System.

## 2. Directory Contents & Structure
```
.github/
|-- implementation.md       # CI pipeline and automation specification
|-- docs/
|   `-- readme.md           # Scope and contents overview
`-- workflows/
    |-- ci.yml              # GitHub Actions Continuous Integration pipeline
    |-- readme.md           # Workflows directory readme
    `-- implementation.md   # Workflows implementation logic
```

## 3. Scope & Responsibilities
- **Continuous Integration Pipeline:** Configures automated testing and quality gates for every commit and pull request.
- **Environment Isolation:** Declares isolated service containers (PostgreSQL 16) within GitHub runners to guarantee identical runtime environments between local machines and CI.
- **Quality Gate Execution:** Enforces zero test failures, zero flaky test regressions, and full coverage thresholds prior to code integration.

