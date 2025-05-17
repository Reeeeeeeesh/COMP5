# Project Structure

This document provides an overview of the Flexible Variable Compensation Calculator project structure.

## Directory Structure

```
COMP5/
├── frontend/           # React frontend application
│   ├── public/         # Static assets
│   ├── src/            # Source code
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API services and data fetching
│   │   ├── utils/      # Utility functions
│   │   └── types/      # TypeScript type definitions
│   ├── .eslintrc.js    # ESLint configuration
│   ├── .prettierrc     # Prettier configuration
│   ├── package.json    # Frontend dependencies
│   ├── tsconfig.json   # TypeScript configuration
│   └── vite.config.ts  # Vite configuration
│
├── backend/            # Python/FastAPI backend
│   ├── app/            # Main application package
│   │   ├── models/     # Data models
│   │   ├── routes/     # API endpoints
│   │   ├── services/   # Business logic
│   │   ├── utils/      # Utility functions
│   │   └── main.py     # Application entry point
│   ├── tests/          # Test suite
│   ├── .flake8         # Flake8 configuration
│   ├── pyproject.toml  # Black and isort configuration
│   ├── requirements.txt # Python dependencies
│   └── run.py          # Script to run the server
│
├── docs/               # Project documentation
│   ├── api/            # API documentation
│   ├── development/    # Developer documentation
│   └── user-guides/    # End-user guides
│
├── .husky/             # Git hooks
├── tasks/              # Task Master task files
├── scripts/            # Project scripts
├── .editorconfig       # Editor configuration
├── .gitignore          # Git ignore file
├── .taskmasterconfig   # Task Master configuration
├── package.json        # Root package.json for Husky
└── README.md           # Project overview
```

## Frontend Structure

### Components

The `frontend/src/components/` directory contains React components organized by feature or functionality:

- **App.tsx**: The main application component
- **Calculator components**: Components for the calculator interface
- **UI components**: Reusable UI components like buttons, inputs, etc.

### Hooks

The `frontend/src/hooks/` directory contains custom React hooks:

- **useCalculator.ts**: Hook for calculator logic
- **useForm.ts**: Hook for form handling
- **useValidation.ts**: Hook for input validation

### Services

The `frontend/src/services/` directory contains service modules for API communication:

- **api.ts**: API client setup
- **calculatorService.ts**: Service for calculator API endpoints

### Utils

The `frontend/src/utils/` directory contains utility functions:

- **calculationUtils.ts**: Utility functions for calculations
- **formatUtils.ts**: Utility functions for formatting
- **validationUtils.ts**: Utility functions for validation

### Types

The `frontend/src/types/` directory contains TypeScript type definitions:

- **calculator.ts**: Types for calculator data
- **api.ts**: Types for API requests and responses

## Backend Structure

### Models

The `backend/app/models/` directory contains Pydantic models:

- **calculator.py**: Models for calculator input and output

### Routes

The `backend/app/routes/` directory contains API route definitions:

- **calculator.py**: Routes for calculator endpoints

### Services

The `backend/app/services/` directory contains business logic:

- **calculator_service.py**: Service for calculator calculations

### Utils

The `backend/app/utils/` directory contains utility functions:

- **validators.py**: Validation utilities
- **config.py**: Configuration utilities

## Documentation Structure

### API Documentation

The `docs/api/` directory contains API documentation:

- **index.md**: API documentation overview
- **reference.md**: API endpoint reference
- **data-models.md**: API data model documentation

### Development Documentation

The `docs/development/` directory contains developer documentation:

- **index.md**: Development documentation overview
- **installation.md**: Installation guide
- **architecture.md**: Architecture overview
- **contributing.md**: Contributing guidelines
- **project-structure.md**: Project structure documentation

### User Guides

The `docs/user-guides/` directory contains end-user documentation:

- **index.md**: User guides overview
- **getting-started.md**: Getting started guide
- **understanding-formula.md**: Formula explanation
- **faq.md**: Frequently asked questions

## Task Management

The `tasks/` directory contains Task Master task files:

- **tasks.json**: Main task definition file
- **task_NNN.txt**: Individual task files

## Scripts

The `scripts/` directory contains project scripts:

- **dev.js**: Development workflow script
- **task-complexity-report.json**: Task complexity analysis
