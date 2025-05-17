import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_calculate_endpoint_valid_input():
    """Test the calculate endpoint with valid input."""
    input_data = {
        "base_salary": 100000,
        "target_bonus_pct": 20,
        "investment_weight": 70,
        "qualitative_weight": 30,
        "investment_score_multiplier": 1.0,
        "qual_score_multiplier": 1.0,
        "raf": 1.0
    }
    
    response = client.post("/api/v1/calculate", json=input_data)
    assert response.status_code == 200
    
    result = response.json()
    assert "investment_component" in result
    assert "qualitative_component" in result
    assert "weighted_performance" in result
    assert "final_bonus" in result
    assert "bonus_to_salary_ratio" in result
    assert "policy_breach" in result
    
    assert result["final_bonus"] == pytest.approx(20000)
    assert result["policy_breach"] == False

def test_calculate_endpoint_invalid_input():
    """Test the calculate endpoint with invalid input."""
    # Missing required field
    input_data = {
        "base_salary": 100000,
        "target_bonus_pct": 20,
        "investment_weight": 70,
        # Missing qualitative_weight
        "investment_score_multiplier": 1.0,
        "qual_score_multiplier": 1.0,
        "raf": 1.0
    }
    
    response = client.post("/api/v1/calculate", json=input_data)
    assert response.status_code == 422  # Validation error
    
    # Invalid value (negative base salary)
    input_data = {
        "base_salary": -100000,
        "target_bonus_pct": 20,
        "investment_weight": 70,
        "qualitative_weight": 30,
        "investment_score_multiplier": 1.0,
        "qual_score_multiplier": 1.0,
        "raf": 1.0
    }
    
    response = client.post("/api/v1/calculate", json=input_data)
    assert response.status_code == 422  # Validation error
    
    # Weights don't sum to 100%
    input_data = {
        "base_salary": 100000,
        "target_bonus_pct": 20,
        "investment_weight": 40,
        "qualitative_weight": 30,
        "investment_score_multiplier": 1.0,
        "qual_score_multiplier": 1.0,
        "raf": 1.0
    }
    
    response = client.post("/api/v1/calculate", json=input_data)
    assert response.status_code == 422  # Validation error
