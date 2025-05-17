# API Data Models

This document provides detailed information about the data models used in the Flexible Variable Compensation Calculator API.

## Overview

The API uses Pydantic models for request and response validation. These models define the structure and validation rules for the data sent to and received from the API.

## Request Models

### CalculatorInput

This model defines the structure of the request body for the `/calculate` endpoint.

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

#### Field Descriptions

| Field | Type | Description | Validation Rules |
|-------|------|-------------|-----------------|
| base_salary | float | Base salary in GBP | Must be greater than 0 |
| target_bonus_pct | float | Target bonus percentage | Must be greater than 0 and less than or equal to 200 |
| investment_weight | float | Investment performance weight (percentage) | Must be between 0 and 100 |
| qualitative_weight | float | Qualitative performance weight (percentage) | Must be between 0 and 100 |
| investment_score_multiplier | float | Investment performance score multiplier | Must be greater than or equal to 0 |
| qual_score_multiplier | float | Qualitative performance score multiplier | Must be greater than or equal to 0 |
| raf | float | Risk Adjustment Factor (RAF) | Must be between 0 and 2 |

#### Additional Validation

The API performs additional validation to ensure that:
- The investment_weight and qualitative_weight sum to 100%
- All numeric values are within reasonable ranges

## Response Models

### CalculationResult

This model defines the structure of the response body for the `/calculate` endpoint.

```python
class CalculationResult(BaseModel):
    investment_component: float
    qualitative_component: float
    weighted_performance: float
    final_bonus: float
    bonus_to_salary_ratio: float
    policy_breach: bool
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| investment_component | float | Investment component of the calculation |
| qualitative_component | float | Qualitative component of the calculation |
| weighted_performance | float | Weighted performance score |
| final_bonus | float | Final calculated bonus amount in GBP |
| bonus_to_salary_ratio | float | Ratio of bonus to base salary |
| policy_breach | boolean | Indicates if the bonus exceeds 3x base salary |

## Error Models

### ValidationError

This model is used when the request fails validation.

```python
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "Error message",
      "type": "error_type"
    }
  ]
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| loc | array | Location of the error (e.g., ["body", "investment_weight"]) |
| msg | string | Human-readable error message |
| type | string | Type of error (e.g., "value_error") |

### InternalServerError

This model is used when an internal server error occurs.

```python
{
  "detail": "Internal server error"
}
```

## Model Relationships

The following diagram shows the relationship between the request and response models:

```
CalculatorInput (Request)
       │
       ▼
  API Processing
       │
       ▼
CalculationResult (Response)
```

## Model Evolution

As the API evolves, these models may be extended to include additional fields or validation rules. Any changes to the models will be documented in the API versioning documentation.
