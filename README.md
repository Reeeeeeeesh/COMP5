# Flexible Variable Compensation Calculator (FVCC)

A web application designed to calculate variable compensation (bonus) for UK fund managers with high flexibility for adjusting input parameters and formula components.

## Features

- Interactive input fields for all compensation components
- Real-time recalculation of bonus upon input changes
- Adjustable weights for different performance components
- Configurable parameters for mapping curves
- Flexible RAF calculation inputs
- Clear display of final bonus and intermediate calculation steps
- Alerts for policy breaches

## Core Bonus Formula

```
FinalBonus = BaseSalary × TargetBonusPct × (InvestmentWeight × InvestmentScoreMultiplier + QualitativeWeight × QualScoreMultiplier) × RAF
```

## Tech Stack

### Frontend
- React 18
- TypeScript 5
- Vite
- Tailwind CSS

### Backend (minimal for V1)
- Python 3.11
- FastAPI (for future versions)

## Project Structure

```
COMP5/
├── frontend/           # React frontend application
│   └── src/
│       ├── components/ # UI components
│       ├── hooks/      # Custom React hooks
│       ├── services/   # API services and data fetching
│       ├── utils/      # Utility functions
│       └── types/      # TypeScript type definitions
│
├── backend/            # Python/FastAPI backend (for future versions)
│   └── app/
│       ├── routes/     # API endpoints
│       ├── models/     # Data models
│       ├── services/   # Business logic
│       └── utils/      # Utility functions
│
└── docs/               # Project documentation
    ├── api/            # API documentation
    ├── user-guides/    # End-user guides
    └── development/    # Developer documentation
```

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Backend Setup (for future versions)

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate  # On Windows
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Start the development server:
   ```
   uvicorn app.main:app --reload
   ```

## Development Workflow

This project uses Task Master for task-driven development. To view and manage tasks:

```
task-master list
```

### Code Quality Tools

This project uses several tools to maintain code quality:

- **Linting and Formatting**: See [LINTING.md](LINTING.md) for details
- **Pre-commit Hooks**: See [PRE-COMMIT-HOOKS.md](PRE-COMMIT-HOOKS.md) for details

To ensure your code meets the project standards, pre-commit hooks will automatically run before each commit. These hooks will:

1. Format your code (Prettier for frontend, Black for backend)
2. Lint your code (ESLint for frontend, Flake8 for backend)
3. Check types (TypeScript for frontend, mypy for backend)

Additionally, tests will run before pushing to the repository.

## License

[MIT License](LICENSE)
