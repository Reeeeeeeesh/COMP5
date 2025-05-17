from typing import Dict, Any
import math


def calculate_average_team_revenue(
    year1_revenue: float,
    year2_revenue: float,
    year3_revenue: float
) -> float:
    """
    Calculates the average team revenue over a 3-year period.
    
    Args:
        year1_revenue: Revenue for year 1
        year2_revenue: Revenue for year 2
        year3_revenue: Revenue for year 3
        
    Returns:
        Average revenue over the 3-year period
    """
    return (year1_revenue + year2_revenue + year3_revenue) / 3


def calculate_raw_raf(average_revenue: float, sensitivity_factor: float) -> float:
    """
    Calculates the raw RAF value based on average revenue and sensitivity factor.
    
    Args:
        average_revenue: Average revenue over the 3-year period
        sensitivity_factor: Sensitivity factor for RAF calculation
        
    Returns:
        Raw RAF value before applying bounds
    """
    if average_revenue <= 0:
        return 1.0  # Default to neutral RAF if no revenue data
    
    # Example formula: Higher revenue leads to higher RAF
    # This is a simplified implementation - actual formula would depend on business requirements
    # Using log10 to create a non-linear relationship between revenue and RAF
    return 1.0 + (math.log10(average_revenue) / 10) * sensitivity_factor


def apply_raf_bounds(raw_raf: float, lower_bound: float, upper_bound: float) -> float:
    """
    Applies bounds to the RAF value.
    
    Args:
        raw_raf: Raw RAF value before applying bounds
        lower_bound: Lower bound for RAF
        upper_bound: Upper bound for RAF
        
    Returns:
        RAF value after applying bounds
    """
    return max(lower_bound, min(upper_bound, raw_raf))


def calculate_raf(params: Dict[str, float]) -> float:
    """
    Calculates the Risk Adjustment Factor (RAF) based on parameters.
    
    Args:
        params: Dictionary containing RAF calculation parameters
            - team_revenue_year1: Revenue for year 1
            - team_revenue_year2: Revenue for year 2
            - team_revenue_year3: Revenue for year 3
            - sensitivity_factor: Sensitivity factor for RAF calculation
            - lower_bound: Lower bound for RAF
            - upper_bound: Upper bound for RAF
        
    Returns:
        Calculated RAF value
    """
    # Calculate average revenue
    average_revenue = calculate_average_team_revenue(
        params["team_revenue_year1"],
        params["team_revenue_year2"],
        params["team_revenue_year3"]
    )
    
    # Calculate raw RAF
    raw_raf = calculate_raw_raf(average_revenue, params["sensitivity_factor"])
    
    # Apply bounds
    return apply_raf_bounds(raw_raf, params["lower_bound"], params["upper_bound"])


def apply_raf_to_bonus(initial_bonus: float, raf: float) -> float:
    """
    Calculates the impact of RAF on the bonus amount.
    
    Args:
        initial_bonus: Initial bonus amount before applying RAF
        raf: Risk Adjustment Factor
        
    Returns:
        Bonus amount after applying RAF
    """
    return initial_bonus * raf


def determine_raf_adjustment(raf: float) -> Dict[str, Any]:
    """
    Determines the RAF adjustment direction and magnitude.
    
    Args:
        raf: Risk Adjustment Factor
        
    Returns:
        Dictionary containing the adjustment direction and percentage
    """
    if raf == 1.0:
        return {"direction": "neutral", "percentage": 0}
    elif raf > 1.0:
        return {"direction": "upward", "percentage": (raf - 1.0) * 100}
    else:
        return {"direction": "downward", "percentage": (1.0 - raf) * 100}
