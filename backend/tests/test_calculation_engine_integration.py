import pytest
from app.services.calculation_engine import calculate_bonus


def test_calculate_bonus_standard_inputs():
    """Test that the calculation engine works correctly with standard inputs."""
    # Standard test inputs
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=50,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.2,
        qual_score_multiplier=0.8,
        raf=1.0
    )
    
    # Check that all expected properties are present
    assert "target_bonus" in result
    assert "normalized_weights" in result
    assert "investment_component" in result
    assert "qualitative_component" in result
    assert "weighted_performance" in result
    assert "pre_raf_bonus" in result
    assert "raf" in result
    assert "final_bonus" in result
    assert "capped_bonus" in result
    assert "base_salary_cap" in result
    assert "policy_breach" in result
    
    # Check specific calculations
    assert result["target_bonus"] == 50000  # 100000 * 50%
    assert result["normalized_weights"]["normalized_investment_weight"] == pytest.approx(0.7)
    assert result["normalized_weights"]["normalized_qualitative_weight"] == pytest.approx(0.3)
    assert result["investment_component"] == pytest.approx(0.84)  # 0.7 * 1.2
    assert result["qualitative_component"] == pytest.approx(0.24)  # 0.3 * 0.8
    assert result["weighted_performance"] == pytest.approx(1.08)  # 0.84 + 0.24
    assert result["pre_raf_bonus"] == pytest.approx(54000)  # 50000 * 1.08
    assert result["raf"] == 1.0
    assert result["final_bonus"] == pytest.approx(54000)  # 54000 * 1.0
    assert result["capped_bonus"] == pytest.approx(54000)  # No cap applied
    assert result["base_salary_cap"] == 300000  # 3 * 100000
    assert result["policy_breach"] is False  # 54000 < 300000


def test_calculate_bonus_with_raf_parameters():
    """Test that the calculation engine works correctly with RAF parameters."""
    # Standard test inputs with RAF parameters
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
        target_bonus_pct=50,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.2,
        qual_score_multiplier=0.8,
        raf=1.0,
        raf_params=raf_params
    )
    
    # The RAF should be calculated from the parameters
    assert result["raf"] != 1.0
    assert result["raf"] > 0
    
    # The final bonus should reflect the calculated RAF
    assert result["final_bonus"] == pytest.approx(result["pre_raf_bonus"] * result["raf"])


def test_calculate_bonus_with_base_salary_cap():
    """Test that the calculation engine applies the 3x base salary cap correctly."""
    # Inputs that would result in a bonus exceeding 3x base salary
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=200,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=2.0,
        qual_score_multiplier=2.0,
        raf=1.0
    )
    
    # The bonus should be capped at 3x base salary
    assert result["final_bonus"] > 300000  # Uncapped bonus > 300000
    assert result["capped_bonus"] == 300000  # Capped at 3x base salary
    assert result["policy_breach"] is True
    assert result["applied_cap"] == "3x Base Salary"


def test_calculate_bonus_with_mrt_cap():
    """Test that the calculation engine applies the MRT cap correctly."""
    # Inputs that would result in a bonus exceeding the MRT cap
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
    
    # The MRT cap should be 150% of base salary
    assert result["mrt_cap"] == 150000  # 100000 * 150%
    
    # The bonus should be capped at the MRT cap
    assert result["final_bonus"] > 150000  # Uncapped bonus > 150000
    assert result["capped_bonus"] == 150000  # Capped at MRT cap
    assert result["applied_cap"] == "MRT Cap"


def test_calculate_bonus_with_zero_weights():
    """Test that the calculation engine handles zero weights correctly."""
    # Inputs with zero weights
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=50,
        investment_weight=0,
        qualitative_weight=0,
        investment_score_multiplier=1.2,
        qual_score_multiplier=0.8,
        raf=1.0
    )
    
    # Weights should default to 50/50
    assert result["normalized_weights"]["normalized_investment_weight"] == 0.5
    assert result["normalized_weights"]["normalized_qualitative_weight"] == 0.5


def test_calculate_bonus_with_zero_base_salary():
    """Test that the calculation engine handles zero base salary gracefully."""
    # Inputs with zero base salary
    result = calculate_bonus(
        base_salary=0,
        target_bonus_pct=50,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.2,
        qual_score_multiplier=0.8,
        raf=1.0
    )
    
    # All bonus amounts should be zero
    assert result["target_bonus"] == 0
    assert result["pre_raf_bonus"] == 0
    assert result["final_bonus"] == 0
    assert result["capped_bonus"] == 0
    
    # Caps should be zero
    assert result["base_salary_cap"] == 0
    assert result["bonus_to_salary_ratio"] == 0
