"""
API routes for batch processing operations.
"""
from fastapi import APIRouter, Depends, HTTPException, Cookie, Response, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import datetime
import uuid
import os
import tempfile
import logging

from app.db import get_db
from app.db.crud import (
    SessionDAL, BatchScenarioDAL, BatchUploadDAL, 
    EmployeeDataDAL, BatchCalculationResultDAL, 
    EmployeeCalculationResultDAL, ImportTemplateDAL
)
from app.services.file_processor import FileProcessor
from app.db.schemas import (
    Session, SessionCreate,
    BatchScenario, BatchScenarioCreate, BatchScenarioUpdate,
    BatchUpload, BatchUploadCreate,
    EmployeeData, EmployeeDataCreate, EmployeeDataUpdate,
    BatchCalculationResult, BatchCalculationResultCreate,
    EmployeeCalculationResult, EmployeeCalculationResultCreate,
    BatchScenarioWithResults, BatchUploadWithEmployees,
    BatchCalculationResultWithEmployees, SessionWithData,
    ImportTemplate, ImportTemplateCreate, ImportTemplateUpdate,
    ColumnInfoSchema
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Session management
@router.post("/sessions", response_model=Session)
def create_session(
    session_data: SessionCreate,
    response: Response,
    db: Session = Depends(get_db)
):
    """Create a new anonymous session."""
    db_session = SessionDAL.create_session(db, expires_in_hours=session_data.expires_in_hours)
    
    # Set session cookie
    response.set_cookie(
        key="session_id",
        value=db_session.id,
        expires=db_session.expires_at.timestamp(),
        httponly=True,
        samesite="lax"
    )
    
    return db_session


@router.get("/sessions/current", response_model=Session)
def get_current_session(
    session_id: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """Get the current session."""
    if not session_id:
        raise HTTPException(status_code=404, detail="No active session")
    
    db_session = SessionDAL.get_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if session is expired
    if db_session.expires_at < datetime.datetime.now():
        raise HTTPException(status_code=401, detail="Session expired")
    
    return db_session


@router.put("/sessions/extend", response_model=Session)
def extend_session(
    hours: int = 24,
    session_id: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """Extend the current session."""
    if not session_id:
        raise HTTPException(status_code=404, detail="No active session")
    
    db_session = SessionDAL.extend_session(db, session_id, hours=hours)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return db_session


# Batch scenario management
@router.post("/scenarios", response_model=BatchScenario)
def create_scenario(
    scenario: BatchScenarioCreate,
    db: Session = Depends(get_db)
):
    """Create a new batch scenario."""
    # Verify session exists
    db_session = SessionDAL.get_session(db, scenario.session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return BatchScenarioDAL.create_scenario(
        db,
        session_id=scenario.session_id,
        name=scenario.name,
        description=scenario.description,
        global_parameters=scenario.global_parameters,
        is_saved=scenario.is_saved
    )


@router.get("/scenarios/{scenario_id}", response_model=BatchScenario)
def get_scenario(
    scenario_id: int,
    db: Session = Depends(get_db)
):
    """Get a batch scenario by ID."""
    db_scenario = BatchScenarioDAL.get_scenario(db, scenario_id)
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return db_scenario


@router.get("/scenarios", response_model=List[BatchScenario])
def get_scenarios(
    session_id: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """Get all batch scenarios for the current session."""
    if not session_id:
        raise HTTPException(status_code=404, detail="No active session")
    
    return BatchScenarioDAL.get_scenarios_by_session(db, session_id)


@router.put("/scenarios/{scenario_id}", response_model=BatchScenario)
def update_scenario(
    scenario_id: int,
    scenario_update: BatchScenarioUpdate,
    db: Session = Depends(get_db)
):
    """Update a batch scenario."""
    db_scenario = BatchScenarioDAL.update_scenario(
        db,
        scenario_id=scenario_id,
        name=scenario_update.name,
        description=scenario_update.description,
        global_parameters=scenario_update.global_parameters,
        is_saved=scenario_update.is_saved
    )
    
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return db_scenario


@router.delete("/scenarios/{scenario_id}", response_model=dict)
def delete_scenario(
    scenario_id: int,
    db: Session = Depends(get_db)
):
    """Delete a batch scenario."""
    success = BatchScenarioDAL.delete_scenario(db, scenario_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return {"message": "Scenario deleted successfully"}


# Batch upload management

@router.post("/uploads/file", response_model=Dict[str, Any])
async def upload_file(
    file: UploadFile = File(...),
    template_id: Optional[int] = Form(None),
    session_id: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """Upload a file for batch processing."""
    if not session_id:
        raise HTTPException(status_code=404, detail="No active session")
    
    # Verify session exists
    db_session = SessionDAL.get_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if db_session.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Read the file content first to store it raw
    raw_content = await file.read()
    # Reset file pointer to allow FileProcessor to read it again
    await file.seek(0)

    # Process the file to extract column info and perform initial validation
    # FileProcessor.process_file expects the UploadFile object
    df, validation_results, source_columns_info = await FileProcessor.process_file(file, template_id, db)
    
    # If initial validation (file format, readability, emptiness) failed, return the validation results
    if not validation_results.get('valid', False) and validation_results.get('error'):
        # More specific error for file processing issues vs. data validation issues
        raise HTTPException(status_code=400, detail=validation_results['error'])
    
    # Create the BatchUpload record, now storing the raw content and column info
    # The status will default to 'awaiting_mapping' or can be set explicitly
    batch_upload = BatchUploadDAL.create_upload(
        db,
        session_id=session_id,
        filename=file.filename,
        expires_in_hours=24, 
        source_columns_info=source_columns_info, 
        raw_file_content=raw_content,
        status="awaiting_mapping" # Explicitly set status
    )
    
    # --- IMPORTANT: EmployeeData is NO LONGER saved here ---
    # The data will be processed and saved after column mapping in a new endpoint.

    # Return information about the created batch upload, including its ID for next steps
    return {
        "message": "File uploaded successfully and is awaiting column mapping.",
        "upload_id": batch_upload.id,
        "filename": batch_upload.filename,
        "status": batch_upload.status,
        "source_columns_info": source_columns_info, # Return this so UI can proceed to mapping
        "validation_results": validation_results # Return initial validation (e.g., template applied)
    }


@router.post("/uploads/{upload_id}/map_and_process", status_code=200)
async def map_and_process_upload(
    upload_id: int,
    payload: schemas.ColumnMappingPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user) # Assuming authentication is needed
):
    """
    Processes an uploaded file after column mapping. 
    Retrieves the raw file, applies mappings and default values, 
    validates, and saves data to EmployeeData.
    """
    batch_upload = BatchUploadDAL.get_upload(db, upload_id)
    if not batch_upload:
        raise HTTPException(status_code=404, detail=f"Batch upload with ID {upload_id} not found.")

    if batch_upload.status != "awaiting_mapping":
        raise HTTPException(
            status_code=400, 
            detail=f"Upload ID {upload_id} is not awaiting mapping. Current status: {batch_upload.status}"
        )
    
    if not batch_upload.raw_file_content:
        BatchUploadDAL.update_upload_processing_status(db, upload_id, "failed_processing", "Raw file content not found.")
        raise HTTPException(status_code=500, detail="Raw file content not found for this upload.")

    # Update status to 'processing'
    BatchUploadDAL.update_upload_processing_status(db, upload_id, "processing")

    try:
        # 2. Reconstruct DataFrame, apply mappings, defaults, and validate
        transformed_df, validation_results = await FileProcessor.apply_mappings_and_process_raw_content(
            raw_file_content=batch_upload.raw_file_content,
            original_filename=batch_upload.filename,
            column_mappings=payload.column_mappings,
            default_values=payload.default_values,
            db=db # Pass db session if needed by underlying validation logic
        )

        if not validation_results.get("valid", False) or transformed_df is None:
            error_detail = validation_results.get("error", "Validation failed after applying mappings.")
            if validation_results.get("errors"): # Prepend specific errors if available
                error_detail = "; ".join(validation_results["errors"]) + ". " + error_detail
            BatchUploadDAL.update_upload_processing_status(db, upload_id, "failed_processing", error_detail)
            raise HTTPException(status_code=400, detail=error_detail)

        # 5. If valid, save to EmployeeData table
        # Note: FileProcessor.save_to_database expects the batch_upload object to link EmployeeData records
        saved_count, errors = FileProcessor.save_to_database(db, transformed_df, batch_upload)

        if errors:
            # Decide if partial success is acceptable or if it's a full failure
            error_summary = "; ".join([f"Row {e['row']}: {e['error']}" for e in errors])
            BatchUploadDAL.update_upload_processing_status(db, upload_id, "failed_processing", f"Completed with errors: {error_summary}")
            return {
                "message": f"Processing for upload ID {upload_id} completed with errors.",
                "upload_id": upload_id,
                "rows_processed": len(transformed_df),
                "rows_saved": saved_count,
                "errors": errors
            }

        # 6. Update BatchUpload status to 'completed'
        BatchUploadDAL.update_upload_processing_status(db, upload_id, "completed")
        
        return {
            "message": f"Successfully processed and saved data for upload ID {upload_id}.",
            "upload_id": upload_id,
            "rows_processed": len(transformed_df),
            "rows_saved": saved_count
        }

    except HTTPException as http_exc: # Catch HTTPExceptions raised by ourselves
        raise http_exc 
    except Exception as e:
        logger.error(f"Unexpected error during map_and_process for upload {upload_id}: {e}", exc_info=True)
        BatchUploadDAL.update_upload_processing_status(db, upload_id, "failed_processing", f"An unexpected server error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred during processing: {str(e)}")


@router.get("/uploads/{upload_id}/columns", response_model=Dict[str, Any])
async def get_upload_columns(
    upload_id: int,
    session_id: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """Get column information from an uploaded file after initial processing."""
    if not session_id:
        raise HTTPException(status_code=403, detail="No active session")
    
    # Verify session exists and is not expired (optional, but good practice)
    db_session = SessionDAL.get_session(db, session_id)
    if not db_session or db_session.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=401, detail="Session invalid or expired")

    # Retrieve the batch upload to ensure it belongs to the current session (security check)
    batch_upload = BatchUploadDAL.get_upload(db, upload_id)
    if not batch_upload or batch_upload.session_id != session_id:
        raise HTTPException(status_code=404, detail="Upload not found or access denied")

    # Get column info using the FileProcessor method
    # This now directly fetches from batch_upload.source_columns_info via FileProcessor
    column_data = FileProcessor.get_column_info(upload_id, db)
    
    if "error" in column_data: # Handle cases where column_data might indicate an error
        raise HTTPException(status_code=404, detail=column_data["error"])
        
    return column_data


@router.get("/uploads/template/{file_format}")
async def download_template(
    file_format: str
):
    """Get a template file for batch uploads."""
    # Validate file format
    if file_format.lower() not in ['csv', 'excel']:
        raise HTTPException(status_code=400, detail="Invalid file format. Supported formats: csv, excel")
    
    # Generate the template file
    template_path = FileProcessor.save_template(file_format.lower())
    
    # Set the filename based on the format
    filename = f"employee_data_template.{file_format.lower()}"
    if file_format.lower() == 'excel':
        filename = "employee_data_template.xlsx"
    
    # Return the file
    return FileResponse(
        path=template_path,
        filename=filename,
        media_type="application/octet-stream"
    )


@router.get("/uploads/{upload_id}/validate", response_model=Dict[str, Any])
def validate_upload(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """Validate a batch upload."""
    # Get the batch upload
    db_upload = BatchUploadDAL.get_upload(db, upload_id)
    if not db_upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    # Get the employees for the upload
    employees = EmployeeDataDAL.get_employees_by_upload(db, upload_id)
    
    # Return validation summary
    return {
        "valid": True,
        "upload_id": upload_id,
        "filename": db_upload.filename,
        "total_employees": len(employees),
        "teams": list(set(e.team for e in employees if e.team))
    }


# Existing batch upload management endpoints
@router.post("/uploads", response_model=BatchUpload)
def create_upload(
    upload: BatchUploadCreate,
    db: Session = Depends(get_db)
):
    """Create a new batch upload."""
    # Verify session exists
    db_session = SessionDAL.get_session(db, upload.session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return BatchUploadDAL.create_upload(
        db,
        session_id=upload.session_id,
        filename=upload.filename,
        expires_in_hours=upload.expires_in_hours
    )


@router.get("/uploads/{upload_id}", response_model=BatchUpload)
def get_upload(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """Get a batch upload by ID."""
    db_upload = BatchUploadDAL.get_upload(db, upload_id)
    if not db_upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    return db_upload


@router.get("/uploads", response_model=List[BatchUpload])
def get_uploads(
    session_id: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """Get all batch uploads for the current session."""
    if not session_id:
        raise HTTPException(status_code=404, detail="No active session")
    
    return BatchUploadDAL.get_uploads_by_session(db, session_id)


@router.delete("/uploads/{upload_id}", response_model=dict)
def delete_upload(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """Delete a batch upload."""
    success = BatchUploadDAL.delete_upload(db, upload_id)
    if not success:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    return {"message": "Upload deleted successfully"}


# Employee data management
@router.post("/employees", response_model=EmployeeData)
def create_employee(
    employee: EmployeeDataCreate,
    db: Session = Depends(get_db)
):
    """Create a new employee data record."""
    # Verify batch upload exists
    db_upload = BatchUploadDAL.get_upload(db, employee.batch_upload_id)
    if not db_upload:
        raise HTTPException(status_code=404, detail="Batch upload not found")
    
    return EmployeeDataDAL.create_employee(
        db,
        batch_upload_id=employee.batch_upload_id,
        base_salary=employee.base_salary,
        target_bonus_pct=employee.target_bonus_pct,
        investment_weight=employee.investment_weight,
        qualitative_weight=employee.qualitative_weight,
        investment_score_multiplier=employee.investment_score_multiplier,
        qual_score_multiplier=employee.qual_score_multiplier,
        raf=employee.raf,
        employee_id=employee.employee_id,
        name=employee.name,
        team=employee.team,
        is_mrt=employee.is_mrt,
        mrt_cap_pct=employee.mrt_cap_pct,
        parameter_overrides=employee.parameter_overrides
    )


@router.get("/employees/{employee_id}", response_model=EmployeeData)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db)
):
    """Get an employee data record by ID."""
    db_employee = EmployeeDataDAL.get_employee(db, employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return db_employee


@router.get("/uploads/{upload_id}/employees", response_model=List[EmployeeData])
def get_employees_by_upload(
    upload_id: int,
    team: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all employee data records for a batch upload."""
    # Verify batch upload exists
    db_upload = BatchUploadDAL.get_upload(db, upload_id)
    if not db_upload:
        raise HTTPException(status_code=404, detail="Batch upload not found")
    
    if team:
        return EmployeeDataDAL.get_employees_by_team(db, upload_id, team)
    else:
        return EmployeeDataDAL.get_employees_by_upload(db, upload_id)


@router.put("/employees/{employee_id}", response_model=EmployeeData)
def update_employee(
    employee_id: int,
    employee_update: EmployeeDataUpdate,
    db: Session = Depends(get_db)
):
    """Update an employee data record."""
    update_data = employee_update.dict(exclude_unset=True)
    db_employee = EmployeeDataDAL.update_employee(db, employee_id, **update_data)
    
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return db_employee


# Batch calculation results management
@router.post("/calculations", response_model=BatchCalculationResult)
def create_calculation_result(
    result: BatchCalculationResultCreate,
    db: Session = Depends(get_db)
):
    """Create a new batch calculation result."""
    # Verify scenario exists
    db_scenario = BatchScenarioDAL.get_scenario(db, result.scenario_id)
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return BatchCalculationResultDAL.create_result(
        db,
        scenario_id=result.scenario_id,
        total_bonus_pool=result.total_bonus_pool,
        average_bonus=result.average_bonus,
        total_employees=result.total_employees,
        capped_employees=result.capped_employees
    )


@router.get("/calculations/{result_id}", response_model=BatchCalculationResult)
def get_calculation_result(
    result_id: int,
    db: Session = Depends(get_db)
):
    """Get a batch calculation result by ID."""
    db_result = BatchCalculationResultDAL.get_result(db, result_id)
    if not db_result:
        raise HTTPException(status_code=404, detail="Calculation result not found")
    
    return db_result


@router.get("/scenarios/{scenario_id}/calculations", response_model=List[BatchCalculationResult])
def get_calculation_results_by_scenario(
    scenario_id: int,
    db: Session = Depends(get_db)
):
    """Get all batch calculation results for a scenario."""
    # Verify scenario exists
    db_scenario = BatchScenarioDAL.get_scenario(db, scenario_id)
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return BatchCalculationResultDAL.get_results_by_scenario(db, scenario_id)


# Employee calculation results management
@router.post("/employee-results", response_model=EmployeeCalculationResult)
def create_employee_result(
    result: EmployeeCalculationResultCreate,
    db: Session = Depends(get_db)
):
    """Create a new employee calculation result."""
    # Verify batch result exists
    db_batch_result = BatchCalculationResultDAL.get_result(db, result.batch_result_id)
    if not db_batch_result:
        raise HTTPException(status_code=404, detail="Batch calculation result not found")
    
    # Verify employee exists
    db_employee = EmployeeDataDAL.get_employee(db, result.employee_data_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return EmployeeCalculationResultDAL.create_result(
        db,
        batch_result_id=result.batch_result_id,
        employee_data_id=result.employee_data_id,
        investment_component=result.investment_component,
        qualitative_component=result.qualitative_component,
        weighted_performance=result.weighted_performance,
        pre_raf_bonus=result.pre_raf_bonus,
        final_bonus=result.final_bonus,
        bonus_to_salary_ratio=result.bonus_to_salary_ratio,
        policy_breach=result.policy_breach,
        applied_cap=result.applied_cap
    )


@router.get("/calculations/{result_id}/employee-results", response_model=List[EmployeeCalculationResult])
def get_employee_results_by_batch(
    result_id: int,
    db: Session = Depends(get_db)
):
    """Get all employee calculation results for a batch calculation."""
    # Verify batch result exists
    db_batch_result = BatchCalculationResultDAL.get_result(db, result_id)
    if not db_batch_result:
        raise HTTPException(status_code=404, detail="Batch calculation result not found")
    
    return EmployeeCalculationResultDAL.get_results_by_batch(db, result_id)


# Import template management

@router.post("/templates", response_model=ImportTemplate)
def create_template(
    template: ImportTemplateCreate,
    db: Session = Depends(get_db)
):
    """Create a new import template."""
    # Verify session exists
    db_session = SessionDAL.get_session(db, template.session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return ImportTemplateDAL.create_template(
        db,
        session_id=template.session_id,
        name=template.name,
        description=template.description,
        is_public=template.is_public,
        column_mappings=template.column_mappings,
        default_values=template.default_values
    )


@router.get("/templates/{template_id}", response_model=ImportTemplate)
def get_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """Get an import template by ID."""
    db_template = ImportTemplateDAL.get_template(db, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return db_template


@router.get("/templates", response_model=List[ImportTemplate])
def get_templates(
    session_id: Optional[str] = Cookie(None),
    public_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all import templates for the current session."""
    if public_only:
        return ImportTemplateDAL.get_public_templates(db)
    
    if not session_id:
        raise HTTPException(status_code=404, detail="No active session")
    
    return ImportTemplateDAL.get_templates_by_session(db, session_id)


@router.put("/templates/{template_id}", response_model=ImportTemplate)
def update_template(
    template_id: int,
    template_update: ImportTemplateUpdate,
    db: Session = Depends(get_db)
):
    """Update an import template."""
    # Verify template exists
    db_template = ImportTemplateDAL.get_template(db, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return ImportTemplateDAL.update_template(
        db,
        template_id=template_id,
        name=template_update.name,
        description=template_update.description,
        is_public=template_update.is_public,
        column_mappings=template_update.column_mappings,
        default_values=template_update.default_values
    )


@router.delete("/templates/{template_id}", response_model=Dict[str, bool])
def delete_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """Delete an import template."""
    # Verify template exists
    db_template = ImportTemplateDAL.get_template(db, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    success = ImportTemplateDAL.delete_template(db, template_id)
    return {"success": success}


@router.post("/templates/{template_id}/apply", response_model=Dict[str, Any])
def apply_template(
    template_id: int,
    upload_id: int,
    db: Session = Depends(get_db)
):
    """Apply an import template to a batch upload."""
    # Verify template exists
    db_template = ImportTemplateDAL.get_template(db, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Verify upload exists
    db_upload = BatchUploadDAL.get_upload(db, upload_id)
    if not db_upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    # Get the column mappings from the template
    column_mappings = db_template.column_mappings
    default_values = db_template.default_values or {}
    
    # Return the mappings and default values
    return {
        "template_id": template_id,
        "template_name": db_template.name,
        "upload_id": upload_id,
        "column_mappings": column_mappings,
        "default_values": default_values
    }


# Detailed views with nested data
@router.get("/scenarios/{scenario_id}/detailed", response_model=BatchScenarioWithResults)
def get_scenario_with_results(
    scenario_id: int,
    db: Session = Depends(get_db)
):
    """Get a batch scenario with all calculation results."""
    db_scenario = BatchScenarioDAL.get_scenario(db, scenario_id)
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return db_scenario


@router.get("/uploads/{upload_id}/detailed", response_model=BatchUploadWithEmployees)
def get_upload_with_employees(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """Get a batch upload with all employee data."""
    db_upload = BatchUploadDAL.get_upload(db, upload_id)
    if not db_upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    return db_upload


@router.get("/calculations/{result_id}/detailed", response_model=BatchCalculationResultWithEmployees)
def get_calculation_with_employee_results(
    result_id: int,
    db: Session = Depends(get_db)
):
    """Get a batch calculation result with all employee results."""
    db_result = BatchCalculationResultDAL.get_result(db, result_id)
    if not db_result:
        raise HTTPException(status_code=404, detail="Calculation result not found")
    
    return db_result


@router.get("/sessions/current/detailed", response_model=SessionWithData)
def get_current_session_with_data(
    session_id: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """Get the current session with all related data."""
    if not session_id:
        raise HTTPException(status_code=404, detail="No active session")
    
    db_session = SessionDAL.get_session(db, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if session is expired
    if db_session.expires_at < datetime.datetime.now():
        raise HTTPException(status_code=401, detail="Session expired")
    
    return db_session
