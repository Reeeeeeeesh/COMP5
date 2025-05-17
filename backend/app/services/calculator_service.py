from typing import Dict, Any, Optional
from app.services.calculation_engine import calculate_bonus as engine_calculate_bonus, RafParameters

def calculate_bonus(
    base_salary: float,
    target_bonus_pct: float,
    investment_weight: float,
    qualitative_weight: float,
    investment_score_multiplier: float,
    qual_score_multiplier: float,
    raf: float,
    raf_params: Optional[RafParameters] = None,
    is_mrt: bool = False,
    mrt_cap_pct: float = 200
) -> Dict[str, Any]:
    """
    Calculate the bonus based on the provided inputs.
    
    Args:
        base_salary: Base salary in GBP
        target_bonus_pct: Target bonus percentage
        investment_weight: Investment performance weight (percentage)
        qualitative_weight: Qualitative performance weight (percentage)
        investment_score_multiplier: Investment performance score multiplier
        qual_score_multiplier: Qualitative performance score multiplier
        raf: Risk Adjustment Factor (RAF)
        raf_params: Optional RAF parameters (if provided, overrides the raf value)
        is_mrt: Whether the employee is a Material Risk Taker
        mrt_cap_pct: MRT cap percentage
        
    Returns:
        Dictionary containing the calculation results
    """
    # Use the enhanced calculation engine
    result = engine_calculate_bonus(
        base_salary=base_salary,
        target_bonus_pct=target_bonus_pct,
        investment_weight=investment_weight,
        qualitative_weight=qualitative_weight,
        investment_score_multiplier=investment_score_multiplier,
        qual_score_multiplier=qual_score_multiplier,
        raf=raf,
        raf_params=raf_params,
        is_mrt=is_mrt,
        mrt_cap_pct=mrt_cap_pct
    )
    
    # Return a simplified result for backward compatibility
    return {
        "investment_component": result["investment_component"],
        "qualitative_component": result["qualitative_component"],
        "weighted_performance": result["weighted_performance"],
        "final_bonus": result["final_bonus"],
        "bonus_to_salary_ratio": result["bonus_to_salary_ratio"],
        "policy_breach": result["policy_breach"],
        "applied_cap": result["applied_cap"]
    }
