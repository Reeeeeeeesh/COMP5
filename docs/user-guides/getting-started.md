# Getting Started

This guide will help you get started with the Flexible Variable Compensation Calculator.

## Overview

The Flexible Variable Compensation Calculator is designed to help UK fund managers calculate variable compensation (bonuses) with a high degree of flexibility. The calculator allows you to adjust various parameters and see the impact on the final bonus amount in real-time.

## Accessing the Calculator

The calculator is available as a web application. You can access it by:

1. Opening a web browser
2. Navigating to the application URL
3. For local development: http://localhost:3000

## Calculator Interface

The calculator interface is divided into two main sections:

1. **Input Parameters**: Where you enter the compensation components
2. **Calculation Results**: Where you see the calculated bonus and intermediate values

![Calculator Interface](../assets/calculator-interface.png)

## Basic Usage

### Step 1: Enter Base Salary

Enter the base salary in GBP in the "Base Salary (£)" field.

Example: £100,000

### Step 2: Set Target Bonus Percentage

Enter the target bonus percentage in the "Target Bonus (%)" field.

Example: 20%

### Step 3: Adjust Component Weights

Set the weights for the investment and qualitative components. These weights determine the relative importance of each component in the bonus calculation.

- Investment Weight (%): Example: 70%
- Qualitative Weight (%): Example: 30%

**Note**: The weights must sum to 100%.

### Step 4: Set Score Multipliers

Set the score multipliers for each component. These multipliers reflect the performance in each area.

- Investment Score Multiplier: Example: 1.0
- Qualitative Score Multiplier: Example: 1.0

Values above 1.0 indicate above-target performance, while values below 1.0 indicate below-target performance.

### Step 5: Adjust Risk Adjustment Factor (RAF)

Set the Risk Adjustment Factor (RAF) to reflect risk considerations.

Example: 1.0

Values below 1.0 indicate a downward risk adjustment, while values above 1.0 indicate an upward risk adjustment.

### Step 6: View Results

The calculator will automatically update the results as you change the inputs. The results section shows:

- Investment Component
- Qualitative Component
- Weighted Performance
- Final Bonus
- Bonus to Salary Ratio

If the bonus exceeds 3x the base salary, a policy breach alert will be displayed.

## Understanding the Formula

The calculator uses the following formula to calculate the bonus:

```
FinalBonus = BaseSalary × TargetBonusPct × (InvestmentWeight × InvestmentScoreMultiplier + QualitativeWeight × QualScoreMultiplier) × RAF
```

For a detailed explanation of the formula and its components, see [Understanding the Formula](./understanding-formula.md).

## Example Calculation

Let's walk through an example calculation:

- Base Salary: £100,000
- Target Bonus: 20%
- Investment Weight: 70%
- Qualitative Weight: 30%
- Investment Score Multiplier: 1.2 (above target)
- Qualitative Score Multiplier: 0.8 (below target)
- RAF: 1.0 (neutral)

Calculation:
1. Investment Component: 0.7 × 1.2 = 0.84
2. Qualitative Component: 0.3 × 0.8 = 0.24
3. Weighted Performance: 0.84 + 0.24 = 1.08
4. Final Bonus: £100,000 × 20% × 1.08 × 1.0 = £21,600
5. Bonus to Salary Ratio: £21,600 ÷ £100,000 = 0.216 (21.6%)

## Next Steps

Now that you understand the basics of using the calculator, you may want to explore:

- [Input Parameters](./input-parameters.md): Detailed information about each input parameter
- [Interpreting Results](./interpreting-results.md): How to interpret the calculation results
- [Policy Breach Alerts](./policy-breach-alerts.md): Understanding policy breach alerts
