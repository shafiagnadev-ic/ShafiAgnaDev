const {chromium}=require('./playwright.cjs').playwright;
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
// Resolve the page under test from the test file, not from the current directory: the suite
// is meant to be run from the folder that CONTAINS the portfolio (so ../Kumpulan resolves).
const entry=path.join(__dirname,'..','index.html');
const base=process.env.TEST_URL || 'http://127.0.0.1:4173';
(async()=>{
 // Smooth scrolling plus late layout (webfonts, chart svg) moves the target under us,
 // so re-centre every sample and return only once the geometry stops changing.
 const settle=async(pg,id)=>{await pg.evaluate(()=>document.fonts&&document.fonts.ready);let last=null,stable=0;for(let i=0;i<80;i++){
   await pg.evaluate(id=>{document.documentElement.style.scrollBehavior='auto';document.getElementById(id).scrollIntoView({block:'center'});},id);
   const key=await pg.evaluate(id=>{const r=document.getElementById(id).getBoundingClientRect();return [Math.round(r.top),Math.round(r.height),Math.round(window.scrollY)].join(':')},id);
   if(key===last)stable++;else stable=0;last=key;
   if(i>=3&&stable>=2)return;
   await pg.waitForTimeout(90);
 }};
 assert.ok(fs.existsSync(entry),'portfolio entry page exists');
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[]; const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await settle(page,'gallery-viewport');
 await page.waitForSelector('.project-card');
 const total=await page.evaluate(()=>portfolioGallery.world.items.length);
 const count=await page.locator('.project-card').count();
 assert.ok(total>=200,`real FNB total ${total}`);assert.ok(count>0 && count<=32 && count<total);
 // The wall is static: card positions must not change on their own, however long we watch.
 const frozen=await page.evaluate(()=>portfolioGallery.world.items.map(p=>[p.x,p.y]));
 await page.waitForTimeout(700);
 assert.deepEqual(await page.evaluate(()=>portfolioGallery.world.items.map(p=>[p.x,p.y])),frozen,'cards never drift');
 assert.equal(await page.evaluate(()=>'raf' in portfolioGallery),false,'the gallery has no animation loop');
 assert.equal(await page.evaluate(()=>document.getElementById('motion-toggle')),null,'no play/stop control remains');
 const box=await page.locator('#gallery-viewport').boundingBox();
 const prior=await page.evaluate(()=>portfolioGallery.camera.x);
 await page.mouse.move(box.x+box.width-50,box.y+box.height-60);await page.mouse.down();
 await page.mouse.move(box.x+100,box.y+box.height-60,{steps:15});await page.mouse.up();
 assert.ok(await page.evaluate(()=>portfolioGallery.camera.x)>prior);
 await page.locator('#gallery-reset').click();
 const card=page.locator('.project-card').first();await card.hover({force:true});
 const id=Number(await card.getAttribute('data-id'));
 const hover=await page.evaluate(id=>{const p=portfolioGallery.world.items[id];return [p.x,p.y]},id);
 await page.waitForTimeout(180);
 assert.deepEqual(await page.evaluate(id=>{const p=portfolioGallery.world.items[id];return [p.x,p.y]},id),hover);
 assert.equal(await card.getAttribute('target'),'_blank');assert.equal(await card.getAttribute('rel'),'noopener noreferrer');
 const popupPromise=page.waitForEvent('popup');await card.click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');await popup.close();
 assert.ok(page.url().startsWith(base));
 await page.locator('#theme-toggle').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
 // every category with items swaps the canvas
 const withItems=await page.evaluate(()=>PORTFOLIO_DATA.categories.filter(c=>c.items.length).map(c=>[c.name,c.items.length]));
 assert.ok(withItems.length>=6,`${withItems.length} categories carry work`);
 for(const [name,n] of withItems){
   await page.locator(`.category-chip[data-category="${name}"]`).click();
   await page.waitForTimeout(280);
   const state=await page.evaluate(()=>({items:portfolioGallery.data.length,cards:document.querySelectorAll('.project-card').length,empty:document.getElementById('gallery-viewport').classList.contains('is-empty'),title:document.getElementById('gallery-title').textContent}));
   assert.equal(state.items,n,`${name}: gallery holds ${n} items`);
   assert.equal(state.empty,false,`${name}: not shown as empty`);
   assert.ok(state.cards>0&&state.cards<=32,`${name}: ${state.cards} cards mounted`);
   assert.ok(state.title.startsWith(name.replace(/\bAnd\b/,'&')),`${name}: heading follows the chip`);
 }
 // every empty category shows the invitation instead of a blank canvas
 const emptyNames=await page.evaluate(()=>PORTFOLIO_DATA.categories.filter(c=>!c.items.length).map(c=>c.name));
 assert.ok(emptyNames.length>=10,`${emptyNames.length} empty categories`);
 for(const name of emptyNames){
   await page.locator(`.category-chip[data-category="${name}"]`).click();
   await page.waitForTimeout(160);
   const state=await page.evaluate(()=>({empty:document.getElementById('gallery-viewport').classList.contains('is-empty'),cards:document.querySelectorAll('.project-card').length,text:document.getElementById('gallery-empty').innerText,hidden:document.getElementById('gallery-empty').hidden}));
   assert.equal(state.empty,true,`${name}: marked empty`);
   assert.equal(state.hidden,false,`${name}: invitation visible`);
   assert.equal(state.cards,0,`${name}: no cards mounted`);
   assert.match(state.text,/Do you want to be the first\?/,`${name}: first-project invitation shown`);
   assert.ok(state.text.includes(name),`${name}: invitation names the category`);
 }
 // back to a filled category: the invitation hides again
 await page.locator('.category-chip[data-category="Food And Beverage"]').click();await page.waitForTimeout(250);
 const back=await page.evaluate(()=>({hidden:document.getElementById('gallery-empty').hidden,cards:document.querySelectorAll('.project-card').length,cat:document.getElementById('gallery-viewport').dataset.activeCategory}));
 assert.equal(back.cat,'Food And Beverage');assert.equal(back.hidden,true,'invitation hidden again');assert.ok(back.cards>0,'cards are back');
 // search spans every category
 await page.locator('.accessible-index summary').click();
 await page.locator('#project-search').fill('kicks');
 await page.waitForTimeout(200);
 const hits=await page.locator('.search-result').evaluateAll(nodes=>nodes.map(n=>n.innerText.replace(/\s+/g,' ').trim()));
 assert.ok(hits.some(h=>/KICKS/i.test(h)&&/E-commerce/i.test(h)),`search finds a non-food project (${JSON.stringify(hits)})`);
 await page.locator('#project-search').fill('');
 const portrait=await page.locator('#portrait').evaluate(img=>({ok:img.complete&&img.naturalWidth>0}));assert.ok(portrait.ok);
 const download=await page.locator('#app-download').getAttribute('href');
 // catalog.app.download stays null until a real APK exists; verify the link only when there is one
 if(download){const resp=await page.request.get(base+'/'+download);assert.equal(resp.status(),200);assert.ok((await resp.body()).length>10000);}
 else assert.ok(await page.locator('#app-download-note').innerText(),'download note explains the missing APK');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(base);await settle(mobile,'gallery-viewport');await mobile.waitForSelector('.project-card');
 assert.equal(await mobile.evaluate(()=>'raf' in portfolioGallery),false);assert.equal(await mobile.locator('#motion-status').innerText(),'KOLEKSI STATIS');
 assert.ok(await mobile.locator('.project-card').count()<=10);
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const grid=await mobile.evaluate(()=>portfolioGallery.world.items.every(p=>p.x===p.originX&&p.y===p.originY));assert.ok(grid);
 await mobile.locator('#gallery-viewport').focus();await mobile.keyboard.press('ArrowRight');assert.ok(await mobile.evaluate(()=>portfolioGallery.camera.x)>0);
 assert.deepEqual(errors,[]);
 const report={total,desktopMounted:count,mobileMounted:await mobile.locator('.project-card').count(),categoriesWithItems:withItems.length,emptyCategories:emptyNames.length,errors,checks:['virtualization','static wall','drag','hover pause','new tab','light theme','every category renders','empty category invitation','cross-category search','portrait','APK response','reduced motion','keyboard pan','mobile overflow']};
 const out=process.env.SHOT_DIR||path.join(__dirname,'..','..','Kumpulan','test-results');
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
