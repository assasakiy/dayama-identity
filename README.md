# Dayama Identity

Identity Provider, Centralized Authentication, and OAuth2 / OIDC SSO service for the Dayama Platform.

## Core Capabilities
- **Global Identity Management**: Unique immutable `sub` identifier for platform users.
- **Authentication & Security**: Password, MFA / TOTP, Passkeys, recovery codes, sessions, login history.
- **OAuth2 & OpenID Connect (OIDC)**: Authorization Code with PKCE (`S256`), JWKS, discovery (`/.well-known/openid-configuration`), UserInfo, and RS256-signed ID tokens.
- **Application Registry & Entitlement**: Manage connected platform applications with access modes (`public`, `authenticated`, `restricted`).
- **Account-Local RBAC**: Local role and permission management governing the Identity service itself.

## Architecture Laws
1. Account proves user identity (`iss + sub`).
2. Account determines which applications a user may enter (entitlements).
3. Consuming domains determine what users can do inside their applications (local roles, permissions, scopes).
4. Consuming domains never own or store Account credentials.
