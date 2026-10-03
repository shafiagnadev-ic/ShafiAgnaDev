/* One renderer for the whole gallery. DOM count is independent of catalog size.
   The wall is static: the cards never move on their own, so there is no animation loop and
   no scheduler — the only thing that changes is the camera, and only when the visitor moves
   it (drag, arrow keys, Home/End, Reset). Everything else here is mount/unmount and hover. */
(function () {
  'use strict';
  const E = window.GalleryEngine;
  class FloatingGallery {
    constructor(data) {
      this.viewport = document.getElementById('gallery-viewport');
      this.layer = document.getElementById('card-layer');
      this.counter = document.getElementById('gallery-count');
      this.status = document.getElementById('motion-status');
      this.mobileQuery = matchMedia('(max-width: 680px)');
      this.data = data;
      this.world = E.createWorld(data, this.mobileQuery.matches);
      this.camera = {x:0,y:0};
      this.nodes = new Map();
      this.hovered = new Set(); this.focused = new Set();
      this.drag = null; this.suppressClick = false;
      document.getElementById('gallery-reset').addEventListener('click', () => {
        this.camera = {x:0,y:0}; this.render();
      });
      this.bindPan();
      this.mobileQuery.addEventListener('change', () => this.resetLayout());
      this.resizeObserver = new ResizeObserver(() => {this.measure(); this.render();});
      this.resizeObserver.observe(this.viewport);
      this.measure(); this.render(); this.syncStatus();
    }
    measure() {
      this.width = this.viewport.clientWidth; this.height = this.viewport.clientHeight;
      this.clampCamera();
    }
    clampCamera() {
      const maxX = this.world.width - this.width, maxY = this.world.height - this.height;
      // Worlds smaller than the viewport are centred instead of pinned to the top-left corner.
      this.camera.x = maxX > 0 ? E.clamp(this.camera.x, 0, maxX) : maxX / 2;
      this.camera.y = maxY > 0 ? E.clamp(this.camera.y, 0, maxY) : maxY / 2;
    }
    resetLayout() {
      this.hovered.clear(); this.focused.clear();
      this.layer.replaceChildren(); this.nodes.clear();
      this.world = E.createWorld(this.data, this.mobileQuery.matches);
      this.camera = {x:0,y:0};
      this.measure(); this.render(); this.syncStatus();
    }
    // Swap the collection in place: the same gallery instance serves every category.
    setData(data) {
      this.data = data;
      this.resetLayout();
    }
    // The status line says what the collection is; there is no motion left to report.
    syncStatus() {
      const empty = !this.data.length;
      this.viewport.classList.toggle('is-empty', empty);
      if (this.status) this.status.textContent = empty ? 'KATEGORI KOSONG' : 'KOLEKSI STATIS';
    }
    makeCard(p) {
      const a = document.createElement('a');
      a.className = 'project-card'; a.dataset.id = String(p.id);
      a.href = p.data.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', `${p.data.nama} — buka website di tab baru`);
      a.draggable = false;
      const glass = document.createElement('div'); glass.className = 'card-glass';
      const wrap = document.createElement('div'); wrap.className = 'thumbnail-wrap loading';
      const loader = window.getBikeLoaderElement ? window.getBikeLoaderElement() : null;
      if (loader) wrap.append(loader);
      const img = new Image(); img.alt = `Preview website ${p.data.nama}`; img.draggable = false;
      img.decoding = 'async'; img.width = 440; img.height = 250;
      const failure = () => {
        if (loader) loader.remove();
        wrap.classList.remove('loading'); img.remove();
        const text = document.createElement('span'); text.className='thumbnail-fallback';
        text.textContent = 'Preview belum tersedia'; wrap.append(text);
      };
      img.addEventListener('load', () => {
        wrap.classList.remove('loading');
        if (loader) {
          loader.style.opacity = '0';
          setTimeout(() => loader.remove(), 400);
        }
      }, {once:true});
      img.addEventListener('error', failure, {once:true});
      wrap.append(img);
      if (p.data.thumbnail) img.src = p.data.thumbnail; else failure();
      // Slashcard body: the card states what it is and what clicking does.
      const body = document.createElement('div'); body.className = 'slash-body';
      const cat = document.createElement('span'); cat.className = 'slash-cat';
      cat.textContent = p.category || this.categoryLabel || 'KARYA';
      const name = document.createElement('span'); name.className = 'slash-name';
      name.textContent = p.data.nama;
      const open = document.createElement('span'); open.className = 'slash-open';
      open.append(document.createTextNode('Buka Website '));
      const arrow = document.createElement('b'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      open.append(arrow);
      body.append(cat, name, open);
      const glare = document.createElement('span'); glare.className = 'card-glare'; glare.setAttribute('aria-hidden', 'true');
      glass.append(wrap, body, glare); a.append(glass);
      // Nothing repaints on its own any more, so hover state asks for a repaint explicitly:
      // that lift is the only thing that moves a card, and the card stays in place.
      a.addEventListener('pointerenter', e => {
        if(e.pointerType==='touch' || this.drag?.moved) return;
        this.hovered.add(p.id); this.render();
      });
      a.addEventListener('pointerleave', () => {if(this.hovered.delete(p.id)) this.render();});
      a.addEventListener('focus', () => {this.focused.add(p.id); this.render();});
      a.addEventListener('blur', () => {if(this.focused.delete(p.id)) this.render();});
      this.layer.append(a); return a;
    }
    render() {
      if (!this.width) return;
      if (!this.data.length) {
        if (this.counter.textContent !== 'Belum ada karya di kategori ini.') this.counter.textContent = 'Belum ada karya di kategori ini.';
        this.viewport.dataset.mounted = '0';
        return;
      }
      const limit = this.world.mobile ? 10 : 32;
      const view = {...this.camera,width:this.width,height:this.height};
      const list = E.visibleItems(this.world,view,limit,this.world.mobile ? 32 : 72);
      // Preserve a keyboard-focused link until focus leaves it, within the same DOM budget.
      for (const id of this.focused) {
        if (!list.some(p=>p.id===id) && this.world.items[id]) {
          if (list.length>=limit) list.pop(); list.push(this.world.items[id]);
        }
      }
      const keep = new Set(list.map(p=>p.id));
      for (const [id,node] of this.nodes) {
        if (!keep.has(id)) {node.remove();this.nodes.delete(id);this.hovered.delete(id);}
      }
      for (const p of list) {
        let node = this.nodes.get(p.id);
        if (!node) {node=this.makeCard(p);this.nodes.set(p.id,node);}
        // Cards sit exactly where the layout put them; only the camera offset changes.
        // The hovered one floats towards the viewer: the wall reads as a 3D space, not a
        // flat plane, and the card itself stays in place.
        const hot = this.hovered.has(p.id) || this.focused.has(p.id);
        node.style.transform = `translate3d(${(p.x-this.camera.x).toFixed(2)}px,${(p.y-this.camera.y).toFixed(2)}px,${hot?110:0}px)`;
      }
      const label = `Menampilkan ${list.length} dari ${this.data.length} website`;
      if (this.counter.textContent !== label) this.counter.textContent=label;
      this.viewport.dataset.mounted=String(list.length);
    }
    bindPan() {
      const el=this.viewport;
      el.addEventListener('dragstart', e=>e.preventDefault());
      el.addEventListener('pointerdown', e => {
        if (!e.isPrimary || e.button!==0) return;
        this.suppressClick=false;
        this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,cx:this.camera.x,cy:this.camera.y,moved:false};
      });
      el.addEventListener('pointermove', e => {
        if (!this.drag || e.pointerId!==this.drag.id) return;
        const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;
        if (!this.drag.moved && Math.hypot(dx,dy)>6) {
          this.drag.moved=true;this.hovered.clear();el.setPointerCapture(e.pointerId);
          el.classList.add('is-dragging');
        }
        if (!this.drag.moved) return;
        e.preventDefault();this.camera.x=this.drag.cx-dx;this.camera.y=this.drag.cy-dy;
        this.clampCamera();this.render();
      });
      const end=e=>{
        if (!this.drag || e.pointerId!==this.drag.id) return;
        this.suppressClick=this.drag.moved;
        this.drag=null;el.classList.remove('is-dragging');
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      };
      window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
      el.addEventListener('lostpointercapture',end);
      el.addEventListener('click', e=>{
        if(this.suppressClick){e.preventDefault();e.stopPropagation();this.suppressClick=false;}
      },true);
      el.addEventListener('keydown',e=>{
        const keySteps={ArrowLeft:[-180,0],ArrowRight:[180,0],ArrowUp:[0,-160],ArrowDown:[0,160]};
        if (keySteps[e.key]) {
          e.preventDefault();const [dx,dy]=keySteps[e.key];
          this.camera.x+=dx;this.camera.y+=dy;this.clampCamera();this.render();
        } else if(e.key==='Home') {e.preventDefault();this.camera={x:0,y:0};this.render();}
        else if(e.key==='End') {e.preventDefault();this.camera={x:this.world.width,y:this.world.height};this.clampCamera();this.render();}
      });
    }
  }
  window.FloatingGallery=FloatingGallery;
})();
