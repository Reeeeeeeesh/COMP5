import pytest
from app.services.calculator_service import calculate_bonus

def test_calculate_bonus_basic():
    """Test basic bonus calculation."""
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=20,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.0,
        qual_score_multiplier=1.0,
        raf=1.0
    )
    
    # Check that all expected keys are present
    expected_keys = [
        "investment_component", 
        "qualitative_component", 
        "weighted_performance", 
        "final_bonus", 
        "bonus_to_salary_ratio", 
        "policy_breach"
    ]
    for key in expected_keys:
        assert key in result
    
    # Check calculated values
    assert result["investment_component"] == pytest.approx(0.7)
    assert result["qualitative_component"] == pytest.approx(0.3)
    assert result["weighted_performance"] == pytest.approx(1.0)
    assert result["final_bonus"] == pytest.approx(20000)
    assert result["bonus_to_salary_ratio"] == pytest.approx(0.2)
    assert result["policy_breach"] == False

def test_calculate_bonus_policy_breach():
    """Test bonus calculation with policy breach."""
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=200,
        investment_weight=70,
        qualitative_weight=30,
        investment_score_multiplier=1.5,
        qual_score_multiplier=1.5,
        raf=1.5
    )
    
    # Check calculated values
    assert result["final_bonus"] == pytest.approx(450000)
    assert result["bonus_to_salary_ratio"] == pytest.approx(4.5)
    assert result["policy_breach"] == True

def test_calculate_bonus_weight_normalization():
    """Test that weights are properly normalized."""
    result = calculate_bonus(
        base_salary=100000,
        target_bonus_pct=20,
        investment_weight=80,  # 80% of weight
        qualitative_weight=20,  # 20% of weight
        investment_score_multiplier=1.0,
        qual_score_multiplier=1.0,
        raf=1.0
    )
    
    # Check calculated values
    assert result["investment_component"] == pytest.approx(0.8)
    assert result["qualitative_component"] == pytest.approx(0.2)
    assert result["weighted_performance"] == pytest.approx(1.0)
    assert result["final_bonus"] == pytest.approx(20000)

def test_calculate_bonus_zero_weights():
    """Test handling of zero weights."""
    # Both weights zero should raise an error
    with pytest.raises(ZeroDivisionError):
        calculate_bonus(
            base_salary=100000,
            target_bonus_pct=20,
            investment_weight=0,
            qualitative_weight=0,
            investment_score_multiplier=1.0,
            qual_score_multiplier=1.0,
            raf=1.0
        )
