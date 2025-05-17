"""
Simple script to test database models.
"""
import datetime
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db.config import Base
from app.db.models import (
    Session, BatchScenario, BatchUpload, EmployeeData,
    BatchCalculationResult, EmployeeCalculationResult
)
from app.db.crud import (
    SessionDAL, BatchScenarioDAL, BatchUploadDAL, EmployeeDataDAL,
    BatchCalculationResultDAL, EmployeeCalculationResultDAL
)


def test_database_models():
    """Test the database models."""
    # Create an in-memory SQLite database for testing
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False}
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create a test session
    db = TestingSessionLocal()
    
    try:
        print("Testing database models...")
        
        # Test session creation
        print("Testing session creation...")
        session = SessionDAL.create_session(db, expires_in_hours=1)
        assert session.id is not None
        assert session.expires_at > datetime.datetime.now()
        
        retrieved_session = SessionDAL.get_session(db, session.id)
        assert retrieved_session is not None
        assert retrieved_session.id == session.id
        print("Session creation test passed!")
        
        # Test batch scenario creation
        print("Testing batch scenario creation...")
        scenario = BatchScenarioDAL.create_scenario(
            db,
            session_id=session.id,
            name="Test Scenario",
            description="A test scenario",
            global_parameters={"param1": 1, "param2": 2},
            is_saved=True
        )
        assert scenario.id is not None
        assert scenario.name == "Test Scenario"
        assert scenario.description == "A test scenario"
        assert scenario.global_parameters == {"param1": 1, "param2": 2}
        assert scenario.is_saved is True
        
        retrieved_scenario = BatchScenarioDAL.get_scenario(db, scenario.id)
        assert retrieved_scenario is not None
        assert retrieved_scenario.id == scenario.id
        assert retrieved_scenario.name == "Test Scenario"
        
        scenarios = BatchScenarioDAL.get_scenarios_by_session(db, session.id)
        assert len(scenarios) == 1
        assert scenarios[0].id == scenario.id
        print("Batch scenario creation test passed!")
        
        # Test batch upload creation
        print("Testing batch upload creation...")
        upload = BatchUploadDAL.create_upload(
            db,
            session_id=session.id,
            filename="test.csv",
            expires_in_hours=1
        )
        assert upload.id is not None
        assert upload.filename == "test.csv"
        assert upload.expires_at > datetime.datetime.now()
        
        retrieved_upload = BatchUploadDAL.get_upload(db, upload.id)
        assert retrieved_upload is not None
        assert retrieved_upload.id == upload.id
        assert retrieved_upload.filename == "test.csv"
        
        uploads = BatchUploadDAL.get_uploads_by_session(db, session.id)
        assert len(uploads) == 1
        assert uploads[0].id == upload.id
        print("Batch upload creation test passed!")
        
        # Test employee data creation
        print("Testing employee data creation...")
        employee = EmployeeDataDAL.create_employee(
            db,
            batch_upload_id=upload.id,
            employee_id="E001",
            name="John Doe",
            team="Team A",
            base_salary=100000,
            target_bonus_pct=20,
            investment_weight=70,
            qualitative_weight=30,
            investment_score_multiplier=1.2,
            qual_score_multiplier=0.8,
            raf=1.0,
            is_mrt=True,
            mrt_cap_pct=200,
            parameter_overrides={"custom_param": "value"}
        )
        assert employee.id is not None
        assert employee.employee_id == "E001"
        assert employee.name == "John Doe"
        assert employee.team == "Team A"
        assert employee.base_salary == 100000
        assert employee.target_bonus_pct == 20
        assert employee.investment_weight == 70
        assert employee.qualitative_weight == 30
        assert employee.investment_score_multiplier == 1.2
        assert employee.qual_score_multiplier == 0.8
        assert employee.raf == 1.0
        assert employee.is_mrt is True
        assert employee.mrt_cap_pct == 200
        assert employee.parameter_overrides == {"custom_param": "value"}
        
        retrieved_employee = EmployeeDataDAL.get_employee(db, employee.id)
        assert retrieved_employee is not None
        assert retrieved_employee.id == employee.id
        assert retrieved_employee.name == "John Doe"
        
        employees = EmployeeDataDAL.get_employees_by_upload(db, upload.id)
        assert len(employees) == 1
        assert employees[0].id == employee.id
        
        team_employees = EmployeeDataDAL.get_employees_by_team(db, upload.id, "Team A")
        assert len(team_employees) == 1
        assert team_employees[0].id == employee.id
        print("Employee data creation test passed!")
        
        # Test calculation results
        print("Testing calculation results...")
        batch_result = BatchCalculationResultDAL.create_result(
            db,
            scenario_id=scenario.id,
            total_bonus_pool=50000,
            average_bonus=25000,
            total_employees=2,
            capped_employees=0
        )
        assert batch_result.id is not None
        assert batch_result.scenario_id == scenario.id
        assert batch_result.total_bonus_pool == 50000
        assert batch_result.average_bonus == 25000
        assert batch_result.total_employees == 2
        assert batch_result.capped_employees == 0
        
        employee_result = EmployeeCalculationResultDAL.create_result(
            db,
            batch_result_id=batch_result.id,
            employee_data_id=employee.id,
            investment_component=0.84,  # 70% * 1.2
            qualitative_component=0.24,  # 30% * 0.8
            weighted_performance=1.08,   # 0.84 + 0.24
            pre_raf_bonus=21600,         # 100000 * 20% * 1.08
            final_bonus=21600,           # 21600 * 1.0 (RAF)
            bonus_to_salary_ratio=0.216  # 21600 / 100000
        )
        assert employee_result.id is not None
        assert employee_result.batch_result_id == batch_result.id
        assert employee_result.employee_data_id == employee.id
        assert employee_result.investment_component == 0.84
        assert employee_result.qualitative_component == 0.24
        assert employee_result.weighted_performance == 1.08
        assert employee_result.pre_raf_bonus == 21600
        assert employee_result.final_bonus == 21600
        assert employee_result.bonus_to_salary_ratio == 0.216
        assert employee_result.policy_breach is False
        assert employee_result.applied_cap is None
        
        retrieved_result = EmployeeCalculationResultDAL.get_result(db, employee_result.id)
        assert retrieved_result is not None
        assert retrieved_result.id == employee_result.id
        
        results = EmployeeCalculationResultDAL.get_results_by_batch(db, batch_result.id)
        assert len(results) == 1
        assert results[0].id == employee_result.id
        
        employee_results = EmployeeCalculationResultDAL.get_result_by_employee(
            db, batch_result.id, employee.id
        )
        assert employee_results is not None
        assert employee_results.id == employee_result.id
        print("Calculation results test passed!")
        
        print("All tests passed!")
        return True
    
    except Exception as e:
        print(f"Test failed: {e}")
        return False
    
    finally:
        db.close()


if __name__ == "__main__":
    test_database_models()
