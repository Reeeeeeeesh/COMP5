from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional

class CalculationInput(BaseModel):
    """Input model for the bonus calculator."""
    base_salary: float = Field(..., gt=0, description="Base salary in GBP")
    target_bonus_pct: float = Field(..., gt=0, le=200, description="Target bonus percentage")
    investment_weight: float = Field(..., ge=0, le=100, description="Investment performance weight (percentage)")
    qualitative_weight: float = Field(..., ge=0, le=100, description="Qualitative performance weight (percentage)")
    investment_score_multiplier: float = Field(..., ge=0, description="Investment performance score multiplier")
    qual_score_multiplier: float = Field(..., ge=0, description="Qualitative performance score multiplier")
    raf: float = Field(..., ge=0, le=2, description="Risk Adjustment Factor (RAF)")
    
    class Config:
        schema_extra = {
            "example": {
                "base_salary": 100000,
                "target_bonus_pct": 20,
                "investment_weight": 70,
                "qualitative_weight": 30,
                "investment_score_multiplier": 1.0,
                "qual_score_multiplier": 1.0,
                "raf": 1.0
            }
        }

class CalculationResult(BaseModel):
    """Output model for the bonus calculator."""
    investment_component: float
    qualitative_component: float
    weighted_performance: float
    final_bonus: float
    bonus_to_salary_ratio: float
    policy_breach: bool
    
    class Config:
        schema_extra = {
            "example": {
                "investment_component": 0.7,
                "qualitative_component": 0.3,
                "weighted_performance": 1.0,
                "final_bonus": 20000,
                "bonus_to_salary_ratio": 0.2,
                "policy_breach": False
            }
        }
