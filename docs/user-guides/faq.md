# Frequently Asked Questions

This document addresses common questions about the Flexible Variable Compensation Calculator.

## General Questions

### What is the Flexible Variable Compensation Calculator?

The Flexible Variable Compensation Calculator (FVCC) is a tool designed to calculate variable compensation (bonuses) for UK fund managers. It provides high flexibility for adjusting input parameters and formula components to model different bonus scenarios.

### Who should use this calculator?

This calculator is primarily designed for:
- Compensation managers
- HR professionals
- Fund managers
- Finance teams
- Anyone involved in determining variable compensation for investment professionals

### Is this calculator specific to a particular industry?

While the calculator was designed with fund managers in mind, it can be adapted for use in any industry that uses a similar bonus calculation approach with weighted performance components.

## Calculation Questions

### How is the bonus calculated?

The calculator uses the following formula:
```
FinalBonus = BaseSalary × TargetBonusPct × (InvestmentWeight × InvestmentScoreMultiplier + QualitativeWeight × QualScoreMultiplier) × RAF
```

For a detailed explanation, see [Understanding the Formula](./understanding-formula.md).

### What does the Risk Adjustment Factor (RAF) represent?

The Risk Adjustment Factor (RAF) is a multiplier that adjusts the bonus based on risk considerations:
- A value of 1.0 indicates no risk adjustment
- Values below 1.0 indicate a downward risk adjustment due to risk concerns
- Values above 1.0 indicate an upward risk adjustment due to exceptional risk management

### Why do the weights need to sum to 100%?

The weights represent the relative importance of each performance component in the overall bonus calculation. They must sum to 100% to ensure the calculation is properly balanced and to maintain the integrity of the formula.

### What is a policy breach?

A policy breach occurs when the calculated bonus exceeds 3 times the base salary. This is a common policy limit in financial institutions to prevent excessive risk-taking. The calculator will display a warning when this occurs.

### Can I save my calculations for future reference?

In the current version (V1), calculations cannot be saved. This feature is planned for a future release.

## Technical Questions

### Does the calculator work offline?

Yes, once loaded, the calculator can function without an internet connection as the core calculation logic runs in your browser.

### Is my data secure?

Yes, all calculations are performed locally in your browser. In the current version (V1), no data is sent to any server or stored anywhere.

### What browsers are supported?

The calculator supports all modern browsers, including:
- Google Chrome (latest 2 versions)
- Mozilla Firefox (latest 2 versions)
- Microsoft Edge (latest 2 versions)
- Safari (latest 2 versions)

### Is there a mobile version?

The calculator is responsive and will work on mobile devices, but it's optimized for desktop use due to the complex nature of the inputs and outputs.

## Troubleshooting

### Why am I getting NaN (Not a Number) in my results?

This typically occurs when:
- You've entered non-numeric values in numeric fields
- You've left required fields empty
- You've entered negative values where only positive values are allowed

### Why aren't my changes to the inputs reflected in the results?

Ensure that:
- All required fields have valid values
- The weights sum to 100% (or close to it)
- You've pressed Tab or clicked outside the input field after making changes

### The calculator shows a policy breach warning. What should I do?

A policy breach warning is informational and indicates that the calculated bonus exceeds 3 times the base salary. You can:
- Adjust the input parameters to bring the bonus below the threshold
- Proceed with the calculation if your organization allows exceptions to the policy
- Document the exception according to your organization's procedures

## Feature Requests and Support

### How can I request a new feature?

Feature requests can be submitted through the project's GitHub repository by creating a new issue with the "enhancement" label.

### How can I report a bug?

Bugs can be reported through the project's GitHub repository by creating a new issue with the "bug" label. Please include:
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Browser and operating system information

### Is there a user community for this calculator?

Not currently, but we're considering creating a user forum in the future. For now, please use the GitHub repository for questions and feedback.
