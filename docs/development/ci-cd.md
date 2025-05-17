# CI/CD Pipeline

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Flexible Variable Compensation Calculator project.

## Overview

The CI/CD pipeline automates the process of building, testing, and deploying the application. It ensures that code changes are automatically validated and deployed to the appropriate environments.

## Pipeline Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│    Build    │────►│    Test     │────►│    Lint     │────►│   Deploy    │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Environments

The pipeline supports the following environments:

- **Development**: For ongoing development work
- **Staging**: For pre-production testing
- **Production**: For end-user access

## GitHub Actions Configuration

The project uses GitHub Actions for CI/CD. The workflow configuration is defined in `.github/workflows/` directory.

### Main Workflow

The main workflow (`main.yml`) is triggered on pushes to the main branch and pull requests:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      
      - name: Install frontend dependencies
        run: cd frontend && npm ci
      
      - name: Build frontend
        run: cd frontend && npm run build
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: 'backend/requirements.txt'
      
      - name: Install backend dependencies
        run: cd backend && pip install -r requirements.txt
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            frontend/dist
            backend/

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      
      - name: Install frontend dependencies
        run: cd frontend && npm ci
      
      - name: Run frontend tests
        run: cd frontend && npm test
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: 'backend/requirements.txt'
      
      - name: Install backend dependencies
        run: cd backend && pip install -r requirements.txt
      
      - name: Run backend tests
        run: cd backend && python -m pytest

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      
      - name: Install frontend dependencies
        run: cd frontend && npm ci
      
      - name: Lint frontend
        run: cd frontend && npm run lint
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: 'backend/requirements.txt'
      
      - name: Install backend dependencies
        run: cd backend && pip install -r requirements.txt
      
      - name: Lint backend
        run: |
          cd backend
          pip install flake8 black
          flake8 .
          black --check .

  deploy-staging:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: [test, lint]
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
      
      - name: Deploy to staging
        run: echo "Deploying to staging environment"
        # Add actual deployment steps here

  deploy-production:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
      
      - name: Deploy to production
        run: echo "Deploying to production environment"
        # Add actual deployment steps here
```

## Pull Request Workflow

The pull request workflow (`pr.yml`) is triggered on pull requests to ensure code quality:

```yaml
name: Pull Request Checks

on:
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      
      - name: Install frontend dependencies
        run: cd frontend && npm ci
      
      - name: Lint frontend
        run: cd frontend && npm run lint
      
      - name: Test frontend
        run: cd frontend && npm test
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: 'backend/requirements.txt'
      
      - name: Install backend dependencies
        run: cd backend && pip install -r requirements.txt
      
      - name: Lint backend
        run: |
          cd backend
          pip install flake8 black
          flake8 .
          black --check .
      
      - name: Test backend
        run: cd backend && python -m pytest
```

## Deployment Strategy

### Frontend Deployment

The frontend is deployed as static files to a CDN or web server:

1. Build the React application with `npm run build`
2. Upload the generated files in the `dist` directory to the hosting service
3. Configure the hosting service for proper routing (for SPA support)

### Backend Deployment

The backend is deployed as a containerized service:

1. Build a Docker image with the FastAPI application
2. Push the image to a container registry
3. Deploy the container to the target environment

## Monitoring and Alerts

The CI/CD pipeline includes monitoring and alerts:

- **Build Failures**: Notify the team when builds fail
- **Test Failures**: Notify the team when tests fail
- **Deployment Failures**: Notify the team when deployments fail
- **Performance Degradation**: Alert when performance metrics degrade

## Setting Up the CI/CD Pipeline

### Prerequisites

- GitHub repository with the project code
- GitHub Actions enabled for the repository
- Access to deployment environments

### Configuration Steps

1. Create the `.github/workflows/` directory in the repository
2. Add the workflow files (`main.yml` and `pr.yml`)
3. Configure environment secrets for deployment
4. Push the changes to the repository

### Environment Secrets

The following secrets should be configured in the GitHub repository:

- `STAGING_DEPLOY_KEY`: SSH key for staging deployment
- `PRODUCTION_DEPLOY_KEY`: SSH key for production deployment
- `API_TOKEN`: API token for service integrations

## Best Practices

- **Fail Fast**: Configure the pipeline to fail as early as possible
- **Parallel Execution**: Run independent jobs in parallel
- **Caching**: Cache dependencies to speed up builds
- **Artifacts**: Share build artifacts between jobs
- **Environment Protection**: Require approvals for production deployments
- **Rollback Plan**: Have a plan for rolling back failed deployments

## Troubleshooting

### Common Issues

#### Build Failures

- Check for syntax errors in the code
- Verify that all dependencies are available
- Ensure that the build configuration is correct

#### Test Failures

- Check the test logs for specific failures
- Verify that the tests are not flaky
- Ensure that the test environment is properly configured

#### Deployment Failures

- Check the deployment logs for specific errors
- Verify that the deployment credentials are correct
- Ensure that the target environment is available
