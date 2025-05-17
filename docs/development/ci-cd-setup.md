# CI/CD Pipeline Setup

This document provides detailed information about the CI/CD pipeline configuration for the Flexible Variable Compensation Calculator project.

## Overview

The project uses GitHub Actions for continuous integration and continuous deployment. The pipeline is configured to automatically build, test, and deploy the application when changes are pushed to the repository.

## Workflow Files

The CI/CD pipeline is defined in the following workflow files:

- `.github/workflows/main.yml`: Main workflow for CI/CD pipeline
- `.github/workflows/pull-request.yml`: Workflow for pull request validation
- `.github/workflows/deployment.yml`: Workflow for manual deployments

## Main Workflow

The main workflow (`main.yml`) is triggered on pushes to the main branch and pull requests. It includes the following jobs:

### Frontend Jobs

1. **frontend-build**: Builds the React frontend application
   - Checks out the code
   - Sets up Node.js
   - Installs dependencies
   - Builds the application
   - Uploads build artifacts

2. **frontend-test**: Runs tests for the frontend application
   - Depends on frontend-build
   - Runs the test suite using Vitest

3. **frontend-lint**: Lints the frontend code
   - Runs ESLint to check code quality

### Backend Jobs

1. **backend-test**: Runs tests for the backend application
   - Sets up Python
   - Installs dependencies
   - Runs the test suite using pytest

2. **backend-lint**: Lints the backend code
   - Runs Flake8 for linting
   - Runs Black to check code formatting

### Deployment Jobs

1. **deploy-staging**: Deploys to the staging environment
   - Only runs on pushes to the main branch
   - Depends on all build, test, and lint jobs
   - Downloads build artifacts
   - Deploys to the staging environment

2. **deploy-production**: Deploys to the production environment
   - Only runs on pushes to the main branch
   - Depends on deploy-staging
   - Downloads build artifacts
   - Deploys to the production environment

## Pull Request Workflow

The pull request workflow (`pull-request.yml`) is triggered on pull requests to the main branch. It includes the following jobs:

1. **validate-pr**: Validates the pull request
   - Checks the PR title for semantic versioning
   - Checks for large files

2. **frontend-checks**: Runs checks for the frontend code
   - Runs tests
   - Lints the code
   - Checks that the build succeeds

3. **backend-checks**: Runs checks for the backend code
   - Lints with Flake8
   - Checks formatting with Black
   - Runs tests with pytest

4. **security-scan**: Runs security scans
   - Runs npm audit for frontend dependencies
   - Runs pip-audit for backend dependencies

## Deployment Workflow

The deployment workflow (`deployment.yml`) is triggered manually and allows deploying to different environments. It includes the following jobs:

1. **build**: Builds the application
   - Builds the frontend
   - Packages the backend
   - Uploads build artifacts

2. **test**: Runs tests
   - Depends on build
   - Runs frontend and backend tests

3. **deploy-staging**: Deploys to the staging environment
   - Only runs if the staging environment is selected
   - Downloads build artifacts
   - Deploys to the staging environment

4. **deploy-production**: Deploys to the production environment
   - Only runs if the production environment is selected
   - Downloads build artifacts
   - Deploys to the production environment
   - Creates a GitHub release

## Environment Configuration

The pipeline uses GitHub Environments to manage environment-specific configurations:

- **staging**: Used for pre-production testing
- **production**: Used for end-user access

Each environment can have its own secrets, variables, and protection rules.

## Secrets Management

Sensitive information such as API keys and deployment credentials should be stored as GitHub Secrets. These secrets can be accessed in the workflow files using the `${{ secrets.SECRET_NAME }}` syntax.

## Workflow Visualization

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Frontend Build │────►│ Frontend Test   │────►│ Deploy Staging  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
┌─────────────────┐                                     │
│                 │                                     ▼
│ Frontend Lint   │────────────────────────────►┌─────────────────┐
│                 │                              │                 │
└─────────────────┘                              │Deploy Production│
                                                 │                 │
┌─────────────────┐                              └─────────────────┘
│                 │                                     ▲
│  Backend Test   │────────────────────────────────────┘
│                 │
└─────────────────┘

┌─────────────────┐
│                 │
│  Backend Lint   │────────────────────────────────────┘
│                 │
└─────────────────┘
```

## Setting Up GitHub Actions

To set up GitHub Actions for your repository:

1. Create the `.github/workflows` directory in your repository
2. Add the workflow files (`main.yml`, `pull-request.yml`, `deployment.yml`)
3. Push the changes to your repository
4. Configure environment secrets in the GitHub repository settings

## Customizing the Pipeline

The pipeline can be customized to fit your specific needs:

- Add or remove jobs
- Modify build steps
- Change deployment targets
- Add additional checks or validations

To customize the pipeline, edit the workflow files in the `.github/workflows` directory.

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

### Viewing Workflow Runs

You can view the status and logs of workflow runs in the "Actions" tab of your GitHub repository.

## Best Practices

- **Fail Fast**: Configure the pipeline to fail as early as possible
- **Parallel Execution**: Run independent jobs in parallel
- **Caching**: Cache dependencies to speed up builds
- **Artifacts**: Share build artifacts between jobs
- **Environment Protection**: Require approvals for production deployments
- **Rollback Plan**: Have a plan for rolling back failed deployments
