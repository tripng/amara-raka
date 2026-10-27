# AGENTS.md — Panduan AI Agent Undangan Pernikahan Amara & Raditya

> Undangan pernikahan Amara & Raditya. Proyek ini telah dipisahkan dari single-file
> HTML menjadi struktur folder standar: `index.html` (markup), `css/style.css`
> (gaya), `js/main.js` (interaktivitas), & `assets/icons.svg` (SVG sprite).
> Dokumen ini mendefinisikan workflow & verifikasi untuk varian proyek ini.

---

## Perintah penting

| Kebutuhan | Perintah |
|---|---|
| Validasi HTML | `npx html-validate index.html` |
| Cek error JS konsol | Buka di browser, `F12 → Console` kosong tiada `error` |
| Pastikan file terbuka | Salin seluruh folder ke server lokal, buka `http://127.0.0.1:8765/index.html` |
| Cek ukuran aset | `wc -c css/style.css js/main.js assets/icons.svg` |
| Commit (atomik) | `git add -A && git commit -m '...'` lalu `git push origin main` |
| Deploy (manual) | Upload seluruh folder ke hosting (docroot → root proyek, bukan subfolder) |

> Tidak ada dev server / bundler. Project = static site biasa. Jika sebuah
> pengecekan tak bisa dijalankan, tulis "**TIDAK DIJALANKAN**" + alasannya.
> Jangan pernah tulis "lulus" untuk cek yang tidak benar-benya dijalankan.

---

## Struktur file

```text
.
├── index.html              ← markup utama (head + body)
├── css/
│   └── style.css           ← semua CSS (dari inline <style>)
├── js/
│   └── main.js             ← semua JS (dari inline <script>)
├── assets/
│   └── icons.svg           ← SVG sprite (ikon i-* + ornamen orn-*)
├── agent.md                ← panduan ini
└── Amara&Raditya.html      ← file asli (backup / referensi)
```

### Aturan wajib

- Hasil akhir tetap **multi-file static site**, tiap concern dipisah ke file tersendiri.
- Konten (nama, tanggal, alamat, doa, rekening) **jangan diganti** kecuali dimintakan.
- Font eksternal boleh tetap (Google Fonts `Cormorant Garamond`, `Jost`).
- SVG sprite (`symbol#i-…` & `orn-*`) **harus dipertahankan** di `assets/icons.svg`.
- Semua referensi `<use href="...">` harus mengarah ke `assets/icons.svg#<id>`.
- Warna token (`--ink`, `--gold`, `--wax`, dst.) jaga konsisten dengan desain.
- Setiap perubahan atomik → commit terpisah: `refactor: extract CSS/JS/SVG → folder structure`
- Bila rancangan (daftar fitur) ternyata salah, **berhenti & laporkan**. Jangan improvisasi.

---

## Konvensi kode

- Dollar-selector ringan `$(s)` / `$$(s)` — jaga di `js/main.js`.
- `RM` = `prefers-reduced-motion` — semua animasi berat **harus** respect ini.
- `toast(msg, type)` — pakai utilitas yang sudah ada; error `i-x`, success `i-check`
  merujuk ke `assets/icons.svg#i-x` & `assets/icons.svg#i-check`.
- Semua string UI tetap Bahasa Indonesia.
- Semua `aria-label`, `aria-live`, `role="dialog"` — jaga aksesibilitas.
- Class nama: kebab-case, semantik (`.sec`, `.reveal`, `.gift-item`).
- `<svg><use href="assets/icons.svg#<id>"/></svg>` — selalu sertakan width/height
  pada elemen `<svg>` inlinenya supaya tidak collapse.

---

## Verifikasi akhir (ceklist sebelum commit)

- [ ] Buka di Chrome & Firefox desktop — layout rapi, tiada horizontal scroll.
- [ ] Buka di HP (lebar ~390px) — semua text terbaca, tombol tappable (≥44px), nav menu collapse.
- [ ] Console kosong — tidak ada `error` / `promise rejection`.
- [ ] Countdown hitung mundur berjalan tiap detik (atau show `00:00:00` bila lewat).
- [ ] RSVP form validasi: empty name → error; submit → wish muncul di list + localStorage.
- [ ] Tombol Salin (rekening & alamat) → copy ke clipboard + toast sukses.
- [ ] `html-validate index.html` — error yang sama dengan versi asal; catat bila ada baru.
- [ ] `git add -A && git commit -m '...' && git push origin main`.
