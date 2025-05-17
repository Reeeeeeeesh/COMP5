# Installation Guide

This guide provides step-by-step instructions for setting up the Flexible Variable Compensation Calculator development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- Git
- Node.js (v16 or later)
- npm (v8 or later)
- Python 3.11
- PowerShell (for Windows) or Bash (for macOS/Linux)

## Clone the Repository

```bash
git clone <repository-url>
cd COMP5
```

## Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will be available at http://localhost:3000.

## Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create and activate a virtual environment:

```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS/Linux (Bash)
python -m venv venv
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Start the development server:

```bash
python run.py
```

The backend API will be available at http://localhost:8000.

## Setting Up Pre-commit Hooks

1. Install pre-commit hooks:

```bash
# Install Husky hooks (from project root)
npm install

# Install Python pre-commit hooks (from backend directory)
cd backend
.\venv\Scripts\python -m pre-commit install
```

## Environment Variables

1. Copy the example environment file for the backend:

```bash
cd backend
copy .env.example .env
```

2. Edit the `.env` file with your specific configuration.

## Verify Installation

1. Check that the frontend is running:
   - Open http://localhost:3000 in your browser
   - You should see the calculator interface

2. Check that the backend is running:
   - Open http://localhost:8000/docs in your browser
   - You should see the FastAPI Swagger documentation

3. Test the API:
   - Open http://localhost:8000/health
   - You should see a JSON response with status "healthy"

## Troubleshooting

### Common Issues

#### Node.js Dependencies

If you encounter issues with Node.js dependencies:

```bash
cd frontend
rm -rf node_modules
npm clean-cache --force
npm install
```

#### Python Virtual Environment

If you encounter issues with the Python virtual environment:

```bash
cd backend
rm -rf venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### Port Conflicts

If the ports are already in use:

- For frontend: Edit `frontend/vite.config.ts` to change the port
- For backend: Edit `backend/run.py` to change the port

### Getting Help

If you encounter any issues not covered in this guide, please:

1. Check the [FAQ](../user-guides/faq.md)
2. Review existing GitHub issues
3. Create a new issue with detailed information about your problem
