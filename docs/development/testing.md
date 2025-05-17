# Testing Guide

This document outlines the testing strategy and practices for the Flexible Variable Compensation Calculator project.

## Testing Philosophy

The project follows a comprehensive testing approach to ensure code quality and reliability:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test the complete application flow
- **Performance Tests**: Ensure the application meets performance requirements

## Frontend Testing

### Testing Stack

- **Vitest**: Test runner and assertion library
- **React Testing Library**: Testing React components
- **MSW (Mock Service Worker)**: API mocking

### Test Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── ComponentName.test.tsx
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── useHookName.test.ts
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── utilName.test.ts
├── test/
│   ├── setup.ts
│   ├── mocks/
│   │   ├── handlers.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run a specific test file
npm test -- ComponentName.test.tsx
```

### Writing Unit Tests

#### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Calculator } from '../Calculator';

describe('Calculator Component', () => {
  it('renders the calculator form', () => {
    render(<Calculator />);
    expect(screen.getByLabelText('Base Salary (£)')).toBeInTheDocument();
    expect(screen.getByLabelText('Target Bonus (%)')).toBeInTheDocument();
  });

  it('calculates the bonus when form is submitted', () => {
    render(<Calculator />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Base Salary (£)'), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText('Target Bonus (%)'), { target: { value: '20' } });
    // ... fill in other fields
    
    // Submit the form
    fireEvent.click(screen.getByText('Calculate'));
    
    // Check the results
    expect(screen.getByText('Final Bonus: £20,000')).toBeInTheDocument();
  });
});
```

#### Hook Tests

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useCalculator } from '../useCalculator';

describe('useCalculator Hook', () => {
  it('calculates the bonus correctly', () => {
    const { result } = renderHook(() => useCalculator());
    
    act(() => {
      result.current.calculate({
        baseSalary: 100000,
        targetBonusPct: 20,
        investmentWeight: 70,
        qualitativeWeight: 30,
        investmentScoreMultiplier: 1.0,
        qualScoreMultiplier: 1.0,
        raf: 1.0
      });
    });
    
    expect(result.current.result?.finalBonus).toBe(20000);
  });
});
```

#### Utility Tests

```typescript
import { calculateWeightedPerformance } from '../calculationUtils';

describe('calculationUtils', () => {
  it('calculates weighted performance correctly', () => {
    const result = calculateWeightedPerformance(0.7, 0.3, 1.0, 1.0);
    expect(result).toBe(1.0);
  });
});
```

### Mocking API Calls

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/v1/calculate', (req, res, ctx) => {
    return res(
      ctx.json({
        investment_component: 0.7,
        qualitative_component: 0.3,
        weighted_performance: 1.0,
        final_bonus: 20000,
        bonus_to_salary_ratio: 0.2,
        policy_breach: false
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Backend Testing

### Testing Stack

- **pytest**: Test framework
- **pytest-cov**: Code coverage
- **httpx**: Async HTTP client for testing FastAPI

### Test Directory Structure

```
backend/
├── tests/
│   ├── conftest.py
│   ├── unit/
│   │   ├── test_calculator_service.py
│   ├── integration/
│   │   ├── test_calculator_api.py
│   ├── e2e/
│   │   ├── test_api_flow.py
```

### Running Tests

```bash
# Run all tests
python -m pytest

# Run tests with coverage
python -m pytest --cov=app

# Run a specific test file
python -m pytest tests/unit/test_calculator_service.py

# Run tests with verbose output
python -m pytest -v
```

### Writing Unit Tests

#### Service Tests

```python
import pytest
from app.services.calculator_service import calculate_bonus

def test_calculate_bonus():
    # Arrange
    base_salary = 100000
    target_bonus_pct = 20
    investment_weight = 70
    qualitative_weight = 30
    investment_score_multiplier = 1.0
    qual_score_multiplier = 1.0
    raf = 1.0
    
    # Act
    result = calculate_bonus(
        base_salary=base_salary,
        target_bonus_pct=target_bonus_pct,
        investment_weight=investment_weight,
        qualitative_weight=qualitative_weight,
        investment_score_multiplier=investment_score_multiplier,
        qual_score_multiplier=qual_score_multiplier,
        raf=raf
    )
    
    # Assert
    assert result["investment_component"] == 0.7
    assert result["qualitative_component"] == 0.3
    assert result["weighted_performance"] == 1.0
    assert result["final_bonus"] == 20000
    assert result["bonus_to_salary_ratio"] == 0.2
    assert result["policy_breach"] is False
```

#### API Tests

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_calculate_endpoint():
    # Arrange
    payload = {
        "base_salary": 100000,
        "target_bonus_pct": 20,
        "investment_weight": 70,
        "qualitative_weight": 30,
        "investment_score_multiplier": 1.0,
        "qual_score_multiplier": 1.0,
        "raf": 1.0
    }
    
    # Act
    response = client.post("/api/v1/calculate", json=payload)
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["final_bonus"] == 20000
    assert data["policy_breach"] is False
```

### Using Fixtures

```python
# conftest.py
import pytest
from app.models.calculator import CalculatorInput

@pytest.fixture
def calculator_input():
    return CalculatorInput(
        base_salary=100000,
        target_bonus_pct=20,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.0,
        qual_score_multiplier=1.0,
        raf=1.0
    )

# test_file.py
def test_with_fixture(calculator_input):
    # Use the fixture
    assert calculator_input.base_salary == 100000
```

## Test Coverage

The project aims for high test coverage, with a minimum target of 80% code coverage.

### Coverage Reports

```bash
# Frontend
npm test -- --coverage

# Backend
python -m pytest --cov=app --cov-report=html
```

The coverage reports will be generated in:
- Frontend: `frontend/coverage/`
- Backend: `backend/htmlcov/`

## Continuous Integration Testing

Tests are automatically run in the CI/CD pipeline on every pull request and push to the main branch. The pipeline will fail if:

- Any tests fail
- Code coverage falls below the minimum threshold
- Linting errors are present

## Performance Testing

Performance tests ensure the application meets the performance requirements:

- Response time < 200ms for calculator operations
- Memory usage < 100MB
- CPU usage < 50% during peak load

### Running Performance Tests

```bash
# Backend performance tests
python -m pytest tests/performance/test_calculator_performance.py
```

## Test-Driven Development

The project encourages test-driven development (TDD):

1. Write a failing test for the new feature or bug fix
2. Implement the minimum code to make the test pass
3. Refactor the code while keeping the tests passing

## Best Practices

- Write tests before or alongside code (TDD/BDD)
- Keep tests small and focused
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases and error conditions
- Avoid testing implementation details
- Keep tests independent and isolated
