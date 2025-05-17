# Calculator Interface

This guide explains the interface of the Flexible Variable Compensation Calculator and how to use its various components.

## Interface Overview

The calculator interface is divided into two main sections:

1. **Input Parameters**: Where you enter the compensation components
2. **Calculation Results**: Where you see the calculated bonus and intermediate values

![Calculator Interface](../assets/calculator-interface.png)

## Input Parameters Section

The input parameters section contains fields for entering the various components of the bonus calculation.

### Base Salary

![Base Salary Input](../assets/base-salary-input.png)

- **Field Label**: Base Salary (£)
- **Description**: The annual base salary in GBP
- **Valid Values**: Any positive number
- **Example**: 100000

### Target Bonus Percentage

![Target Bonus Input](../assets/target-bonus-input.png)

- **Field Label**: Target Bonus (%)
- **Description**: The target bonus as a percentage of base salary
- **Valid Values**: Any positive number up to 200
- **Example**: 20

### Performance Component Weights

![Weight Inputs](../assets/weight-inputs.png)

- **Field Labels**:
  - Investment Weight (%)
  - Qualitative Weight (%)
- **Description**: The relative importance of each performance component
- **Valid Values**: Any positive numbers that sum to 100
- **Examples**:
  - Investment Weight: 70
  - Qualitative Weight: 30

### Score Multipliers

![Score Multiplier Inputs](../assets/score-multiplier-inputs.png)

- **Field Labels**:
  - Investment Score Multiplier
  - Qualitative Score Multiplier
- **Description**: The performance score for each component
- **Valid Values**: Any non-negative number
- **Examples**:
  - Investment Score Multiplier: 1.2 (above target)
  - Qualitative Score Multiplier: 0.8 (below target)

### Risk Adjustment Factor

![RAF Input](../assets/raf-input.png)

- **Field Label**: Risk Adjustment Factor (RAF)
- **Description**: A multiplier that adjusts the bonus based on risk considerations
- **Valid Values**: Any number between 0 and 2
- **Example**: 1.0 (neutral)

## Calculation Results Section

The calculation results section displays the calculated bonus and intermediate values.

### Intermediate Results

![Intermediate Results](../assets/intermediate-results.png)

- **Investment Component**: The contribution of the investment performance to the bonus
- **Qualitative Component**: The contribution of the qualitative performance to the bonus
- **Weighted Performance**: The combined performance score

### Final Results

![Final Results](../assets/final-results.png)

- **Final Bonus**: The calculated bonus amount in GBP
- **Bonus to Salary Ratio**: The ratio of the bonus to the base salary
- **Policy Breach Alert**: A warning if the bonus exceeds 3x the base salary

## Interactive Features

### Real-Time Calculation

The calculator updates the results in real-time as you change the input parameters. There's no need to click a "Calculate" button.

### Input Validation

The calculator validates the input parameters and displays error messages if the values are invalid. Common validation rules include:

- All numeric fields must contain valid numbers
- Base salary must be positive
- Weights must sum to 100%
- RAF must be between 0 and 2

### Policy Breach Alert

![Policy Breach Alert](../assets/policy-breach-alert.png)

If the calculated bonus exceeds 3 times the base salary, a policy breach alert is displayed. This alert is informational and does not prevent the calculation.

## Mobile Interface

The calculator is responsive and will adapt to different screen sizes. On mobile devices, the interface is reorganized to fit the smaller screen:

- Input fields are stacked vertically
- Results are displayed below the inputs
- Font sizes are adjusted for readability

## Keyboard Navigation

You can navigate the calculator using the keyboard:

- **Tab**: Move to the next field
- **Shift+Tab**: Move to the previous field
- **Enter**: Submit the form (if applicable)
- **Arrow Keys**: Adjust numeric values in some browsers

## Accessibility Features

The calculator includes several accessibility features:

- **ARIA Labels**: All input fields have appropriate ARIA labels
- **Focus Indicators**: Visible focus indicators for keyboard navigation
- **Color Contrast**: High contrast between text and background
- **Screen Reader Support**: Compatible with screen readers

## Tips for Using the Calculator

- **Start with Defaults**: Begin with the default values and adjust as needed
- **Understand the Formula**: Familiarize yourself with the bonus formula to understand how changes to inputs affect the result
- **Check for Validation Errors**: Look for error messages if the results don't update as expected
- **Use Realistic Values**: Enter realistic values for your organization to get meaningful results
- **Experiment with Scenarios**: Try different scenarios to see how they affect the bonus
