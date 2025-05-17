import pytest
from app.services.raf_calculation import (
    calculate_average_team_revenue,
    calculate_raw_raf,
    apply_raf_bounds,
    calculate_raf,
    apply_raf_to_bonus,
    determine_raf_adjustment
)


def test_calculate_average_team_revenue():
    """Test that average revenue calculation works correctly."""
    # Standard case
    assert calculate_average_team_revenue(1000000, 1100000, 1200000) == 1100000
    
    # Zero values
    assert calculate_average_team_revenue(0, 0, 0) == 0


def test_calculate_raw_raf():
    """Test that raw RAF calculation works correctly."""
    # Positive revenue
    result = calculate_raw_raf(1000000, 1.0)
    # The exact value will depend on the implementation, but it should be a number
    assert isinstance(result, float)
    assert result > 0
    
    # Zero revenue
    assert calculate_raw_raf(0, 1.0) == 1.0
    
    # Sensitivity factor scaling
    result1 = calculate_raw_raf(1000000, 1.0)
    result2 = calculate_raw_raf(1000000, 2.0)
    # Higher sensitivity factor should result in a larger deviation from 1.0
    assert abs(result2 - 1.0) > abs(result1 - 1.0)


def test_apply_raf_bounds():
    """Test that RAF bounds are applied correctly."""
    # Within bounds
    assert apply_raf_bounds(1.2, 0.5, 1.5) == 1.2
    
    # Below lower bound
    assert apply_raf_bounds(0.3, 0.5, 1.5) == 0.5
    
    # Above upper bound
    assert apply_raf_bounds(1.7, 0.5, 1.5) == 1.5


def test_calculate_raf():
    """Test that RAF calculation works correctly."""
    params = {
        "team_revenue_year1": 1000000,
        "team_revenue_year2": 1100000,
        "team_revenue_year3": 1200000,
        "sensitivity_factor": 1.0,
        "lower_bound": 0.5,
        "upper_bound": 1.5
    }
    
    # Standard case
    result = calculate_raf(params)
    # The exact value will depend on the implementation, but it should be within bounds
    assert result >= params["lower_bound"]
    assert result <= params["upper_bound"]
    
    # Lower bound enforcement
    params["lower_bound"] = 1.0
    result = calculate_raf(params)
    assert result >= 1.0
    
    # Upper bound enforcement
    params["upper_bound"] = 1.0
    result = calculate_raf(params)
    assert result <= 1.0


def test_apply_raf_to_bonus():
    """Test that RAF is applied to bonus correctly."""
    # Standard case
    assert apply_raf_to_bonus(20000, 1.2) == 24000
    
    # Zero bonus
    assert apply_raf_to_bonus(0, 1.2) == 0
    
    # Zero RAF
    assert apply_raf_to_bonus(20000, 0) == 0


def test_determine_raf_adjustment():
    """Test that RAF adjustment direction and magnitude are determined correctly."""
    # Neutral adjustment
    result = determine_raf_adjustment(1.0)
    assert result["direction"] == "neutral"
    assert result["percentage"] == 0
    
    # Upward adjustment
    result = determine_raf_adjustment(1.2)
    assert result["direction"] == "upward"
    assert result["percentage"] == 20
    
    # Downward adjustment
    result = determine_raf_adjustment(0.8)
    assert result["direction"] == "downward"
    assert result["percentage"] == 20
