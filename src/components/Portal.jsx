import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

/**
 * Portal – renders children directly into document.body.
 * This escapes any overflow / stacking-context issues caused by
 * overflow-y:auto scroll containers (like .dashboard-content) and
 * opacity animations (animate-fade-in) that would otherwise trap
 * position:fixed modal overlays inside the wrong containing block.
 *
 * Uses useState instead of useRef to hold the portal container so that
 * the DOM element is never accessed from ref.current during render
 * (which violates react-hooks/refs in strict ESLint configs).
 */
export default function Portal({ children }) {
  const [container] = useState(() => {
    const el = document.createElement('div');
    el.setAttribute('data-portal', 'true');
    return el;
  });

  useEffect(() => {
    document.body.appendChild(container);
    return () => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, [container]);

  return ReactDOM.createPortal(children, container);
}
