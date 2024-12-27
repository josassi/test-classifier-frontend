import { useState, useCallback } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialPresent: T) {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: []
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const undo = useCallback(() => {
    setState(currentState => {
      if (!currentState.past.length) return currentState;

      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(currentState => {
      if (!currentState.future.length) return currentState;

      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const updatePresent = useCallback((newPresent: T) => {
    // Only update if the new state is different from the current state
    setState(currentState => {
      if (JSON.stringify(currentState.present) === JSON.stringify(newPresent)) {
        return currentState;
      }
      
      return {
        past: [...currentState.past, currentState.present],
        present: newPresent,
        future: []
      };
    });
  }, []);

  // Reset history when initialPresent changes
  const reset = useCallback((newPresent: T) => {
    setState({
      past: [],
      present: newPresent,
      future: []
    });
  }, []);

  return {
    state: state.present,
    setState: updatePresent,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
    history: state
  };
}