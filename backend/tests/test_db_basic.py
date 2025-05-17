"""
Basic tests for database models.
"""
import pytest
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.config import Base
from app.db.models import Session
from app.db.crud import SessionDAL


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


def test_session_creation(test_db):
    """Test creating a session."""
    # Create a session
    session = SessionDAL.create_session(test_db, expires_in_hours=1)
    
    # Verify session was created
    assert session.id is not None
    assert session.expires_at > datetime.datetime.now()
    
    # Verify session can be retrieved
    retrieved_session = SessionDAL.get_session(test_db, session.id)
    assert retrieved_session is not None
    assert retrieved_session.id == session.id
