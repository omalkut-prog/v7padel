# 21 · Спека для Макса — фиксы сайта v7padel.com

> **Кому**: Макс (developer / web)
> **Когда**: после прочтения этого документа
> **Срок**: 60-90 минут работы суммарно
> **Среда**: Webflow Designer access нужен (не просто Editor)

## Контекст

Сайт **v7padel.com** на Webflow — нормальный premium-look, 4 языка (EN/RU/TR/UA), 6 страниц, интегрирован с Matchpoint для бронирования.

**Технические дыры найдены при аудите** (2026-04-30):
- Нет meta description ни на одной странице
- Нет Open Graph image (страшная превьюшка при шаринге в WhatsApp/IG)
- Нет hreflang тегов (Google не понимает мультиязычность → каннибализация в SERP)
- Нет Google Analytics, Pixel, TikTok pixel — слепая реклама
- Нет Schema.org — не появляются rich snippets в Google
- Нет cookie banner — KVKK violation в Турции
- Нет email capture — теряем 100% посетителей которые не забронировали

Все эти фиксы — **30-90 минут в Webflow Designer**.

---

## Задачи для Макса

### Задача 1 · Meta descriptions (15 мин)

**Webflow Designer** → каждая страница → правая панель **Page Settings (D)** → раздел **SEO Settings**.

Заполнить **Description** для каждой страницы:

#### Главная (Home)

| Язык | Текст |
|---|---|
| EN | Premium padel club in Antalya. 4 indoor/outdoor courts, professional coaches, daily tournaments. Book online or join V7 membership. |
| RU | Премиум падел-клуб в Анталье. 4 крытых/открытых корта, профессиональные тренеры, ежедневные турниры. Бронируйте онлайн или вступайте в клуб V7. |
| TR | Antalya'da premium padel kulübü. 4 kapalı/açık kort, profesyonel antrenörler, günlük turnuvalar. Online rezervasyon veya V7 üyeliği. |
| UA | Преміум падел-клуб в Анталії. 4 криті/відкриті корти, професійні тренери, щоденні турніри. Бронюйте онлайн або вступайте в клуб V7. |

#### About club

| Язык | Текст |
|---|---|
| EN | About V7 Padel Antalya — premium padel club with 4 modern courts, expert coaches, vibrant community of players from beginners to pros. |
| RU | О клубе V7 Padel Anталья — премиум-клуб с 4 современными кортами, опытными тренерами и активным сообществом игроков любого уровня. |
| TR | V7 Padel Antalya hakkında — 4 modern kort, deneyimli antrenörler, başlangıçtan profesyonele her seviyede oyuncu topluluğu. |
| UA | Про клуб V7 Padel Анталія — преміум-клуб з 4 сучасними кортами, досвідченими тренерами та активною спільнотою гравців. |

#### Membership

| Язык | Текст |
|---|---|
| EN | V7 Padel membership in Antalya. Unlimited play, priority booking, member-only tournaments and events. Choose Club or VIP card. |
| RU | Клубные карты V7 Padel в Анталье. Безлимит игры, приоритетное бронирование, турниры и ивенты только для членов. Club или VIP. |
| TR | V7 Padel Antalya üyelik. Sınırsız oyun, öncelikli rezervasyon, sadece üyelere özel turnuvalar ve etkinlikler. Club veya VIP. |
| UA | Клубні картки V7 Padel в Анталії. Безлімітна гра, пріоритетне бронювання, турніри та івенти лише для членів. Club або VIP. |

#### Learn padel

| Язык | Текст |
|---|---|
| EN | Learn padel in Antalya — group classes, individual training, intro lessons with V7 professional coaches. From beginner to advanced. |
| RU | Учитесь падель в Анталье — групповые занятия, индивидуальные тренировки, intro-уроки с тренерами V7. От новичка до продвинутого. |
| TR | Antalya'da padel öğrenin — grup dersleri, bireysel antrenmanlar, V7 profesyonel antrenörlerle giriş dersleri. Başlangıçtan ileriye. |
| UA | Вчіться падель в Анталії — групові заняття, індивідуальні тренування, intro-уроки з тренерами V7. Від новачка до продвинутого. |

#### Courts

| Язык | Текст |
|---|---|
| EN | V7 Padel courts in Antalya — 3 indoor and 1 outdoor court, premium surface, perfect lighting, climate control. Book online. |
| RU | Корты V7 Padel в Анталье — 3 крытых и 1 открытый корт, премиум-поверхность, идеальное освещение, кондиционирование. Брони онлайн. |
| TR | V7 Padel Antalya kortları — 3 kapalı ve 1 açık kort, premium yüzey, mükemmel aydınlatma, iklim kontrolü. Online rezervasyon. |
| UA | Корти V7 Padel в Анталії — 3 криті та 1 відкритий корт, преміум-поверхня, ідеальне освітлення, кондиціонування. Бронь онлайн. |

#### Contact

| Язык | Текст |
|---|---|
| EN | Contact V7 Padel Antalya — phone, WhatsApp, location, opening hours. Open Mon-Fri 08:00-23:00. |
| RU | Контакты V7 Padel Anталья — телефон, WhatsApp, локация, часы работы. Открыты пн-пт 08:00-23:00. |
| TR | V7 Padel Antalya iletişim — telefon, WhatsApp, konum, çalışma saatleri. Açık Pzt-Cum 08:00-23:00. |
| UA | Контакти V7 Padel Анталія — телефон, WhatsApp, локація, години роботи. Відкрито пн-пт 08:00-23:00. |

---

### Задача 2 · Open Graph image (10 мин)

**Что нужно**: одна картинка 1200×630px PNG/JPG. Логотип V7 на фирменном фоне с кортами/игроками.

**Куда вставить**:
1. Webflow Designer → **Site Settings** → **SEO** → **Default Open Graph Image**
2. Загрузить файл
3. Применить ко всем страницам где не задан индивидуальный OG image

**Если хорошей картинки нет** — взять кадр из имеющихся фото клуба, наложить логотип в Figma/Canva.

---

### Задача 3 · Tracking — GA4 + Meta Pixel + TikTok Pixel (15 мин)

Webflow → **Site Settings** → **Custom Code** → секция **Head Code**:

```html
<!-- Google Analytics GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- Meta Pixel -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
/></noscript>

<!-- TikTok Pixel -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('YOUR_TIKTOK_PIXEL_ID');
  ttq.page();
}(window, document, 'ttq');
</script>
```

**Заменить плейсхолдеры**:
- `G-XXXXXXXXXX` — GA4 Measurement ID (получить в analytics.google.com)
- `YOUR_PIXEL_ID` — Meta Pixel ID (Эрдем знает / Business Manager → Events Manager)
- `YOUR_TIKTOK_PIXEL_ID` — TikTok Pixel ID (если запускаете рекламу TikTok)

---

### Задача 4 · Schema.org LocalBusiness (5 мин)

Webflow → **Site Settings** → **Custom Code** → **Head Code** → добавить:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  "name": "V7 Padel Antalya",
  "image": "https://www.v7padel.com/og-image.jpg",
  "@id": "https://www.v7padel.com/",
  "url": "https://www.v7padel.com/",
  "telephone": "+905467800877",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "ВПИСАТЬ АДРЕС",
    "addressLocality": "Antalya",
    "addressCountry": "TR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "ВПИСАТЬ_LAT",
    "longitude": "ВПИСАТЬ_LNG"
  },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "08:00",
    "closes": "23:00"
  }],
  "sameAs": [
    "https://www.instagram.com/v7padel_antalya/",
    "https://www.tiktok.com/@v7padel_antalya",
    "https://www.facebook.com/[V7-FB-страница]",
    "https://www.youtube.com/channel/UCzz_UDNDMt2b8r18LiPpU7A"
  ]
}
</script>
```

**Заменить**:
- `ВПИСАТЬ АДРЕС` — точный адрес клуба
- `ВПИСАТЬ_LAT` / `ВПИСАТЬ_LNG` — координаты (взять с Google Maps клик правой кнопкой по точке клуба)
- ссылку Facebook добавить если есть

**Что даёт**: через 2-4 недели Google показывает в SERP клуб с часами работы, телефоном, рейтингом, картой — выглядит **в 3 раза заметнее** обычной ссылки.

---

### Задача 5 · hreflang (5 мин)

В **Site Settings** → **Custom Code** → **Head Code** (общее для всех страниц) добавить:

```html
<link rel="alternate" hreflang="en" href="https://www.v7padel.com/" />
<link rel="alternate" hreflang="ru" href="https://www.v7padel.com/ru" />
<link rel="alternate" hreflang="tr" href="https://www.v7padel.com/tr" />
<link rel="alternate" hreflang="uk" href="https://www.v7padel.com/ua" />
<link rel="alternate" hreflang="x-default" href="https://www.v7padel.com/" />
```

**Что даёт**: Google понимает что 4 страницы — это перевод одного контента, не дубль.

---

### Задача 6 · Cookie Consent banner (5 мин)

Webflow → **Site Settings** → **Cookie Consent** → переключатель **Enable**.

Настроить:
- Mode: **Allow & Deny** (выбор для пользователя)
- Категории: **Essential** (всегда вкл) + **Analytics** (можно отказаться) + **Marketing** (можно отказаться)
- Текст на 4 языках — Webflow подставит автоматом из переводов

**Что даёт**: KVKK / GDPR compliance. Без этого юридический риск штрафов в Турции.

---

### Задача 7 · Email capture в footer (15 мин)

Дизайн footer → добавить блок **«Stay in the loop»** с:
- Заголовок «Subscribe to V7 news» (на 4 языках)
- Поле email
- Кнопка «Subscribe»

Backend: интеграция с **Brevo** (бесплатно до 2000 контактов) — у Webflow есть native интеграция через Forms.

**Что даёт**: каждый посетитель который не забронировал — попадает в email-список для retention. По industry benchmark **30-50%** туристов нуждаются в 2-3 касаниях прежде чем забронировать. Email — самое дешёвое касание.

---

## Чеклист проверки после деплоя

После применения всех 7 задач — Макс (или ты) проверяет:

1. **PageSpeed Insights** (https://pagespeed.web.dev/) — ввести v7padel.com → проверить mobile + desktop scores. Должно быть >80.
2. **Google Rich Results Test** (https://search.google.com/test/rich-results) — ввести v7padel.com → подтверждается LocalBusiness schema.
3. **Meta Sharing Debugger** (https://developers.facebook.com/tools/debug/) — ввести v7padel.com → видно красивую превьюшку с лого + текстом.
4. **Cookie banner** — открыть incognito tab → загрузка страницы → банер появляется → выбор сохраняется.
5. **GA4 Real Time** (analytics.google.com → Reports → Realtime) — открыть сайт → видно событие в GA4.
6. **Meta Pixel Helper** (Chrome extension) — открыть сайт → ext показывает PageView event.

---

## Итого

| Задача | Время | Деп |
|---|---:|---|
| 1. Meta descriptions × 6 страниц × 4 языка = 24 текста | 15 мин | — |
| 2. Open Graph image × 1 | 10 мин | картинка 1200×630 |
| 3. Tracking codes (GA4 + Meta + TikTok) | 15 мин | IDs от Эрдема |
| 4. Schema.org LocalBusiness | 5 мин | адрес + координаты |
| 5. hreflang теги | 5 мин | — |
| 6. Cookie banner | 5 мин | — |
| 7. Email capture в footer | 15 мин | Brevo аккаунт |
| Чеклист проверки | 10 мин | — |
| **ИТОГО** | **80 мин** | |

После выполнения — **сайт SEO-полноценный**, аналитика работает, ретаргетинг возможен, email-список начинает расти.

---

## Связанные документы

- [docs/20_ACCESS_LIST.md](20_ACCESS_LIST.md) — какие доступы нужны Claude
- [docs/05_BACKLOG.md](05_BACKLOG.md) — приоритизированный список всех задач
- [docs/19_FULL_AUDIT.md](19_FULL_AUDIT.md) — полный аудит несделанного
