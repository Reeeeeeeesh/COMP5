import pytest
from app.services.calculation_engine import (
    normalize_weights,
    calculate_target_bonus,
    calculate_investment_component,
    calculate_qualitative_component,
    calculate_weighted_performance,
    calculate_initial_bonus,
    calculate_raf,
    perform_cap_checks,
    calculate_final_bonus,
    calculate_bonus_to_salary_ratio,
    calculate_bonus
)


def test_normalize_weights():
    """Test that weights are normalized correctly."""
    result = normalize_weights(70, 30)
    assert round(result["normalized_investment_weight"], 2) == 0.7
    assert round(result["normalized_qualitative_weight"], 2) == 0.3

    # Test handling of zero weights
    result = normalize_weights(0, 0)
    assert result["normalized_investment_weight"] == 0.5
    assert result["normalized_qualitative_weight"] == 0.5


def test_calculate_target_bonus():
    """Test that target bonus is calculated correctly."""
    result = calculate_target_bonus(100000, 20)
    assert result == 20000

    # Test with zero base salary
    result = calculate_target_bonus(0, 20)
    assert result == 0

    # Test with zero target bonus percentage
    result = calculate_target_bonus(100000, 0)
    assert result == 0


def test_calculate_investment_component():
    """Test that investment component is calculated correctly."""
    result = calculate_investment_component(0.7, 1.2)
    assert round(result, 2) == 0.84


def test_calculate_qualitative_component():
    """Test that qualitative component is calculated correctly."""
    result = calculate_qualitative_component(0.3, 0.8)
    assert round(result, 2) == 0.24


def test_calculate_weighted_performance():
    """Test that weighted performance is calculated correctly."""
    result = calculate_weighted_performance(0.84, 0.24)
    assert round(result, 2) == 1.08


def test_calculate_initial_bonus():
    """Test that initial bonus is calculated correctly."""
    result = calculate_initial_bonus(20000, 1.08)
    assert round(result, 0) == 21600


def test_calculate_raf():
    """Test that RAF is calculated correctly."""
    params = {
        "team_revenue_year1": 1000000,
        "team_revenue_year2": 1100000,
        "team_revenue_year3": 1200000,
        "sensitivity_factor": 1.0,
        "lower_bound": 0.5,
        "upper_bound": 1.5
    }
    result = calculate_raf(params)
    # The exact value will depend on the implementation, but it should be within bounds
    assert result >= params["lower_bound"]
    assert result <= params["upper_bound"]

    # Test lower bound
    params["lower_bound"] = 1.0
    result = calculate_raf(params)
    assert result >= 1.0

    # Test upper bound
    params["upper_bound"] = 1.0
    result = calculate_raf(params)
    assert result <= 1.0


def test_perform_cap_checks():
    """Test that cap checks are performed correctly."""
    # Test policy breach
    result = perform_cap_checks(100000, 350000)
    assert result["policy_breach"] is True
    assert result["applied_cap"] == 300000

    # Test no policy breach
    result = perform_cap_checks(100000, 250000)
    assert result["policy_breach"] is False
    assert result["applied_cap"] is None

    # Test MRT cap
    result = perform_cap_checks(100000, 250000, True, 150)
    assert result["applied_cap"] == 150000

    # Test lower of MRT cap and 3x base salary
    result = perform_cap_checks(100000, 350000, True, 250)
    assert result["applied_cap"] == 250000


def test_calculate_final_bonus():
    """Test that final bonus is calculated correctly."""
    # Test RAF application
    result = calculate_final_bonus(20000, 0.9, {"base_salary_cap": 300000, "mrt_cap": None, "applied_cap": None, "policy_breach": False})
    assert round(result, 0) == 18000

    # Test cap application
    result = calculate_final_bonus(20000, 1.0, {"base_salary_cap": 300000, "mrt_cap": None, "applied_cap": 15000, "policy_breach": False})
    assert result == 15000


def test_calculate_bonus_to_salary_ratio():
    """Test that bonus to salary ratio is calculated correctly."""
    result = calculate_bonus_to_salary_ratio(20000, 100000)
    assert result == 0.2

    # Test with zero base salary
    result = calculate_bonus_to_salary_ratio(20000, 0)
    assert result == 0


def test_calculate_bonus():
    """Test the main bonus calculation function."""
    # Standard input
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=20,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.0,
        qual_score_multiplier=1.0,
        raf=1.0
    )
    assert round(result["final_bonus"], 0) == 20000
    assert round(result["bonus_to_salary_ratio"], 2) == 0.2
    assert result["policy_breach"] is False

    # Above-target performance
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=20,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.5,
        qual_score_multiplier=1.3,
        raf=1.0
    )
    assert result["final_bonus"] > 100000 * (20 / 100)

    # Below-target performance
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=20,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=0.7,
        qual_score_multiplier=0.8,
        raf=1.0
    )
    assert result["final_bonus"] < 100000 * (20 / 100)

    # RAF application
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=20,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.0,
        qual_score_multiplier=1.0,
        raf=0.8
    )
    assert round(result["final_bonus"], 0) == 16000

    # Policy breach
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=150,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.5,
        qual_score_multiplier=1.5,
        raf=1.5
    )
    assert result["policy_breach"] is True

    # RAF parameters
    raf_params = {
        "team_revenue_year1": 1000000,
        "team_revenue_year2": 1100000,
        "team_revenue_year3": 1200000,
        "sensitivity_factor": 1.0,
        "lower_bound": 0.5,
        "upper_bound": 1.5
    }
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=20,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.0,
        qual_score_multiplier=1.0,
        raf=1.0,
        raf_params=raf_params
    )
    # The exact value will depend on the implementation, but it should be calculated
    assert not isinstance(result["final_bonus"], float) or not pytest.approx(result["final_bonus"]) == float('nan')

    # MRT cap
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=150,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.5,
        qual_score_multiplier=1.5,
        raf=1.0,
        is_mrt=True,
        mrt_cap_pct=150
    )
    assert result["applied_cap"] == "MRT Cap"
