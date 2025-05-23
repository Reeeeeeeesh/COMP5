from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.api.deps import get_db
from app.services.batch_service import BatchService
from app.db.models import BatchUpload, EmployeeData
from typing import List, Optional, Dict, Any
import pandas as pd
import io
from collections import defaultdict

router = APIRouter()

@router.post("/upload")
async def upload_batch(
    file: UploadFile = File(...),
    session_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Upload a batch file for processing"""
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Process the batch
        batch_service = BatchService(db)
        result = batch_service.process_batch(df, session_id=session_id, filename=file.filename)
        
        return {
            "status": "success",
            "message": "File uploaded successfully",
            "batch_id": result.id,
            "session_id": result.session_id,
            "employee_count": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{batch_id}/results")
def get_batch_results(
    batch_id: int,
    db: Session = Depends(get_db)
):
    """Get results for a specific batch"""
    batch_service = BatchService(db)
    results = batch_service.get_batch_results(batch_id)
    if not results:
        raise HTTPException(status_code=404, detail="Batch results not found")
    return results

@router.get("/latest/employees")
def get_latest_batch_employees(
    session_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get employee data from the most recent batch upload"""
    # Query to find the most recent batch upload
    query = db.query(BatchUpload)
    if session_id:
        query = query.filter(BatchUpload.session_id == session_id)
    
    latest_batch = query.order_by(desc(BatchUpload.uploaded_at)).first()
    
    if not latest_batch:
        raise HTTPException(status_code=404, detail="No batch uploads found")
    
    # Get all employee data for this batch
    employees = db.query(EmployeeData).filter(EmployeeData.batch_upload_id == latest_batch.id).all()
    
    if not employees:
        raise HTTPException(status_code=404, detail="No employee data found for the latest batch")
    
    # Convert to list of dictionaries for JSON response
    employee_data = [{
        "id": emp.id,
        "employee_id": emp.employee_id,
        "name": emp.name,
        "team": emp.team,
        "base_salary": emp.base_salary,
        "target_bonus_pct": emp.target_bonus_pct,
        "investment_weight": emp.investment_weight,
        # Use the qualitative weight as a proxy for qualitative score (1-5 scale)
        # This is a temporary fix until the database schema is updated
        "qualitative_score": min(5, max(1, round(emp.qualitative_weight * 5))) if emp.qualitative_weight else 3
    } for emp in employees]
    
    return {
        "batch_id": latest_batch.id,
        "session_id": latest_batch.session_id,
        "filename": latest_batch.filename,
        "uploaded_at": latest_batch.uploaded_at,
        "employee_count": len(employee_data),
        "employees": employee_data
    }

@router.get("/latest/team-aggregations")
def get_latest_batch_team_aggregations(
    session_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get team aggregation data from the most recent batch upload"""
    # Query to find the most recent batch upload
    query = db.query(BatchUpload)
    if session_id:
        query = query.filter(BatchUpload.session_id == session_id)
    
    latest_batch = query.order_by(desc(BatchUpload.uploaded_at)).first()
    
    if not latest_batch:
        raise HTTPException(status_code=404, detail="No batch uploads found")
    
    # Get all employee data for this batch
    employees = db.query(EmployeeData).filter(EmployeeData.batch_upload_id == latest_batch.id).all()
    
    if not employees:
        raise HTTPException(status_code=404, detail="No employee data found for the latest batch")
    
    # Aggregate data by team
    team_data = defaultdict(lambda: {
        "team": "",
        "employeeCount": 0,
        "totalBaseSalary": 0,
        "totalBonus": 0,
        "averageBonus": 0,
        "averageBonusToSalaryRatio": 0
    })
    
    for emp in employees:
        team_name = emp.team or "Unassigned"
        
        # Calculate bonus using the same logic as in the frontend
        base_salary = emp.base_salary or 0
        target_bonus_pct = emp.target_bonus_pct or 0.2
        investment_weight = emp.investment_weight or 0.5
        qualitative_weight = emp.qualitative_weight or 0.5
        qualitative_score = min(5, max(1, round(qualitative_weight * 5))) if qualitative_weight else 3
        
        target_bonus = base_salary * target_bonus_pct
        inv_component = target_bonus * investment_weight
        qual_component = target_bonus * (1 - investment_weight) * (qualitative_score / 5)
        bonus = inv_component + qual_component
        
        # Update team aggregation
        team_data[team_name]["team"] = team_name
        team_data[team_name]["employeeCount"] += 1
        team_data[team_name]["totalBaseSalary"] += base_salary
        team_data[team_name]["totalBonus"] += bonus
    
    # Calculate averages
    for team_name, data in team_data.items():
        if data["employeeCount"] > 0:
            data["averageBonus"] = data["totalBonus"] / data["employeeCount"]
            if data["totalBaseSalary"] > 0:
                data["averageBonusToSalaryRatio"] = data["totalBonus"] / data["totalBaseSalary"]
    
    # Convert to list for response
    team_aggregations = list(team_data.values())
    
    return {
        "batch_id": latest_batch.id,
        "session_id": latest_batch.session_id,
        "team_count": len(team_aggregations),
        "team_aggregations": team_aggregations
    }
