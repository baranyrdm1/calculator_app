# Asset Manifest – GT-R R35 vs Corvette C8 belgeseli

Hiçbir kaynak bağlantısı uydurulmamıştır. Aşağıdakilerin hepsi bu oturumda gerçekten üretildi/indirildi.

| Asset | Dosya | Tür | Kaynak | Sahne |
|---|---|---|---|---|
| GT-R yan profil | `public/gtr_c8/vehicles/gtr_side.png` | **Üretilmiş görsel** (yapay zekâ, fotogerçekçi) | ElevenLabs creative flow `W18Y9iyF71OVmpsddjZh`, model `bytedance-seedream-5-pro` | 2 |
| C8 yan profil | `.../c8_side.png` | Üretilmiş görsel | aynı | 2 |
| GT-R önden 3/4 | `.../gtr_front34.png` | Üretilmiş görsel | aynı | 1, 3, 7 |
| C8 önden 3/4 | `.../c8_front34.png` | Üretilmiş görsel | aynı | 1, 3, 7 |
| GT-R üstten | `.../gtr_top.png` | Üretilmiş görsel | aynı | 4 |
| C8 üstten | `.../c8_top.png` | Üretilmiş görsel | aynı | 4 |
| GT-R X-ray | `.../gtr_xray.png` | Üretilmiş görsel, **illüstratif** | aynı | 2 |
| C8 X-ray | `.../c8_xray.png` | Üretilmiş görsel, **illüstratif** (yatay çevrilerek kullanıldı) | aynı | 2 |
| Seslendirme | `public/gtr_c8/audio/narration.mp3` | Üretilmiş ses (TTS), 70,04 sn | ElevenLabs, `eleven_v4`, ses: "Alpaslan - Cinematic Narrator" (`Nq00Jyuquw10YtGgKSf8`) | tümü |
| Müzik + efekt | `public/gtr_c8/audio/music_bed.wav` | **Prosedürel sentez** (`scripts/make_audio.py`) | kod ile üretildi, telifsiz | tümü |
| Yazı tipi | `public/gtr_c8/fonts/space-grotesk-*.woff2` | Açık lisanslı font (OFL) | npm `@fontsource/space-grotesk` | tümü |
| Şematik viraj ve şanzıman animasyonları | `src/gtr/GtrVsC8.tsx` | **Prosedürel SVG animasyon** | kod | 5, 6 |

## Sınırlamalar
- **Gerçek 3D araç modeli kullanılmadı.** Bu ortamda Blender yok ve lisanslı/indirilebilir R35 ve C8 modeline erişim yok. Araçlar fotogerçekçi *üretilmiş görsellerdir*; kamera hareketleri bu görsellerin üzerinde kırpma/zoom ile yapıldı. Yörünge (orbit), patlatılmış görünüm (exploded view) ve gerçek 3D motor/şanzıman animasyonu **yapılmadı**.
- Araç görselleri yapay zekâ ürünüdür; küçük geometri ve rozet farkları olabilir. Üretilen görsellerde marka rozetleri (ör. GT-R, CORVETTE yazıları) görünebilir.
- X-ray görselleri illüstratiftir; iç mekanik yapı ölçekli mühendislik çizimi değildir.
- Verilen turuncu GT-R stüdyo referans görseli bu oturuma **ulaşmadı** (yalnızca video yüklendi). Stüdyo atmosferi prompttaki tarifle (koyu antrasit duvar, amber şeritler, parlak zemin) kuruldu.
