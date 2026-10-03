(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ---------- BIKE LOADER SVG CREATOR ---------- */
  window.getBikeLoaderElement = function () {
    const stage = document.createElement('div');
    stage.className = 'bike-loader-stage';
    stage.setAttribute('aria-label', 'Memuat...');
    stage.innerHTML = `<div class="bike-scene"><svg id="bike" viewBox="0 0 220 178" xmlns="http://www.w3.org/2000/svg"><defs><g id="shoeIcon"><path d="M -3,-1 L 3,-2.2 Q 9,-1.4 10.2,2.6 Q 10.4,6.2 6.4,6.2 L -3.2,6.2 Q -5.2,3 -3,-1 Z" fill="var(--shoe, #1a1a1a)"/><rect x="-3.2" y="5.2" width="13.6" height="2" rx="1" fill="#4a4a4a"/></g><pattern id="lanePattern" width="40" height="38" patternUnits="userSpaceOnUse" x="0" y="140"><rect width="40" height="38" fill="#3a3a3a"/><rect x="6" y="17" width="18" height="4" rx="2" fill="#f2f2f2"/><animate attributeName="x" from="0" to="-40" dur="0.6s" repeatCount="indefinite"/></pattern></defs><rect x="0" y="140" width="220" height="38" fill="url(#lanePattern)"/><rect x="0" y="139" width="220" height="1.5" fill="#c9c9c9"/><g transform="translate(28,-3)"><g id="rearWheel"><circle cx="30" cy="116" r="24" fill="none" stroke="var(--ink, #1a1a1a)" stroke-width="7"/><g stroke="var(--ink, #1a1a1a)" stroke-width="2.2"><line x1="54.50" y1="116.00" x2="58.00" y2="116.00"/><line x1="52.64" y1="125.38" x2="55.87" y2="126.72"/><line x1="47.32" y1="133.32" x2="49.80" y2="135.80"/><line x1="39.38" y1="138.64" x2="40.72" y2="141.87"/><line x1="30.00" y1="140.50" x2="30.00" y2="144.00"/><line x1="20.62" y1="138.64" x2="19.28" y2="141.87"/><line x1="12.68" y1="133.32" x2="10.20" y2="135.80"/><line x1="7.36" y1="125.38" x2="4.13" y2="126.72"/><line x1="5.50" y1="116.00" x2="2.00" y2="116.00"/><line x1="7.36" y1="106.62" x2="4.13" y2="105.28"/><line x1="12.68" y1="98.68" x2="10.20" y2="96.20"/><line x1="20.62" y1="93.36" x2="19.28" y2="90.13"/><line x1="30.00" y1="91.50" x2="30.00" y2="88.00"/><line x1="39.38" y1="93.36" x2="40.72" y2="90.13"/><line x1="47.32" y1="98.68" x2="49.80" y2="96.20"/><line x1="52.64" y1="106.62" x2="55.87" y2="105.28"/></g><circle cx="30" cy="116" r="19" fill="none" stroke="#9a9a9a" stroke-width="1.5"/><g stroke="#9a9a9a" stroke-width="1.4"><line x1="50" y1="116" x2="10" y2="116"/><line x1="44.14" y1="130.14" x2="15.86" y2="101.86"/><line x1="30" y1="136" x2="30" y2="96"/><line x1="15.86" y1="130.14" x2="44.14" y2="101.86"/></g><circle cx="30" cy="116" r="5.5" fill="#777"/><circle cx="30" cy="116" r="4" fill="var(--ink, #1a1a1a)"/><animateTransform attributeName="transform" type="rotate" from="0 30 116" to="360 30 116" dur="0.3s" repeatCount="indefinite"/></g></g><g transform="translate(-26,-3)"><g id="frontWheel"><circle cx="175" cy="116" r="24" fill="none" stroke="var(--ink, #1a1a1a)" stroke-width="7"/><g stroke="var(--ink, #1a1a1a)" stroke-width="2.2"><line x1="199.50" y1="116.00" x2="203.00" y2="116.00"/><line x1="197.64" y1="125.38" x2="200.87" y2="126.72"/><line x1="192.32" y1="133.32" x2="194.80" y2="135.80"/><line x1="184.38" y1="138.64" x2="185.72" y2="141.87"/><line x1="175.00" y1="140.50" x2="175.00" y2="144.00"/><line x1="165.62" y1="138.64" x2="164.28" y2="141.87"/><line x1="157.68" y1="133.32" x2="155.20" y2="135.80"/><line x1="152.36" y1="125.38" x2="149.13" y2="126.72"/><line x1="150.50" y1="116.00" x2="147.00" y2="116.00"/><line x1="152.36" y1="106.62" x2="149.13" y2="105.28"/><line x1="157.68" y1="98.68" x2="155.20" y2="96.20"/><line x1="165.62" y1="93.36" x2="164.28" y2="90.13"/><line x1="175.00" y1="91.50" x2="175.00" y2="88.00"/><line x1="184.38" y1="93.36" x2="185.72" y2="90.13"/><line x1="192.32" y1="98.68" x2="194.80" y2="96.20"/><line x1="197.64" y1="106.62" x2="200.87" y2="105.28"/></g><circle cx="175" cy="116" r="19" fill="none" stroke="#9a9a9a" stroke-width="1.5"/><g stroke="#9a9a9a" stroke-width="1.4"><line x1="195" y1="116" x2="155" y2="116"/><line x1="189.14" y1="130.14" x2="160.86" y2="101.86"/><line x1="175" y1="136" x2="175" y2="96"/><line x1="160.86" y1="130.14" x2="189.14" y2="101.86"/></g><circle cx="175" cy="116" r="5.5" fill="#777"/><circle cx="175" cy="116" r="4" fill="var(--ink, #1a1a1a)"/><animateTransform attributeName="transform" type="rotate" from="0 175 116" to="360 175 116" dur="0.3s" repeatCount="indefinite"/></g></g><line x1="90" y1="112" x2="58" y2="117" stroke="#555" stroke-width="2" stroke-dasharray="2.5 2"/><g stroke="var(--accent-dark, #8e1f28)" stroke-width="7" stroke-linecap="round" fill="none"><line x1="58" y1="113" x2="90" y2="108"/><line x1="90" y1="108" x2="72" y2="53"/><line x1="72" y1="53" x2="58" y2="113"/><line x1="90" y1="108" x2="128" y2="66"/><line x1="72" y1="53" x2="128" y2="66"/></g><g stroke="var(--accent, #e63946)" stroke-width="4.6" stroke-linecap="round" fill="none"><line x1="58" y1="113" x2="90" y2="108"/><line x1="90" y1="108" x2="72" y2="53"/><line x1="72" y1="53" x2="58" y2="113"/><line x1="90" y1="108" x2="128" y2="66"/><line x1="72" y1="53" x2="128" y2="66"/></g><line x1="128" y1="66" x2="149" y2="113" stroke="#4a4a4a" stroke-width="7" stroke-linecap="round"/><line x1="128.6" y1="67" x2="149.6" y2="114" stroke="#8a8a8a" stroke-width="2" stroke-linecap="round"/><rect x="121" y="61.5" width="14" height="9" rx="3" fill="#333" transform="rotate(24 128 66)"/><ellipse cx="71" cy="54" rx="14" ry="3.2" fill="var(--ink, #1a1a1a)" transform="rotate(-8 71 54)"/><line x1="128" y1="66" x2="111" y2="44" stroke="var(--ink, #1a1a1a)" stroke-width="4.5" stroke-linecap="round"/><line x1="102" y1="42" x2="120" y2="46" stroke="var(--ink, #1a1a1a)" stroke-width="5" stroke-linecap="round"/><rect x="98" y="38.5" width="8" height="8" rx="2.5" fill="var(--ink, #1a1a1a)" transform="rotate(12 102 42)"/><rect x="116" y="42.5" width="8" height="8" rx="2.5" fill="var(--ink, #1a1a1a)" transform="rotate(12 120 46)"/><g id="crank"><line x1="90" y1="108" x2="106" y2="108" stroke="var(--ink, #1a1a1a)" stroke-width="4" stroke-linecap="round"/><line x1="90" y1="108" x2="74" y2="108" stroke="var(--ink, #1a1a1a)" stroke-width="4" stroke-linecap="round"/><rect x="102" y="104" width="9" height="6" rx="1.5" fill="var(--ink, #1a1a1a)"/><rect x="70" y="105" width="9" height="6" rx="1.5" fill="var(--ink, #1a1a1a)"/><circle cx="90" cy="108" r="5" fill="var(--ink, #1a1a1a)"/><animateTransform attributeName="transform" type="rotate" from="0 90 108" to="360 90 108" dur="0.9s" repeatCount="indefinite"/></g><g><line id="thighBack" x1="72" y1="53" x2="99.22" y2="82.31" stroke="var(--pants-back, #202b36)" stroke-width="8" stroke-linecap="round"><animate attributeName="x2" dur="0.9s" repeatCount="indefinite" values="99.22;103.92;108.37;110.82;111.26;110.29;107.19;101.44;94.58;91.32;92.42;95.29;99.22" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/><animate attributeName="y2" dur="0.9s" repeatCount="indefinite" values="82.31;77.1;69.64;62.63;60.67;64.58;72.02;80.08;86.02;88.02;87.4;85.52;82.31" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/></line><line id="shinBack" x1="99.22" y1="82.31" x2="74" y2="108" stroke="var(--pants-back, #202b36)" stroke-width="7" stroke-linecap="round"><animate attributeName="x1" dur="0.9s" repeatCount="indefinite" values="99.22;103.92;108.37;110.82;111.26;110.29;107.19;101.44;94.58;91.32;92.42;95.29;99.22" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/><animate attributeName="y1" dur="0.9s" repeatCount="indefinite" values="82.31;77.1;69.64;62.63;60.67;64.58;72.02;80.08;86.02;88.02;87.4;85.52;82.31" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/><animate attributeName="x2" dur="0.9s" repeatCount="indefinite" values="74;76.14;82;90;98;103.86;106;103.86;98;90;82;76.14;74" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/><animate attributeName="y2" dur="0.9s" repeatCount="indefinite" values="108;100;94.14;92;94.14;100;108;116;121.86;124;121.86;116;108" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/></line><circle id="kneeBack" cx="99.22" cy="82.31" r="4.3" fill="var(--pants-back, #202b36)"><animate attributeName="cx" dur="0.9s" repeatCount="indefinite" values="99.22;103.92;108.37;110.82;111.26;110.29;107.19;101.44;94.58;91.32;92.42;95.29;99.22" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/><animate attributeName="cy" dur="0.9s" repeatCount="indefinite" values="82.31;77.1;69.64;62.63;60.67;64.58;72.02;80.08;86.02;88.02;87.4;85.52;82.31" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/></circle><use href="#shoeIcon"><animateTransform attributeName="transform" type="translate" dur="0.9s" repeatCount="indefinite" values="74,108;76.14,100;82,94.14;90,92;98,94.14;103.86,100;106,108;103.86,116;98,121.86;90,124;82,121.86;76.14,116;74,108" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/></use></g><rect x="67" y="27.5" width="12" height="19" rx="4" fill="var(--bag, #c98a2b)" transform="rotate(-18 73 37)"/><line x1="70.2" y1="27.9" x2="90" y2="29" stroke="#a5701f" stroke-width="3.2" stroke-linecap="round"/><circle cx="90" cy="29" r="2.6" fill="#a5701f"/><line x1="72" y1="53" x2="90" y2="29" stroke="var(--shirt, #2f6fa5)" stroke-width="12" stroke-linecap="round"/><line x1="90" y1="29" x2="100" y2="41" stroke="var(--shirt, #2f6fa5)" stroke-width="8" stroke-linecap="round"/><line x1="100" y1="41" x2="111" y2="44" stroke="var(--skin, #e0ac69)" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="41" r="3.6" fill="var(--shirt, #2f6fa5)"/><circle cx="111" cy="44" r="4" fill="var(--skin, #e0ac69)"/><ellipse cx="73" cy="56" rx="10" ry="8" fill="var(--pants, #33404f)" transform="rotate(-8 73 56)"/><circle cx="98" cy="13" r="9" fill="var(--skin, #e0ac69)"/><path d="M 88.5 10 A 9.5 8 0 0 1 107.5 10 L 107.5 13 L 88.5 13 Z" fill="var(--cap, #e63946)"/><rect x="104" y="9" width="13" height="4.5" rx="2" fill="var(--cap, #e63946)" transform="rotate(-6 104 11)"/><line id="thighFront" x1="72" y1="53" x2="107.19" y2="72.02" stroke="var(--pants, #33404f)" stroke-width="8" stroke-linecap="round"><animate attributeName="x2" dur="0.9s" repeatCount="indefinite" values="107.19;101.44;94.58;91.32;92.42;95.29;99.22;103.92;108.37;110.82;111.26;110.29;107.19" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/><animate attributeName="y2" dur="0.9s" repeatCount="indefinite" values="72.02;80.08;86.02;88.02;87.4;85.52;82.31;77.1;69.64;62.63;60.67;64.58;72.02" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/></line><line id="shinFront" x1="107.19" y1="72.02" x2="106" y2="108" stroke="var(--pants, #33404f)" stroke-width="7" stroke-linecap="round"><animate attributeName="x1" dur="0.9s" repeatCount="indefinite" values="107.19;101.44;94.58;91.32;92.42;95.29;99.22;103.92;108.37;110.82;111.26;110.29;107.19" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/><animate attributeName="y1" dur="0.9s" repeatCount="indefinite" values="72.02;80.08;86.02;88.02;87.4;85.52;82.31;77.1;69.64;62.63;60.67;64.58;72.02" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/><animate attributeName="x2" dur="0.9s" repeatCount="indefinite" values="106;103.86;98;90;82;76.14;74;76.14;82;90;98;103.86;106" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/><animate attributeName="y2" dur="0.9s" repeatCount="indefinite" values="108;116;121.86;124;121.86;116;108;100;94.14;92;94.14;100;108" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/></line><circle id="kneeFront" cx="107.19" cy="72.02" r="4.3" fill="var(--pants, #33404f)"><animate attributeName="cx" dur="0.9s" repeatCount="indefinite" values="107.19;101.44;94.58;91.32;92.42;95.29;99.22;103.92;108.37;110.82;111.26;110.29;107.19" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/><animate attributeName="cy" dur="0.9s" repeatCount="indefinite" values="72.02;80.08;86.02;88.02;87.4;85.52;82.31;77.1;69.64;62.63;60.67;64.58;72.02" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/></circle><use href="#shoeIcon"><animateTransform attributeName="transform" type="translate" dur="0.9s" repeatCount="indefinite" values="106,108;103.86,116;98,121.86;90,124;82,121.86;76.14,116;74,108;76.14,100;82,94.14;90,92;98,94.14;103.86,100;106,108" keyTimes="0;0.0833;0.1667;0.25;0.3333;0.4167;0.5;0.5833;0.6667;0.75;0.8333;0.9167;1"/></use></svg></div><div class="bike-label">Loading<span class="dots"><span>.</span><span>.</span><span>.</span></span></div>`;
    return stage;
  };

  /* Attach loaders on static image wraps on load */
  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.thumbnail-wrap.loading').forEach(wrap => {
      if (!wrap.querySelector('.bike-loader-stage')) {
        const loader = window.getBikeLoaderElement();
        wrap.prepend(loader);
      }
      const img = wrap.querySelector('img');
      if (img) {
        if (img.complete) {
          wrap.classList.remove('loading');
          const loader = wrap.querySelector('.bike-loader-stage');
          if (loader) loader.remove();
        } else {
          img.addEventListener('load', () => {
            wrap.classList.remove('loading');
            const loader = wrap.querySelector('.bike-loader-stage');
            if (loader) {
              loader.style.opacity = '0';
              setTimeout(() => loader.remove(), 400);
            }
          }, { once: true });
          img.addEventListener('error', () => {
            wrap.classList.remove('loading');
            const loader = wrap.querySelector('.bike-loader-stage');
            if (loader) loader.remove();
          }, { once: true });
        }
      }
    });
  });

  const profile = window.AGNA_PROFILE || { skills: [], roles: [] };
  const iconSet = window.AGNA_ICONS || {};

  function brandIcon(key) {
    const icon = iconSet[key];
    if (!icon) return null;
    const box = document.createElement('span');
    box.className = 'brand-icon';
    box.style.setProperty('--brand', icon.color);
    box.style.setProperty('--brand-dark', icon.colorDark);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', icon.d); svg.append(path); box.append(svg);
    return box;
  }

  const skills = profile.skills;
  for (const [name, level, icon] of skills) {
    const row = document.createElement('div'); row.className = 'skill-row';
    const dt = document.createElement('dt');
    const glyph = brandIcon(icon); if (glyph) dt.append(glyph);
    const label = document.createElement('span'); label.className = 'skill-name'; label.textContent = name; dt.append(label);
    const dd = document.createElement('dd'); dd.textContent = level; row.append(dt, dd); $('skills-list').append(row);
  }

  const roles = profile.roles;
  for (const [name, years, icon] of roles) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const glyph = brandIcon(icon); if (glyph) nameCell.append(glyph);
    const label = document.createElement('span'); label.textContent = name; nameCell.append(label);
    row.append(nameCell);
    const yearCell = document.createElement('td'); yearCell.textContent = `${years} tahun`; row.append(yearCell);
    $('experience-rows').append(row);
  }

  const themeButton = $('theme-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let sweep = null;

  function themeSweep(x, y) {
    if (reducedMotion.matches || !document.body) return;
    if (!sweep) { sweep = document.createElement('div'); sweep.className = 'theme-sweep'; sweep.setAttribute('aria-hidden', 'true'); document.body.append(sweep); }
    sweep.style.setProperty('--sweep-x', `${x}px`); sweep.style.setProperty('--sweep-y', `${y}px`);
    sweep.classList.remove('is-running'); void sweep.offsetWidth; sweep.classList.add('is-running');
  }

  function setTheme(theme, animate) {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute('aria-label', `Aktifkan ${theme === 'dark' ? 'light' : 'dark'} mode`);
    if (animate) { const box = themeButton.getBoundingClientRect(); themeSweep(box.left + box.width / 2, box.top + box.height / 2); }
  }

  try { setTheme(localStorage.getItem('agna-theme') === 'light' ? 'light' : 'dark'); } catch { setTheme('dark'); }
  themeButton.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; setTheme(theme, true);
    try { localStorage.setItem('agna-theme', theme); } catch { /* private browsing */ }
  });

  /* ---------- LANGUAGE PICKER + TSUNAMI WAVE TRANSITION ---------- */
  const langButtons = document.querySelectorAll('.lang-btn');
  const tsunami = $('tsunami-wave');

  function triggerTsunamiWave() {
    if (!tsunami) return;
    tsunami.classList.remove('is-animating');
    void tsunami.offsetWidth; // force reflow
    tsunami.classList.add('is-animating');
    setTimeout(() => tsunami.classList.remove('is-animating'), 900);
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      triggerTsunamiWave();
      if (window.PORTFOLIO_I18N && window.PORTFOLIO_I18N.setLanguage) {
        window.PORTFOLIO_I18N.setLanguage(lang, true);
      }
    });
  });

  try {
    const savedLang = localStorage.getItem('agna-lang') || 'id';
    if (window.PORTFOLIO_I18N && window.PORTFOLIO_I18N.setLanguage) {
      window.PORTFOLIO_I18N.setLanguage(savedLang, false);
    }
  } catch (e) {}

  /* ---------- ROLE MORPHER ENGINE (0.8s interval) ---------- */
  const roleList = [
    { title: 'UI/UX Design', exp: '8+ Tahun Exp' },
    { title: 'Fullstack Developer', exp: '5+ Tahun Exp' },
    { title: 'Front-end Developer', exp: '4+ Tahun Exp' },
    { title: 'React', exp: '4+ Tahun Exp' },
    { title: 'Back-end Developer', exp: '3+ Tahun Exp' },
    { title: 'Network Security', exp: '3+ Tahun Exp' },
    { title: 'Android Developer', exp: '2+ Tahun Exp' },
    { title: 'Mobile Apps Developer', exp: '2+ Tahun Exp' },
    { title: 'iOS Developer', exp: '1+ Tahun Exp' },
    { title: 'Software Engineer', exp: '1+ Tahun Exp' },
    { title: 'SQL', exp: '1+ Tahun Exp' }
  ];

  let roleIndex = 0;
  let morphPhase = 0; // 0: title, 1: tenure exp, 2: back to title
  const roleBox = $('hero-role-box');
  const roleText = $('hero-role-text');
  const expBadge = $('hero-exp-badge');

  function updateRoleMorph() {
    if (!roleText) return;
    const current = roleList[roleIndex];

    if (morphPhase === 0) {
      roleText.classList.add('morph-out');
      setTimeout(() => {
        roleText.textContent = current.title;
        if (expBadge) { expBadge.textContent = current.exp; expBadge.classList.remove('is-visible'); }
        roleText.classList.remove('morph-out');
        roleText.classList.add('morph-in');
        setTimeout(() => roleText.classList.remove('morph-in'), 350);
      }, 150);
      morphPhase = 1;
    } else if (morphPhase === 1) {
      if (expBadge) {
        expBadge.textContent = current.exp;
        expBadge.classList.add('is-visible');
      }
      morphPhase = 2;
    } else {
      if (expBadge) expBadge.classList.remove('is-visible');
      morphPhase = 0;
      roleIndex = (roleIndex + 1) % roleList.length;
    }
  }

  let roleInterval = setInterval(updateRoleMorph, 800);

  if (roleBox) {
    roleBox.addEventListener('click', () => {
      clearInterval(roleInterval);
      morphPhase = 0;
      roleIndex = (roleIndex + 1) % roleList.length;
      updateRoleMorph();
      roleInterval = setInterval(updateRoleMorph, 800);
    });

    roleBox.addEventListener('mouseenter', () => clearInterval(roleInterval));
    roleBox.addEventListener('mouseleave', () => {
      clearInterval(roleInterval);
      roleInterval = setInterval(updateRoleMorph, 800);
    });
  }

  /* ---------- FORMAL / CASUAL PORTRAIT TOGGLE ---------- */
  const photoBtn = $('toggle-photo-btn');
  const portraitImg = $('portrait');
  const photoText = $('photo-toggle-text');
  let isFormal = true;

  if (photoBtn && portraitImg) {
    photoBtn.addEventListener('click', () => {
      isFormal = !isFormal;
      portraitImg.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      portraitImg.style.transform = 'scale(0.95) rotateY(90deg)';
      portraitImg.style.opacity = '0';

      setTimeout(() => {
        if (isFormal) {
          portraitImg.src = 'My%20formal%20picture.jpeg';
          portraitImg.alt = 'Foto formal Shafi Agna Rakasiwi Avianto';
          if (photoText) photoText.textContent = (window.PORTFOLIO_I18N && window.PORTFOLIO_I18N[window.PORTFOLIO_I18N.currentLang]?.btnTogglePhoto) || 'FOTO FORMAL';
        } else {
          portraitImg.src = 'assets/agna-casual.png';
          portraitImg.alt = 'Foto casual Shafi Agna Rakasiwi Avianto';
          if (photoText) photoText.textContent = (window.PORTFOLIO_I18N && window.PORTFOLIO_I18N[window.PORTFOLIO_I18N.currentLang]?.btnTogglePhotoAlt) || 'FOTO CASUAL';
        }
        portraitImg.style.transform = 'scale(1) rotateY(0deg)';
        portraitImg.style.opacity = '1';
      }, 300);
    });
  }


  const data = window.PORTFOLIO_DATA;
  if (!data || !Array.isArray(data.categories)) {
    return;
  }

  /* The project files (Website/, Apps/) live outside this folder so the portfolio
     itself stays small; every catalog URL is relative to this page. When the site is
     published on a host that serves those projects from somewhere else, only
     window.PORTFOLIO_PROJECT_BASE (set in index.html) needs to change — the 280+
     entries keep pointing at the same relative paths. */
  const projectBase = data.projectBase || '';
  const remoteBase = String(window.PORTFOLIO_PROJECT_BASE || '').trim();
  if (remoteBase && projectBase) {
    const target = remoteBase.replace(/\/+$/, '') + '/';
    const rebase = value => (typeof value === 'string' && value.startsWith(projectBase))
      ? target + value.slice(projectBase.length) : value;
    for (const category of data.categories) {
      for (const item of category.items) {
        item.localUrl = rebase(item.localUrl);
        item.url = item.url.startsWith('http') ? item.url : rebase(item.url);
      }
    }
  }
  if (data.portrait) $('portrait').src = data.portrait;

  const stage = $('project-orbit-stage');
  const cardsRoot = $('project-orbit-cards');
  const coreTrigger = $('my-project-trigger');
  const orbitStatus = $('orbit-status');
  const backBtn = $('orbit-back');
  const resetBtn = $('orbit-reset');
  const categories = data.categories.map(category => ({
    ...category,
    label: category.name.replace(/\bAnd\b/g, '&')
  }));
  const openableCategories = categories.filter(category => Array.isArray(category.items) && category.items.length > 0);
  let autoRaf = null;
  let autoDir = 1;

  if (stage) {
    stage.addEventListener('pointermove', event => {
      const box = stage.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = ((event.clientX - box.left) / box.width) * 100;
      const y = ((event.clientY - box.top) / box.height) * 100;
      stage.style.setProperty('--orbit-x', `${x.toFixed(2)}%`);
      stage.style.setProperty('--orbit-y', `${y.toFixed(2)}%`);
    }, { passive: true });

    stage.addEventListener('pointerleave', () => {
      stage.style.setProperty('--orbit-x', '50%');
      stage.style.setProperty('--orbit-y', '50%');
    });
  }

  function stopAutoFlow() {
    if (!autoRaf) return;
    cancelAnimationFrame(autoRaf);
    autoRaf = null;
  }

  function startAutoFlow() {
    stopAutoFlow();
    if (!cardsRoot || stage?.dataset.state !== 'projects') return;

    const tick = () => {
      if (!cardsRoot || stage?.dataset.state !== 'projects') {
        stopAutoFlow();
        return;
      }
      const max = Math.max(0, cardsRoot.scrollWidth - cardsRoot.clientWidth);
      if (max > 0) {
        cardsRoot.scrollLeft += autoDir * 0.7;
        if (cardsRoot.scrollLeft >= max - 1) autoDir = -1;
        if (cardsRoot.scrollLeft <= 1) autoDir = 1;
      }
      autoRaf = requestAnimationFrame(tick);
    };

    autoRaf = requestAnimationFrame(tick);
  }

  function makeProjectCard(item, categoryLabel, index, total) {
    const card = document.createElement('a');
    card.className = 'orbit-card orbit-card-project';
    card.href = item.url || '#';
    if (item.url) {
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }
    card.style.setProperty('--order', String(index));
    card.style.setProperty('--spread', `${(index - (total - 1) / 2) * 34}px`);

    const thumb = document.createElement('div');
    thumb.className = 'orbit-card-thumb thumbnail-wrap loading';
    const loader = window.getBikeLoaderElement();
    thumb.append(loader);

    const img = new Image();
    img.alt = item.nama || 'Project';
    img.decoding = 'async';
    img.addEventListener('load', () => {
      thumb.classList.remove('loading');
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 350);
    }, { once: true });
    img.addEventListener('error', () => {
      thumb.classList.remove('loading');
      loader.remove();
    }, { once: true });
    if (item.thumbnail) img.src = item.thumbnail;
    else {
      thumb.classList.remove('loading');
      loader.remove();
    }

    const body = document.createElement('div');
    body.className = 'orbit-card-body';
    const cat = document.createElement('span');
    cat.className = 'orbit-card-cat';
    cat.textContent = categoryLabel;
    const title = document.createElement('strong');
    title.className = 'orbit-card-title';
    title.textContent = item.nama || 'Untitled';
    const action = document.createElement('span');
    action.className = 'orbit-card-open';
    action.textContent = 'Buka Website ↗';

    body.append(cat, title, action);
    thumb.append(img);
    card.append(thumb, body);
    return card;
  }

  function makeCategoryCard(category, index, total) {
    const button = document.createElement('button');
    button.className = 'orbit-card orbit-card-category';
    button.type = 'button';
    button.dataset.category = category.name;
    button.style.setProperty('--order', String(index));
    button.style.setProperty('--spread', `${(index - (total - 1) / 2) * 92}px`);
    button.style.setProperty('--spin', `${index % 2 === 0 ? -5 : 5}deg`);

    const cat = document.createElement('span');
    cat.className = 'orbit-card-cat';
    cat.textContent = 'Category';
    const title = document.createElement('strong');
    title.className = 'orbit-card-title';
    title.textContent = category.label;
    const count = document.createElement('span');
    count.className = 'orbit-card-open';
    count.textContent = `${category.items.length} proyek`;

    button.append(cat, title, count);
    return button;
  }

  function renderCategoryBurst() {
    if (!stage || !cardsRoot || !coreTrigger) return;
    stopAutoFlow();
    stage.dataset.state = 'categories';
    coreTrigger.hidden = true;
    backBtn.hidden = true;
    cardsRoot.replaceChildren();
    cardsRoot.classList.remove('is-project-flow', 'is-project-enter', 'is-burst-visible', 'is-burst-animating');
    cardsRoot.scrollLeft = 0;

    const total = openableCategories.length;
    openableCategories.forEach((category, index) => {
      cardsRoot.append(makeCategoryCard(category, index, total));
    });

    if (orbitStatus) orbitStatus.textContent = 'Kategori menyebar ke kanan dan kiri. Pilih satu kategori untuk lihat project slash card.';
    requestAnimationFrame(() => {
      cardsRoot.classList.add('is-burst-visible', 'is-burst-animating');
      setTimeout(() => cardsRoot.classList.remove('is-burst-animating'), 900);
    });
  }

  function renderProjectBurst(category) {
    if (!stage || !cardsRoot || !coreTrigger || !category) return;
    stopAutoFlow();
    stage.dataset.state = 'projects';
    coreTrigger.hidden = true;
    backBtn.hidden = false;
    cardsRoot.replaceChildren();
    cardsRoot.classList.remove('is-burst-visible', 'is-burst-animating', 'is-project-enter');
    cardsRoot.classList.add('is-project-flow', 'is-project-enter');
    cardsRoot.scrollLeft = 0;

    const items = category.items || [];
    const total = items.length;
    items.forEach((item, index) => cardsRoot.append(makeProjectCard(item, category.label.toUpperCase(), index, total)));

    if (orbitStatus) orbitStatus.textContent = `${category.label}: ${total} project aktif. Slash card meledak dari tengah lalu bergerak otomatis kiri ke kanan.`;
    requestAnimationFrame(() => {
      startAutoFlow();
      setTimeout(() => cardsRoot.classList.remove('is-project-enter'), 900);
    });
  }

  if (coreTrigger) {
    coreTrigger.addEventListener('click', renderCategoryBurst);
  }

  if (cardsRoot) {
    cardsRoot.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest('.orbit-card-category') : null;
      if (!target) return;
      const category = openableCategories.find(item => item.name === target.dataset.category);
      if (!category) return;

      target.classList.add('is-activating');
      if (stage) {
        stage.classList.remove('is-transitioning');
        void stage.offsetWidth;
        stage.classList.add('is-transitioning');
      }

      setTimeout(() => {
        target.classList.remove('is-activating');
        if (stage) stage.classList.remove('is-transitioning');
        renderProjectBurst(category);
      }, 260);
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      renderCategoryBurst();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      stopAutoFlow();
      if (stage) {
        stage.dataset.state = 'idle';
        stage.style.setProperty('--orbit-x', '50%');
        stage.style.setProperty('--orbit-y', '50%');
      }
      if (cardsRoot) {
        cardsRoot.replaceChildren();
        cardsRoot.classList.remove('is-burst-visible', 'is-project-flow', 'is-burst-animating', 'is-project-enter');
      }
      if (coreTrigger) coreTrigger.hidden = false;
      if (backBtn) backBtn.hidden = true;
      if (orbitStatus) orbitStatus.textContent = 'Tekan My Project untuk membuka kategori.';
    });
  }

  if (openableCategories.length) {
    if (orbitStatus) orbitStatus.textContent = `Tekan My Project untuk membuka ${openableCategories.length} kategori.`;
  } else if (orbitStatus) {
    orbitStatus.textContent = 'Belum ada kategori dengan project aktif.';
  }

  const app = data.app;
  if (app) {
    $('app-description').textContent = app.description;
    for (const feature of (app.features || [])) {
      const li = document.createElement('li');
      li.textContent = feature;
      $('app-features').append(li);
    }
    if (app.download) {
      $('app-download').href = app.download;
      $('app-download').hidden = false;
      $('app-download').textContent = (app.downloadLabel || 'Download Android APK') + ' ↓';
      $('app-download-note').textContent = 'APK Android · Instalasi manual. ' + (app.downloadNote || 'Versi pengembangan;');
    } else {
      $('app-download-note').textContent = 'Berkas instalasi belum tersedia.';
    }
  }

  window.addEventListener('beforeunload', stopAutoFlow);
})();