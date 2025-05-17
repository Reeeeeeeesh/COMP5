"""
Database configuration module for the application.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get database URL from environment variable or use SQLite as default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./compensation_calculator.db")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False  # Set to True for SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for declarative models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    """
    Dependency function to get a database session.
    Yields a session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
