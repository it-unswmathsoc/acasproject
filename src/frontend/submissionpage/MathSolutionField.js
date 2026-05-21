import { useEffect, useRef } from 'react';
import 'mathlive';
import 'mathlive/fonts.css';
import { dismissMathLiveUI } from './dismissMathLiveUI';

export default function MathSolutionField({ id, value, onChange }) {
  const fieldRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) {
      return undefined;
    }

    field.defaultMode = 'math';
    field.smartMode = true;
    field.smartFence = true;
    field.smartSuperscript = true;
    field.mathVirtualKeyboardPolicy = 'manual';

    const handleInput = () => {
      onChangeRef.current(field.value);
    };

    field.addEventListener('input', handleInput);

    if (value && field.value !== value) {
      field.setValue(value, { silenceNotifications: true });
    }

    return () => {
      field.removeEventListener('input', handleInput);
      dismissMathLiveUI(field);
    };
    // Mount-only: value sync is handled in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field || field.value === value) {
      return;
    }
    field.setValue(value ?? '', { silenceNotifications: true });
  }, [value]);

  return <math-field ref={fieldRef} id={id} className="ms-math-field" />;
}
