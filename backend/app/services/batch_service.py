from sqlalchemy.orm import Session
import pandas as pd
from typing import Dict, Any, List
from app.models.batch import BatchResult
from app.db.models import BatchUpload, EmployeeData, Session as SessionModel
import datetime
import uuid

class BatchService:
    def __init__(self, db: Session):
        self.db = db

    def process_batch(self, df: pd.DataFrame, session_id: str = None, filename: str = "uploaded_file.csv") -> BatchUpload:
        """Process a batch of employee data and store it in the database"""
        
        # Generate session_id if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Ensure session exists
        session = self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            # Create a new session with 24 hour expiry
            session = SessionModel(
                id=session_id,
                expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            )
            self.db.add(session)
            self.db.flush()
        
        # Create a new batch upload record
        batch_upload = BatchUpload(
            session_id=session_id,
            filename=filename,
            status="completed",
            uploaded_at=datetime.datetime.utcnow(),
            processed_at=datetime.datetime.utcnow()
        )
        self.db.add(batch_upload)
        self.db.flush()  # Get the ID without committing
        
        # Process each row in the DataFrame and create EmployeeData records
        for _, row in df.iterrows():
            employee_data = EmployeeData(
                batch_upload_id=batch_upload.id,
                employee_id=str(row.get('employee_id', '')),
                name=str(row.get('name', '')),
                team=str(row.get('team', '')),
                base_salary=float(row.get('base_salary', 0)),
                target_bonus_pct=float(row.get('target_bonus_pct', 0)),
                investment_weight=float(row.get('investment_weight', 0)),
                qualitative_weight=float(row.get('qualitative_weight', 0)),
                investment_score_multiplier=float(row.get('investment_score_multiplier', 1.0)),
                qual_score_multiplier=float(row.get('qual_score_multiplier', 1.0)),
                raf=float(row.get('raf', 1.0)),
                is_mrt=bool(row.get('is_mrt', False)),
                mrt_cap_pct=float(row.get('mrt_cap_pct', 0)) if pd.notna(row.get('mrt_cap_pct')) else None
            )
            self.db.add(employee_data)
        
        self.db.commit()
        self.db.refresh(batch_upload)
        
        print(f"DEBUG: Created batch upload {batch_upload.id} with {len(df)} employees for session {session_id}")
        
        return batch_upload

    def get_batch_results(self, batch_id: int) -> Dict[str, Any]:
        """Get results for a specific batch"""
        batch_upload = self.db.query(BatchUpload).filter(BatchUpload.id == batch_id).first()
        if not batch_upload:
            return None
            
        employee_count = self.db.query(EmployeeData).filter(EmployeeData.batch_upload_id == batch_id).count()
            
        return {
            "id": batch_upload.id,
            "session_id": batch_upload.session_id,
            "filename": batch_upload.filename,
            "status": batch_upload.status,
            "employee_count": employee_count,
            "uploaded_at": batch_upload.uploaded_at,
            "processed_at": batch_upload.processed_at
        }
