from typing import Dict, Any, Optional, Union


def exceeds_base_salary_cap(base_salary: float, bonus: float) -> bool:
    """
    Checks if a bonus exceeds the 3x base salary cap.
    
    Args:
        base_salary: Base salary in GBP
        bonus: Bonus amount to check
        
    Returns:
        Whether the bonus exceeds the cap
    """
    cap = base_salary * 3
    return bonus > cap


def calculate_base_salary_cap(base_salary: float) -> float:
    """
    Calculates the 3x base salary cap.
    
    Args:
        base_salary: Base salary in GBP
        
    Returns:
        The 3x base salary cap amount
    """
    return base_salary * 3


def exceeds_mrt_cap(base_salary: float, bonus: float, mrt_cap_pct: float) -> bool:
    """
    Checks if a bonus exceeds the MRT cap.
    
    Args:
        base_salary: Base salary in GBP
        bonus: Bonus amount to check
        mrt_cap_pct: MRT cap percentage
        
    Returns:
        Whether the bonus exceeds the MRT cap
    """
    cap = base_salary * (mrt_cap_pct / 100)
    return bonus > cap


def calculate_mrt_cap(base_salary: float, mrt_cap_pct: float) -> float:
    """
    Calculates the MRT cap.
    
    Args:
        base_salary: Base salary in GBP
        mrt_cap_pct: MRT cap percentage
        
    Returns:
        The MRT cap amount
    """
    return base_salary * (mrt_cap_pct / 100)


def apply_cap_to_bonus(bonus: float, base_salary_cap: float, mrt_cap: Optional[float]) -> float:
    """
    Applies caps to a bonus amount.
    
    Args:
        bonus: Bonus amount to cap
        base_salary_cap: 3x base salary cap
        mrt_cap: MRT cap (if applicable)
        
    Returns:
        The capped bonus amount
    """
    capped_bonus = bonus
    
    # Apply 3x base salary cap
    if bonus > base_salary_cap:
        capped_bonus = base_salary_cap
    
    # Apply MRT cap if applicable and lower than current capped bonus
    if mrt_cap is not None and bonus > mrt_cap and mrt_cap < capped_bonus:
        capped_bonus = mrt_cap
    
    return capped_bonus


def determine_applied_cap(
    original_bonus: float, 
    capped_bonus: float, 
    base_salary_cap: float, 
    mrt_cap: Optional[float]
) -> Optional[str]:
    """
    Determines which cap was applied (if any).
    
    Args:
        original_bonus: Original bonus amount before capping
        capped_bonus: Bonus amount after capping
        base_salary_cap: 3x base salary cap
        mrt_cap: MRT cap (if applicable)
        
    Returns:
        String indicating which cap was applied, or None if no cap was applied
    """
    if original_bonus <= capped_bonus:
        return None
    
    if capped_bonus == base_salary_cap:
        return "3x Base Salary"
    
    if mrt_cap is not None and capped_bonus == mrt_cap:
        return "MRT Cap"
    
    return None


def perform_cap_and_policy_checks(
    base_salary: float, 
    bonus: float, 
    is_mrt: bool = False, 
    mrt_cap_pct: float = 200
) -> Dict[str, Any]:
    """
    Performs comprehensive cap and policy checks on a bonus amount.
    
    Args:
        base_salary: Base salary in GBP
        bonus: Bonus amount to check
        is_mrt: Whether the employee is a Material Risk Taker
        mrt_cap_pct: MRT cap percentage (if applicable)
        
    Returns:
        Results of cap and policy checks
    """
    # Calculate caps
    base_salary_cap = calculate_base_salary_cap(base_salary)
    mrt_cap = calculate_mrt_cap(base_salary, mrt_cap_pct) if is_mrt else None
    
    # Check for policy breach
    policy_breach = exceeds_base_salary_cap(base_salary, bonus)
    
    # Determine if a cap should be applied
    applied_cap = None
    
    if bonus > base_salary_cap:
        applied_cap = base_salary_cap
    
    if is_mrt and mrt_cap is not None and bonus > mrt_cap and (applied_cap is None or mrt_cap < applied_cap):
        applied_cap = mrt_cap
    
    return {
        "base_salary_cap": base_salary_cap,
        "mrt_cap": mrt_cap,
        "applied_cap": applied_cap,
        "policy_breach": policy_breach
    }
