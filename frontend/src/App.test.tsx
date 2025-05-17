import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  it('renders the calculator title', () => {
    render(<App />)
    expect(screen.getByText('Flexible Variable Compensation Calculator')).toBeInTheDocument()
  })

  it('renders the input section', () => {
    render(<App />)
    expect(screen.getByText('Input Parameters')).toBeInTheDocument()
  })

  it('renders the results section', () => {
    render(<App />)
    expect(screen.getByText('Calculation Results')).toBeInTheDocument()
  })

  it('renders the formula', () => {
    render(<App />)
    expect(screen.getByText(/FinalBonus = BaseSalary × TargetBonusPct/)).toBeInTheDocument()
  })
})
