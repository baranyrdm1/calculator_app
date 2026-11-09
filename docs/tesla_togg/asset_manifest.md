# Asset Manifest – Tesla Model Y vs Togg T10X

| Asset | Dosya | Tür | Kaynak |
|---|---|---|---|
| Yan profil (2), önden 3/4 (2), üstten (2), X-ray (2) | `public/tesla_togg/vehicles/*.png` | **Üretilmiş görsel** (yapay zekâ) | ElevenLabs flow `aAprvz7P1m4EWcAElK4W`, `bytedance-seedream-5-pro` |
| Seslendirme (66,2 sn) | `public/tesla_togg/audio/narration.mp3` | Üretilmiş ses | ElevenLabs `eleven_v4`, "Alpaslan - Cinematic Narrator" |
| Kelime zamanlamaları | (caption zamanları kodda) | ElevenLabs Scribe transkripti | aynı flow |
| Müzik/efekt | `public/tesla_togg/audio/music_tt.wav` (git'e alınmaz) | Prosedürel sentez | `scripts/make_audio_tt.py` |

Üstten görseller (`*_top.png`) üretildi ancak final kurguda kullanılmadı.

## Sınırlamalar
- Gerçek 3D model yok; araçlar yapay zekâ görselleridir. **Togg görselleri resmî fotoğraf değildir**; yapay zekâ şeklin genel hatlarını yakalasa da detaylar (far imzası, ızgara, jant) birebir olmayabilir. Tesla için de aynı.
- X-ray görselleri illüstratiftir; batarya/motor yerleşimi ölçekli mühendislik çizimi değildir.
- Yarış çubukları hızlandırılmış animasyondur; gerçek zamanlı 0–100 simülasyonu değildir.
