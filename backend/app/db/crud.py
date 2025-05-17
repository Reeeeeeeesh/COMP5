"""
CRUD operations for database models.
"""
import uuid
import datetime
import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from . import models, schemas
from .models import Session as SessionModel, User, BatchUpload, EmployeeData, ImportTemplate, BatchScenario 
from .schemas import (
    SessionCreate, UserCreate, BatchUploadCreate, EmployeeDataCreate, 
    ImportTemplateCreate, ImportTemplateUpdate, BatchScenarioCreate, BatchScenarioUpdate,
    ColumnInfoSchema 
)
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

class SessionDAL:
    """Data Access Layer for Session model."""
    
    @staticmethod
    def create_session(db: Session, expires_in_hours: int = 24) -> models.Session:
        """Create a new anonymous session."""
        expires_at = datetime.datetime.now() + datetime.timedelta(hours=expires_in_hours)
        session = models.Session(
            id=str(uuid.uuid4()),
            expires_at=expires_at
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    
    @staticmethod
    def get_session(db: Session, session_id: str) -> Optional[models.Session]:
        """Get a session by ID."""
        return db.query(models.Session).filter(models.Session.id == session_id).first()
    
    @staticmethod
    def extend_session(db: Session, session_id: str, hours: int = 24) -> Optional[models.Session]:
        """Extend a session's expiration time."""
        session = SessionDAL.get_session(db, session_id)
        if not session:
            return None
        
        session.expires_at = datetime.datetime.now() + datetime.timedelta(hours=hours)
        db.commit()
        db.refresh(session)
        return session
    
    @staticmethod
    def delete_expired_sessions(db: Session) -> int:
        """Delete all expired sessions."""
        now = datetime.datetime.now()
        result = db.query(models.Session).filter(models.Session.expires_at < now).delete()
        db.commit()
        return result


class BatchScenarioDAL:
    """Data Access Layer for BatchScenario model."""
    
    @staticmethod
    def create_scenario(
        db: Session, 
        session_id: str, 
        name: str, 
        description: Optional[str] = None,
        global_parameters: Dict[str, Any] = None,
        is_saved: bool = False
    ) -> models.BatchScenario:
        """Create a new batch scenario."""
        if global_parameters is None:
            global_parameters = {}
            
        scenario = models.BatchScenario(
            session_id=session_id,
            name=name,
            description=description,
            global_parameters=global_parameters,
            is_saved=is_saved
        )
        db.add(scenario)
        db.commit()
        db.refresh(scenario)
        return scenario
    
    @staticmethod
    def get_scenario(db: Session, scenario_id: int) -> Optional[models.BatchScenario]:
        """Get a scenario by ID."""
        return db.query(models.BatchScenario).filter(models.BatchScenario.id == scenario_id).first()
    
    @staticmethod
    def get_scenarios_by_session(db: Session, session_id: str) -> List[models.BatchScenario]:
        """Get all scenarios for a session."""
        return db.query(models.BatchScenario).filter(models.BatchScenario.session_id == session_id).all()
    
    @staticmethod
    def update_scenario(
        db: Session, 
        scenario_id: int, 
        name: Optional[str] = None,
        description: Optional[str] = None,
        global_parameters: Optional[Dict[str, Any]] = None,
        is_saved: Optional[bool] = None
    ) -> Optional[models.BatchScenario]:
        """Update a scenario."""
        scenario = BatchScenarioDAL.get_scenario(db, scenario_id)
        if not scenario:
            return None
        
        if name is not None:
            scenario.name = name
        if description is not None:
            scenario.description = description
        if global_parameters is not None:
            scenario.global_parameters = global_parameters
        if is_saved is not None:
            scenario.is_saved = is_saved
            
        db.commit()
        db.refresh(scenario)
        return scenario
    
    @staticmethod
    def delete_scenario(db: Session, scenario_id: int) -> bool:
        """Delete a scenario."""
        scenario = BatchScenarioDAL.get_scenario(db, scenario_id)
        if not scenario:
            return False
        
        db.delete(scenario)
        db.commit()
        return True


class BatchUploadDAL:
    """Data Access Layer for BatchUpload model."""
    
    @staticmethod
    def create_upload(
        db: Session, 
        session_id: str, 
        filename: str,
        expires_in_hours: int = 24,
        source_columns_info: Optional[List[Dict[str, Any]]] = None,
        raw_file_content: Optional[bytes] = None,
        status: str = "awaiting_mapping"
    ) -> models.BatchUpload:
        """Create a new batch upload record, storing raw file content and column info."""
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=expires_in_hours)
        db_upload = models.BatchUpload(
            session_id=session_id, 
            filename=filename, 
            expires_at=expires_at,
            uploaded_at=datetime.datetime.utcnow(),
            status=status,
            source_columns_info=json.dumps(source_columns_info) if source_columns_info else None,
            raw_file_content=raw_file_content
        )
        db.add(db_upload)
        db.commit()
        db.refresh(db_upload)
        return db_upload
    
    @staticmethod
    def get_upload(db: Session, upload_id: int) -> Optional[models.BatchUpload]:
        """Get a batch upload record by its ID."""
        upload = db.query(models.BatchUpload).filter(models.BatchUpload.id == upload_id).first()
        if upload and upload.source_columns_info and isinstance(upload.source_columns_info, str):
            try:
                upload.source_columns_info = json.loads(upload.source_columns_info)
            except json.JSONDecodeError:
                upload.source_columns_info = [] 
        return upload
    
    @staticmethod
    def get_uploads_by_session(db: Session, session_id: str) -> List[models.BatchUpload]:
        """Get all uploads for a session."""
        return db.query(models.BatchUpload).filter(models.BatchUpload.session_id == session_id).all()
    
    @staticmethod
    def delete_upload(db: Session, upload_id: int) -> bool:
        """Delete an upload."""
        upload = BatchUploadDAL.get_upload(db, upload_id)
        if not upload:
            return False
        
        db.delete(upload)
        db.commit()
        return True
    
    @staticmethod
    def delete_expired_uploads(db: Session) -> int:
        """Delete all expired uploads."""
        now = datetime.datetime.now()
        result = db.query(models.BatchUpload).filter(models.BatchUpload.expires_at < now).delete()
        db.commit()
        return result

    @staticmethod
    def update_upload_processing_status(
        db: Session, 
        upload_id: int, 
        status: str, 
        error_message: Optional[str] = None,
        processed_at: Optional[datetime.datetime] = None
    ) -> Optional[models.BatchUpload]:
        """Updates the status, error_message, and processed_at time of a batch upload."""
        upload = db.query(models.BatchUpload).filter(models.BatchUpload.id == upload_id).first()
        if upload:
            upload.status = status
            upload.error_message = error_message
            if processed_at is None and (status == "completed" or status == "failed_processing"):
                upload.processed_at = datetime.datetime.utcnow()
            elif processed_at:
                upload.processed_at = processed_at
            
            db.commit()
            db.refresh(upload)
            # Re-deserialize source_columns_info if it was serialized before update
            if upload.source_columns_info and isinstance(upload.source_columns_info, str):
                try:
                    upload.source_columns_info = json.loads(upload.source_columns_info)
                except json.JSONDecodeError:
                    upload.source_columns_info = []
            return upload
        return None


class EmployeeDataDAL:
    """Data Access Layer for EmployeeData model."""
    
    @staticmethod
    def create_employee(
        db: Session,
        batch_upload_id: int,
        base_salary: float,
        target_bonus_pct: float,
        investment_weight: float,
        qualitative_weight: float,
        investment_score_multiplier: float,
        qual_score_multiplier: float,
        raf: float,
        employee_id: Optional[str] = None,
        name: Optional[str] = None,
        team: Optional[str] = None,
        is_mrt: bool = False,
        mrt_cap_pct: Optional[float] = None,
        parameter_overrides: Optional[Dict[str, Any]] = None
    ) -> models.EmployeeData:
        """Create a new employee data record."""
        employee = models.EmployeeData(
            batch_upload_id=batch_upload_id,
            employee_id=employee_id,
            name=name,
            team=team,
            base_salary=base_salary,
            target_bonus_pct=target_bonus_pct,
            investment_weight=investment_weight,
            qualitative_weight=qualitative_weight,
            investment_score_multiplier=investment_score_multiplier,
            qual_score_multiplier=qual_score_multiplier,
            raf=raf,
            is_mrt=is_mrt,
            mrt_cap_pct=mrt_cap_pct,
            parameter_overrides=parameter_overrides
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee
    
    @staticmethod
    def get_employee(db: Session, employee_id: int) -> Optional[models.EmployeeData]:
        """Get an employee by ID."""
        return db.query(models.EmployeeData).filter(models.EmployeeData.id == employee_id).first()
    
    @staticmethod
    def get_employees_by_upload(db: Session, batch_upload_id: int) -> List[models.EmployeeData]:
        """Get all employees for a batch upload."""
        return db.query(models.EmployeeData).filter(models.EmployeeData.batch_upload_id == batch_upload_id).all()
    
    @staticmethod
    def get_employees_by_team(db: Session, batch_upload_id: int, team: str) -> List[models.EmployeeData]:
        """Get all employees for a specific team in a batch upload."""
        return db.query(models.EmployeeData).filter(
            models.EmployeeData.batch_upload_id == batch_upload_id,
            models.EmployeeData.team == team
        ).all()
    
    @staticmethod
    def update_employee(
        db: Session,
        employee_id: int,
        **kwargs
    ) -> Optional[models.EmployeeData]:
        """Update an employee data record."""
        employee = EmployeeDataDAL.get_employee(db, employee_id)
        if not employee:
            return None
        
        for key, value in kwargs.items():
            if hasattr(employee, key):
                setattr(employee, key, value)
                
        db.commit()
        db.refresh(employee)
        return employee


class BatchCalculationResultDAL:
    """Data Access Layer for BatchCalculationResult model."""
    
    @staticmethod
    def create_result(
        db: Session,
        scenario_id: int,
        total_bonus_pool: float,
        average_bonus: float,
        total_employees: int,
        capped_employees: int
    ) -> models.BatchCalculationResult:
        """Create a new batch calculation result."""
        result = models.BatchCalculationResult(
            scenario_id=scenario_id,
            total_bonus_pool=total_bonus_pool,
            average_bonus=average_bonus,
            total_employees=total_employees,
            capped_employees=capped_employees
        )
        db.add(result)
        db.commit()
        db.refresh(result)
        return result
    
    @staticmethod
    def get_result(db: Session, result_id: int) -> Optional[models.BatchCalculationResult]:
        """Get a result by ID."""
        return db.query(models.BatchCalculationResult).filter(models.BatchCalculationResult.id == result_id).first()
    
    @staticmethod
    def get_results_by_scenario(db: Session, scenario_id: int) -> List[models.BatchCalculationResult]:
        """Get all results for a scenario."""
        return db.query(models.BatchCalculationResult).filter(models.BatchCalculationResult.scenario_id == scenario_id).all()


class EmployeeCalculationResultDAL:
    """Data Access Layer for EmployeeCalculationResult model."""
    
    @staticmethod
    def create_result(
        db: Session,
        batch_result_id: int,
        employee_data_id: int,
        investment_component: float,
        qualitative_component: float,
        weighted_performance: float,
        pre_raf_bonus: float,
        final_bonus: float,
        bonus_to_salary_ratio: float,
        policy_breach: bool = False,
        applied_cap: Optional[str] = None
    ) -> models.EmployeeCalculationResult:
        """Create a new employee calculation result."""
        result = models.EmployeeCalculationResult(
            batch_result_id=batch_result_id,
            employee_data_id=employee_data_id,
            investment_component=investment_component,
            qualitative_component=qualitative_component,
            weighted_performance=weighted_performance,
            pre_raf_bonus=pre_raf_bonus,
            final_bonus=final_bonus,
            bonus_to_salary_ratio=bonus_to_salary_ratio,
            policy_breach=policy_breach,
            applied_cap=applied_cap
        )
        db.add(result)
        db.commit()
        db.refresh(result)
        return result
    
    @staticmethod
    def get_result(db: Session, result_id: int) -> Optional[models.EmployeeCalculationResult]:
        """Get an employee calculation result by ID."""
        return db.query(models.EmployeeCalculationResult).filter(models.EmployeeCalculationResult.id == result_id).first()
    
    @staticmethod
    def get_results_by_batch(db: Session, batch_result_id: int) -> List[models.EmployeeCalculationResult]:
        """Get all employee calculation results for a batch calculation."""
        return db.query(models.EmployeeCalculationResult).filter(
            models.EmployeeCalculationResult.batch_result_id == batch_result_id
        ).all()
    
    @staticmethod
    def get_result_by_employee(db: Session, batch_result_id: int, employee_id: int) -> Optional[models.EmployeeCalculationResult]:
        """Get an employee calculation result by employee ID."""
        return db.query(models.EmployeeCalculationResult).filter(
            models.EmployeeCalculationResult.batch_result_id == batch_result_id,
            models.EmployeeCalculationResult.employee_data_id == employee_id
        ).first()


class ImportTemplateDAL:
    """Data Access Layer for ImportTemplate model."""
    
    @staticmethod
    def create_template(
        db: Session,
        session_id: str,
        name: str,
        column_mappings: Dict[str, str],
        description: Optional[str] = None,
        is_public: bool = False,
        default_values: Optional[Dict[str, Any]] = None
    ) -> models.ImportTemplate:
        """Create a new import template."""
        db_template = models.ImportTemplate(
            session_id=session_id,
            name=name,
            description=description,
            is_public=is_public,
            column_mappings=column_mappings,
            default_values=default_values or {}
        )
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        return db_template
    
    @staticmethod
    def get_template(db: Session, template_id: int) -> Optional[models.ImportTemplate]:
        """Get an import template by ID."""
        return db.query(models.ImportTemplate).filter(models.ImportTemplate.id == template_id).first()
    
    @staticmethod
    def get_templates_by_session(db: Session, session_id: str) -> List[models.ImportTemplate]:
        """Get all import templates for a session, including public templates."""
        return db.query(models.ImportTemplate).filter(
            or_(
                models.ImportTemplate.session_id == session_id,
                models.ImportTemplate.is_public == True
            )
        ).all()
    
    @staticmethod
    def get_public_templates(db: Session) -> List[models.ImportTemplate]:
        """Get all public import templates."""
        return db.query(models.ImportTemplate).filter(models.ImportTemplate.is_public == True).all()
    
    @staticmethod
    def update_template(
        db: Session,
        template_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_public: Optional[bool] = None,
        column_mappings: Optional[Dict[str, str]] = None,
        default_values: Optional[Dict[str, Any]] = None
    ) -> Optional[models.ImportTemplate]:
        """Update an import template."""
        db_template = db.query(models.ImportTemplate).filter(models.ImportTemplate.id == template_id).first()
        if not db_template:
            return None
        
        if name is not None:
            db_template.name = name
        if description is not None:
            db_template.description = description
        if is_public is not None:
            db_template.is_public = is_public
        if column_mappings is not None:
            db_template.column_mappings = column_mappings
        if default_values is not None:
            db_template.default_values = default_values
        
        db.commit()
        db.refresh(db_template)
        return db_template
    
    @staticmethod
    def delete_template(db: Session, template_id: int) -> bool:
        """Delete an import template."""
        db_template = db.query(models.ImportTemplate).filter(models.ImportTemplate.id == template_id).first()
        if not db_template:
            return False
        
        db.delete(db_template)
        db.commit()
        return True
