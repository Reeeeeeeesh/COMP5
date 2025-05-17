from typing import Dict, Any, Optional, Tuple, TypedDict
from app.services.cap_policy_logic import perform_cap_and_policy_checks, apply_cap_to_bonus
from app.services.raf_calculation import calculate_raf as calculate_raf_specialized, apply_raf_to_bonus


class RafParameters(TypedDict, total=False):
    """Parameters for RAF calculation."""
    team_revenue_year1: float
    team_revenue_year2: float
    team_revenue_year3: float
    sensitivity_factor: float
    lower_bound: float
    upper_bound: float


def calculate_target_bonus(base_salary: float, target_bonus_pct: float) -> float:
    """
    Calculate the target bonus amount based on base salary and target bonus percentage.
    
    Args:
        base_salary: Base salary in GBP
        target_bonus_pct: Target bonus percentage
        
    Returns:
        Target bonus amount in GBP
    """
    return base_salary * (target_bonus_pct / 100)


def normalize_weights(investment_weight: float, qualitative_weight: float) -> Dict[str, float]:
    """
    Normalize weights to ensure they sum to 100%.
    
    Args:
        investment_weight: Investment performance weight
        qualitative_weight: Qualitative performance weight
        
    Returns:
        Dictionary containing normalized weights
    """
    total_weight = investment_weight + qualitative_weight
    
    if total_weight == 0:
        return {
            "normalized_investment_weight": 0.5,
            "normalized_qualitative_weight": 0.5
        }
    
    return {
        "normalized_investment_weight": investment_weight / total_weight,
        "normalized_qualitative_weight": qualitative_weight / total_weight
    }


def calculate_investment_component(normalized_investment_weight: float, investment_score_multiplier: float) -> float:
    """
    Calculate the investment component of the bonus.
    
    Args:
        normalized_investment_weight: Normalized investment weight
        investment_score_multiplier: Investment score multiplier
        
    Returns:
        Investment component value
    """
    return normalized_investment_weight * investment_score_multiplier


def calculate_qualitative_component(normalized_qualitative_weight: float, qual_score_multiplier: float) -> float:
    """
    Calculate the qualitative component of the bonus.
    
    Args:
        normalized_qualitative_weight: Normalized qualitative weight
        qual_score_multiplier: Qualitative score multiplier
        
    Returns:
        Qualitative component value
    """
    return normalized_qualitative_weight * qual_score_multiplier


def calculate_weighted_performance(investment_component: float, qualitative_component: float) -> float:
    """
    Calculate the weighted performance score.
    
    Args:
        investment_component: Investment component value
        qualitative_component: Qualitative component value
        
    Returns:
        Weighted performance score
    """
    return investment_component + qualitative_component


def calculate_initial_bonus(target_bonus: float, weighted_performance: float) -> float:
    """
    Calculate the initial bonus amount before applying RAF and caps.
    
    Args:
        target_bonus: Target bonus amount
        weighted_performance: Weighted performance score
        
    Returns:
        Initial bonus amount
    """
    return target_bonus * weighted_performance


def calculate_raf(params: RafParameters) -> float:
    """
    Calculate the Risk Adjustment Factor (RAF) based on team revenues and parameters.
    
    Args:
        params: RAF calculation parameters
        
    Returns:
        Calculated RAF value
    """
    # Calculate 3-year rolling average team revenue
    avg_revenue = (params["team_revenue_year1"] + params["team_revenue_year2"] + params["team_revenue_year3"]) / 3
    
    # Apply sensitivity factor to get the raw RAF value
    # This is a simplified implementation - actual formula would depend on business requirements
    raw_raf = 1.0
    
    if avg_revenue > 0:
        # Example formula: Higher revenue leads to higher RAF
        # This is a placeholder - actual formula would be defined by business
        import math
        raw_raf = 1.0 + (math.log10(avg_revenue) / 10) * params["sensitivity_factor"]
    
    # Apply clamp values (lower and upper bounds)
    return max(params["lower_bound"], min(params["upper_bound"], raw_raf))


def perform_cap_checks(
    base_salary: float, 
    initial_bonus: float, 
    is_mrt: bool = False, 
    mrt_cap_pct: float = 200
) -> Dict[str, Any]:
    """
    Perform cap and policy checks on the calculated bonus.
    
    Args:
        base_salary: Base salary in GBP
        initial_bonus: Initial bonus amount before caps
        is_mrt: Whether the employee is a Material Risk Taker (MRT)
        mrt_cap_pct: MRT cap percentage (if applicable)
        
    Returns:
        Dictionary containing cap check results
    """
    # Calculate 3x base salary cap
    base_salary_cap = base_salary * 3
    
    # Calculate MRT cap if applicable
    mrt_cap = base_salary * (mrt_cap_pct / 100) if is_mrt else None
    
    # Determine the applicable cap (the lower of the two if both apply)
    applied_cap = None
    
    if initial_bonus > base_salary_cap:
        applied_cap = base_salary_cap
    
    if is_mrt and mrt_cap is not None and initial_bonus > mrt_cap and (applied_cap is None or mrt_cap < applied_cap):
        applied_cap = mrt_cap
    
    # Check for policy breach
    policy_breach = initial_bonus > base_salary_cap
    
    return {
        "base_salary_cap": base_salary_cap,
        "mrt_cap": mrt_cap,
        "applied_cap": applied_cap,
        "policy_breach": policy_breach
    }


def calculate_final_bonus(initial_bonus: float, raf: float, cap_check_results: Dict[str, Any]) -> float:
    """
    Calculate the final bonus amount after applying RAF and caps.
    
    Args:
        initial_bonus: Initial bonus amount
        raf: Risk Adjustment Factor
        cap_check_results: Results from cap checks
        
    Returns:
        Final bonus amount
    """
    # Apply RAF to the initial bonus
    final_bonus = initial_bonus * raf
    
    # Apply cap if necessary
    if cap_check_results["applied_cap"] is not None and final_bonus > cap_check_results["applied_cap"]:
        final_bonus = cap_check_results["applied_cap"]
    
    return final_bonus


def calculate_bonus_to_salary_ratio(final_bonus: float, base_salary: float) -> float:
    """
    Calculate the bonus to salary ratio.
    
    Args:
        final_bonus: Final bonus amount
        base_salary: Base salary
        
    Returns:
        Bonus to salary ratio
    """
    return final_bonus / base_salary if base_salary > 0 else 0


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
    # Calculate target bonus
    target_bonus = calculate_target_bonus(base_salary, target_bonus_pct)
    
    # Normalize weights
    normalized_weights = normalize_weights(investment_weight, qualitative_weight)
    normalized_investment_weight = normalized_weights["normalized_investment_weight"]
    normalized_qualitative_weight = normalized_weights["normalized_qualitative_weight"]
    
    # Calculate components
    investment_component = calculate_investment_component(
        normalized_investment_weight, 
        investment_score_multiplier
    )
    
    qualitative_component = calculate_qualitative_component(
        normalized_qualitative_weight, 
        qual_score_multiplier
    )
    
    weighted_performance = calculate_weighted_performance(
        investment_component, 
        qualitative_component
    )
    
    # Calculate pre-RAF bonus
    pre_raf_bonus = calculate_initial_bonus(target_bonus, weighted_performance)
    
    # Determine RAF to use (either from input or calculate from parameters)
    effective_raf = raf
    if raf_params is not None:
        # Use the specialized RAF calculation module
        effective_raf = calculate_raf_specialized(raf_params)
    
    # Apply RAF to get final bonus
    final_bonus = apply_raf_to_bonus(pre_raf_bonus, effective_raf)
    
    # Perform cap and policy checks using the specialized module
    cap_check_results = perform_cap_and_policy_checks(
        base_salary, 
        final_bonus, 
        is_mrt, 
        mrt_cap_pct
    )
    
    # Apply cap if necessary
    capped_bonus = final_bonus
    if cap_check_results["applied_cap"] is not None:
        capped_bonus = apply_cap_to_bonus(
            final_bonus,
            cap_check_results["base_salary_cap"],
            cap_check_results["mrt_cap"]
        )
    
    # Calculate bonus to salary ratio
    bonus_to_salary_ratio = calculate_bonus_to_salary_ratio(capped_bonus, base_salary)
    
    # Determine which cap was applied (if any)
    applied_cap = None
    if cap_check_results["applied_cap"] is not None:
        if cap_check_results["applied_cap"] == cap_check_results["base_salary_cap"]:
            applied_cap = "3x Base Salary"
        elif cap_check_results["applied_cap"] == cap_check_results["mrt_cap"]:
            applied_cap = "MRT Cap"
    
    return {
        "target_bonus": target_bonus,
        "normalized_weights": normalized_weights,
        "investment_component": investment_component,
        "qualitative_component": qualitative_component,
        "weighted_performance": weighted_performance,
        "pre_raf_bonus": pre_raf_bonus,
        "raf": effective_raf,
        "final_bonus": final_bonus,
        "capped_bonus": capped_bonus,
        "bonus_to_salary_ratio": bonus_to_salary_ratio,
        "base_salary_cap": cap_check_results["base_salary_cap"],
        "mrt_cap": cap_check_results["mrt_cap"],
        "applied_cap": applied_cap,
        "policy_breach": cap_check_results["policy_breach"]
    }
