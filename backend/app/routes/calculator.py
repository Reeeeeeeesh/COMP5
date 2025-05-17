from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Dict, Any
from app.services.calculator_service import calculate_bonus

router = APIRouter()

class CalculatorInput(BaseModel):
    """Input model for the bonus calculator."""
    base_salary: float = Field(..., gt=0, description="Base salary in GBP")
    target_bonus_pct: float = Field(..., gt=0, le=200, description="Target bonus percentage")
    investment_weight: float = Field(..., ge=0, le=100, description="Investment performance weight (percentage)")
    qualitative_weight: float = Field(..., ge=0, le=100, description="Qualitative performance weight (percentage)")
    investment_score_multiplier: float = Field(..., ge=0, description="Investment performance score multiplier")
    qual_score_multiplier: float = Field(..., ge=0, description="Qualitative performance score multiplier")
    raf: float = Field(..., ge=0, le=2, description="Risk Adjustment Factor (RAF)")
    
    @validator('investment_weight', 'qualitative_weight')
    def weights_must_sum_to_100(cls, v, values):
        """Validate that weights sum to 100%."""
        if 'investment_weight' in values and 'qualitative_weight' in values:
            total = values['investment_weight'] + v
            if abs(total - 100) > 0.01:  # Allow small floating point errors
                raise ValueError(f"Investment and qualitative weights must sum to 100%, got {total}%")
        return v

class CalculationResult(BaseModel):
    """Output model for the bonus calculator."""
    investment_component: float
    qualitative_component: float
    weighted_performance: float
    final_bonus: float
    bonus_to_salary_ratio: float
    policy_breach: bool
    
@router.post("/calculate", response_model=CalculationResult)
async def calculate(input_data: CalculatorInput):
    """
    Calculate the bonus based on the provided inputs.
    
    The formula used is:
    FinalBonus = BaseSalary × TargetBonusPct × (InvestmentWeight × InvestmentScoreMultiplier + QualitativeWeight × QualScoreMultiplier) × RAF
    """
    try:
        result = calculate_bonus(
            base_salary=input_data.base_salary,
            target_bonus_pct=input_data.target_bonus_pct,
            investment_weight=input_data.investment_weight,
            qualitative_weight=input_data.qualitative_weight,
            investment_score_multiplier=input_data.investment_score_multiplier,
            qual_score_multiplier=input_data.qual_score_multiplier,
            raf=input_data.raf
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
