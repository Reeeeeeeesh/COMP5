import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.config import Base

@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)

@pytest.fixture
def valid_calculator_input():
    """Return valid calculator input data."""
    return {
        "base_salary": 100000,
        "target_bonus_pct": 20,
        "investment_weight": 70,
        "qualitative_weight": 30,
        "investment_score_multiplier": 1.0,
        "qual_score_multiplier": 1.0,
        "raf": 1.0
    }

@pytest.fixture
def test_db():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create a test session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
