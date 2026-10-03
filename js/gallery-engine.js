/* Pure positioning model: no DOM, timers or animation scheduler.
   The wall is STATIC by design — cards are laid out once on a fixed grid and never move on
   their own. The only thing that moves is the view, and only when the visitor moves it
   (drag or arrow keys); see js/gallery.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GalleryEngine = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(Math.max(min, max), value));
  function createWorld(data, mobile = false) {
    // Cards carry a slashcard body (category + name + action), so they are taller
    // than the plain thumbnails they replaced. Keep in sync with
    // .gallery-viewport .project-card in the 3D layer of css/styles.css.
    const cardWidth = mobile ? 182 : 244;
    const cardHeight = mobile ? 186 : 238;
    const gapX = mobile ? 48 : 64, gapY = mobile ? 48 : 72;
    const cols = Math.min(mobile ? 8 : 12, Math.max(1, Math.ceil(Math.sqrt(data.length * 1.3))));
    const rows = Math.max(1, Math.ceil(data.length / cols));
    const padding = 42;
    const items = data.map((item, id) => {
      const x = padding + (id % cols) * (cardWidth + gapX);
      const y = padding + Math.floor(id / cols) * (cardHeight + gapY);
      return {id, data:item, x, y, originX:x, originY:y};
    });
    return {items, cardWidth, cardHeight, width:cols * (cardWidth + gapX) - gapX + padding * 2,
      height:rows * (cardHeight + gapY) - gapY + padding * 2, mobile};
  }
  function visibleItems(world, view, limit = 32, buffer = 80) {
    const cx = view.x + view.width / 2, cy = view.y + view.height / 2;
    return world.items.filter(p => p.x + world.cardWidth >= view.x - buffer && p.x <= view.x + view.width + buffer &&
      p.y + world.cardHeight >= view.y - buffer && p.y <= view.y + view.height + buffer)
      .sort((a,b) => Math.hypot(a.x + world.cardWidth/2-cx,a.y+world.cardHeight/2-cy) - Math.hypot(b.x+world.cardWidth/2-cx,b.y+world.cardHeight/2-cy))
      .slice(0,limit);
  }
  return {createWorld, clamp, visibleItems};
});
