You are a senior software architect and code auditor.
Your task is to scan this entire codebase and evaluate whether this project satisfies the requirements of a production-ready vanilla SaaS template using a file-system based architecture (no database).

## Context

This is a baseline SaaS template that will be reused to build multiple SaaS applications.
The system must be feature-based, modular, and traceable.
All data persistence is file-based (JSON/YAML/files), not a database.
The application must start with a login and all features must be accessible only after authentication.

## Your Tasks

1. Scan the entire repository structure.
2. Identify whether the following core SaaS features exist.
3. If a feature is missing, output:
   - Missing feature name
   - Why it is required in a SaaS
   - What files/modules should be created
   - What tests should be added

4. If the feature exists, evaluate whether it follows good architecture practices.
5. Suggest improvements for modularity, traceability, and maintainability.
6. Do NOT modify code. Only produce an evaluation report.

## Required Baseline SaaS Features

### Core System

- Authentication (login/logout)
- User registration
- Password hashing
- Session management
- Role-based access (admin/user)
- User profile management
- File-based data storage layer
- Logging system
- Error handling system
- Configuration management
- Environment variable support
- Health check endpoint
- Audit trail / activity log

### Security

- Password hashing
- Input validation
- Access control middleware
- Rate limiting
- Basic security headers
- CSRF protection (if web)
- Secure file handling

### SaaS Management Features

- User profile page
- Change password
- Delete account
- Admin panel
- User management (admin)
- Feature flags system
- Subscription/plan placeholder (even if fake for now)
- Notification system placeholder
- API layer (even if internal)
- Settings page

### Engineering Quality

- Feature-based folder structure
- Each feature has:
  - controller/service
  - model (file-based)
  - routes
  - tests
  - documentation

- Central logging
- Central error handler
- Automated tests
- README
- .env.example
- Configuration file
- Script to create first admin user
- Backup/restore script for file data

### DevOps / Operations

- Dockerfile
- docker-compose
- Linting
- Formatting
- Pre-commit hooks
- CI pipeline placeholder
- Environment configs (dev/prod)
- Start script
- Build script

### Traceability (Very Important)

- Feature list file
- Migration / feature log
- Each feature must be registered in a feature registry file
- Tests must exist for each feature
- After a feature is implemented, the feature list must be updated

## Output Format

Produce a structured report:

- Existing Features
- Missing Features
- Security Issues
- Architecture Problems
- Recommended Folder Structure
- Recommended Next Features
- Technical Debt
- Risk Assessment

Your goal is to ensure this repository can serve as a reusable SaaS starter template.
