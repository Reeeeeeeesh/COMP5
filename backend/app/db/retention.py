"""
Data retention policy implementation.
Handles automatic deletion of expired sessions and temporary batch data.
"""
import logging
from sqlalchemy.orm import Session

from .crud import SessionDAL, BatchUploadDAL

logger = logging.getLogger(__name__)


def cleanup_expired_data(db: Session) -> dict:
    """
    Clean up expired sessions and temporary batch data.
    Returns a dictionary with counts of deleted items.
    """
    # Delete expired sessions (this will cascade to related data)
    deleted_sessions = SessionDAL.delete_expired_sessions(db)
    logger.info(f"Deleted {deleted_sessions} expired sessions")
    
    # Delete expired batch uploads (this will cascade to related data)
    deleted_uploads = BatchUploadDAL.delete_expired_uploads(db)
    logger.info(f"Deleted {deleted_uploads} expired batch uploads")
    
    return {
        "deleted_sessions": deleted_sessions,
        "deleted_uploads": deleted_uploads
    }
