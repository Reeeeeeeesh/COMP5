# Flexible Variable Compensation Calculator Documentation

Welcome to the documentation for the Flexible Variable Compensation Calculator (FVCC) project. This documentation provides comprehensive information about the project, its features, architecture, and how to use and contribute to it.

## Documentation Sections

- [User Guides](./user-guides/index.md): End-user documentation on how to use the application
- [API Documentation](./api/index.md): Details about the API endpoints and data models
- [Development Guides](./development/index.md): Information for developers working on the project

## Project Overview

The Flexible Variable Compensation Calculator is a web application designed to calculate variable compensation (bonus) for UK fund managers with high flexibility for adjusting input parameters and formula components.

### Key Features

- Interactive input fields for all compensation components
- Real-time recalculation of bonus upon input changes
- Adjustable weights for different performance components
- Configurable parameters for mapping curves
- Flexible RAF calculation inputs
- Clear display of final bonus and intermediate calculation steps
- Alerts for policy breaches

### Core Bonus Formula

```
FinalBonus = BaseSalary × TargetBonusPct × (InvestmentWeight × InvestmentScoreMultiplier + QualitativeWeight × QualScoreMultiplier) × RAF
```

### Tech Stack

#### Frontend
- React 18
- TypeScript 5
- Vite
- Tailwind CSS

#### Backend
- Python 3.11
- FastAPI

## Quick Links

- [Getting Started](./user-guides/getting-started.md)
- [Installation Guide](./development/installation.md)
- [API Reference](./api/reference.md)
- [Contributing Guidelines](./development/contributing.md)
- [Architecture Overview](./development/architecture.md)
