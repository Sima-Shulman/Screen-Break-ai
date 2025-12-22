import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExerciseModal from '../../popup/src/components/ExerciseModal';

// Mock the lucide-react dependency
jest.mock('lucide-react');

describe('ExerciseModal', () => {
  const mockExercise = {
    name: 'Eye Focus',
    icon: '👁️',
    duration: 10,
    steps: ['Look far away', 'Look at your nose'],
    description: 'A simple eye exercise.'
  };

  const onCloseMock = jest.fn();
  const onCompleteMock = jest.fn();

  beforeEach(() => {
    // Use fake timers to control setInterval
    jest.useFakeTimers();
    onCloseMock.mockClear();
    onCompleteMock.mockClear();
  });

  afterEach(() => {
    // Restore real timers
    jest.useRealTimers();
  });

  it('should not render if exercise prop is null', () => {
    const { container } = render(<ExerciseModal exercise={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the modal with initial exercise data', () => {
    render(<ExerciseModal exercise={mockExercise} onClose={onCloseMock} onComplete={onCompleteMock} />);

    expect(screen.getByText(/Eye Focus/)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Initial time
    expect(screen.getByText('Look far away')).toBeInTheDocument();
    expect(screen.getByText('Look at your nose')).toBeInTheDocument();
  });

  it('should count down the timer', () => {
    render(<ExerciseModal exercise={mockExercise} onClose={onCloseMock} onComplete={onCompleteMock} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('should progress through steps as time passes', () => {
    render(<ExerciseModal exercise={mockExercise} onClose={onCloseMock} onComplete={onCompleteMock} />);
    
    // Step 1 is initially active - find the correct container with scale-105 class
    const activeStep = screen.getByText('Look far away').closest('.scale-105') || 
                      screen.getByText('Look far away').parentElement.parentElement;
    expect(activeStep).toHaveClass('bg-blue-500'); // Active step has blue background

    // Each step is 5 seconds (10s duration / 2 steps)
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Step 1 is now marked as complete - check for completed styling
    const step1 = screen.getByText('Look far away').parentElement.parentElement;
    expect(step1).toHaveClass('line-through'); // Completed step has line-through
    
    // Step 2 is now active
    const step2 = screen.getByText('Look at your nose').parentElement.parentElement;
    expect(step2).toHaveClass('bg-blue-500'); // Active step has blue background
  });

  it('should pause and resume the timer', () => {
    render(<ExerciseModal exercise={mockExercise} onClose={onCloseMock} onComplete={onCompleteMock} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();

    // Pause the timer
    fireEvent.click(screen.getByText('Pause'));
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Time should not have changed
    expect(screen.getByText('10')).toBeInTheDocument();

    // Resume the timer
    fireEvent.click(screen.getByText('Resume'));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Time should now have changed
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('should call onComplete and show success message when timer finishes', () => {
    render(<ExerciseModal exercise={mockExercise} onClose={onCloseMock} onComplete={onCompleteMock} />);
    
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Great Job! 🎉')).toBeInTheDocument();
  });

  it('should call onComplete and show success message when skipped', () => {
    render(<ExerciseModal exercise={mockExercise} onClose={onCloseMock} onComplete={onCompleteMock} />);
    
    fireEvent.click(screen.getByText('Skip'));

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Great Job! 🎉')).toBeInTheDocument();
  });

  it('should call onClose when the close button is clicked from the success screen', () => {
    render(<ExerciseModal exercise={mockExercise} onClose={onCloseMock} onComplete={onCompleteMock} />);
    
    // Complete the exercise
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Click the "Done" button on the success screen
    fireEvent.click(screen.getByText('Done'));

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when the "X" button is clicked', () => {
    render(<ExerciseModal exercise={mockExercise} onClose={onCloseMock} onComplete={onCompleteMock} />);
    
    // The 'X' button is inside a button element, let's find it by its role
    const closeButton = screen.getAllByRole('button')[0]; // Assuming it's the first button
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
