# Architecture Overview

This document provides an overview of the architecture of the Flexible Variable Compensation Calculator application.

## System Architecture

The Flexible Variable Compensation Calculator uses a modern web application architecture with a clear separation of concerns:

```
┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │
│  React Frontend │◄────►│ FastAPI Backend │
│                 │      │                 │
└─────────────────┘      └─────────────────┘
```

### Frontend Architecture

The frontend is built with React 18, TypeScript 5, and Tailwind CSS, using Vite as the build tool. It follows a component-based architecture with a focus on type safety and maintainability.

#### Key Components

- **App**: The main application component
- **Calculator**: Manages the calculator state and logic
- **InputFields**: Reusable input components for calculator parameters
- **ResultsDisplay**: Components for displaying calculation results
- **Alerts**: Components for displaying policy breach alerts

#### State Management

For V1, the application uses React's built-in state management (useState, useContext) to manage the calculator state. This includes:

- Input parameters (base salary, target bonus, weights, multipliers, RAF)
- Calculation results (final bonus, intermediate values)
- UI state (loading, error states)

#### Data Flow

1. User inputs parameters in the form
2. React state is updated on input change
3. Calculation function is triggered on state change
4. Results are displayed in real-time

### Backend Architecture

The backend is built with Python 3.11 and FastAPI. For V1, the backend is minimal and primarily serves as an API for the calculator logic. In future versions, it will be expanded to support scenario saving and other features.

#### Key Components

- **FastAPI Application**: The main application entry point
- **Routes**: API endpoints for the calculator
- **Services**: Business logic for calculations
- **Models**: Pydantic models for request/response validation
- **Utils**: Utility functions and helpers

#### API Design

The API follows RESTful principles with JSON as the data format. Key endpoints include:

- `/api/v1/calculate`: Calculate bonus based on input parameters
- `/health`: Check API health status

### Cross-Cutting Concerns

#### Security

- CORS configuration to restrict API access
- Input validation using TypeScript types and Pydantic models
- Error handling to prevent information leakage

#### Performance

- Client-side calculations for real-time updates
- Efficient state management to minimize re-renders
- Lazy loading of components when appropriate

#### Testing

- Unit tests for core calculation logic
- Component tests for UI elements
- API tests for backend endpoints

## Technology Stack

### Frontend

- **React 18**: UI library
- **TypeScript 5**: Type-safe JavaScript
- **Vite**: Build tool
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint/Prettier**: Code quality tools
- **Vitest**: Testing framework

### Backend

- **Python 3.11**: Programming language
- **FastAPI**: Web framework
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server
- **Black/Flake8**: Code quality tools
- **Pytest**: Testing framework

## Future Architecture Considerations

For V1.1 and beyond, the architecture will be expanded to include:

- **Database**: For storing calculation scenarios
- **Authentication**: User accounts and access control
- **Advanced Visualization**: Charts and graphs for comparing scenarios
- **Batch Processing**: For handling multiple scenarios simultaneously

## Deployment Architecture

The application is designed to be deployed as follows:

- Frontend: Static files served from a CDN or web server
- Backend: Containerized service running in a cloud environment
- API Gateway: For routing and rate limiting (future)
- Database: For persistent storage (future)
