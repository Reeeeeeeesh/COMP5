# Contributing Guidelines

This document provides guidelines for contributing to the Flexible Variable Compensation Calculator project.

## Development Workflow

This project uses Task Master for task-driven development. The workflow is designed to ensure consistent, high-quality code and a smooth development process.

### Task Management

1. View available tasks:
   ```
   task-master list
   ```

2. Select a task to work on based on dependencies and priority.

3. Check task details:
   ```
   task-master show <id>
   ```

4. Mark a task as in-progress:
   ```
   task-master set-status --id=<id> --status=in-progress
   ```

5. For complex tasks, expand into subtasks:
   ```
   task-master expand --id=<id> --research
   ```

6. After completion, mark the task as done:
   ```
   task-master set-status --id=<id> --status=done
   ```

### Git Workflow

1. Create a new branch for each task:
   ```
   git checkout -b feature/task-<id>-<short-description>
   ```

2. Make small, focused commits with clear messages:
   ```
   git commit -m "Task #<id>: <description of changes>"
   ```

3. Push your branch to the remote repository:
   ```
   git push origin feature/task-<id>-<short-description>
   ```

4. Create a pull request when the task is complete.

5. Address any review comments and update your PR.

6. Merge the PR once approved.

## Code Standards

### General Guidelines

- Keep files under 200-300 lines of code
- Follow the Single Responsibility Principle
- Write clear, descriptive comments
- Include appropriate error handling
- Write tests for all major functionality

### Frontend (TypeScript/React)

- Follow the [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- Use functional components with hooks
- Use TypeScript interfaces for props and state
- Follow the project's ESLint and Prettier configuration
- Organize imports according to the project standards

### Backend (Python/FastAPI)

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use type hints consistently
- Document functions with docstrings
- Follow the project's Black and Flake8 configuration
- Organize imports using isort

## Pull Request Process

1. Ensure your code passes all linting and tests:
   ```
   # Frontend
   cd frontend
   npm run lint
   npm run test
   
   # Backend
   cd backend
   .\venv\Scripts\python -m flake8
   .\venv\Scripts\python -m pytest
   ```

2. Update documentation if necessary.

3. Create a pull request with a clear title and description.

4. Link the PR to the relevant task.

5. Request a review from at least one team member.

6. Address any review comments promptly.

7. Once approved, merge the PR.

## Testing Guidelines

### Frontend Testing

- Write unit tests for utility functions
- Write component tests for UI components
- Test edge cases and error handling
- Aim for good test coverage of critical paths

### Backend Testing

- Write unit tests for services and utilities
- Write API tests for endpoints
- Test validation logic and error handling
- Test edge cases and boundary conditions

## Documentation Guidelines

- Update documentation when making significant changes
- Document public APIs with clear descriptions
- Include examples where appropriate
- Keep documentation up-to-date with code changes

## Getting Help

If you need help with the contribution process:

1. Check the existing documentation
2. Ask questions in the project's communication channels
3. Reach out to the project maintainers

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow
