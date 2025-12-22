import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple Settings component for testing
const SimpleSettings = () => {
  const [intervals, setIntervals] = useState({ eye: 20, stretch: 60 });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div>
      <h1>Settings</h1>
      <input 
        type="number" 
        value={intervals.eye} 
        onChange={(e) => setIntervals({...intervals, eye: +e.target.value})}
        data-testid="eye-input"
      />
      <button onClick={handleSave}>
        {isSaved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
};

describe('Simple Settings Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render settings form', () => {
    render(<SimpleSettings />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });

  it('should update input value', () => {
    render(<SimpleSettings />);
    const input = screen.getByTestId('eye-input');
    fireEvent.change(input, { target: { value: '30' } });
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  it('should show saved message', () => {
    render(<SimpleSettings />);
    fireEvent.click(screen.getByText('Save Changes'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });
});
