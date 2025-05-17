# Code Style Guide

This document outlines the coding standards and style guidelines for the Flexible Variable Compensation Calculator project.

## General Guidelines

- Write clean, readable, and maintainable code
- Follow the principle of "code is read more often than it is written"
- Keep functions and methods small and focused on a single responsibility
- Use meaningful variable and function names
- Write comments to explain "why" not "what"
- Keep files under 300 lines of code when possible
- Use consistent indentation and formatting

## Frontend (TypeScript/React)

### TypeScript Guidelines

- Use TypeScript's type system effectively
- Define interfaces for props, state, and API responses
- Avoid using `any` type when possible
- Use type guards for runtime type checking
- Prefer interfaces over type aliases for object types
- Use union types for variables that can have multiple types

Example:

```typescript
// Good
interface CalculatorProps {
  baseSalary: number;
  targetBonusPct: number;
  onCalculate: (result: CalculationResult) => void;
}

// Avoid
type CalculatorProps = {
  baseSalary: any;
  targetBonusPct: any;
  onCalculate: Function;
};
```

### React Guidelines

- Use functional components with hooks
- Keep components small and focused
- Use React.memo for performance optimization when appropriate
- Follow the React component naming convention (PascalCase)
- Use custom hooks to share logic between components
- Use the React Context API for state that needs to be accessed by many components

Example:

```typescript
// Good
const Calculator: React.FC<CalculatorProps> = ({ baseSalary, targetBonusPct, onCalculate }) => {
  const [result, setResult] = useState<CalculationResult | null>(null);
  
  // Component logic
  
  return (
    <div className="calculator">
      {/* Component JSX */}
    </div>
  );
};

// Avoid
function calculator(props) {
  const result = null;
  
  // Component logic
  
  return (
    <div className="calculator">
      {/* Component JSX */}
    </div>
  );
}
```

### File Organization

- Group related files in directories
- Use index.ts files to export components
- Organize imports in the following order:
  1. React and third-party libraries
  2. Project imports
  3. Relative imports
  4. CSS/SCSS imports

Example:

```typescript
// Good
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { CalculationResult } from 'types/calculator';
import { calculateBonus } from 'services/calculatorService';

import { InputField } from '../InputField';
import { ResultDisplay } from '../ResultDisplay';

import './Calculator.css';
```

### ESLint Configuration

The project uses ESLint with the following configuration:

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react', '@typescript-eslint', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

### Prettier Configuration

The project uses Prettier with the following configuration:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

## Backend (Python/FastAPI)

### Python Guidelines

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use type hints consistently
- Use docstrings for functions, classes, and modules
- Use f-strings for string formatting
- Use list/dict comprehensions when appropriate
- Keep functions and methods small and focused

Example:

```python
# Good
def calculate_bonus(
    base_salary: float,
    target_bonus_pct: float,
    investment_weight: float,
    qualitative_weight: float,
    investment_score_multiplier: float,
    qual_score_multiplier: float,
    raf: float
) -> Dict[str, Any]:
    """
    Calculate the bonus based on the input parameters.
    
    Args:
        base_salary: Base salary in GBP
        target_bonus_pct: Target bonus percentage
        investment_weight: Investment performance weight
        qualitative_weight: Qualitative performance weight
        investment_score_multiplier: Investment performance score multiplier
        qual_score_multiplier: Qualitative performance score multiplier
        raf: Risk Adjustment Factor
        
    Returns:
        Dictionary containing the calculation results
    """
    # Function logic
    return result
```

### FastAPI Guidelines

- Use Pydantic models for request and response validation
- Use dependency injection for shared logic
- Use path operations decorators with appropriate HTTP methods
- Use status codes consistently
- Use appropriate response models
- Use tags to organize API endpoints

Example:

```python
# Good
@router.post("/calculate", response_model=CalculationResult, status_code=200, tags=["calculator"])
async def calculate(input_data: CalculatorInput):
    """
    Calculate bonus based on input parameters.
    """
    result = calculator_service.calculate_bonus(
        base_salary=input_data.base_salary,
        target_bonus_pct=input_data.target_bonus_pct,
        investment_weight=input_data.investment_weight,
        qualitative_weight=input_data.qualitative_weight,
        investment_score_multiplier=input_data.investment_score_multiplier,
        qual_score_multiplier=input_data.qual_score_multiplier,
        raf=input_data.raf
    )
    return result
```

### File Organization

- Organize code into modules and packages
- Use a clear and consistent directory structure
- Keep related functionality together
- Use `__init__.py` files to expose public interfaces

### Black Configuration

The project uses Black with the following configuration in pyproject.toml:

```toml
[tool.black]
line-length = 88
target-version = ['py311']
include = '\.pyi?$'
exclude = '''
/(
    \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | _build
  | buck-out
  | build
  | dist
)/
'''
```

### Flake8 Configuration

The project uses Flake8 with the following configuration in .flake8:

```ini
[flake8]
max-line-length = 88
extend-ignore = E203
exclude = .git,__pycache__,docs/source/conf.py,old,build,dist,.venv
```

### isort Configuration

The project uses isort with the following configuration in pyproject.toml:

```toml
[tool.isort]
profile = "black"
line_length = 88
multi_line_output = 3
include_trailing_comma = true
force_grid_wrap = 0
use_parentheses = true
ensure_newline_before_comments = true
```

## Commit Message Guidelines

- Use the imperative mood ("Add feature" not "Added feature")
- Keep the first line under 50 characters
- Provide a detailed description in the body if necessary
- Reference issues and pull requests
- Use the following format:
  ```
  <type>(<scope>): <subject>
  
  <body>
  
  <footer>
  ```

- Types:
  - feat: A new feature
  - fix: A bug fix
  - docs: Documentation changes
  - style: Changes that do not affect the meaning of the code
  - refactor: Code changes that neither fix a bug nor add a feature
  - perf: Performance improvements
  - test: Adding or updating tests
  - chore: Changes to the build process or auxiliary tools

Example:

```
feat(calculator): add RAF validation

Add validation for Risk Adjustment Factor to ensure it's between 0 and 2.

Closes #123
```

## Code Review Guidelines

- Be respectful and constructive
- Focus on the code, not the person
- Provide specific and actionable feedback
- Explain why changes are suggested
- Use a checklist for common issues
- Approve only when all issues are addressed
