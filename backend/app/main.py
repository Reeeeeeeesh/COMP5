from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Dict, Any
import logging
import time
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

# Import routes
from app.routes import calculator, batch

# Import database
from app.db import Base, engine, get_db
from app.db.retention import cleanup_expired_data

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Flexible Variable Compensation Calculator API",
    description="API for calculating variable compensation for UK fund managers",
    version="0.1.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Both Vite and custom port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(calculator.router, prefix="/api/v1", tags=["calculator"])
app.include_router(batch.router, prefix="/api/v1/batch", tags=["batch"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Flexible Variable Compensation Calculator API",
        "version": "0.1.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Initialize database tables
@app.on_event("startup")
async def init_db():
    logger.info("Creating database tables (if they don't exist)")
    Base.metadata.create_all(bind=engine)
    
    # Set up scheduled cleanup task
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=lambda: cleanup_expired_data(next(get_db())),
        trigger="interval",
        hours=1,  # Run every hour
        id="cleanup_expired_data",
        name="Clean up expired sessions and temporary batch data",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Started scheduled cleanup task")


@app.get("/cleanup", include_in_schema=False)
async def manual_cleanup(db: Session = Depends(get_db)):
    """Manually trigger cleanup of expired data (for testing)"""
    result = cleanup_expired_data(db)
    return {"message": "Cleanup completed", "result": result}
