import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

/**
 * Portal – renders children directly into document.body.
 * This escapes any overflow / stacking-context issues caused by
 * overflow-y:auto scroll containers (like .dashboard-content) and
 * opacity animations (animate-fade-in) that would otherwise trap
 * position:fixed modal overlays inside the wrong containing block.
 */
export default function Portal({ children }) {
  const elRef = useRef(null);
  if (!elRef.current) {
    elRef.current = document.createElement('div');
    elRef.current.setAttribute('data-portal', 'true');
  }

  useEffect(() => {
    document.body.appendChild(elRef.current);
    return () => {
      if (document.body.contains(elRef.current)) {
        document.body.removeChild(elRef.current);
      }
    };
  }, []);

  return ReactDOM.createPortal(children, elRef.current);
}
