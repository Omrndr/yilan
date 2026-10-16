# Yılan 🐍

KA.OS tarzında küçük bir yılan oyunu. Bağımlılığı yok, tek bir JavaScript dosyası (`yilan.js`). [korayakdogan.me](https://korayakdogan.me) masaüstündeki `yilan.exe` penceresinde oynanıyor.

## Oynamak

`index.html` dosyasını tarayıcıda aç, ya da [korayakdogan.me](https://korayakdogan.me) adresinde masaüstündeki **Yılan** simgesine tıkla.

| Tuş | İş |
|---|---|
| Ok tuşları / WASD | Yön |
| Boşluk / Enter | Başlat, duraklat, devam |
| Esc / P | Duraklat |
| Dokunmatik | Tahtada kaydır ya da alttaki yön tuşlarını kullan; dokununca başlar |

- 20×20 tahta, duvara ya da kendine çarpınca oyun biter.
- Her yemde yılan uzar ve biraz hızlanır (140 ms'den 65 ms'ye kadar).
- En iyi skor tarayıcıda saklanır (`localStorage`).
- Sekme gizlenince oyun kendiliğinden duraklar.

## Kendi sayfana eklemek

```html
<div id="oyun"></div>
<script src="yilan.js"></script>
<script>
  const oyun = KAYilan.mount(document.getElementById('oyun'), { grid: 20 });
  oyun.focus();
</script>
```

`mount` şu seçenekleri alır:

| Seçenek | Varsayılan | Açıklama |
|---|---|---|
| `grid` | `20` | Tahtanın bir kenarındaki hücre sayısı |
| `touch` | `false` | `true` ise yön tuşları dokunmatik olmayan ekranda da görünür |
| `storageKey` | `"ka-yilan-en-iyi"` | En iyi skorun saklandığı anahtar |

Dönen nesnede `start()`, `pause()`, `toggle()`, `focus()`, `destroy()` ve `state` (`ready` / `play` / `pause` / `over`) var.

Stiller dosyanın içinde, `.ky` önekiyle gelir. Renkler CSS değişkenleriyle değiştirilebilir: `--ky-k`, `--ky-pink`, `--ky-yellow`. Başlıklar için [VT323](https://fonts.google.com/specimen/VT323), gövde için [DM Mono](https://fonts.google.com/specimen/DM+Mono) önerilir; yüklenmezse sistemin monospace yazı tipi kullanılır.

## Lisans

[MIT](LICENSE) © 2026 Koray Akdoğan
