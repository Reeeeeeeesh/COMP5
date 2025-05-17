# API Reference

This document provides detailed information about the Flexible Variable Compensation Calculator API endpoints, request parameters, and response formats.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

The API does not currently require authentication for V1. Authentication will be added in future versions.

## Endpoints

### Calculate Bonus

Calculate the bonus based on the provided input parameters.

```
POST /api/v1/calculate
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| base_salary | number | Yes | Base salary in GBP |
| target_bonus_pct | number | Yes | Target bonus percentage (0-200) |
| investment_weight | number | Yes | Investment performance weight (0-100) |
| qualitative_weight | number | Yes | Qualitative performance weight (0-100) |
| investment_score_multiplier | number | Yes | Investment performance score multiplier |
| qual_score_multiplier | number | Yes | Qualitative performance score multiplier |
| raf | number | Yes | Risk Adjustment Factor (0-2) |

**Note**: `investment_weight` and `qualitative_weight` must sum to 100%.

#### Example Request

```json
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

#### Response

| Field | Type | Description |
|-------|------|-------------|
| investment_component | number | Investment component of the calculation |
| qualitative_component | number | Qualitative component of the calculation |
| weighted_performance | number | Weighted performance score |
| final_bonus | number | Final calculated bonus amount in GBP |
| bonus_to_salary_ratio | number | Ratio of bonus to base salary |
| policy_breach | boolean | Indicates if the bonus exceeds 3x base salary |

#### Example Response

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

#### Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input parameters |
| 422 | Validation Error - Input validation failed |
| 500 | Internal Server Error |

#### Error Response

```json
{
  "detail": [
    {
      "loc": ["body", "investment_weight"],
      "msg": "Investment and qualitative weights must sum to 100%",
      "type": "value_error"
    }
  ]
}
```

### Health Check

Check the health status of the API.

```
GET /health
```

#### Response

```json
{
  "status": "healthy"
}
```

#### Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | API is healthy |
| 503 | API is unhealthy |

## Data Models

### CalculatorInput

```python
class CalculatorInput(BaseModel):
    base_salary: float = Field(..., gt=0, description="Base salary in GBP")
    target_bonus_pct: float = Field(..., gt=0, le=200, description="Target bonus percentage")
    investment_weight: float = Field(..., ge=0, le=100, description="Investment performance weight (percentage)")
    qualitative_weight: float = Field(..., ge=0, le=100, description="Qualitative performance weight (percentage)")
    investment_score_multiplier: float = Field(..., ge=0, description="Investment performance score multiplier")
    qual_score_multiplier: float = Field(..., ge=0, description="Qualitative performance score multiplier")
    raf: float = Field(..., ge=0, le=2, description="Risk Adjustment Factor (RAF)")
```

### CalculationResult

```python
class CalculationResult(BaseModel):
    investment_component: float
    qualitative_component: float
    weighted_performance: float
    final_bonus: float
    bonus_to_salary_ratio: float
    policy_breach: bool
```

## Rate Limiting

There is currently no rate limiting implemented for V1. Rate limiting will be added in future versions.

## Versioning

The API uses URL versioning (e.g., `/api/v1/`). When breaking changes are introduced, a new version will be created (e.g., `/api/v2/`).
