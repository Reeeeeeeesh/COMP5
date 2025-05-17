# API Authentication

This document describes the authentication mechanisms for the Flexible Variable Compensation Calculator API.

## Current Authentication Status

For the V1 release, the API does not require authentication. This is because:

1. The calculator is designed for internal use within an organization
2. The API does not store or access sensitive data
3. The initial release focuses on core functionality

## Planned Authentication for Future Releases

In future releases, the API will implement authentication to support features such as:
- User accounts
- Saved calculation scenarios
- Personalized settings
- Access control

## Authentication Methods

The following authentication methods will be implemented in future releases:

### API Key Authentication

API keys will be used for machine-to-machine communication:

```http
GET /api/v1/resource
Authorization: ApiKey YOUR_API_KEY
```

### JWT Authentication

JSON Web Tokens (JWT) will be used for user authentication:

```http
GET /api/v1/resource
Authorization: Bearer YOUR_JWT_TOKEN
```

### OAuth 2.0

OAuth 2.0 will be supported for integration with identity providers:

1. Client application redirects to authorization server
2. User authenticates and grants permissions
3. Authorization server redirects back with authorization code
4. Client exchanges code for access token
5. Client uses access token to access API

## Token Management

### Token Issuance

Tokens will be issued through the `/auth/token` endpoint:

```http
POST /auth/token
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "secure_password"
}
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Token Refresh

Tokens can be refreshed through the `/auth/refresh` endpoint:

```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer REFRESH_TOKEN

{}
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Token Revocation

Tokens can be revoked through the `/auth/revoke` endpoint:

```http
POST /auth/revoke
Content-Type: application/json
Authorization: Bearer ACCESS_TOKEN

{}
```

## Role-Based Access Control

The API will implement role-based access control (RBAC) with the following roles:

- **User**: Can perform calculations and save personal scenarios
- **Manager**: Can view and manage team scenarios
- **Administrator**: Has full access to all API features

## Security Best Practices

When authentication is implemented, the API will follow these security best practices:

1. **HTTPS Only**: All API requests must use HTTPS
2. **Token Expiration**: Access tokens will expire after a short period
3. **Refresh Tokens**: Long-lived refresh tokens for obtaining new access tokens
4. **Rate Limiting**: Limit the number of authentication attempts to prevent brute force attacks
5. **Secure Headers**: Implement security headers such as Content-Security-Policy
6. **CORS**: Configure Cross-Origin Resource Sharing to restrict access

## Client Implementation

### JavaScript Example

```javascript
async function getAuthenticatedData() {
  // Get token from storage
  const token = localStorage.getItem('access_token');
  
  try {
    const response = await fetch('/api/v1/resource', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      // Token expired, refresh it
      await refreshToken();
      return getAuthenticatedData();
    }
    
    return await response.json();
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${refreshToken}`
    }
  });
  
  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
}
```

### Python Example

```python
import requests

class AuthenticatedClient:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.access_token = None
        self.refresh_token = None
    
    def authenticate(self):
        response = requests.post(
            f"{self.base_url}/auth/token",
            json={"username": self.username, "password": self.password}
        )
        data = response.json()
        self.access_token = data["access_token"]
        self.refresh_token = data.get("refresh_token")
    
    def get_resource(self, path):
        if not self.access_token:
            self.authenticate()
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        response = requests.get(f"{self.base_url}{path}", headers=headers)
        
        if response.status_code == 401:
            # Token expired, refresh it
            self.refresh()
            return self.get_resource(path)
        
        return response.json()
    
    def refresh(self):
        if not self.refresh_token:
            self.authenticate()
            return
        
        headers = {"Authorization": f"Bearer {self.refresh_token}"}
        response = requests.post(f"{self.base_url}/auth/refresh", headers=headers)
        data = response.json()
        self.access_token = data["access_token"]
```

## Conclusion

While the V1 release does not include authentication, future releases will implement robust authentication mechanisms to support advanced features and ensure secure access to the API.
