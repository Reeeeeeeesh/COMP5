# Understanding the Formula

This guide explains the bonus calculation formula used in the Flexible Variable Compensation Calculator.

## Core Formula

The calculator uses the following formula to calculate the bonus:

```
FinalBonus = BaseSalary × TargetBonusPct × (InvestmentWeight × InvestmentScoreMultiplier + QualitativeWeight × QualScoreMultiplier) × RAF
```

## Formula Components

### Base Salary

The base salary is the fixed annual compensation in GBP.

Example: £100,000

### Target Bonus Percentage

The target bonus percentage is the percentage of the base salary that would be awarded as a bonus for on-target performance.

Example: 20% (which means £20,000 for a £100,000 base salary if all multipliers are 1.0)

### Performance Components

The formula includes two performance components:

1. **Investment Performance**: Quantitative performance based on investment returns
2. **Qualitative Performance**: Qualitative assessment of performance

Each component has two elements:

#### Component Weights

The weights determine the relative importance of each component in the bonus calculation. The weights must sum to 100%.

Examples:
- Investment Weight: 70%
- Qualitative Weight: 30%

#### Score Multipliers

The score multipliers reflect the performance in each area:
- Values equal to 1.0 indicate on-target performance
- Values above 1.0 indicate above-target performance
- Values below 1.0 indicate below-target performance

Examples:
- Investment Score Multiplier: 1.2 (above target)
- Qualitative Score Multiplier: 0.8 (below target)

### Risk Adjustment Factor (RAF)

The Risk Adjustment Factor (RAF) is a multiplier that adjusts the bonus based on risk considerations:
- Value of 1.0 indicates no risk adjustment
- Values below 1.0 indicate a downward risk adjustment
- Values above 1.0 indicate an upward risk adjustment

Example: 0.9 (10% downward adjustment due to risk factors)

## Calculation Steps

Let's break down the calculation process step by step:

### Step 1: Calculate Component Contributions

Calculate the contribution of each performance component:

```
InvestmentComponent = InvestmentWeight × InvestmentScoreMultiplier
QualitativeComponent = QualitativeWeight × QualScoreMultiplier
```

Example:
- Investment Component: 70% × 1.2 = 0.84
- Qualitative Component: 30% × 0.8 = 0.24

### Step 2: Calculate Weighted Performance

Sum the component contributions to get the weighted performance:

```
WeightedPerformance = InvestmentComponent + QualitativeComponent
```

Example:
- Weighted Performance: 0.84 + 0.24 = 1.08

### Step 3: Calculate Target Bonus Amount

Calculate the target bonus amount based on the base salary and target bonus percentage:

```
TargetBonus = BaseSalary × TargetBonusPct
```

Example:
- Target Bonus: £100,000 × 20% = £20,000

### Step 4: Apply Performance Adjustment

Adjust the target bonus based on the weighted performance:

```
PerformanceAdjustedBonus = TargetBonus × WeightedPerformance
```

Example:
- Performance Adjusted Bonus: £20,000 × 1.08 = £21,600

### Step 5: Apply Risk Adjustment

Apply the Risk Adjustment Factor to get the final bonus:

```
FinalBonus = PerformanceAdjustedBonus × RAF
```

Example:
- Final Bonus: £21,600 × 0.9 = £19,440

### Step 6: Calculate Bonus to Salary Ratio

Calculate the ratio of the final bonus to the base salary:

```
BonusToSalaryRatio = FinalBonus ÷ BaseSalary
```

Example:
- Bonus to Salary Ratio: £19,440 ÷ £100,000 = 0.1944 (19.44%)

### Step 7: Check for Policy Breach

Check if the bonus exceeds 3 times the base salary:

```
PolicyBreach = BonusToSalaryRatio > 3.0
```

Example:
- Policy Breach: 0.1944 > 3.0? No (False)

## Example Scenarios

### Scenario 1: On-Target Performance

- Base Salary: £100,000
- Target Bonus: 20%
- Investment Weight: 70%
- Qualitative Weight: 30%
- Investment Score Multiplier: 1.0
- Qualitative Score Multiplier: 1.0
- RAF: 1.0

Result:
- Final Bonus: £20,000
- Bonus to Salary Ratio: 20%
- Policy Breach: No

### Scenario 2: Above-Target Performance

- Base Salary: £100,000
- Target Bonus: 20%
- Investment Weight: 70%
- Qualitative Weight: 30%
- Investment Score Multiplier: 1.5
- Qualitative Score Multiplier: 1.3
- RAF: 1.0

Result:
- Final Bonus: £28,200
- Bonus to Salary Ratio: 28.2%
- Policy Breach: No

### Scenario 3: Policy Breach

- Base Salary: £100,000
- Target Bonus: 150%
- Investment Weight: 70%
- Qualitative Weight: 30%
- Investment Score Multiplier: 1.5
- Qualitative Score Multiplier: 1.5
- RAF: 1.5

Result:
- Final Bonus: £337,500
- Bonus to Salary Ratio: 3.375
- Policy Breach: Yes

## Normalization of Weights

The calculator automatically normalizes the weights to ensure they sum to 100%. For example, if you enter:
- Investment Weight: 80
- Qualitative Weight: 40

The calculator will normalize these to:
- Investment Weight: 66.67% (80 ÷ 120)
- Qualitative Weight: 33.33% (40 ÷ 120)

This ensures the formula works correctly even if the weights don't initially sum to 100%.
