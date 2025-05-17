# API Examples

This document provides examples of common API requests and responses for the Flexible Variable Compensation Calculator API.

## Calculate Bonus Examples

### Basic Calculation

This example demonstrates a basic bonus calculation with standard parameters.

#### Request

```http
POST /api/v1/calculate
Content-Type: application/json

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

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "investment_component": 0.7,
  "qualitative_component": 0.3,
  "weighted_performance": 1.0,
  "final_bonus": 20000,
  "bonus_to_salary_ratio": 0.2,
  "policy_breach": false
}
```

### Above-Target Performance

This example demonstrates a calculation with above-target performance in both investment and qualitative components.

#### Request

```http
POST /api/v1/calculate
Content-Type: application/json

{
  "base_salary": 100000,
  "target_bonus_pct": 20,
  "investment_weight": 70,
  "qualitative_weight": 30,
  "investment_score_multiplier": 1.5,
  "qual_score_multiplier": 1.3,
  "raf": 1.0
}
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "investment_component": 1.05,
  "qualitative_component": 0.39,
  "weighted_performance": 1.44,
  "final_bonus": 28800,
  "bonus_to_salary_ratio": 0.288,
  "policy_breach": false
}
```

### Below-Target Performance

This example demonstrates a calculation with below-target performance in both investment and qualitative components.

#### Request

```http
POST /api/v1/calculate
Content-Type: application/json

{
  "base_salary": 100000,
  "target_bonus_pct": 20,
  "investment_weight": 70,
  "qualitative_weight": 30,
  "investment_score_multiplier": 0.7,
  "qual_score_multiplier": 0.8,
  "raf": 1.0
}
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "investment_component": 0.49,
  "qualitative_component": 0.24,
  "weighted_performance": 0.73,
  "final_bonus": 14600,
  "bonus_to_salary_ratio": 0.146,
  "policy_breach": false
}
```

### Risk-Adjusted Calculation

This example demonstrates a calculation with a risk adjustment factor applied.

#### Request

```http
POST /api/v1/calculate
Content-Type: application/json

{
  "base_salary": 100000,
  "target_bonus_pct": 20,
  "investment_weight": 70,
  "qualitative_weight": 30,
  "investment_score_multiplier": 1.2,
  "qual_score_multiplier": 1.1,
  "raf": 0.8
}
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "investment_component": 0.84,
  "qualitative_component": 0.33,
  "weighted_performance": 1.17,
  "final_bonus": 18720,
  "bonus_to_salary_ratio": 0.1872,
  "policy_breach": false
}
```

### Policy Breach Example

This example demonstrates a calculation that results in a policy breach (bonus exceeds 3x base salary).

#### Request

```http
POST /api/v1/calculate
Content-Type: application/json

{
  "base_salary": 100000,
  "target_bonus_pct": 150,
  "investment_weight": 70,
  "qualitative_weight": 30,
  "investment_score_multiplier": 1.5,
  "qual_score_multiplier": 1.5,
  "raf": 1.5
}
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "investment_component": 1.05,
  "qualitative_component": 0.45,
  "weighted_performance": 1.5,
  "final_bonus": 337500,
  "bonus_to_salary_ratio": 3.375,
  "policy_breach": true
}
```

### Validation Error Example

This example demonstrates a request that fails validation due to invalid parameters.

#### Request

```http
POST /api/v1/calculate
Content-Type: application/json

{
  "base_salary": 100000,
  "target_bonus_pct": 20,
  "investment_weight": 80,
  "qualitative_weight": 40,
  "investment_score_multiplier": 1.0,
  "qual_score_multiplier": 1.0,
  "raf": 1.0
}
```

#### Response

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "detail": [
    {
      "loc": ["body", "investment_weight", "qualitative_weight"],
      "msg": "Investment and qualitative weights must sum to 100%",
      "type": "value_error"
    }
  ]
}
```

## Health Check Example

This example demonstrates a health check request.

#### Request

```http
GET /health
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "healthy"
}
```

## Using the API with cURL

### Calculate Bonus

```bash
curl -X POST http://localhost:8000/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "base_salary": 100000,
    "target_bonus_pct": 20,
    "investment_weight": 70,
    "qualitative_weight": 30,
    "investment_score_multiplier": 1.0,
    "qual_score_multiplier": 1.0,
    "raf": 1.0
  }'
```

### Health Check

```bash
curl -X GET http://localhost:8000/health
```

## Using the API with JavaScript

```javascript
// Calculate bonus
async function calculateBonus() {
  const data = {
    base_salary: 100000,
    target_bonus_pct: 20,
    investment_weight: 70,
    qualitative_weight: 30,
    investment_score_multiplier: 1.0,
    qual_score_multiplier: 1.0,
    raf: 1.0
  };

  try {
    const response = await fetch('http://localhost:8000/api/v1/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Calculation result:', result);
    return result;
  } catch (error) {
    console.error('Error calculating bonus:', error);
    throw error;
  }
}
```

## Using the API with Python

```python
import requests

# Calculate bonus
def calculate_bonus():
    data = {
        "base_salary": 100000,
        "target_bonus_pct": 20,
        "investment_weight": 70,
        "qualitative_weight": 30,
        "investment_score_multiplier": 1.0,
        "qual_score_multiplier": 1.0,
        "raf": 1.0
    }
    
    response = requests.post('http://localhost:8000/api/v1/calculate', json=data)
    response.raise_for_status()
    result = response.json()
    print('Calculation result:', result)
    return result
```
