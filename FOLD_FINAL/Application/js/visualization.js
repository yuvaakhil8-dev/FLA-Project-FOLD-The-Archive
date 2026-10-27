/**
 * FOLD — Automata SVG Visualizer
 * Renders interactive state transition diagrams with dual glowing arrow markers,
 * NFA multi-shadow echo states, fold selection rings, and transition highlighting.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FoldVisualizer = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function createSVGElement(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    return el;
  }

  function render(container, machine, options = {}) {
    if (!container || !machine) return;
    container.innerHTML = '';

    const width = options.width || 700;
    const height = options.height || 360;
    const activeStates = options.activeStates || []; // array of state names
    const activeEdge = options.activeEdge || null; // { from, to, symbol }
    const selectedStates = options.selectedStates || []; // for folding selection
    const onStateClick = options.onStateClick || null;
    const isInteractive = Boolean(options.interactive);

    const svg = createSVGElement('svg', {
      viewBox: `0 0 ${width} ${height}`,
      class: 'automata-svg-canvas',
      preserveAspectRatio: 'xMidYMid meet'
    });

    // Defs: Arrowhead markers & filters
    const defs = createSVGElement('defs');
    defs.innerHTML = `
      <marker id="arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#656272" />
      </marker>
      <marker id="active-arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9 z" fill="#00f0a0" />
      </marker>
      <marker id="red-arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9 z" fill="#e0314b" />
      </marker>
      <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    `;
    svg.appendChild(defs);

    // Compute coordinates if not provided
    const coords = {};
    const n = machine.states.length;
    const providedLayout = machine.layout || (options.coords || {});

    machine.states.forEach((s, idx) => {
      if (providedLayout[s]) {
        coords[s] = providedLayout[s];
      } else {
        const radius = Math.min(width, height) * 0.35;
        const cx = width / 2;
        const cy = height / 2;
        const angle = (2 * Math.PI * idx) / n;
        coords[s] = {
          x: Math.round(cx + radius * Math.cos(angle)),
          y: Math.round(cy + radius * Math.sin(angle))
        };
      }
    });

    const edgeGroup = createSVGElement('g', { class: 'edges-group' });
    const nodeGroup = createSVGElement('g', { class: 'nodes-group' });

    // Collect and group transitions
    // Key: from -> to
    const transitionPairs = {};
    for (const src of machine.states) {
      const trans = machine.transitions[src] || {};
      for (const [sym, dest] of Object.entries(trans)) {
        const dests = Array.isArray(dest) ? dest : [dest];
        for (const target of dests) {
          if (!target || !coords[target]) continue;
          const pairKey = `${src}->${target}`;
          if (!transitionPairs[pairKey]) {
            transitionPairs[pairKey] = { from: src, to: target, symbols: [] };
          }
          if (!transitionPairs[pairKey].symbols.includes(sym)) {
            transitionPairs[pairKey].symbols.push(sym);
          }
        }
      }
    }

    // Render Transitions
    for (const { from, to, symbols } of Object.values(transitionPairs)) {
      const p1 = coords[from];
      const p2 = coords[to];
      const isLoop = from === to;
      const reverseKey = `${to}->${from}`;
      const hasBidirectional = from !== to && Boolean(transitionPairs[reverseKey]);

      const labelText = symbols.join(',');
      const isEdgeActive = activeEdge && activeEdge.from === from && activeEdge.to === to && symbols.includes(activeEdge.symbol);

      let pathD = '';
      let textX = 0;
      let textY = 0;

      if (isLoop) {
        // Self-loop
        const loopRadius = 32;
        const x = p1.x;
        const y = p1.y - 22;
        pathD = `M ${x - 12} ${y} C ${x - loopRadius} ${y - loopRadius * 1.5}, ${x + loopRadius} ${y - loopRadius * 1.5}, ${x + 12} ${y}`;
        textX = x;
        textY = y - loopRadius - 6;
      } else {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        if (hasBidirectional) {
          // Curved arc to separate opposing edges
          const nx = -dy / dist;
          const ny = dx / dist;
          const curvature = 28;
          const ctrlX = midX + nx * curvature;
          const ctrlY = midY + ny * curvature;
          pathD = `M ${p1.x} ${p1.y} Q ${ctrlX} ${ctrlY} ${p2.x} ${p2.y}`;
          textX = ctrlX + nx * 4;
          textY = ctrlY + ny * 4;
        } else {
          // Straight or gentle curve
          pathD = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
          textX = midX;
          textY = midY - 10;
        }
      }

      const edgePath = createSVGElement('path', {
        d: pathD,
        class: `transition-edge ${isEdgeActive ? 'active' : ''}`,
        'marker-end': isEdgeActive ? 'url(#active-arrow)' : 'url(#arrow)'
      });
      edgeGroup.appendChild(edgePath);

      // Label background plate
      const labelBg = createSVGElement('rect', {
        x: textX - 10 - labelText.length * 2,
        y: textY - 9,
        width: 20 + labelText.length * 4,
        height: 16,
        rx: 3,
        class: `transition-label-bg ${isEdgeActive ? 'active' : ''}`
      });
      edgeGroup.appendChild(labelBg);

      // Label text
      const labelEl = createSVGElement('text', {
        x: textX,
        y: textY + 3,
        class: `transition-label ${isEdgeActive ? 'active' : ''}`,
        'text-anchor': 'middle'
      });
      labelEl.textContent = labelText;
      edgeGroup.appendChild(labelEl);
    }

    svg.appendChild(edgeGroup);

    // Render States
    for (const s of machine.states) {
      const pos = coords[s];
      const isStart = s === machine.start;
      const isAccepting = machine.accepting.includes(s);
      const isActive = activeStates.includes(s);
      const isSelected = selectedStates.includes(s);

      const stateG = createSVGElement('g', {
        class: `state-node ${isActive ? 'active-state' : ''} ${isSelected ? 'selected-state' : ''} ${isInteractive ? 'interactive' : ''}`,
        transform: `translate(${pos.x}, ${pos.y})`
      });

      if (onStateClick) {
        stateG.style.cursor = 'pointer';
        stateG.addEventListener('click', (e) => {
          e.stopPropagation();
          onStateClick(s);
        });
      }

      // Initial State Incoming Arrow
      if (isStart) {
        const startArrow = createSVGElement('path', {
          d: 'M -46 0 L -25 0',
          class: 'start-arrow-path',
          'marker-end': 'url(#active-arrow)'
        });
        stateG.appendChild(startArrow);

        const startLabel = createSVGElement('text', {
          x: -52,
          y: 4,
          class: 'start-label',
          'text-anchor': 'end'
        });
        startLabel.textContent = 'START';
        stateG.appendChild(startLabel);
      }

      // Outer Selection Ring (when chosen in Folding System)
      if (isSelected) {
        const selRing = createSVGElement('circle', {
          r: 28,
          class: 'fold-selection-ring',
          filter: 'url(#glow-filter)'
        });
        stateG.appendChild(selRing);
      }

      // Outer Halo for Active States
      if (isActive) {
        const halo = createSVGElement('circle', {
          r: 26,
          class: 'active-state-halo',
          filter: 'url(#glow-filter)'
        });
        stateG.appendChild(halo);
      }

      // Main State Circle
      const mainCircle = createSVGElement('circle', {
        r: 22,
        class: `state-circle ${isAccepting ? 'accepting' : ''}`
      });
      stateG.appendChild(mainCircle);

      // Double Ring for Accepting States
      if (isAccepting) {
        const innerCircle = createSVGElement('circle', {
          r: 18,
          class: 'state-circle-inner'
        });
        stateG.appendChild(innerCircle);
      }

      // State Label
      const stateLabel = createSVGElement('text', {
        x: 0,
        y: 5,
        class: 'state-text',
        'text-anchor': 'middle'
      });
      stateLabel.textContent = s;
      stateG.appendChild(stateLabel);

      nodeGroup.appendChild(stateG);
    }

    svg.appendChild(nodeGroup);
    container.appendChild(svg);
  }

  return {
    render
  };
});
