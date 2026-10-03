/* Charts built from AGNA_PROFILE with plain SVG/DOM — no chart library, no CDN,
   so the page still works from file:// and offline.
   Renders: radar map of language levels, level bars per language, duration bars per role. */
(function () {
  'use strict';
  const profile = window.AGNA_PROFILE;
  if (!profile) return;
  const $ = id => document.getElementById(id);
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const levelValue = new Map(profile.levels.map(([name, value]) => [name, value]));
  const maxLevel = Math.max(...profile.levels.map(([, value]) => value));

  function el(tag, attrs = {}, text) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* ---------- radar map ---------- */
  function renderRadar() {
    const svg = $('skill-radar');
    if (!svg) return;
    const size = 420, c = size / 2, radius = 138, labelGap = 30;
    const items = profile.skills.map(([name, level]) => ({
      name, level, value: levelValue.get(level) || 1
    }));
    const angleOf = i => (-90 + (i * 360) / items.length) * Math.PI / 180;

    for (let ring = 1; ring <= maxLevel; ring++) {
      const points = items.map((_, i) => {
        const a = angleOf(i), r = (radius * ring) / maxLevel;
        return `${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`;
      }).join(' ');
      svg.append(el('polygon', { class: 'radar-ring', points }));
    }

    items.forEach((item, i) => {
      const a = angleOf(i), x = c + radius * Math.cos(a), y = c + radius * Math.sin(a);
      svg.append(el('line', { class: 'radar-axis', x1: c, y1: c, x2: x.toFixed(1), y2: y.toFixed(1) }));
      const lx = c + (radius + labelGap) * Math.cos(a), ly = c + (radius + labelGap) * Math.sin(a);
      const cos = Math.cos(a);
      const anchor = Math.abs(cos) < 0.2 ? 'middle' : (cos > 0 ? 'start' : 'end');
      const label = el('text', {
        class: 'radar-label' + (item.value >= maxLevel ? ' is-top' : ''),
        x: lx.toFixed(1), y: (ly + 3).toFixed(1), 'text-anchor': anchor
      }, item.name);
      svg.append(label);
    });

    const shapePoints = items.map((item, i) => {
      const a = angleOf(i), r = (radius * item.value) / maxLevel;
      return `${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    svg.append(el('polygon', { class: 'radar-shape', points: shapePoints }));

    items.forEach((item, i) => {
      const a = angleOf(i), r = (radius * item.value) / maxLevel;
      const dot = el('circle', {
        class: 'radar-point', cx: (c + r * Math.cos(a)).toFixed(1), cy: (c + r * Math.sin(a)).toFixed(1),
        r: 4.2, style: `--i:${i}`
      });
      dot.append(el('title', {}, `${item.name} — ${item.level}`));
      svg.append(dot);
    });

    const strongest = items.filter(i => i.value === maxLevel).map(i => i.name);
    const next = items.filter(i => i.value === maxLevel - 1).map(i => i.name);
    const middle = items.filter(i => i.value === 3 || i.value === 2).map(i => i.name);
    const growing = items.filter(i => i.value <= 1).map(i => i.name);
    const parts = [];
    if (strongest.length) parts.push(`Terkuat: ${strongest.join(', ')} (Master).`);
    if (next.length) parts.push(`Menyusul: ${next.join(', ')} (Advanced).`);
    if (middle.length) parts.push(`Menengah: ${middle.join(', ')}.`);
    if (growing.length) parts.push(`Masih diasah: ${growing.join(', ')} (Elementary).`);
    $('radar-desc').textContent = parts.join(' ') || 'Peta keahlian belum tersedia.';
  }

  /* ---------- legend: level -> languages ---------- */
  function renderLegend() {
    const root = $('radar-legend');
    if (!root) return;
    const byLevel = new Map(profile.levels.map(([name]) => [name, []]));
    for (const [name, level] of profile.skills) {
      if (!byLevel.has(level)) byLevel.set(level, []);
      byLevel.get(level).push(name);
    }
    for (const [level, value] of profile.levels) {
      const names = byLevel.get(level) || [];
      const li = document.createElement('li');
      li.className = 'legend-item' + (value >= maxLevel ? ' is-top' : '');
      li.style.setProperty('--level-fill', `${(value / maxLevel) * 100}%`);
      const head = document.createElement('span');
      head.className = 'legend-head';
      const label = document.createElement('strong');
      label.textContent = level;
      const count = document.createElement('small');
      count.textContent = `${value}/${maxLevel} · ${names.length} bahasa`;
      head.append(label, count);
      const bar = document.createElement('span');
      bar.className = 'legend-bar';
      const names2 = document.createElement('span');
      names2.className = 'legend-names';
      names2.textContent = names.length ? names.join(' · ') : 'Belum ada';
      li.append(head, bar, names2);
      root.append(li);
    }
  }

  /* ---------- level bars per language, and duration bars per role ---------- */
  function renderSkillMeters() {
    const rows = document.querySelectorAll('#skills-list .skill-row');
    rows.forEach((row, index) => {
      if (row.querySelector('.skill-meter')) return;
      const dt = row.querySelector('dt'), dd = row.querySelector('dd');
      if (!dt || !dd) return;
      const value = levelValue.get((dd.textContent || '').trim()) || 0;
      const meter = document.createElement('span');
      meter.className = 'skill-meter';
      meter.setAttribute('aria-hidden', 'true');
      meter.style.setProperty('--fill', `${(value / maxLevel) * 100}%`);
      meter.style.setProperty('--meter-delay', `${index * 55}ms`);
      const fill = document.createElement('i');
      meter.append(fill);
      row.insertBefore(meter, dd);
      row.dataset.level = String(value);
      row.style.setProperty('--row-index', String(index));
    });
  }

  function renderRoleMeters() {
    const rows = document.querySelectorAll('#experience-rows tr');
    const maxYears = Math.max(...profile.roles.map(([, years]) => years), 1);
    rows.forEach((row, index) => {
      const cell = row.lastElementChild;
      if (!cell || cell.querySelector('.role-meter')) return;
      const years = parseInt((cell.textContent || '').replace(/\D+/g, ''), 10) || 0;
      const meter = document.createElement('span');
      meter.className = 'role-meter';
      meter.setAttribute('aria-hidden', 'true');
      meter.style.setProperty('--fill', `${(years / maxYears) * 100}%`);
      meter.style.setProperty('--meter-delay', `${index * 60}ms`);
      const fill = document.createElement('i');
      meter.append(fill);
      cell.append(meter);
      row.style.setProperty('--row-index', String(index));
    });
  }

  function animateRadar() {
    const svg = $('skill-radar');
    if (!svg) return;
    const reveal = () => svg.classList.add('is-drawn');
    if (!('IntersectionObserver' in window)) { reveal(); return; }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { reveal(); observer.disconnect(); }
    }, { threshold: 0.25 });
    observer.observe(svg);
  }

  renderRadar();
  renderLegend();
  renderSkillMeters();
  renderRoleMeters();
  animateRadar();
})();
