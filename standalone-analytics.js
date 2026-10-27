/* One optional, non-blocking analytics hook for each independent student site. */
(() => {
  'use strict';
  const repositories = Object.freeze({
    'young-modulus-lab-students': 'young',
    'nonlinear-resistance-lab-students': 'resistance',
    'newton-rings-lab-students': 'rings',
    'polarization-light-lab-students': 'polarization',
    'oscilloscope-instrument-lab-students': 'oscilloscope',
    'hall-effect-lab-students': 'hall'
  });
  const lab = repositories[location.pathname.split('/')[1]];
  // The unified platform counts its iframe only after the experiment loads.
  if (!lab || location.origin !== 'https://hwangbl.github.io' || window.top !== window) return;

  const current = document.currentScript;
  if (!current?.src) return;
  const base = new URL('.', current.src);
  if (base.href !== 'https://hwangbl.github.io/college-experimental-physics-lab-student/') return;

  function load(name, ready) {
    const script = document.createElement('script');
    script.src = new URL(name, base).href;
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.onload = ready;
    document.head.appendChild(script);
  }
  load('analytics-config.js', () => load('lab-analytics.js', () => {
    window.PhysicsLabAnalytics?.visit(lab);
  }));
})();
