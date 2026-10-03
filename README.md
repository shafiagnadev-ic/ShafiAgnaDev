# Portofolio Shafi Agna

Frontend statis tanpa framework/build step. Tiga cara melihatnya, pilih satu:

1. **Buka `index.html` langsung** (klik dua kali). Semua kartu proyek tetap membuka
   `../Kumpulan/Website/...` di tab baru, dan scene WebGL tetap jalan.
2. **`serve.cmd`** (klik dua kali di folder ini). Skrip ini menyalakan **dua** server — portofolio
   di port **5500** dan folder proyek di port **5510** — lalu membuka browsernya:

       python serve.py                                        # 5500 (portofolio) + 5510 (proyek)
       python serve.py --portfolio-port 8080 --projects-port 8081

   Port 5510 itulah yang membuat `Kumpulan` (3,3 GB) tetap bisa dibuka dari kartu proyek tanpa ikut
   masuk ke folder portofolio. Server proyek juga menahan stylesheet CDN (Google Fonts, Font
   Awesome, Bootstrap Icons) supaya tidak memblokir render — stylesheet lambat yang belum menjawab
   membuat tab proyek kosong putih sampai timeout. Berkas di disk tidak diubah, hanya byte yang
   dikirim server. Matikan dengan `--no-cdn-fix`.

3. **VS Code Live Server:** sudah diperbaiki lewat `.vscode/settings.json`
   (`"liveServer.settings.root": "/.."`), jadi "Go Live" dari folder `Portofolio 2` sekarang
   menyajikan folder **induk** dan membuka `/Portofolio 2/index.html` — tautan `../Kumpulan/...`
   ikut jalan tanpa mengubah cara kamu membuka folder. (Alternatif: buka folder `Agna Files`
   sebagai workspace.) Kalau nilai root itu dihapus, Live Server kembali menyajikan folder ini
   saja dan setiap kartu proyek akan menjawab `Cannot GET /Kumpulan/...`.

> **Penting — jangan jalankan Live Server dari dalam folder `Portofolio 2`.** Kalau root server
> adalah folder ini, permintaan `/Kumpulan/Website/...` keluar dari root dan server menjawab
> `Cannot GET /Kumpulan/Website/...` (proyeknya memang tidak ada di dalam folder ini). Root harus
> folder yang memuat `Portofolio 2` **dan** `Kumpulan`. Ini bukan bug kartu: kartunya benar
> menunjuk ke `../Kumpulan/...`, hanya servernya yang tidak menjangkau ke luar root.

Server lokal ini hanya untuk preview, bukan server produksi.

## Di mana file-file proyeknya

Folder portofolio ini sengaja kecil (±18 MB) supaya gampang di-upload ke hosting. Seluruh berkas
proyek yang berat dipindahkan ke folder sebelah, `../Kumpulan/`:

- `../Kumpulan/Website/` — 280 website proyek (Food & Beverage, Property, E-commerce, dst).
- `../Kumpulan/Apps/` — proyek aplikasi Android MakeMeSmart.
- `../Kumpulan/node_modules/` — Playwright (hanya untuk menjalankan test browser).
- `../Kumpulan/test-results/`, `../Kumpulan/prompt_extracted_media/` — artefak.

Setiap tautan kartu proyek di situs ini menunjuk ke `../Kumpulan/Website/<kategori>/<proyek>/index.html`
dan selalu dibuka di **tab baru** (`target="_blank"`), jadi klik kartu tidak pernah menavigasi
portofolio itu sendiri. Kalau nanti file proyeknya di-host di tempat lain (mis. `https://projects.contoh.com/`),
cukup isi satu baris di `index.html`:

    <script>window.PORTFOLIO_PROJECT_BASE = 'https://projects.contoh.com/';</script>

`js/app.js` akan menukar awalan `../Kumpulan/` pada seluruh 280+ entri katalog tanpa perlu
mengedit satu per satu. `js/gallery.js` memakai URL yang sama, jadi kanvas ikut menyesuaikan.

## Struktur

- `index.html`: Hero → Tentang → Diferensiator → Keahlian (+peta keahlian) → Pengalaman → Belajar → Proyek → Kontak.
- `css/styles.css`: desain responsif, dark/light tokens, glassmorphism, skeleton, reduced motion. Lapisan kaca/animasi ada di blok terakhir file ini agar mudah dilepas. Font di-self-host dari `assets/fonts/` (variable woff2, `font-display:swap`) supaya tidak ada pergantian font setelah halaman tampil dan situs tetap jalan offline.
- `js/gallery-engine.js`: model world, posisi grid statis, batas, dan culling; murni tanpa DOM. Tidak ada steering/drift: kartu tidak pernah bergerak sendiri.
- `js/gallery.js`: FloatingGallery tanpa loop animasi — mounting/unmounting, drag, keyboard, hover. Satu-satunya yang bergerak adalah kamera, dan hanya saat pengunjung menggesernya.
- `js/app.js`: profil, tabel, tema, pemilihan kategori, pencarian lintas kategori, MakeMeSmart.
- `js/profile.js`: satu sumber data keahlian dan pengalaman, dipakai `app.js` dan `charts.js`. Setiap entri boleh membawa kunci ikon merek sebagai nilai ketiga.
- `js/icons.js`: glyph merek untuk daftar keahlian dan peran (Python, HTML, JavaScript, PHP, C#/.NET, Kotlin, Swift, Dart, TypeScript, C, SQL, Git & GitHub, React, Android, iOS). Path berasal dari Simple Icons (CC0-1.0) dan di-vendor supaya tidak butuh CDN. Tiap ikon punya warna tema terang dan varian yang dicerahkan untuk tema gelap, jadi tetap terbaca di kedua tema tanpa gambar terpisah.
- `js/charts.js`: peta keahlian (radar SVG), bar level per bahasa, bar durasi per peran — digambar manual tanpa library chart maupun CDN.
- `js/motion.js`: reveal saat scroll, header kaca, progress bar, nav aktif, count-up, tilt/magnet pointer.
- `js/intro.js`: intro splash dua belahan yang membuka dari tengah layar (center split reveal) saat situs dibuka.
- `js/depth.js`: lapisan kedalaman 3D — tilt pointer, spotlight kursor, parallax aurora, hero yang mundur saat scroll, dan coverflow rail slashcard.
- `js/scene3d.js`: scene 3D asli berbasis WebGL mentah (tanpa library/CDN) — globe titik-titik yang berputar, wireframe meridian/parallel, dan tiga orbit ring. Kamera digerakkan oleh pointer + scroll; warna diambil dari token tema (tema gelap = glow aditif, tema terang = tinta). Tanpa WebGL kanvasnya menghapus dirinya sendiri, dan `prefers-reduced-motion` hanya menggambar satu frame statis.
- `data/catalog.json`: data proyek `{categories:[{name,items:[{nama,url,thumbnail}]}],app,portrait,projectBase}`. Semua `url`/`localUrl` bersifat relatif terhadap folder portofolio (contoh: `../Kumpulan/Website/Food%20And%20Beverage/Bun%20Pao/index.html`); `sourceFolder` tetap relatif terhadap akar sumber (`../Kumpulan`).
- `data/catalog.js`: data yang sama sebagai `window.PORTFOLIO_DATA`, agar bisa dibuka melalui file:// tanpa fetch/CORS.
- `scripts/build_catalog.py`: menghasilkan katalog dari folder sumber dan mengoptimalkan aset.
- `assets/`: thumbnail/foto yang disiapkan untuk portofolio, termasuk `assets/fonts/` (DM Sans + Manrope, variable woff2, self-hosted) dan ikon favicon (`favicon-32.png`, `favicon-180.png`, `favicon-512.png`).
- `favicon.ico`: ikon tab (16/32/48/64/128/256 px) dari logo pita 3D yang diberikan; sumbernya `assets/favicon-512.png`. Ganti `favicon.ico` + `assets/favicon-*.png` bila logonya berubah.
- `downloads/`: installer aplikasi yang ditemukan dari proyek asli (belum ada APK valid, jadi folder ini tidak ada).
- `tests/`: unit test model, browser integration test, test lapisan kaca/animasi, test lapisan 3D, dan `tests/3d-scene.cjs` untuk scene WebGL + tautan tab baru. `node_modules` tidak lagi di folder ini; `tests/playwright.cjs` yang mencarinya di `../Kumpulan/node_modules` (atau lewat `PLAYWRIGHT_MODULE=...`).

## Menjalankan test

Dari folder induk (`Agna Files`), dengan server preview hidup seperti di atas (mis. `serve.cmd`):

    TEST_URL=http://127.0.0.1:5500 node "Portofolio 2/tests/3d-scene.cjs"
    TEST_URL=http://127.0.0.1:5500 node "Portofolio 2/tests/3d-depth.cjs"
    TEST_URL=http://127.0.0.1:5500 node "Portofolio 2/tests/motion-ui.cjs"
    TEST_URL=http://127.0.0.1:5500 node "Portofolio 2/tests/browser.cjs"
    TEST_URL=http://127.0.0.1:5500 node "Portofolio 2/tests/black-theme-check.cjs"
    node --test "Portofolio 2/tests/engine.test.cjs" "Portofolio 2/tests/motion.test.cjs"
    cd "Portofolio 2" && python -m unittest discover -s tests -p 'catalog*.py' -v

## Kanvas dan performa

Dunia virtual lebih besar dari area pandang. Posisi disusun grid tetap dengan jarak kosong dan **tidak pernah berubah** — tidak ada drift, auto-play, maupun pantulan di batas dunia. Kamera digeser melalui pointer/touch drag, bukan scroll. Culling memakai perpotongan posisi model dengan viewport + buffer. Maksimum 32 kartu desktop / 10 kartu mobile berada dalam DOM; katalog keseluruhan tetap berupa objek JavaScript, bukan elemen tersembunyi.

Kartu kanvas memakai bahasa visual slashcard yang sama dengan rail di bawahnya: sudut terpotong (`clip-path`), eyebrow kategori, nama proyek, dan aksi `Buka Website ↗` yang baru menyala saat kartu di-hover atau difokus keyboard. Ukurannya 244×238 px di desktop dan 182×186 px di mobile (dinaikkan dari 236×194/176×154 agar badan slashcard muat); angka ini harus sama di `js/gallery-engine.js` dan `.gallery-viewport .project-card`.

Posisi hanya mengubah `transform: translate3d(x, y, 0|110px)`: kartu duduk tepat di posisi grid-nya, dan yang di-hover terangkat 110px ke depan tanpa berpindah tempat, sedangkan scale hover tetap di layer kaca di dalam kartu. Tidak ada `requestAnimationFrame` sama sekali — `render()` dipanggil saat drag, resize, ganti kategori, reset, dan saat hover berubah. Karena tidak ada loop, tidak ada yang perlu dijeda untuk tab tersembunyi atau galeri di luar viewport.

Drag lebih dari 6px menahan navigasi klik. Pointer capture baru aktif setelah threshold agar klik biasa tetap membuka link aslinya di tab baru. Tombol arah melakukan pan; Home/End menuju batas dunia.

`prefers-reduced-motion: reduce` meniadakan transisi dan skeleton pulsing; kanvasnya sudah statis untuk semua orang, jadi tidak ada gerakan yang perlu dimatikan di sana. Drag, keyboard, dan tautan tetap berfungsi.

Thumbnail menggunakan aset asli proyek bila screenshot tidak ada; bukan klaim screenshot halaman lengkap. Error gambar ditangani dengan fallback teks, bukan skeleton selamanya. Counter menggunakan total data sebenarnya, tidak angka 200+ yang di-hardcode.

Ada indeks pencarian dengan hasil bertahap agar pengguna keyboard/screen reader tidak harus mengandalkan kanvas bergerak.

## Tema hitam (monokrom)

Seluruh palet sekarang hitam–putih, tanpa warna RGB:

- Tema gelap: `--bg:#000`, `--canvas:#050505`, `--ink:#f2f2f2`, `--accent:#f2f2f2` (putih), permukaan
  kaca hitam transparan. Tema terang ikut dinetralkan (`--bg:#f5f5f5`, `--accent:#111`).
- Blob aurora (dulu hijau/kuning/biru/ungu) dan blob ambient di kanvas jadi hitam pekat — kroma 0 —
  jadi kedalamannya tetap ada tanpa warna.
- Blok "Bukti kerja" dan panel MakeMeSmart ikut monokrom; warna tinta keduanya dipindah ke terang
  karena latarnya sekarang gelap.
- Scene WebGL membaca `--accent` dari CSS, jadi globe-nya otomatis ikut putih/hitam tanpa perubahan
  kode di `js/scene3d.js`.
- Blok `prefers-reduced-motion` tidak lagi menyebut animasi blob karena animasinya sudah dihapus.

## Semua kategori tampil di halaman

Satu instance `FloatingGallery` melayani seluruh kategori. Setiap chip kategori di halaman:

- **punya isi** → kanvas langsung bertukar ke koleksi kategori itu (judul, eyebrow, dan deskripsi ikut berubah, kamera reset, jumlah kartu mengikuti `MAX 32 desktop / 10 mobile`), atau
- **kosong** → kanvas menampilkan ajakan `Do you want to be the first?` beserta nama kategori dan tombol mailto; tidak ada kartu yang dipasang dan baris status menulis `KATEGORI KOSONG`.

Kategori yang berisi karya saat ini: Food & Beverage (263), Property (10), E-commerce Online Store (2), Example Startup (2), Travel & Tourism (2), Sport & Fitness (1) — total 280. Sepuluh kategori lain kosong dan menampilkan ajakan tersebut. Dunia virtual yang lebih kecil dari area pandang kini dipusatkan, bukan menempel di sudut kiri atas.

Pencarian mencakup semua kategori (bukan hanya Food & Beverage) dan menampilkan nama kategori pada tiap hasil.

## Animasi, transisi, dan glassmorphism

Seluruh lapisan ini ada di blok terakhir `css/styles.css` dan di `js/motion.js`; menghapus dua blok itu mengembalikan tampilan sebelumnya tanpa efek samping.

- Latar aurora: empat blob `position: fixed` di belakang konten, **statis** (tanpa animasi), dan berada di dalam kontainer `overflow: hidden` supaya tidak pernah memicu scroll horizontal. Warnanya hitam pekat di tema gelap dan abu terang di tema terang — gradien RGB hijau/kuning/biru/ungu sudah dihapus.
- Permukaan kaca: header sticky, panel peta keahlian, chip kategori, kartu galeri, dialog, strip "sedang dipelajari", bagian kontak, dan kartu sosial memakai `background` transparan + `backdrop-filter: blur()` + border terang. Sorotan mengikuti posisi pointer (`--mx`/`--my`).
- Reveal saat scroll: satu `IntersectionObserver` menambahkan `.is-visible`; transisi memakai `opacity`, `transform`, dan `filter`. Elemen tetap terlihat bila JavaScript mati karena kelas `js-motion` hanya ditambahkan oleh skrip.
- Urutan masuk: hero naik berurutan, baris keahlian dan tabel pengalaman menyusul dengan delay bertingkat, kartu galeri fade saat dipasang (dan tidak beranimasi saat sedang di-drag).
- Chart: poligon radar tumbuh dari tengah lalu titik-titiknya muncul bertingkat; bar level dan bar durasi tumbuh ke nilai masing-masing saat section masuk viewport.
- Mikro-interaksi: garis nav bergerak + item aktif, sheen pada tombol primary, tombol "magnet" mengikuti pointer, tilt halus pada foto profil, sheen melintas di blok diferensiator, dialog muncul dengan skala + backdrop blur.
- Ganti tema: `theme-sweep` membuat reveal melingkar dari posisi tombol tema.
- `prefers-reduced-motion: reduce` menonaktifkan semua animasi/transisi, menampilkan seluruh konten tanpa reveal, dan menampilkan chart dalam keadaan final. Preferensi yang berubah saat halaman terbuka juga ditangani.

## Intro center split reveal dan lapisan 3D

Intro dan lapisan 3D hidup di blok terakhir `css/styles.css` plus `js/intro.js` dan `js/depth.js`. Menghapus ketiganya (dan kelas `app-icon thumbnail-wrap loading` pada thumbnail aplikasi) mengembalikan situs ke desain kaca datar.

- **Center split reveal.** Dua belahan `position: fixed` identik, masing-masing di-clip `clip-path: inset()` ke sisi kiri/kanan garis tengah, jadi wordmark `agna /` terbaca sebagai satu tanda sampai kedua belahan itu berputar dan bergeser keluar dari tengah (`translate3d(±112%) rotateY(∓10deg)`). Penutupnya hanya berisi tanda itu — tanpa loader, progress bar, atau counter persen: `js/intro.js` menunggu window selesai memuat lalu membuka, dengan jeda minimum 520ms supaya tandanya sempat terbaca. Selama menutup, hero ditahan (`html.intro-active`) supaya animasi masuknya baru berjalan setelah layar terbuka; failsafe selalu melepas penutup, dan `prefers-reduced-motion` melewati intro sepenuhnya. Overlay berhenti menerima klik begitu mulai membuka. Loader sepeda tetap ada di thumbnail (kanvas, rail, dan ikon aplikasi) sesuai permintaan sebelumnya.
- **Tilt + glare.** Satu listener `pointermove` yang di-delegasi ke `.hardware-card, .slash-card, .social-link, .category-chip, .legend-item, .app-icon, .glass-panel, .card-glass`; posisi pointer disimpan sebagai `--rx/--ry/--tz` sehingga setiap permukaan punya transform 3D sendiri. Kartu galeri yang dipasang belakangan ikut terkena tanpa perlu daftar ulang. Pointer kasar (sentuh) dan reduced motion tidak mendapat tilt sama sekali.
- **Kedalaman lain.** Aurora dan spotlight kursor mengikuti pointer (`--px/--py`), hero mundur ke dalam layar saat di-scroll (`--hero-rx/--hero-ty/--hero-tz`), dan `FloatingGallery` mengangkat kartu yang di-hover 110px ke depan. Ganti kategori langsung menukar kartu tanpa animasi warp pada `#card-layer`.
- **Kartu kanvas interaktif.** Tiap kartu galeri adalah slashcard: eyebrow kategori (diisi dari chip yang aktif), nama proyek dua baris, aksi `Buka Website ↗`, dan lapisan glare yang mengikuti pointer (`--mx/--my` dari `js/depth.js`). Hover/fokus menyalakan aksi, memperbesar thumbnail, memberi border aksen, dan memunculkan glare; klik tetap membuka website di tab baru, dan drag kanvas tetap menahan klik.
- **Rail slashcard interaktif.** Selain tombol panah dan scroll-snap, rail bisa digeser langsung dengan pointer (drag >6px, klik setelah drag ditahan), punya `tabindex` + `aria-label`, dan merespons tombol panah kiri/kanan. Kartu rail di-set `draggable=false` plus `dragstart` dicegah: tanpa itu drag bawaan browser untuk `<a>` memutus aliran pointer di tengah geser.
- **Reveal 3D.** Setiap `[data-reveal]` naik dari kedalaman (`perspective(1400px) translate3d(0,34px,-80px) rotateX(9deg)`) dengan `transform-origin` di bawah. Blok `prefers-reduced-motion` di akhir lapisan mengembalikan seluruh keadaan akhir yang datar.
- **Thumbnail aplikasi.** `.app-icon` memakai kelas `thumbnail-wrap loading`, jadi loader sepeda yang sama muncul selama logo MakeMeSmart belum selesai dimuat (gambar `loading="lazy"` di bawah lipatan) dan menghilang dengan fade saat gambar siap.
- **Header responsif.** Pemilih bahasa sempat mendorong header melewati lebar viewport (scroll horizontal di 700px ke bawah). Di bawah 1000px header membungkus menjadi dua baris dan teks ID/EN/DE/ZH menyusut jadi bendera saja di bawah 680px; `scroll-padding-top` disesuaikan agar anchor tetap tidak tertutup header.

## Kontak dan tautan sosial

Lima tautan sosial tampil di bagian kontak: GitHub (`shafiagnadev-ic`), Instagram (`@shafithropic`), TikTok (`@syafign`), Facebook, dan LinkedIn. Facebook dan LinkedIn belum punya URL profil, jadi untuk sementara keduanya memakai tautan pencarian nama dan diberi `title` sebagai penanda; ganti `href` di `index.html` begitu URL profil asli tersedia. Logo merek memakai Simple Icons (CC0-1.0), disematkan sebagai SVG inline sehingga tetap tampil offline.

## Tes

    node --test tests/engine.test.cjs tests/motion.test.cjs
    npm install --no-save --package-lock=false playwright
    node tests/browser.cjs
    node tests/motion-ui.cjs
    node tests/3d-depth.cjs
    node tests/black-theme-check.cjs
    node tests/3d-intro-frames.cjs && python tests/3d-intro-pixels.py

Browser test memakai Edge terpasang, server lokal port 5500, dan menyimpan laporan di `test-results/browser.json`. Alamat uji bisa diubah dengan variabel TEST_URL.

`tests/black-theme-check.cjs` memeriksa dua permintaan terakhir secara terprogram: seluruh permukaan (termasuk blob glow dan panel) harus netral — kroma maksimum ≤3 dari setiap nilai `rgb()` yang dipakai, tanpa satu pun elemen UI berwarna — dan kartu tidak boleh bergerak sama sekali (transform dan posisi identik selama 3 detik, tidak ada `raf`/`playing`, tidak ada tombol Play/Stop, tidak ada animasi CSS yang mengubah posisi), sementara drag dan Reset tetap bekerja. Screenshot hasilnya: `test-results/black-theme-hero.png` dan `black-theme-gallery.png`.

`python -m http.server` punya antrean koneksi kecil (5), sehingga beberapa tab uji paralel bisa gagal koneksi sesaat. Test mencatatnya sebagai warning (bukan error), sedangkan aset yang benar-benar hilang tetap terdeteksi lewat status 4xx. Untuk lingkungan uji yang bersih:

    python -c "import functools,http.server,socketserver,os; socketserver.TCPServer.request_queue_size=256; http.server.ThreadingHTTPServer(('127.0.0.1',5500), functools.partial(http.server.SimpleHTTPRequestHandler, directory=os.getcwd())).serve_forever()"

`tests/motion-ui.cjs` memeriksa lapisan kaca (header sticky + `backdrop-filter`, panel, dialog), reveal dan animasi chart, bar level/durasi terhadap data `js/profile.js`, lima tautan sosial beserta logonya, sweep tema, regresi galeri, tidak adanya error console, dan sapuan lebar 1440→390 px tanpa overflow. Laporan dan screenshot ada di `test-results/`.

`tests/3d-depth.cjs` memeriksa lapisan 3D secara terprogram: intro menutup viewport lalu benar-benar membuka dan hilang (fase tertutup dikunci dengan menahan request gambar portrait, karena preload font tidak menahan event `load`), hero baru muncul setelah reveal, loader sepeda ada di thumbnail aplikasi sampai gambarnya tiba, toggle foto berputar keluar bidang dengan perspective, tilt menanggapi pointer (dan kembali datar saat pointer pergi), rail slashcard menjadi coverflow saat di-scroll dan bisa digeser dengan pointer maupun tombol panah, kartu kanvas adalah slashcard interaktif (kategori, nama, aksi yang menyala saat hover, glare, dan klik yang tetap membuka tab baru), kartu tidak bergerak saat kategori berganti, tidak ada overflow horizontal pada sapuan 1440→390 px, anchor tetap bebas dari header yang membungkus, dan halaman reduced motion tetap datar tanpa intro. Laporan ada di `test-results/3d-depth.json`.

`tests/3d-intro-frames.cjs` menyimpan tiga frame intro ke `test-results/` (tertutup, saat membuka, setelah terbuka) dan `tests/3d-intro-pixels.py` memeriksa pikselnya karena model teks tidak bisa melihat gambar: frame tertutup harus gelap, tidak boleh ada indikator loading di penutup, tanda harus punya tinta di kedua sisi garis tengah (dan tidak ada salinan lain di jauh kiri), garis tengah harus lebih terang dari sekitarnya, dan frame akhir harus lebih terang karena situs sudah terlihat.

Dua catatan pada `tests/browser.cjs`: pengukuran galeri menunggu font siap dan posisi scroll stabil (`settle()`), dan pemeriksaan tautan APK hanya berjalan bila `catalog.app.download` memang berisi berkas.

`tests/motion-ui.cjs` juga memeriksa kontras teks terhadap piksel di belakangnya. Alatnya ada di luar repo (skrip probe + laporan), tapi hasil akhirnya: seluruh elemen teks yang diuji (166 probe pada tema gelap/terang, lebar 1440 dan 390) memenuhi ambang WCAG AA. Untuk memeriksa ulang setelah mengubah warna, jalankan probe lalu bandingkan rasio kontras per elemen.

## Pembaruan data & publikasi

    python scripts/build_catalog.py

Semua berkas proyek (`Website/`, `Apps/`) berada di `../Kumpulan`, dan `PORTFOLIO_SOURCE=<path>`
bisa dipakai kalau lokasinya berbeda. Skrip ini menulis URL relatif terhadap folder portofolio
(`../Kumpulan/Website/...`), jadi pemindahan folder tidak mengubah data katalog selain awalannya.

## Scene 3D (WebGL)

Lapisan ini ada di `js/scene3d.js` + blok **3D SCENE (WEBGL)** di akhir `css/styles.css` + satu tag
`<canvas id="depth-scene">` di `index.html`. Menghapus ketiganya mengembalikan situs ke lapisan
kedalaman CSS saja.

- **Scene, bukan gambar.** Globe titik (1500 titik pada cangkang bola, ukuran menyesuaikan jarak),
  wireframe 5 parallel + 8 meridian, dan tiga orbit ring dengan kemiringan berbeda — semuanya
  digambar tangan di WebGL 1 tanpa library dan tanpa CDN, jadi tetap jalan lewat `file://` dan
  offline. Titik digambar dengan `gl_PointSize` + jarak kamera, garis dengan `gl.LINES`; keduanya
  berbagi satu vertex shader, jadi hanya ada dua program dan dua draw call per frame.
- **Kamera.** Satu listener pointer (halus, `lerp` 0.06) dan satu listener scroll. Scroll menaikkan
  `yaw`, menurunkan `pitch`, dan menjauhkan kamera (`zoom` 2.6 → 3.15) sehingga globe ikut mundur;
  rotasi dasarnya tetap berjalan sendiri (`spin += dt * 0.16`), jadi tidak ada kesan "berhenti".
- **Warna tema.** `--accent` dibaca dari CSS custom property: tema gelap memakai blending aditif
  (`ONE, ONE`) jadi titiknya bercahaya, tema terang memakai `ONE, ONE_MINUS_SRC_ALPHA` jadi titiknya
  menjadi tinta gelap. Penggantian tema (`data-theme` pada `<html>`) memicu re-read lewat
  `MutationObserver` dan langsung menggambar ulang.
- **Anggaran performa.** Ukuran backing store dibatasi DPR 1.5, loop dijeda saat tab tersembunyi,
  dan kalau 40 dari 120 frame pertama lebih lambat dari 26 ms jumlah titik dipotong separuh. Warna,
  ukuran titik, radius globe, dan posisinya adalah konstanta di bagian atas `js/scene3d.js`
  (`TOTAL_POINTS`, `state.alpha`, `pointSize`, `radius`, `centerX`/`centerY`).
- **Fallback.** Tanpa `WebGLRenderingContext`, tanpa konteks WebGL, atau kalau shader gagal dikompilasi,
  kanvas menghapus dirinya sendiri dan halaman tidak berubah. `prefers-reduced-motion` menggambar
  satu frame statis (tanpa loop) dan tetap merespons scroll/pointer saat itu.
- **Kedalaman foto profil.** `.portrait-img-container` menjadi panggung `preserve-3d` dan fotonya
  `translateZ(34px)`, jadi tilt pointer yang sudah ada memparalaks foto terhadap bingkainya. Panggung
  itu sengaja dipilih karena tidak punya *grouping property* (tanpa `filter`/`backdrop-filter`/
  `overflow`), yang kalau ada akan meratakan kembali kedalamannya.
- **Verifikasi.** `tests/3d-scene.cjs` membaca framebuffer WebGL-nya langsung (`gl.readPixels`) untuk
  membuktikan scene benar-benar menggambar (jumlah piksel menyala dan cakupannya), membandingkan dua
  hash frame untuk membuktikan animasinya jalan — dan tetap identik saat `prefers-reduced-motion` —
  lalu mengklik satu kartu proyek untuk memastikan tab baru membuka proyek dari `../Kumpulan`.

## Pembaruan data & publikasi

Jangan publikasikan seluruh folder sumber secara membabi buta: ada source Android, build caches, dan folder proyek dengan dependensi. Untuk hosting, siapkan paket publik yang mencakup index/CSS/JS/data/aset/download dan hanya berkas website statis yang benar-benar ditautkan. Periksa `data/catalog-report.json` untuk sumber URL, fallback, dan pengecualian. Installer Android pengembangan perlu ditandatangani release untuk distribusi produksi. Keberadaan berkas dan respons unduhan tidak berarti aplikasi telah diuji pemasangannya pada perangkat.
