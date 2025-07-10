import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NavigationItem from './NavigationItem'
import { Dashboard as DashboardIcon } from '@mui/icons-material'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const MockedNavigationItem = (props) => (
  <BrowserRouter>
    <NavigationItem {...props} />
  </BrowserRouter>
)

describe('NavigationItem', () => {
  const defaultProps = {
    item: {
      id: 'test-item',
      title: 'Test Item',
      path: '/test',
      icon: DashboardIcon,
    },
    selected: false,
    collapsed: false,
    onItemClick: jest.fn(),
    level: 0,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<MockedNavigationItem {...defaultProps} />)
    expect(screen.getByText('Test Item')).toBeInTheDocument()
  })

  it('navigates when clicked', () => {
    render(<MockedNavigationItem {...defaultProps} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockNavigate).toHaveBeenCalledWith('/test')
    expect(defaultProps.onItemClick).toHaveBeenCalledWith(defaultProps.item)
  })

  it('shows selected state correctly', () => {
    render(<MockedNavigationItem {...defaultProps} selected={true} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('Mui-selected')
  })

  it('handles collapsed state', () => {
    render(<MockedNavigationItem {...defaultProps} collapsed={true} />)
    
    expect(screen.queryByText('Test Item')).not.toBeInTheDocument()
  })

  it('shows tooltip when collapsed', () => {
    render(<MockedNavigationItem {...defaultProps} collapsed={true} />)
    
    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)
    
    expect(screen.getByRole('tooltip')).toHaveTextContent('Test Item')
  })
})