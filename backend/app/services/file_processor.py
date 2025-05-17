"""
Service for processing uploaded files for batch data.
"""
import os
import pandas as pd
import tempfile
import io
from typing import Dict, List, Tuple, Optional, Any, Union
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.db.crud import BatchUploadDAL, EmployeeDataDAL, ImportTemplateDAL
from app.db.models import BatchUpload, EmployeeData, ImportTemplate
from ..db.models import ImportTemplate, EmployeeData, BatchUpload # Ensure BatchUpload is imported if needed for status updates
from ..db import schemas

"""
Service for processing uploaded files for batch data.
"""
import os
import pandas as pd
import tempfile
import io
from typing import Dict, List, Tuple, Optional, Any, Union
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.db.crud import BatchUploadDAL, EmployeeDataDAL, ImportTemplateDAL
from app.db.models import BatchUpload, EmployeeData, ImportTemplate
from ..db.models import ImportTemplate, EmployeeData, BatchUpload # Ensure BatchUpload is imported if needed for status updates
from ..db import schemas


# Define the required columns for the uploaded file
REQUIRED_COLUMNS = [
    'employee_id', 'name', 'team', 'base_salary', 'target_bonus_pct',
    'investment_weight', 'qualitative_weight', 'investment_score_multiplier',
    'qual_score_multiplier', 'raf'
]
    
# Define optional columns
OPTIONAL_COLUMNS = ['is_mrt', 'mrt_cap_pct']
    
# Define column types for validation
COLUMN_TYPES = {
    'employee_id': str,
    'name': str,
    'team': str,
    'base_salary': float,
    'target_bonus_pct': float,
    'investment_weight': float,
    'qualitative_weight': float,
    'investment_score_multiplier': float,
    'qual_score_multiplier': float,
    'raf': float,
    'is_mrt': bool,
    'mrt_cap_pct': float
}

# Define expected columns and their types for validation
EXPECTED_COLUMNS = {
    'employee_id': str,
    'name': str,
    'team': str,
    'base_salary': float,
    'target_bonus_pct': float,
    'investment_weight': float,
    'qualitative_weight': float,
    'investment_score_multiplier': float,
    'qual_score_multiplier': float,
    'raf': float,
    'is_mrt': bool,
    'mrt_cap_pct': float
}

class FileProcessor:
    """Service for processing uploaded files for batch data."""
    
    @staticmethod
    async def save_upload_file(upload_file: UploadFile) -> str:
        """
        Save the uploaded file to a temporary location.
        
        Args:
            upload_file: The uploaded file
            
        Returns:
            The path to the saved file
        """
        try:
            # Create a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(upload_file.filename)[1]) as temp_file:
                # Read the uploaded file content
                content = await upload_file.read()
                # Write the content to the temporary file
                temp_file.write(content)
                # Return the path to the temporary file
                return temp_file.name
        except Exception as e:
            # If an error occurs, raise an HTTP exception
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    
    @staticmethod
    def read_file(file_path: str) -> pd.DataFrame:
        """
        Read the file into a pandas DataFrame.
        
        Args:
            file_path: The path to the file
            
        Returns:
            A pandas DataFrame containing the file data
        """
        try:
            # Determine the file type based on the extension
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.csv':
                # Read CSV file
                df = pd.read_csv(file_path)
            elif file_extension in ['.xlsx', '.xls']:
                # Read Excel file
                df = pd.read_excel(file_path)
            else:
                # If the file type is not supported, raise an HTTP exception
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported file type: {file_extension}. Please upload a CSV or Excel file."
                )
            
            return df
        except Exception as e:
            # If an error occurs, raise an HTTP exception
            raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")
    
    @classmethod
    def validate_columns(cls, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """
        Validate that the DataFrame contains all required columns.
        
        Args:
            df: The pandas DataFrame to validate
            
        Returns:
            A tuple containing a boolean indicating if the validation passed and a list of missing columns
        """
        # Get the columns in the DataFrame
        df_columns = [col.lower() for col in df.columns]
        
        # Check for missing required columns
        missing_columns = [col for col in cls.REQUIRED_COLUMNS if col.lower() not in df_columns]
        
        # Return the validation result and missing columns
        return len(missing_columns) == 0, missing_columns
    
    @classmethod
    def validate_data_types(cls, df: pd.DataFrame) -> Tuple[bool, Dict[str, List[int]]]:
        """
        Validate that the data in the DataFrame has the correct types.
        
        Args:
            df: The pandas DataFrame to validate
            
        Returns:
            A tuple containing a boolean indicating if the validation passed and a dictionary of errors
        """
        errors = {}
        
        # Standardize column names to lowercase
        df.columns = [col.lower() for col in df.columns]
        
        # Check each column
        for col, dtype in cls.COLUMN_TYPES.items():
            # Skip optional columns that are not present
            if col not in df.columns and col in cls.OPTIONAL_COLUMNS:
                continue
            
            # Skip columns that are not present (should not happen after column validation)
            if col not in df.columns:
                continue
            
            # For each column, check the data type of each value
            if dtype == float:
                # For float columns, check if the values can be converted to float
                invalid_rows = []
                for i, val in enumerate(df[col]):
                    try:
                        float(val)
                    except (ValueError, TypeError):
                        invalid_rows.append(i + 2)  # +2 because row 0 is header and row indices start at 0
                
                if invalid_rows:
                    errors[col] = invalid_rows
            
            elif dtype == bool:
                # For boolean columns, check if the values are valid boolean values
                valid_values = [True, False, 'True', 'False', 'true', 'false', 'yes', 'no', 'y', 'n', 1, 0]
                invalid_rows = []
                for i, val in enumerate(df[col]):
                    if val not in valid_values and not pd.isna(val):
                        invalid_rows.append(i + 2)
                
                if invalid_rows:
                    errors[col] = invalid_rows
        
        # Return the validation result and errors
        return len(errors) == 0, errors
    
    @classmethod
    def validate_data_ranges(cls, df: pd.DataFrame) -> Tuple[bool, Dict[str, List[int]]]:
        """
        Validate that the data in the DataFrame is within valid ranges.
        
        Args:
            df: The pandas DataFrame to validate
            
        Returns:
            A tuple containing a boolean indicating if the validation passed and a dictionary of errors
        """
        errors = {}
        
        # Define range validations
        range_validations = {
            'base_salary': (0, None),  # Greater than 0, no upper limit
            'target_bonus_pct': (0, 200),  # Between 0 and 200
            'investment_weight': (0, 100),  # Between 0 and 100
            'qualitative_weight': (0, 100),  # Between 0 and 100
            'investment_score_multiplier': (0, None),  # Greater than or equal to 0, no upper limit
            'qual_score_multiplier': (0, None),  # Greater than or equal to 0, no upper limit
            'raf': (0, 2),  # Between 0 and 2
            'mrt_cap_pct': (0, None)  # Greater than or equal to 0, no upper limit
        }
        
        # Check each column
        for col, (min_val, max_val) in range_validations.items():
            # Skip columns that are not present
            if col not in df.columns:
                continue
            
            # Convert column to numeric, coercing errors to NaN
            df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # Check minimum value
            if min_val is not None:
                invalid_rows = []
                for i, val in enumerate(df[col]):
                    if not pd.isna(val) and val < min_val:
                        invalid_rows.append(i + 2)
                
                if invalid_rows:
                    errors[f"{col}_min"] = invalid_rows
            
            # Check maximum value
            if max_val is not None:
                invalid_rows = []
                for i, val in enumerate(df[col]):
                    if not pd.isna(val) and val > max_val:
                        invalid_rows.append(i + 2)
                
                if invalid_rows:
                    errors[f"{col}_max"] = invalid_rows
        
        # Check that investment_weight + qualitative_weight = 100
        if 'investment_weight' in df.columns and 'qualitative_weight' in df.columns:
            invalid_rows = []
            for i, (inv_weight, qual_weight) in enumerate(zip(df['investment_weight'], df['qualitative_weight'])):
                if not pd.isna(inv_weight) and not pd.isna(qual_weight):
                    if abs((inv_weight + qual_weight) - 100) > 0.01:  # Allow for small floating point errors
                        invalid_rows.append(i + 2)
            
            if invalid_rows:
                errors['weight_sum'] = invalid_rows
        
        # Return the validation result and errors
        return len(errors) == 0, errors
    
    @staticmethod
    def clean_data(df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean the data in the DataFrame.
        
        Args:
            df: The pandas DataFrame to clean
            
        Returns:
            The cleaned pandas DataFrame
        """
        # Standardize column names to lowercase
        df.columns = [col.lower() for col in df.columns]
        
        # Convert numeric columns to appropriate types
        numeric_columns = [
            'base_salary', 'target_bonus_pct', 'investment_weight', 'qualitative_weight',
            'investment_score_multiplier', 'qual_score_multiplier', 'raf', 'mrt_cap_pct'
        ]
        
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Convert boolean columns
        if 'is_mrt' in df.columns:
            # Map various boolean representations to True/False
            bool_map = {
                'true': True, 'false': False,
                'yes': True, 'no': False,
                'y': True, 'n': False,
                '1': True, '0': False,
                1: True, 0: False
            }
            
            df['is_mrt'] = df['is_mrt'].map(lambda x: bool_map.get(str(x).lower(), False) if not pd.isna(x) else False)
        else:
            # If is_mrt column doesn't exist, add it with default value False
            df['is_mrt'] = False
        
        # Fill NaN values in optional columns
        if 'mrt_cap_pct' not in df.columns:
            df['mrt_cap_pct'] = None
        
        return df
    
    @classmethod
    async def process_file(cls, upload_file: UploadFile, template_id: Optional[int] = None, db: Optional[Session] = None) -> Tuple[pd.DataFrame, Dict[str, Any], Optional[List[Dict[str, Any]]]]:
        """
        Process the uploaded file and return the parsed data.
        
        Args:
            upload_file: The uploaded file
            template_id: Optional ID of an import template to apply
            db: Optional database session (required if template_id is provided)
            
        Returns:
            A tuple containing the parsed DataFrame, validation results, and source column information
        """
        content = await upload_file.read()
        source_columns_info: Optional[List[Dict[str, Any]]] = None
        df: pd.DataFrame

        try:
            if upload_file.filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content))
            elif upload_file.filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(io.BytesIO(content))
            else:
                return pd.DataFrame(), {
                    'valid': False,
                    'error': 'Unsupported file format. Please upload a CSV or Excel file.'
                }, None
        except Exception as e:
             return pd.DataFrame(), {
                'valid': False,
                'error': f'Error reading file: {str(e)}'
            }, None

        if df.empty:
            return df, {
                'valid': False,
                'error': 'The uploaded file is empty or could not be parsed.'
            }, None

        # Extract source columns information
        source_columns_info = []
        for col_name in df.columns:
            # Take up to 5 unique non-null sample values, converted to string
            sample_values = df[col_name].dropna().astype(str).unique()[:5].tolist()
            source_columns_info.append({"name": str(col_name), "sample": sample_values})
        
        template_applied_info = {}
        if template_id is not None and db is not None:
            template = ImportTemplateDAL.get_template(db, template_id)
            if template:
                df, _ = cls.apply_template(df, template) # apply_template might modify df
                template_applied_info = {'template_applied': True, 'template_name': template.name}
        
        validation_results = cls.validate_dataframe(df)
        validation_results.update(template_applied_info)
        
        return df, validation_results, source_columns_info
    
    @classmethod
    def validate_dataframe(cls, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate the DataFrame.
        
        Args:
            df: The pandas DataFrame to validate
            
        Returns:
            A dictionary containing the validation results
        """
        # Validate columns
        columns_valid, missing_columns = cls.validate_columns(df)
        
        # If columns are not valid, return the validation results
        if not columns_valid:
            return {
                'valid': False,
                'error_type': 'missing_columns',
                'missing_columns': missing_columns,
                'template_applied': False
            }
        
        # Validate data types
        types_valid, type_errors = cls.validate_data_types(df)
        
        # Validate data ranges
        ranges_valid, range_errors = cls.validate_data_ranges(df)
        
        # If data is not valid, return the validation results
        if not types_valid or not ranges_valid:
            return {
                'valid': False,
                'error_type': 'invalid_data',
                'type_errors': type_errors,
                'range_errors': range_errors,
                'template_applied': False
            }
        
        # Clean the data
        df = cls.clean_data(df)
        
        # Return the parsed data and validation results
        return {
            'valid': True,
            'rows': len(df),
            'columns': list(df.columns),
            'template_applied': False
        }
    
    @classmethod
    def apply_template(cls, df: pd.DataFrame, template: ImportTemplate) -> pd.DataFrame:
        """
        Apply an import template to a DataFrame.
        
        Args:
            df: The pandas DataFrame to apply the template to
            template: The import template to apply
            
        Returns:
            The transformed pandas DataFrame
        """
        # Get the column mappings and default values from the template
        column_mappings = template.column_mappings
        default_values = template.default_values or {}
        
        # Create a new DataFrame with the required columns
        new_df = pd.DataFrame()
        
        # Map source columns to target fields
        for source_col, target_field in column_mappings.items():
            if source_col in df.columns:
                new_df[target_field] = df[source_col]
        
        # Apply default values for missing columns
        for field, value in default_values.items():
            if field not in new_df.columns:
                new_df[field] = value
        
        # Check if all required columns are present
        for col in cls.REQUIRED_COLUMNS:
            if col not in new_df.columns:
                # If a required column is missing and not in default values, add it as NaN
                new_df[col] = float('nan')
        
        return new_df
    
    @staticmethod
    def save_to_database(
        db: Session, 
        df: pd.DataFrame, 
        batch_upload: BatchUpload
    ) -> Tuple[int, List[Dict[str, Any]]]:
        """
        Save the parsed data to the database.
        
        Args:
            db: The database session
            df: The pandas DataFrame containing the parsed data
            batch_upload: The BatchUpload object
            
        Returns:
            A tuple containing the number of rows saved and a list of errors
        """
        errors = []
        saved_count = 0
        
        # For each row in the DataFrame
        for i, row in df.iterrows():
            try:
                # Create an employee data record
                employee = EmployeeDataDAL.create_employee(
                    db,
                    batch_upload_id=batch_upload.id,
                    employee_id=row.get('employee_id'),
                    name=row.get('name'),
                    team=row.get('team'),
                    base_salary=row['base_salary'],
                    target_bonus_pct=row['target_bonus_pct'],
                    investment_weight=row['investment_weight'],
                    qualitative_weight=row['qualitative_weight'],
                    investment_score_multiplier=row['investment_score_multiplier'],
                    qual_score_multiplier=row['qual_score_multiplier'],
                    raf=row['raf'],
                    is_mrt=row.get('is_mrt', False),
                    mrt_cap_pct=row.get('mrt_cap_pct'),
                    parameter_overrides={}  # Empty for now, will be updated later
                )
                
                # Increment the saved count
                saved_count += 1
            except Exception as e:
                # If an error occurs, add it to the errors list
                errors.append({
                    'row': i + 2,  # +2 because row 0 is header and row indices start at 0
                    'error': str(e)
                })
        
        # Return the saved count and errors
        return saved_count, errors
    
    @classmethod
    def generate_template(cls) -> pd.DataFrame:
        """
        Generate a template DataFrame for batch uploads.
        
        Returns:
            A pandas DataFrame containing the template
        """
        # Create a template DataFrame with all required columns
        template_data = {col: [] for col in cls.REQUIRED_COLUMNS + cls.OPTIONAL_COLUMNS}
        
        # Add example data
        example_data = {
            'employee_id': 'E001',
            'name': 'John Doe',
            'team': 'Team A',
            'base_salary': 100000,
            'target_bonus_pct': 20,
            'investment_weight': 70,
            'qualitative_weight': 30,
            'investment_score_multiplier': 1.2,
            'qual_score_multiplier': 0.8,
            'raf': 1.0,
            'is_mrt': False,
            'mrt_cap_pct': None
        }
        
        # Add the example data to the template
        for col in template_data:
            template_data[col].append(example_data.get(col, ''))
        
        # Create the DataFrame
        return pd.DataFrame(template_data)
    
    @classmethod
    def create_default_template(cls, db: Session, session_id: str) -> ImportTemplate:
        """
        Create a default import template for a session.
        
        Args:
            db: The database session
            session_id: The session ID
            
        Returns:
            The created import template
        """
        # Create a mapping from standard column names to field names
        column_mappings = {}
        for col in cls.REQUIRED_COLUMNS + cls.OPTIONAL_COLUMNS:
            # Map various common column name formats to the standard field name
            variations = [
                col,  # exact match
                col.upper(),  # uppercase
                col.lower(),  # lowercase
                col.replace('_', ' '),  # spaces instead of underscores
                col.replace('_', ' ').title(),  # Title Case with spaces
                ''.join(word.capitalize() for word in col.split('_')),  # camelCase
                col.replace('_', '')  # no separators
            ]
            
            for var in variations:
                column_mappings[var] = col
        
        # Create the template
        return ImportTemplateDAL.create_template(
            db,
            session_id=session_id,
            name="Default Template",
            description="Automatically generated template with standard column mappings",
            is_public=True,
            column_mappings=column_mappings,
            default_values={
                'is_mrt': False,
                'mrt_cap_pct': None
            }
        )
    
    @classmethod
    def save_template(cls, file_format: str = 'csv') -> str:
        """
        Save a template file for batch uploads.
        
        Args:
            file_format: The format to save the template in ('csv' or 'excel')
            
        Returns:
            The path to the saved template file
        """
        # Generate the template DataFrame
        template_df = cls.generate_template()
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_format}') as temp_file:
            # Save the DataFrame to the temporary file
            if file_format == 'csv':
                template_df.to_csv(temp_file.name, index=False)
            else:
                template_df.to_excel(temp_file.name, index=False)
            
            # Return the path to the temporary file
            return temp_file.name
    
    @staticmethod
    def get_column_info(upload_id: int, db: Session) -> Dict[str, Any]:
        """Get stored source column information for an uploaded file."""
        batch_upload = BatchUploadDAL.get_upload(db, upload_id)
        if not batch_upload:
            # Changed to raise HTTPException for consistency in API error handling
            raise HTTPException(status_code=404, detail="Upload not found")
        
        if not batch_upload.source_columns_info:
            return {
                'columns': [],
                'message': 'Source column information not found or not processed for this upload.'
            }
        
        return {
            'columns': batch_upload.source_columns_info
        }

    @staticmethod
    async def apply_mappings_and_process_raw_content(
        raw_file_content: bytes,
        original_filename: str,
        column_mappings: Dict[str, str], # Source column name -> Target system field name
        default_values: Optional[Dict[str, Any]],
        db: Session # Needed for validation against existing data or templates if applicable
    ) -> Tuple[Optional[pd.DataFrame], Dict[str, Any]]:
        """
        Processes raw file content by applying column mappings and default values,
        then validates the resulting DataFrame.
        """
        validation_results = {"valid": True, "errors": [], "warnings": [], "summary": {}}
        df = None

        try:
            file_like_object = io.BytesIO(raw_file_content)
            if original_filename.endswith('.csv'):
                df = pd.read_csv(file_like_object)
            elif original_filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file_like_object)
            else:
                validation_results['valid'] = False
                validation_results['error'] = "Unsupported file type for processing."
                return None, validation_results
            
            if df.empty:
                validation_results['valid'] = False
                validation_results['error'] = "The file is empty after attempting to read raw content."
                return None, validation_results

            # 1. Apply Column Mappings (Rename columns)
            # Only rename columns that are present in the DataFrame and in mappings
            rename_dict = {src_col: tgt_col for src_col, tgt_col in column_mappings.items() if src_col in df.columns}
            df.rename(columns=rename_dict, inplace=True)
            validation_results['summary']['columns_renamed'] = list(rename_dict.values())

            # 2. Apply Default Values
            # Ensure default values are applied for columns that might be missing after rename
            # or are defined as system fields that need defaults.
            if default_values:
                for col_name, value in default_values.items():
                    if col_name not in df.columns:
                        df[col_name] = value # Add column with default value
                    else:
                        df[col_name].fillna(value, inplace=True) # Fill NaNs if column exists
                validation_results['summary']['defaults_applied_for'] = list(default_values.keys())

            # 3. Data Validation (Leverage existing or create specific validation logic)
            # This is a simplified version. You'll want to integrate your comprehensive validation here.
            # For now, let's check for presence of all EXPECTED_COLUMNS after mapping.
            
            current_columns = set(df.columns)
            missing_expected_columns = set(EXPECTED_COLUMNS.keys()) - current_columns
            if missing_expected_columns:
                validation_results['valid'] = False
                for col in missing_expected_columns:
                    validation_results['errors'].append(f"Missing required system column after mapping: {col}")
            
            # Placeholder for more comprehensive validation (types, constraints, etc.)
            # For example, you could adapt parts of 'validate_data' or call it:
            # validated_df, type_validation_results = cls.validate_data(df.copy()) # Pass a copy
            # validation_results['errors'].extend(type_validation_results.get('errors', []))
            # validation_results['warnings'].extend(type_validation_results.get('warnings', []))
            # if not type_validation_results.get('valid', True):
            #     validation_results['valid'] = False
            # df = validated_df # Use the type-converted and validated DataFrame

            if not validation_results['valid']:
                return df, validation_results # Return partially processed df for inspection

        except Exception as e:
            logger.error(f"Error processing raw content with mappings: {e}", exc_info=True)
            validation_results['valid'] = False
            validation_results['error'] = f"An unexpected error occurred during processing: {str(e)}"
            return df, validation_results # df might be None or partially processed

        return df, validation_results

    @classmethod
    def validate_data(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Validates the DataFrame columns and data types against EXPECTED_COLUMNS."""
        # ... rest of your code remains the same ...
