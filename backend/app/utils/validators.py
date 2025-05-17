from typing import Dict, Any, Tuple, Optional

def validate_calculator_input(data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validate calculator input data.
    
    Args:
        data: Dictionary containing the input data
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    required_fields = [
        "base_salary", 
        "target_bonus_pct", 
        "investment_weight", 
        "qualitative_weight", 
        "investment_score_multiplier", 
        "qual_score_multiplier", 
        "raf"
    ]
    
    # Check for missing fields
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate field types
    for field in required_fields:
        if not isinstance(data[field], (int, float)):
            return False, f"Field {field} must be a number"
    
    # Validate field values
    if data["base_salary"] <= 0:
        return False, "Base salary must be greater than 0"
    
    if data["target_bonus_pct"] <= 0 or data["target_bonus_pct"] > 200:
        return False, "Target bonus percentage must be between 0 and 200"
    
    if data["investment_weight"] < 0 or data["investment_weight"] > 100:
        return False, "Investment weight must be between 0 and 100"
    
    if data["qualitative_weight"] < 0 or data["qualitative_weight"] > 100:
        return False, "Qualitative weight must be between 0 and 100"
    
    # Check that weights sum to approximately 100%
    total_weight = data["investment_weight"] + data["qualitative_weight"]
    if abs(total_weight - 100) > 1:  # Allow 1% tolerance
        return False, f"Investment and qualitative weights must sum to 100%, got {total_weight}%"
    
    if data["investment_score_multiplier"] < 0:
        return False, "Investment score multiplier must be non-negative"
    
    if data["qual_score_multiplier"] < 0:
        return False, "Qualitative score multiplier must be non-negative"
    
    if data["raf"] < 0 or data["raf"] > 2:
        return False, "RAF must be between 0 and 2"
    
    return True, None
