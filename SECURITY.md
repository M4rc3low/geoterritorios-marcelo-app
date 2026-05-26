# Security Policy

## Supported versions

This project is currently maintained as an active portfolio application. Security improvements should target the latest version available on the `main` branch.

## Reporting a vulnerability

If you find a vulnerability, do not open a public issue with sensitive details.

Please report it privately to the repository owner with:

- A clear description of the issue
- Steps to reproduce
- Expected impact
- Suggested mitigation, if available

## Security principles

- No credentials, secrets or tokens should be committed to the repository.
- Real addresses, personal data or operational data should not be used in public examples.
- Demonstration data should be anonymized before publication.
- Local storage is used only as a development/demo persistence layer.
- A production deployment should use a secure backend with authentication, authorization and proper access control.

## Production hardening checklist

- Configure authentication and authorization
- Move persistence to a secure backend
- Validate all user input
- Anonymize sensitive territorial data
- Enable HTTPS
- Configure security headers
- Add monitoring and audit logs
- Review dependency vulnerabilities before release
