# AGENTS.md — Panduan AI Agent Versi "Lebih Murah"

> Undangan pernikahan Amara & Raditya. Versi aslinya adalah single-file HTML
> "premium" — CSS/JS inline, Web Audio sintesis musik, canvas kelopak, kursor
> kustom 3D, gerbang amplop berputar. Dokumen ini mendefinisikan **versi yang
> lebih murah**: sama fungsional & estetika, tapi strip semua fitur pro proses
> berat. AI agent wajib ikuti panduan ini bila ditugaskan membuat/menyederhanakan
> varian murah.

---

## Perintah penting
| Kebutuhan | Perintah |
|---|---|
| Validasi HTML | `npx html-validate --config .htmlvalidate.json Amara&Raditya.html` |
| Cek error JS konsol | Buka di browser, `F12 → Console` kosong tiada `error` |
| Pastikan file terbuka | Buka `file://` di browser, semua section terlihat |
| Commit (atomik) | `git add -A && git commit -m '...'` lalu `git push origin main` |
| Cek ukuran file | `wc -c Amara&Raditya.html` — target < 120 KB gzip untuk versi murah |
| Deploy (manual) | Salin `Amara&Raditya.html` ke `public_html` hosting (subfolder `amara-raka/`) |

> Tidak ada dev server / bundler. Project = satu file HTML static. Jika sebuah
> pengecekan tak bisa dijalankan, tulis "**TIDAK DIJALANKAN**" + alasannya.
> Jangan pernah tulis "lulus" untuk cek yang tidak benar-benya dijalankan.

---

## Aturan wajib
- Hasil akhir tetap **single file HTML** (`Amara&Raditya.html`), semua CSS+JS inline.
- Konten (nama, tanggal, alamat, doa, rekening) **jangan diganti** kecuali dimintakan.
- Font eksternal boleh tetap (Google Fonts `Cormorant Garamond`, `Jost`) — itu murah.
- Font ikon SVG sprite (`symbol#i-…`) **harus dipertahankan** — reusable & nol request ekstra.
- Warna token (`--ink`, `--gold`, `--wax`, dst.) jaga agar konsisten dengan versi premium.
- Setiap perubahan atomik → commit terpisah: `perf: strip canvas petals → CSS confetti`
  atau `refactor: replace Web Audio synth → static .mp3 loop`.
- Perubahan hanya boleh menyentuh `Amara&Raditya.html` (dan `.htmlvalidaterc` bila ditambah).
- Bila rancangan (daftar fitur murah) ternyata salah, **berhenti & laporkan**. Jangan improvisasi.

---

## Struktur file (jangan diubah urutannya)
```
<head>
  <meta>, <title>, deskripsi, favicon SVG inline, Google Fonts
  <style>            ← semua CSS inline
</head>
<body class="locked">
  <svg style="display:none">  ← SVG sprite: ikon (i-music, i-copy, i-map, …) + ornamen (orn-divider, orn-flourish, orn-corner)
  <div class="cursor-*">      ← KURSOR KUSTOM (boleh dihapus di v. murah)
  <div id="gate" class="gate">← GERBANG AMPLOP (bisa disederhanakan)
  <main id="page">
    <section id="beranda">     ← HERO (nama, tanggal, lokasi)
    <section id="countdown">   ← HITUNG MUNDUR (JS Date)
    <section id="mempelai">    ← DUA KARTU MEMPELAI
    <section id="acara">       ← RANGKAIAN ACARA + dresscode
    <section id="galeri">      ← GALERI (lightbox — lihat catatan)
    <section id="kisah">       ← KISAH (4 chapter)
    <section id="rsvp">        ← FORM RSVP + daftar ucapan (localStorage)
    <section id="hadiah">      ← REKENING TRANSFER (copy-to-clipboard)
    <footer class="footer">    ← Footer tutup
  </main>
  <button id="musicBtn">       ← PEMUTAR MUSIK (bisa diganti)
  <div id="toasts">            ← Toast notifikasi
  <div id="lightbox">          ← Lightbox galeri (bisa disederhanakan)
  <script>                     ← semua JS inline
  </body>
```

---

## Ekonomi fitur: apa yang "mahal" vs "murah"

Ringkasan biaya relatif tiap fitur vs alternatif murah. AI agent **wajib**
memilih kolom kanan bila menstrukturkan versi murah.

| Fitur premium (mahal) | Kenapa mahal | Alternatif murah |
|---|---|---|
| **Canvas kelopak jatuh** (`Petals` IIFE, `requestAnimationFrame` 60fps, 10-20 partikel) | CPU/GPU berkelanjutan, baterai drop, mobile jank | Hapus seluruhnya, atau ganti 3-4 CSS `.confetti` statis + `@keyframes` |
| **Web Audio sintesis musik** (`Music` IIFE: AudioContext, delay, biquad, arpeggio 4-chord) | Kompleks, heap audio, sering blocked autoplay | Ganti pakai 1 file `.mp3` `<audio loop>` atau hapus music sama sekali |
| **Kursor kustom split** (`cursor-dot`/`cursor-ring` + `requestAnimationFrame` follow loop) | Loop rerender tiap frame, kursor tak presisi | Hapus; pakai `cursor: auto` native |
| **Gerbang amplop 3D** (`env-flap` rotateX, `wax-seal` break anim, envelope rise, 4× setTimeout 420/1250/2500/3600ms) | Choreografi JS+CSS timing-sensitif, banyak repaint layer | Ganti jadi 1 elemen, fade-out + slide-up lewat CSS animation `@keyframes` tunggal (≤800ms) |
| **Hero parallax** (pointermove → transform ornamen, `will-change:transform`) | Event handler tiap gerakan mouse | Hapus atau ganti CSS `transform: rotate` statis saja |
| **Marquee `-webkit-text-stroke`** (clip + text masking) | Render berulang tiap frame | Ganti jadi warna solid + `transform translateX` anim (lebih murah) tetap boleh |
| **Lightbox keyboard navigation** (ArrowLeft/Right + Escape listener) | Interaktif kompleks | Lightbox tetap boleh, tapi hapus keyboard listener; cukup klik keluar |
| **IntersectionObserver reveal** tiap `.reveal` | 1 observer + kelas transisi | Pertahankan (murah — 1 IO observer) |
| **RSVP localStorage + seed wishes** | Simpan data interaksi | Pertahankan tapi boleh tanpa seed data dummy |
| **Toast notifikasi animasi** | Transisi CSS ringan | Pertahankan (murah) |

### Prioritas strip (urutan)
1. **Wajib hapus dulu**: canvas petals, Web Audio music, kursor kustom. Ini 3
   konsumen resource terbesar.
2. **Boleh sederhanakan**: gerbang amplop (fade saja), parallax hero, keyboard
   lightbox.
3. **Pertahankan penuh**: countdown, scroll reveal, RSVP form, copy-to-clipboard,
   marquee (tapi pakai warna solid), semua ikon SVG, tipografi & warna token.

---

## Konvensi kode (ikuti gaya file asli)
- Dollar-selector ringan `$(s)` / `$$(s)` — jaga.
- `RM` = `prefers-reduced-motion` — semua animasi berat **harus** respect ini.
- `toast(msg, type)` — pakai utilitas yang sudah ada, hapus error `i-x`, success `i-check`.
- Semua string UI tetap Bahasa Indonesia.
- Semua `aria-label`, `aria-live`, `role="dialog"` — jaga aksesibilitas.
- Class nama: kebab-case, semantik (`.sec`, `.reveal`, `.gift-item`).

---

## Verifikasi akhir (ceklist sebelum commit)
- [ ] Buka di Chrome & Firefox desktop — layout rapi, tiada horizontal scroll.
- [ ] Buka di HP (lebar ~390px) — semua text terbaca, tombol tappable (≥44px), nav menu collapse.
- [ ] Console kosong — tidak ada `error` / `promise rejection`.
- [ ] Countdown hitung mundur berjalan tiap detik (atau show `00:00:00` bila lewat).
- [ ] RSVP form validasi: empty name → error; submit → wish muncul di list + localStorage.
- [ ] Tombol Salin (rekening & alamat) → copy ke clipboard + toast sukses.
- [ ] `html-validate` lolos (atau catat error kritis yang tidak fatal).
- [ ] `wc -c` file < 120 KB (target murah).
- [ ] `git add -A && git commit -m '...' && git push origin main`.

---

## Contoh commit message
```
perf: strip canvas petals + Web Audio musik → static audio + CSS confetti
```
```
refactor: gerbang amplop 3D → CSS fade-slide, hapus kursor kustom
```
```
perf: ganti marquee text-stroke → solid warna, hapus parallax hero
```

---

## Penafian
Panduan ini ditulis untuk **AI agent** yang menstrukturkan ulang/ menyederhanakan
file `Amara&Raditya.html` menjadi varian "lebih murah" (lighter). Setiap keputusan
penghapusan fitur harus didokumentasikan di commit message — jelaskan fitur apa
yang dihapus dan gantiannya. Jika menemukan bug di file asli (bug asli, bukan dari
penyederhanaan), beri catatan tapi **jangan fix** kecuali diminta.
