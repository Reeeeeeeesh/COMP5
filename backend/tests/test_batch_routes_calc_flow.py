import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from typing import List

from app.main import app  # Assuming your FastAPI app instance is named 'app'
from app.db.crud import (
    SessionDAL,
    BatchUploadDAL,
    EmployeeDataDAL,
    BatchScenarioDAL,
    BatchCalculationResultDAL,
    EmployeeCalculationResultDAL,
)
from app.db.models import BatchUpload as BatchUploadModel
from app.db.models import EmployeeData as EmployeeDataModel
from app.db.models import BatchScenario as BatchScenarioModel
from app.db.models import BatchCalculationResult as BatchCalculationResultModel
from app.db.models import EmployeeCalculationResult as EmployeeCalculationResultModel
from app.db.schemas import BatchCalculationResultWithEmployees, EmployeeData
from app.services.calculation_engine import calculate_bonus
from app.tests.conftest import test_db_session, TestingSessionLocal  # Make sure this path is correct

client = TestClient(app)

# Helper function to create a session
def create_test_session(db: Session) -> str:
    session = SessionDAL.create_session(db, expires_in_hours=1)
    return session.id

# Helper function to create a batch upload
def create_test_batch_upload(
    db: Session, session_id: str, filename: str = "test_upload.csv", status: str = "completed"
) -> BatchUploadModel:
    upload = BatchUploadDAL.create_upload(
        db,
        session_id=session_id,
        filename=filename,
        status=status,
        source_columns_info=[{"name": "col1", "sample": ["val1"]}], # Minimal valid info
        raw_file_content=b"col1\nval1" # Minimal valid content
    )
    return upload

# Helper function to create employee data
def create_test_employee_data(
    db: Session, batch_upload_id: int, count: int = 1, **override_attrs
) -> List[EmployeeDataModel]:
    employees = []
    base_data = {
        "base_salary": 100000.0,
        "target_bonus_pct": 20.0,
        "investment_weight": 60.0,
        "qualitative_weight": 40.0,
        "investment_score_multiplier": 1.1,
        "qual_score_multiplier": 1.0,
        "raf": 0.9,
        "is_mrt": False,
        "mrt_cap_pct": 200.0,
        "employee_id": "EMP00",
        "name": "Test Employee ",
        "team": "Test Team",
    }
    for i in range(count):
        emp_data_final = base_data.copy()
        emp_data_final["employee_id"] = f"{base_data['employee_id']}{i+1}"
        emp_data_final["name"] = f"{base_data['name']}{i+1}"
        
        # Apply overrides for this specific employee if any
        for key, value in override_attrs.items():
            if isinstance(value, list) and i < len(value):
                emp_data_final[key] = value[i]
            elif not isinstance(value, list):
                 emp_data_final[key] = value


        employee = EmployeeDataDAL.create_employee(db, batch_upload_id=batch_upload_id, **emp_data_final)
        employees.append(employee)
    return employees


def test_calculate_and_retrieve_results_success(test_db_session: Session):
    db = test_db_session
    session_id = create_test_session(db)
    batch_upload = create_test_batch_upload(db, session_id, status="completed")
    
    # Create varied employee data
    emp_data_inputs = [
        {"base_salary": 100000, "target_bonus_pct": 20, "investment_score_multiplier": 1.0, "qual_score_multiplier": 1.0, "raf": 1.0, "is_mrt": False},
        {"base_salary": 120000, "target_bonus_pct": 25, "investment_score_multiplier": 1.2, "qual_score_multiplier": 0.9, "raf": 0.95, "is_mrt": True, "mrt_cap_pct": 150.0},
        {"base_salary": 80000, "target_bonus_pct": 15, "investment_score_multiplier": 0.8, "qual_score_multiplier": 1.1, "raf": 1.05, "is_mrt": False},
    ]
    created_employees = []
    for i, ed_input in enumerate(emp_data_inputs):
        emp_specific_data = {
            "employee_id": f"EMP_S_{i+1}",
            "name": f"Success Emp {i+1}",
            "team": "Alpha",
            "investment_weight": 60.0, # Assuming constant for simplicity here
            "qualitative_weight": 40.0, # Assuming constant
            **ed_input
        }
        created_employees.append(
            EmployeeDataDAL.create_employee(db, batch_upload_id=batch_upload.id, **emp_specific_data)
        )

    # Action
    response = client.post(f"/api/batch/uploads/{batch_upload.id}/calculate_and_retrieve_results")

    # Assertions
    assert response.status_code == 200
    response_data = response.json()

    # Validate schema
    assert BatchCalculationResultWithEmployees(**response_data)

    # Verify BatchScenario creation
    scenarios = BatchScenarioDAL.get_scenarios_by_session(db, session_id)
    assert len(scenarios) == 1
    created_scenario = scenarios[0]
    assert created_scenario.session_id == session_id
    assert f"Auto-calc for Upload {batch_upload.id}" in created_scenario.name
    assert created_scenario.is_saved is False

    # Verify BatchCalculationResult
    batch_calc_result = BatchCalculationResultDAL.get_result(db, response_data["id"])
    assert batch_calc_result is not None
    assert batch_calc_result.scenario_id == created_scenario.id
    assert batch_calc_result.total_employees == len(created_employees)

    expected_total_bonus_pool = 0
    expected_capped_employees = 0
    
    # Verify EmployeeCalculationResult records and their values
    assert len(response_data["employee_results"]) == len(created_employees)
    
    for i, emp_model in enumerate(created_employees):
        emp_calc_result_response = next(filter(lambda r: r["employee_data_id"] == emp_model.id, response_data["employee_results"]), None)
        assert emp_calc_result_response is not None

        # Recalculate expected bonus for this employee to verify
        expected_bonus_details = calculate_bonus(
            base_salary=emp_model.base_salary,
            target_bonus_pct=emp_model.target_bonus_pct,
            investment_weight=emp_model.investment_weight,
            qualitative_weight=emp_model.qualitative_weight,
            investment_score_multiplier=emp_model.investment_score_multiplier,
            qual_score_multiplier=emp_model.qual_score_multiplier,
            raf=emp_model.raf,
            is_mrt=emp_model.is_mrt,
            mrt_cap_pct=emp_model.mrt_cap_pct if emp_model.mrt_cap_pct is not None else 200.0
        )
        
        assert abs(emp_calc_result_response["final_bonus"] - expected_bonus_details["capped_bonus"]) < 0.01 # Using capped_bonus
        assert abs(emp_calc_result_response["pre_raf_bonus"] - expected_bonus_details["pre_raf_bonus"]) < 0.01
        assert emp_calc_result_response["policy_breach"] == expected_bonus_details["policy_breach"]
        assert emp_calc_result_response["applied_cap"] == expected_bonus_details["applied_cap"]
        
        expected_total_bonus_pool += expected_bonus_details["capped_bonus"]
        if expected_bonus_details["applied_cap"] is not None:
            expected_capped_employees +=1

    assert abs(batch_calc_result.total_bonus_pool - expected_total_bonus_pool) < 0.01
    assert batch_calc_result.capped_employees == expected_capped_employees
    if batch_calc_result.total_employees > 0:
        assert abs(batch_calc_result.average_bonus - (expected_total_bonus_pool / batch_calc_result.total_employees)) < 0.01
    else:
        assert batch_calc_result.average_bonus == 0


def test_calculate_and_retrieve_results_non_existent_upload_id(test_db_session: Session):
    non_existent_upload_id = 99999
    response = client.post(f"/api/batch/uploads/{non_existent_upload_id}/calculate_and_retrieve_results")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_calculate_and_retrieve_results_wrong_status(test_db_session: Session):
    db = test_db_session
    session_id = create_test_session(db)
    batch_upload_pending = create_test_batch_upload(db, session_id, status="awaiting_mapping") # or 'pending'
    
    response = client.post(f"/api/batch/uploads/{batch_upload_pending.id}/calculate_and_retrieve_results")
    assert response.status_code == 400 # As per backend logic improvement
    json_response = response.json()
    assert "not ready for calculation" in json_response["detail"].lower()
    assert f"current status: {batch_upload_pending.status}" in json_response["detail"].lower()

def test_calculate_and_retrieve_results_no_employee_data(test_db_session: Session):
    db = test_db_session
    session_id = create_test_session(db)
    batch_upload = create_test_batch_upload(db, session_id, status="completed")
    # No EmployeeData records are created for this batch_upload
    
    response = client.post(f"/api/batch/uploads/{batch_upload.id}/calculate_and_retrieve_results")
    assert response.status_code == 404 # As per backend logic
    assert "no employee data found" in response.json()["detail"].lower()

# More tests can be added for edge cases in calculation logic if needed,
# e.g., all employees capped, zero salary/bonus, etc.
# For now, this covers the main success and specified error paths.

# Test with a specific session_id in cookie for scenario creation
def test_calculate_and_retrieve_results_with_session_cookie(test_db_session: Session):
    db = test_db_session
    cookie_session_id = create_test_session(db) # This session should be used for the scenario
    upload_session_id = create_test_session(db) # A different session for the upload itself
    
    batch_upload = create_test_batch_upload(db, upload_session_id, status="completed")
    create_test_employee_data(db, batch_upload.id, count=1)

    # Action with cookie
    response = client.post(
        f"/api/batch/uploads/{batch_upload.id}/calculate_and_retrieve_results",
        cookies={"session_id": cookie_session_id} # Simulate session_id from cookie
    )

    assert response.status_code == 200
    response_data = response.json()

    # Verify BatchScenario creation uses the cookie_session_id
    scenarios = BatchScenarioDAL.get_scenarios_by_session(db, cookie_session_id)
    assert len(scenarios) == 1
    created_scenario = scenarios[0]
    assert created_scenario.session_id == cookie_session_id

    # Verify no scenario was created under the upload's original session
    scenarios_upload_session = BatchScenarioDAL.get_scenarios_by_session(db, upload_session_id)
    assert len(scenarios_upload_session) == 0
```
