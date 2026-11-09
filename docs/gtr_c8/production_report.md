# Üretim raporu – GT-R R35 vs Corvette C8 (1080×1920, 30 fps, 72,4 sn)

Final: `out/gtr_c8/final/GTR_vs_Corvette_C8.mp4` · Kaynak kod: `src/gtr/GtrVsC8.tsx` (composition `GtrVsC8`) · Render: `npm run render:gtr`

## Gerçekten yapılanlar
- Referans videonun anlatım dili uyarlandı: koyu minimal zemin, tek odak, ince teknik çizgiler, amber vurgu, kelime vurgulu üst caption, sayaç animasyonları, üstten yol/iz diyagramı.
- Türkçe seslendirme (ElevenLabs), Space Grotesk, Ç Ğ İ Ö Ş Ü doğrulandı.
- 7 sahne: hook, felsefe + X-ray geçişi, güç sayaçları, yerleşim (üstten), çekiş (şematik viraj), şanzıman (şematik DCT), final tablo + soru + kısa duraklama.
- Rakamlar yalnızca üretici verisinden (bkz. `sources.md`).
- Prosedürel müzik/ses bedeni + vurgu efektleri, seslendirme altında otomatik kısılır (sidechain), -14 LUFS.

## Yapılmayanlar / sınırlar (dürüst liste)
- **Gerçek 3D model yok**; araçlar yapay zekâ üretimi görseller. Orbit, exploded-view, 3D motor/şanzıman makro animasyonu, lastik temas yaması fiziği, gerçek yol geometrisinde iki aracın aynı virajı almasının *gerçekçi* simülasyonu **yok**. Viraj ve şanzıman sahneleri şematik SVG'dir ve ekranda "şematik" diye etiketlidir.
- Motor/motor-aktarma konumları görseller üzerinde elle işaretlendi, illüstratiftir.
- Motor çalıştırma, turbo, vites, lastik sesleri **yok** (kaynak ses yok); yalnızca sentezlenmiş müzik/vuruşlar var.
- Caption zamanları seslendirmedeki duraklamalardan türetildi; kelime düzeyinde değil ifade düzeyinde senkron.
- Verilen turuncu GT-R stüdyo referans görseli oturuma ulaşmadı.
- Ağırlık dağılımı, kerb ağırlığı, GT-R 0–60 doğrulanamadığı için videoda yok.
- Görsel tutarlılık: görseller ayrı üretildiği için araç ölçeği/kamera yüksekliği sahneler arasında birebir aynı değil.
- Araç görsellerindeki küçük geometri/rozet farkları yapay zekâ kaynaklıdır.
