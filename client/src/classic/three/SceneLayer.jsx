import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { measureChapters } from './scrollTimeline.js';

const Scene = lazy(() => import('./Scene.jsx'));

class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn('3D scene disabled:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Fixed sky + 3D canvas behind the page. The canvas stops rendering once the solid
 * content "sheet" (#sheet) covers the whole screen, to save battery.
 */
export function SceneLayer() {
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    measureChapters();
    const remeasure = () => measureChapters();
    window.addEventListener('resize', remeasure);
    const observer = new ResizeObserver(remeasure);
    observer.observe(document.body);
    document.fonts?.ready.then(remeasure);

    const sheet = document.getElementById('sheet');
    const checkCovered = () => setCovered(Boolean(sheet) && sheet.getBoundingClientRect().top <= 0);
    checkCovered();
    window.addEventListener('scroll', checkCovered, { passive: true });
    window.addEventListener('resize', checkCovered);

    return () => {
      window.removeEventListener('resize', remeasure);
      observer.disconnect();
      window.removeEventListener('scroll', checkCovered);
      window.removeEventListener('resize', checkCovered);
    };
  }, []);

  return (
    <div className={`scene ${covered ? 'scene--covered' : ''}`} aria-hidden="true">
      <div className="scene__sun" />
      <SceneBoundary>
        <Suspense fallback={null}>
          <Scene paused={covered} />
        </Suspense>
      </SceneBoundary>
    </div>
  );
}
