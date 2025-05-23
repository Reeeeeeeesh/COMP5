"""
CRUD operations for the Scenario Playground feature.
"""
import uuid
import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from . import models
from .models import BatchScenario, ScenarioAuditLog, EmployeeCalculationResult
from .. import models as main_models
from ..services import raf_calculation as raf_module
from collections import defaultdict

class ScenarioPlaygroundDAL:
    """Data Access Layer for the Scenario Playground feature."""
    
    @staticmethod
    def create_scenario(
        db: Session, 
        session_id: str, 
        name: str, 
        description: Optional[str] = None,
        parent_scenario_id: Optional[int] = None,
        global_parameters: Dict[str, Any] = None,
        parameters: Optional[Dict[str, Any]] = None,
        is_saved: bool = False,
        user_id: Optional[str] = None
    ) -> models.BatchScenario:
        """Create a new scenario with optional versioning."""
        if global_parameters is None:
            global_parameters = {}
            
        # Create the scenario
        scenario = models.BatchScenario(
            session_id=session_id,
            name=name,
            description=description,
            parent_scenario_id=parent_scenario_id,
            global_parameters=global_parameters,
            parameters=parameters,
            is_saved=is_saved
        )
        db.add(scenario)
        db.flush()  # Flush to get the ID without committing
        
        # Create audit log entry
        audit_log = models.ScenarioAuditLog(
            id=str(uuid.uuid4()),
            scenario_id=scenario.id,
            user_id=user_id,
            action="create",
            diff={
                "name": name,
                "description": description,
                "parent_scenario_id": parent_scenario_id,
                "global_parameters": global_parameters,
                "parameters": parameters,
                "is_saved": is_saved
            }
        )
        db.add(audit_log)
        db.commit()
        db.refresh(scenario)
        
        return scenario
    
    @staticmethod
    def get_scenario(db: Session, scenario_id: int) -> Optional[models.BatchScenario]:
        """Get a scenario by ID."""
        return db.query(models.BatchScenario).filter(models.BatchScenario.id == scenario_id).first()
    
    @staticmethod
    def get_scenarios_by_session(db: Session, session_id: str) -> List[models.BatchScenario]:
        """Get all scenarios for a session."""
        return db.query(models.BatchScenario).filter(models.BatchScenario.session_id == session_id).all()
    
    @staticmethod
    def update_scenario(
        db: Session, 
        scenario_id: int, 
        name: Optional[str] = None,
        description: Optional[str] = None,
        global_parameters: Optional[Dict[str, Any]] = None,
        parameters: Optional[Dict[str, Any]] = None,
        is_saved: Optional[bool] = None,
        user_id: Optional[str] = None
    ) -> Optional[models.BatchScenario]:
        """Update a scenario and create an audit log entry."""
        scenario = db.query(models.BatchScenario).filter(models.BatchScenario.id == scenario_id).first()
        if not scenario:
            return None
        
        # Track changes for audit log
        changes = {}
        
        if name is not None and name != scenario.name:
            changes["name"] = {"old": scenario.name, "new": name}
            scenario.name = name
            
        if description is not None and description != scenario.description:
            changes["description"] = {"old": scenario.description, "new": description}
            scenario.description = description
            
        if global_parameters is not None and global_parameters != scenario.global_parameters:
            changes["global_parameters"] = {"old": scenario.global_parameters, "new": global_parameters}
            scenario.global_parameters = global_parameters
            
        if parameters is not None and parameters != scenario.parameters:
            changes["parameters"] = {"old": scenario.parameters, "new": parameters}
            scenario.parameters = parameters
            
        if is_saved is not None and is_saved != scenario.is_saved:
            changes["is_saved"] = {"old": scenario.is_saved, "new": is_saved}
            scenario.is_saved = is_saved
        
        # Only create audit log if there are changes
        if changes:
            audit_log = models.ScenarioAuditLog(
                id=str(uuid.uuid4()),
                scenario_id=scenario.id,
                user_id=user_id,
                action="update",
                diff=changes
            )
            db.add(audit_log)
            
        db.commit()
        db.refresh(scenario)
        return scenario
    
    @staticmethod
    def delete_scenario(db: Session, scenario_id: int, user_id: Optional[str] = None) -> bool:
        """Delete a scenario and create an audit log entry."""
        scenario = db.query(models.BatchScenario).filter(models.BatchScenario.id == scenario_id).first()
        if not scenario:
            return False
        
        # Create audit log entry before deleting
        audit_log = models.ScenarioAuditLog(
            id=str(uuid.uuid4()),
            scenario_id=scenario.id,
            user_id=user_id,
            action="delete",
            diff={
                "name": scenario.name,
                "description": scenario.description,
                "parent_scenario_id": scenario.parent_scenario_id,
                "global_parameters": scenario.global_parameters,
                "parameters": scenario.parameters,
                "is_saved": scenario.is_saved
            }
        )
        db.add(audit_log)
        
        # Delete the scenario
        db.delete(scenario)
        db.commit()
        return True
    
    @staticmethod
    def fork_scenario(
        db: Session, 
        scenario_id: int, 
        name: str,
        description: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Optional[models.BatchScenario]:
        """Create a new version of an existing scenario."""
        parent_scenario = db.query(models.BatchScenario).filter(models.BatchScenario.id == scenario_id).first()
        if not parent_scenario:
            return None
        
        # Create a new scenario based on the parent
        new_scenario = models.BatchScenario(
            session_id=parent_scenario.session_id,
            name=name,
            description=description or parent_scenario.description,
            parent_scenario_id=parent_scenario.id,
            global_parameters=parent_scenario.global_parameters,
            parameters=parent_scenario.parameters,
            is_saved=False  # New versions start as unsaved
        )
        db.add(new_scenario)
        db.flush()  # Flush to get the ID without committing
        
        # Create audit log entry
        audit_log = models.ScenarioAuditLog(
            id=str(uuid.uuid4()),
            scenario_id=new_scenario.id,
            user_id=user_id,
            action="fork",
            diff={
                "parent_scenario_id": parent_scenario.id,
                "name": name,
                "description": description
            }
        )
        db.add(audit_log)
        db.commit()
        db.refresh(new_scenario)
        
        return new_scenario
    
    @staticmethod
    def get_scenario_version_history(db: Session, scenario_id: int) -> Dict[str, Any]:
        """Get the version history for a scenario."""
        scenario = db.query(models.BatchScenario).filter(models.BatchScenario.id == scenario_id).first()
        if not scenario:
            return {"scenario": None, "parent": None, "children": []}
        
        # Get parent scenario if it exists
        parent = None
        if scenario.parent_scenario_id:
            parent = db.query(models.BatchScenario).filter(models.BatchScenario.id == scenario.parent_scenario_id).first()
        
        # Get child scenarios
        children = db.query(models.BatchScenario).filter(models.BatchScenario.parent_scenario_id == scenario.id).all()
        
        return {
            "scenario": scenario,
            "parent": parent,
            "children": children
        }
    
    @staticmethod
    def get_scenario_audit_logs(db: Session, scenario_id: int) -> List[models.ScenarioAuditLog]:
        """Get all audit logs for a scenario."""
        return db.query(models.ScenarioAuditLog).filter(
            models.ScenarioAuditLog.scenario_id == scenario_id
        ).order_by(models.ScenarioAuditLog.created_at.desc()).all()
    
    @staticmethod
    def calculate_scenario(
        db: Session, 
        scenario_id: int,
        employee_data_ids: Optional[List[int]] = None
    ) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Calculate results for a scenario and generate team aggregations.
        
        Returns a tuple of (calculation_results, team_aggregations)
        """
        print(f"DEBUG: Starting calculate_scenario for scenario_id {scenario_id}")
        scenario = db.query(models.BatchScenario).filter(models.BatchScenario.id == scenario_id).first()
        if not scenario:
            print(f"ERROR: No scenario found with id {scenario_id}")
            raise ValueError(f"Scenario with id {scenario_id} not found")
            
        print(f"DEBUG: Looking for batch_upload with session_id {scenario.session_id}")
        batch_upload = (
            db.query(main_models.BatchUpload)
            .filter(main_models.BatchUpload.session_id == scenario.session_id)
            .order_by(desc(main_models.BatchUpload.uploaded_at))
            .first()
        )
        if batch_upload:
            print(f"DEBUG: Found batch_upload with id {batch_upload.id} for session_id {scenario.session_id}")
        else:
            print(f"ERROR: No batch upload found for scenario {scenario_id}")
            raise ValueError(f"No batch upload found for scenario {scenario_id}")
            
        employees_query = db.query(main_models.EmployeeData)
        if batch_upload:
            print(f"DEBUG: Filtering employees by batch_upload_id {batch_upload.id}")
            employees_query = employees_query.filter(main_models.EmployeeData.batch_upload_id == batch_upload.id)
        
        if employee_data_ids:
            employees_query = employees_query.filter(main_models.EmployeeData.id.in_(employee_data_ids))
        
        employees = employees_query.all()
        if not employees:
            print(f"ERROR: No employee data found for batch upload {batch_upload.id}")
            raise ValueError(f"No employee data found for batch upload {batch_upload.id}")

        # Actual Calculation Logic Starts Here
        global_parameters = scenario.global_parameters or {}
        override_parameters = scenario.parameters or {}

        # Helper function to get parameters with override
        def get_param(key, default_value, is_dict=False):
            value = override_parameters.get(key, global_parameters.get(key, default_value))
            if is_dict and isinstance(default_value, dict):
                # For dictionaries, merge them, overrides taking precedence
                merged_value = default_value.copy()
                if isinstance(global_parameters.get(key), dict):
                    merged_value.update(global_parameters.get(key))
                if isinstance(override_parameters.get(key), dict):
                    merged_value.update(override_parameters.get(key))
                return merged_value
            return value

        max_qual_score_default = 5.0
        max_qualitative_score = float(get_param('max_qualitative_score', max_qual_score_default))
        if max_qualitative_score == 0: max_qualitative_score = max_qual_score_default # Avoid division by zero

        default_raf_config = {
            "team_revenue_year1": 0, "team_revenue_year2": 0, "team_revenue_year3": 0,
            "sensitivity_factor": 0.1, "lower_bound": 0.8, "upper_bound": 1.2
        }
        actual_raf_params = get_param('raf_params', default_raf_config, is_dict=True)
        
        # Ensure all raf_params values are float, falling back to default_raf_config if conversion fails
        for k, v_default in default_raf_config.items():
            try: 
                actual_raf_params[k] = float(actual_raf_params.get(k, v_default))
            except (ValueError, TypeError):
                 actual_raf_params[k] = float(v_default)

        raf_value = raf_module.calculate_raf(actual_raf_params)

        # Capping parameters
        cap_percentage_default = None # Default to no cap if not specified
        cap_percentage_of_salary = get_param('cap_percentage_of_salary', cap_percentage_default)
        try:
            if cap_percentage_of_salary is not None:
                cap_percentage_of_salary = float(cap_percentage_of_salary)
        except (ValueError, TypeError):
            cap_percentage_of_salary = None # Invalid format, treat as no cap

        calculated_employee_data = []
        total_calculated_bonus_pool = 0.0
        total_capped_employees = 0

        for emp in employees:
            # Ensure numeric fields are float, with defaults for safety
            base_salary = float(emp.base_salary or 0.0)
            target_bonus_pct = float(emp.target_bonus_pct or 0.0)
            investment_weight = float(emp.investment_weight or 0.0)
            qualitative_score = float(emp.qualitative_score or 0.0)

            inv_component = base_salary * target_bonus_pct * investment_weight
            qual_component_factor = (1 - investment_weight) * (qualitative_score / max_qualitative_score)
            qual_component = base_salary * target_bonus_pct * qual_component_factor
            
            pre_raf_bonus = inv_component + qual_component
            final_bonus = raf_module.apply_raf_to_bonus(pre_raf_bonus, raf_value)
            
            is_capped_this_employee = False
            if cap_percentage_of_salary is not None and base_salary > 0: # Apply cap only if defined and salary is positive
                cap_amount = base_salary * cap_percentage_of_salary
                if final_bonus > cap_amount:
                    final_bonus = cap_amount
                    is_capped_this_employee = True
                    total_capped_employees += 1
            
            policy_breach_this_employee = False
            if final_bonus < 0:
                final_bonus = 0.0
                policy_breach_this_employee = True

            total_calculated_bonus_pool += final_bonus
            calculated_employee_data.append({
                "employee_id": emp.employee_id,
                "employee_db_id": emp.id,
                "name": emp.name,
                "team": emp.team,
                "base_salary": base_salary,
                "target_bonus_pct": target_bonus_pct,
                "investment_weight": investment_weight,
                "qualitative_score": qualitative_score,
                "inv_component": inv_component,
                "qual_component": qual_component,
                "pre_raf_bonus": pre_raf_bonus,
                "raf_applied": raf_value, # Store the scenario-wide RAF used
                "final_bonus": final_bonus,
                "is_capped": is_capped_this_employee, # Updated capping status
                "policy_breach": policy_breach_this_employee # Updated policy breach status
            })

        # Aggregate overall results
        num_employees = len(employees)
        average_bonus = (total_calculated_bonus_pool / num_employees) if num_employees > 0 else 0.0

        calculation_results = {
            "scenario_id": scenario.id,
            "total_bonus_pool": total_calculated_bonus_pool,
            "average_bonus": average_bonus,
            "total_employees": num_employees,
            "capped_employees": total_capped_employees # Updated total capped employees
        }

        # Aggregate team results
        team_summary_data = defaultdict(lambda: {
            "team": "",
            "employee_count": 0,
            "total_base_salary": 0.0,
            "total_final_bonus": 0.0,
            "capped_employee_count": 0 # Initialized per team
        })

        for emp_data in calculated_employee_data:
            team_name = emp_data["team"] or "Unassigned"
            team_summary_data[team_name]["team"] = team_name
            team_summary_data[team_name]["employee_count"] += 1
            team_summary_data[team_name]["total_base_salary"] += emp_data["base_salary"]
            team_summary_data[team_name]["total_final_bonus"] += emp_data["final_bonus"]
            if emp_data["is_capped"]:
                team_summary_data[team_name]["capped_employee_count"] += 1

        team_aggregations = []
        for team_name, data in team_summary_data.items():
            if data["employee_count"] > 0:
                data["average_bonus"] = data["total_final_bonus"] / data["employee_count"]
                data["average_bonus_to_salary_ratio"] = data["total_final_bonus"] / data["total_base_salary"]
            else:
                data["average_bonus"] = 0
                data["average_bonus_to_salary_ratio"] = 0
                
            team_aggregations.append(data)
            
        return calculation_results, team_aggregations
    
    @staticmethod
    def link_employee_results_to_scenario(
        db: Session,
        scenario_id: int,
        employee_result_ids: List[int]
    ) -> int:
        """Link employee calculation results directly to a scenario."""
        count = 0
        for result_id in employee_result_ids:
            result = db.query(models.EmployeeCalculationResult).filter(
                models.EmployeeCalculationResult.id == result_id
            ).first()
            
            if result:
                result.scenario_id = scenario_id
                count += 1
        
        db.commit()
        return count
    
    @staticmethod
    def get_employee_results_by_scenario(
        db: Session,
        scenario_id: int
    ) -> List[models.EmployeeCalculationResult]:
        """Get all employee calculation results directly linked to a scenario."""
        return db.query(models.EmployeeCalculationResult).filter(
            models.EmployeeCalculationResult.scenario_id == scenario_id
        ).all()
    
    @staticmethod
    def get_team_aggregations(
        db: Session,
        scenario_id: int
    ) -> List[Dict[str, Any]]:
        """
        Calculate team aggregations for a scenario based on employee results.
        
        This uses SQL aggregation functions to efficiently calculate team-level metrics.
        """
        # Get employee results for this scenario
        results = db.query(models.EmployeeCalculationResult).filter(
            models.EmployeeCalculationResult.scenario_id == scenario_id
        ).all()
        
        if not results:
            return []
        
        # Get employee data for these results
        employee_data_ids = [r.employee_data_id for r in results]
        employees = db.query(main_models.EmployeeData).filter(
            main_models.EmployeeData.id.in_(employee_data_ids)
        ).all()
        
        # Create a mapping of employee_data_id to employee data
        employee_map = {e.id: e for e in employees}
        
        # Group by team
        team_data = {}
        for result in results:
            employee = employee_map.get(result.employee_data_id)
            if not employee or not employee.team:
                continue
                
            team = employee.team
            if team not in team_data:
                team_data[team] = {
                    "team": team,
                    "employee_count": 0,
                    "total_base_salary": 0.0,
                    "total_bonus": 0.0,
                    "capped_employee_count": 0
                }
                
            team_data[team]["employee_count"] += 1
            team_data[team]["total_base_salary"] += employee.base_salary
            team_data[team]["total_bonus"] += result.final_bonus
            if result.policy_breach:
                team_data[team]["capped_employee_count"] += 1
        
        # Calculate averages
        aggregations = []
        for team, data in team_data.items():
            if data["employee_count"] > 0:
                data["average_bonus"] = data["total_bonus"] / data["employee_count"]
                data["average_bonus_to_salary_ratio"] = data["total_bonus"] / data["total_base_salary"]
            else:
                data["average_bonus"] = 0
                data["average_bonus_to_salary_ratio"] = 0
                
            aggregations.append(data)
            
        return aggregations
