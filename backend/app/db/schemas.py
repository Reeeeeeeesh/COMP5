"""
Pydantic schemas for API validation.
"""
import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


# Base schemas

class ImportTemplateBase(BaseModel):
    """Base schema for import template."""
    name: str
    description: Optional[str] = None
    is_public: bool = False
    column_mappings: Dict[str, str] = Field(default_factory=dict)
    default_values: Optional[Dict[str, Any]] = None

class SessionBase(BaseModel):
    """Base schema for session."""
    id: str
    expires_at: datetime.datetime


class BatchScenarioBase(BaseModel):
    """Base schema for batch scenario."""
    name: str
    description: Optional[str] = None
    global_parameters: Dict[str, Any] = Field(default_factory=dict)
    is_saved: bool = False


class BatchUploadBase(BaseModel):
    """Base schema for batch upload."""
    filename: str
    expires_at: datetime.datetime


class EmployeeDataBase(BaseModel):
    """Base schema for employee data."""
    employee_id: Optional[str] = None
    name: Optional[str] = None
    team: Optional[str] = None
    base_salary: float = Field(..., gt=0)
    target_bonus_pct: float = Field(..., gt=0, le=200)
    investment_weight: float = Field(..., ge=0, le=100)
    qualitative_weight: float = Field(..., ge=0, le=100)
    investment_score_multiplier: float = Field(..., ge=0)
    qual_score_multiplier: float = Field(..., ge=0)
    raf: float = Field(..., ge=0, le=2)
    is_mrt: bool = False
    mrt_cap_pct: Optional[float] = None
    parameter_overrides: Optional[Dict[str, Any]] = None


class BatchCalculationResultBase(BaseModel):
    """Base schema for batch calculation result."""
    total_bonus_pool: float
    average_bonus: float
    total_employees: int
    capped_employees: int


class EmployeeCalculationResultBase(BaseModel):
    """Base schema for employee calculation result."""
    investment_component: float
    qualitative_component: float
    weighted_performance: float
    pre_raf_bonus: float
    final_bonus: float
    bonus_to_salary_ratio: float
    policy_breach: bool = False
    applied_cap: Optional[str] = None


# Create schemas

class ImportTemplateCreate(ImportTemplateBase):
    """Schema for creating an import template."""
    session_id: str

class SessionCreate(BaseModel):
    """Schema for creating a session."""
    expires_in_hours: int = 24


class BatchScenarioCreate(BatchScenarioBase):
    """Schema for creating a batch scenario."""
    session_id: str


class BatchUploadCreate(BatchUploadBase):
    """Schema for creating a batch upload."""
    session_id: str
    filename: str
    expires_in_hours: Optional[int] = 24
    source_columns_info: Optional[List[ColumnInfoSchema]] = None


class EmployeeDataCreate(EmployeeDataBase):
    """Schema for creating employee data."""
    batch_upload_id: int


class BatchCalculationResultCreate(BatchCalculationResultBase):
    """Schema for creating a batch calculation result."""
    scenario_id: int


class EmployeeCalculationResultCreate(EmployeeCalculationResultBase):
    """Schema for creating an employee calculation result."""
    batch_result_id: int
    employee_data_id: int


# Update schemas

class ImportTemplateUpdate(BaseModel):
    """Schema for updating an import template."""
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    column_mappings: Optional[Dict[str, str]] = None
    default_values: Optional[Dict[str, Any]] = None

class BatchScenarioUpdate(BaseModel):
    """Schema for updating a batch scenario."""
    name: Optional[str] = None
    description: Optional[str] = None
    global_parameters: Optional[Dict[str, Any]] = None
    is_saved: Optional[bool] = None


class EmployeeDataUpdate(BaseModel):
    """Schema for updating employee data."""
    employee_id: Optional[str] = None
    name: Optional[str] = None
    team: Optional[str] = None
    base_salary: Optional[float] = None
    target_bonus_pct: Optional[float] = None
    investment_weight: Optional[float] = None
    qualitative_weight: Optional[float] = None
    investment_score_multiplier: Optional[float] = None
    qual_score_multiplier: Optional[float] = None
    raf: Optional[float] = None
    is_mrt: Optional[bool] = None
    mrt_cap_pct: Optional[float] = None
    parameter_overrides: Optional[Dict[str, Any]] = None


# Response schemas

class ImportTemplate(ImportTemplateBase):
    """Schema for import template response."""
    id: int
    session_id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    class Config:
        orm_mode = True

class Session(SessionBase):
    """Schema for session response."""
    class Config:
        orm_mode = True


class BatchScenario(BatchScenarioBase):
    """Schema for batch scenario response."""
    id: int
    session_id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True


class BatchUpload(BatchUploadBase):
    """Schema for batch upload response."""
    id: int
    session_id: str
    filename: str
    status: Optional[str] = "pending"
    uploaded_at: datetime.datetime
    expires_at: Optional[datetime.datetime] = None
    processed_at: Optional[datetime.datetime] = None
    error_message: Optional[str] = None
    source_columns_info: Optional[List[ColumnInfoSchema]] = None

    class Config:
        orm_mode = True


class EmployeeData(EmployeeDataBase):
    """Schema for employee data response."""
    id: int
    batch_upload_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True


class BatchCalculationResult(BatchCalculationResultBase):
    """Schema for batch calculation result response."""
    id: int
    scenario_id: int
    calculation_date: datetime.datetime
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True


class EmployeeCalculationResult(EmployeeCalculationResultBase):
    """Schema for employee calculation result response."""
    id: int
    batch_result_id: int
    employee_data_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True


# Nested response schemas
class EmployeeDataWithResults(EmployeeData):
    """Schema for employee data with calculation results."""
    calculation_results: List[EmployeeCalculationResult] = []

    class Config:
        orm_mode = True


class BatchUploadWithEmployees(BatchUpload):
    """Schema for batch upload with employee data."""
    employees: List[EmployeeData] = []

    class Config:
        orm_mode = True


class BatchCalculationResultWithEmployees(BatchCalculationResult):
    """Schema for batch calculation result with employee results."""
    employee_results: List[EmployeeCalculationResult] = []

    class Config:
        orm_mode = True


class BatchScenarioWithResults(BatchScenario):
    """Schema for batch scenario with calculation results."""
    calculation_results: List[BatchCalculationResult] = []

    class Config:
        orm_mode = True


class SessionWithData(Session):
    """Schema for session with all related data."""
    scenarios: List[BatchScenario] = []
    batch_uploads: List[BatchUpload] = []

    class Config:
        orm_mode = True


# Column Info Schema for Batch Uploads
class ColumnInfoSchema(BaseModel):
    name: str
    sample: List[str]

# Payload for submitting column mappings and default values
class ColumnMappingPayload(BaseModel):
    column_mappings: Dict[str, str] # Maps source column name to target system field name
    default_values: Optional[Dict[str, Any]] = Field(default_factory=dict) # Maps target system field name to its default value

# Import Template Schemas
class ImportTemplateBase(BaseModel):
    """Base schema for import template."""
    name: str
    description: Optional[str] = None
    is_public: bool = False
    column_mappings: Dict[str, str] = Field(default_factory=dict)
    default_values: Optional[Dict[str, Any]] = None
