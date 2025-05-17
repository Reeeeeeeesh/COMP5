import pytest
from app.services.cap_policy_logic import (
    exceeds_base_salary_cap,
    calculate_base_salary_cap,
    exceeds_mrt_cap,
    calculate_mrt_cap,
    apply_cap_to_bonus,
    determine_applied_cap,
    perform_cap_and_policy_checks
)


def test_exceeds_base_salary_cap():
    """Test that base salary cap check works correctly."""
    # Bonus exceeds cap
    assert exceeds_base_salary_cap(100000, 350000) is True
    
    # Bonus equals cap
    assert exceeds_base_salary_cap(100000, 300000) is False
    
    # Bonus below cap
    assert exceeds_base_salary_cap(100000, 250000) is False


def test_calculate_base_salary_cap():
    """Test that base salary cap calculation works correctly."""
    assert calculate_base_salary_cap(100000) == 300000
    
    # Handle zero base salary
    assert calculate_base_salary_cap(0) == 0


def test_exceeds_mrt_cap():
    """Test that MRT cap check works correctly."""
    # Bonus exceeds cap
    assert exceeds_mrt_cap(100000, 250000, 200) is True
    
    # Bonus equals cap
    assert exceeds_mrt_cap(100000, 200000, 200) is False
    
    # Bonus below cap
    assert exceeds_mrt_cap(100000, 150000, 200) is False


def test_calculate_mrt_cap():
    """Test that MRT cap calculation works correctly."""
    assert calculate_mrt_cap(100000, 200) == 200000
    
    # Handle zero base salary
    assert calculate_mrt_cap(0, 200) == 0


def test_apply_cap_to_bonus():
    """Test that cap application works correctly."""
    # No cap applied
    assert apply_cap_to_bonus(200000, 300000, None) == 200000
    assert apply_cap_to_bonus(200000, 300000, 250000) == 200000
    
    # Base salary cap applied
    assert apply_cap_to_bonus(350000, 300000, None) == 300000
    
    # MRT cap applied (lower than base salary cap)
    assert apply_cap_to_bonus(350000, 300000, 250000) == 250000
    
    # Base salary cap applied (lower than MRT cap)
    assert apply_cap_to_bonus(350000, 200000, 250000) == 200000


def test_determine_applied_cap():
    """Test that applied cap determination works correctly."""
    # No cap applied
    assert determine_applied_cap(200000, 200000, 300000, None) is None
    
    # Base salary cap applied
    assert determine_applied_cap(350000, 300000, 300000, None) == "3x Base Salary"
    
    # MRT cap applied
    assert determine_applied_cap(350000, 250000, 300000, 250000) == "MRT Cap"


def test_perform_cap_and_policy_checks():
    """Test that comprehensive cap and policy checks work correctly."""
    # No caps exceeded
    result = perform_cap_and_policy_checks(100000, 200000)
    assert result["base_salary_cap"] == 300000
    assert result["mrt_cap"] is None
    assert result["applied_cap"] is None
    assert result["policy_breach"] is False
    
    # Base salary cap exceeded
    result = perform_cap_and_policy_checks(100000, 350000)
    assert result["base_salary_cap"] == 300000
    assert result["mrt_cap"] is None
    assert result["applied_cap"] == 300000
    assert result["policy_breach"] is True
    
    # MRT cap exceeded
    result = perform_cap_and_policy_checks(100000, 250000, True, 150)
    assert result["base_salary_cap"] == 300000
    assert result["mrt_cap"] == 150000
    assert result["applied_cap"] == 150000
    assert result["policy_breach"] is False
    
    # Both caps exceeded, lower one applied
    result = perform_cap_and_policy_checks(100000, 350000, True, 250)
    assert result["base_salary_cap"] == 300000
    assert result["mrt_cap"] == 250000
    assert result["applied_cap"] == 250000
    assert result["policy_breach"] is True
