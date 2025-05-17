# API Documentation

This section provides comprehensive documentation for the Flexible Variable Compensation Calculator API.

## Contents

- [API Reference](./reference.md)
- [Authentication](./authentication.md)
- [Error Handling](./error-handling.md)
- [Data Models](./data-models.md)
- [Examples](./examples.md)
- [Rate Limiting](./rate-limiting.md)
- [Versioning](./versioning.md)

## API Overview

The Flexible Variable Compensation Calculator API provides endpoints for calculating variable compensation (bonuses) for UK fund managers. The API is built using FastAPI and follows RESTful principles.

### Base URL

```
http://localhost:8000/api/v1
```

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/calculate` | POST | Calculate bonus based on input parameters |
| `/health` | GET | Check API health status |

### Content Type

All requests and responses use JSON format:

```
Content-Type: application/json
```

### Example Request

```json
POST /api/v1/calculate
{
  "base_salary": 100000,
  "target_bonus_pct": 20,
  "investment_weight": 70,
  "qualitative_weight": 30,
  "investment_score_multiplier": 1.0,
  "qual_score_multiplier": 1.0,
  "raf": 1.0
}
```

### Example Response

```json
{
  "investment_component": 0.7,
  "qualitative_component": 0.3,
  "weighted_performance": 1.0,
  "final_bonus": 20000,
  "bonus_to_salary_ratio": 0.2,
  "policy_breach": false
}
```

For detailed information about each endpoint, request parameters, and response formats, please refer to the [API Reference](./reference.md).
