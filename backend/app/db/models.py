"""
SQLAlchemy models for the database schema.
"""
import uuid
import datetime
from typing import List, Optional
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text, JSON, UniqueConstraint, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .config import Base


class BaseModel(Base):
    """Base model with common fields for all tables."""
    __abstract__ = True
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class Session(BaseModel):
    """Anonymous session model for tracking user sessions."""
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    expires_at = Column(DateTime, nullable=False)
    
    # Relationships
    scenarios = relationship("BatchScenario", back_populates="session", cascade="all, delete-orphan")
    batch_uploads = relationship("BatchUpload", back_populates="session", cascade="all, delete-orphan")


class BatchScenario(BaseModel):
    """Model for storing saved parameter sets for batch calculations."""
    __tablename__ = "batch_scenarios"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    is_saved = Column(Boolean, default=False, nullable=False)
    
    # Parameter sets stored as JSON
    global_parameters = Column(JSON, nullable=False)
    
    # Relationships
    session = relationship("Session", back_populates="scenarios")
    calculation_results = relationship("BatchCalculationResult", back_populates="scenario", cascade="all, delete-orphan")


class BatchUpload(BaseModel):
    """Model for storing temporary batch upload data."""
    __tablename__ = "batch_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    status = Column(String(50), default="pending_upload", nullable=False) 
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True) 
    processed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    source_columns_info = Column(Text, nullable=True)  
    raw_file_content = Column(LargeBinary, nullable=True) 
    
    # Relationships
    session = relationship("Session", back_populates="batch_uploads")
    employees = relationship("EmployeeData", back_populates="batch_upload", cascade="all, delete-orphan")


class EmployeeData(BaseModel):
    """Model for storing individual employee data from batch uploads."""
    __tablename__ = "employee_data"
    
    id = Column(Integer, primary_key=True)
    batch_upload_id = Column(Integer, ForeignKey("batch_uploads.id"), nullable=False)
    
    # Employee information
    employee_id = Column(String(50), nullable=True)
    name = Column(String(100), nullable=True)
    team = Column(String(100), nullable=True)
    
    # Base calculation parameters
    base_salary = Column(Float, nullable=False)
    target_bonus_pct = Column(Float, nullable=False)
    investment_weight = Column(Float, nullable=False)
    qualitative_weight = Column(Float, nullable=False)
    investment_score_multiplier = Column(Float, nullable=False)
    qual_score_multiplier = Column(Float, nullable=False)
    raf = Column(Float, nullable=False)
    
    # Optional parameters
    is_mrt = Column(Boolean, default=False)
    mrt_cap_pct = Column(Float, nullable=True)
    
    # Parameter overrides stored as JSON
    parameter_overrides = Column(JSON, nullable=True)
    
    # Relationships
    batch_upload = relationship("BatchUpload", back_populates="employees")
    calculation_results = relationship("EmployeeCalculationResult", back_populates="employee_data", cascade="all, delete-orphan")


class BatchCalculationResult(BaseModel):
    """Model for storing batch calculation results."""
    __tablename__ = "batch_calculation_results"
    
    id = Column(Integer, primary_key=True)
    scenario_id = Column(Integer, ForeignKey("batch_scenarios.id"), nullable=False)
    calculation_date = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Summary statistics
    total_bonus_pool = Column(Float, nullable=False)
    average_bonus = Column(Float, nullable=False)
    total_employees = Column(Integer, nullable=False)
    capped_employees = Column(Integer, nullable=False)
    
    # Relationships
    scenario = relationship("BatchScenario", back_populates="calculation_results")
    employee_results = relationship("EmployeeCalculationResult", back_populates="batch_result", cascade="all, delete-orphan")


class EmployeeCalculationResult(BaseModel):
    """Model for storing individual employee calculation results."""
    __tablename__ = "employee_calculation_results"
    
    id = Column(Integer, primary_key=True)
    batch_result_id = Column(Integer, ForeignKey("batch_calculation_results.id"), nullable=False)
    employee_data_id = Column(Integer, ForeignKey("employee_data.id"), nullable=False)
    
    # Calculation results
    investment_component = Column(Float, nullable=False)
    qualitative_component = Column(Float, nullable=False)
    weighted_performance = Column(Float, nullable=False)
    pre_raf_bonus = Column(Float, nullable=False)
    final_bonus = Column(Float, nullable=False)
    bonus_to_salary_ratio = Column(Float, nullable=False)
    policy_breach = Column(Boolean, default=False)
    applied_cap = Column(String(50), nullable=True)
    
    # Relationships
    batch_result = relationship("BatchCalculationResult", back_populates="employee_results")
    employee_data = relationship("EmployeeData", back_populates="calculation_results")


class ImportTemplate(BaseModel):
    """Model for storing import templates."""
    __tablename__ = "import_templates"
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)
    
    # Column mappings stored as JSON
    # Format: {"source_column": "target_field"}
    column_mappings = Column(JSON, nullable=False)
    
    # Default values for missing columns
    # Format: {"field_name": default_value}
    default_values = Column(JSON, nullable=True)
    
    # Relationships
    session = relationship("Session", backref="import_templates")
    
    # Ensure template names are unique per session
    __table_args__ = (UniqueConstraint('session_id', 'name', name='uix_template_session_name'),)
