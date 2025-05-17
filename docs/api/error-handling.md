# Error Handling

This document describes how errors are handled in the Flexible Variable Compensation Calculator API.

## Error Response Format

All API errors follow a consistent JSON format:

```json
{
  "detail": <error_details>
}
```

The `detail` field can be either a string or an array of validation errors.

## HTTP Status Codes

The API uses standard HTTP status codes to indicate the success or failure of a request:

| Status Code | Description |
|-------------|-------------|
| 200 | Success - The request was successful |
| 400 | Bad Request - The request was invalid or cannot be served |
| 422 | Validation Error - The request data failed validation |
| 500 | Internal Server Error - An error occurred on the server |
| 503 | Service Unavailable - The server is temporarily unavailable |

## Common Error Types

### Validation Errors (422)

Validation errors occur when the request data does not meet the validation rules defined in the API models.

Example:

```json
{
  "detail": [
    {
      "loc": ["body", "base_salary"],
      "msg": "value is not a valid number",
      "type": "type_error.float"
    },
    {
      "loc": ["body", "investment_weight"],
      "msg": "Investment and qualitative weights must sum to 100%",
      "type": "value_error"
    }
  ]
}
```

### Bad Request Errors (400)

Bad request errors occur when the request is malformed or missing required parameters.

Example:

```json
{
  "detail": "Missing required parameter: base_salary"
}
```

### Internal Server Errors (500)

Internal server errors occur when an unexpected error happens on the server.

Example:

```json
{
  "detail": "An internal server error occurred"
}
```

## Error Handling Best Practices

When interacting with the API, follow these best practices for error handling:

1. **Check the HTTP status code** to determine if the request was successful
2. **Parse the error response** to get detailed information about the error
3. **Handle validation errors** by correcting the request data
4. **Implement retry logic** for 5xx errors with exponential backoff
5. **Log detailed error information** for debugging purposes

## Example Error Handling

### JavaScript Example

```javascript
async function calculateBonus(data) {
  try {
    const response = await fetch('/api/v1/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 422) {
        // Handle validation errors
        const validationErrors = errorData.detail.reduce((acc, error) => {
          const fieldName = error.loc[error.loc.length - 1];
          acc[fieldName] = error.msg;
          return acc;
        }, {});
        
        throw new ValidationError('Validation failed', validationErrors);
      } else {
        // Handle other errors
        throw new Error(errorData.detail || 'An error occurred');
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calculating bonus:', error);
    throw error;
  }
}
```

### Python Example

```python
import requests

def calculate_bonus(data):
    try:
        response = requests.post('http://localhost:8000/api/v1/calculate', json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 422:
            # Handle validation errors
            error_data = e.response.json()
            validation_errors = {error['loc'][-1]: error['msg'] for error in error_data['detail']}
            raise ValueError(f"Validation failed: {validation_errors}")
        else:
            # Handle other errors
            error_message = e.response.json().get('detail', 'An error occurred')
            raise Exception(f"API error: {error_message}")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Request failed: {str(e)}")
```

## Troubleshooting Common Errors

### Weight Sum Errors

If you receive an error about weights not summing to 100%, ensure that:
- `investment_weight` + `qualitative_weight` = 100
- Both weights are between 0 and 100

### Invalid Value Errors

If you receive an error about invalid values, ensure that:
- `base_salary` is a positive number
- `target_bonus_pct` is between 0 and 200
- `investment_score_multiplier` and `qual_score_multiplier` are non-negative
- `raf` is between 0 and 2
