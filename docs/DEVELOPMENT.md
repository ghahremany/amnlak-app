# راهنمای توسعه امنلاک

## معماری

امنلاک یک Activity اندروید دارد که رابط محلی `assets/www/index.html` را در WebView نمایش می‌دهد. برنامه از Gradle، npm، AndroidX یا سرویس آنلاین استفاده نمی‌کند.

```text
MainActivity.java ── loadUrl ──► assets/www/index.html
        ▲                              │
        └──── window.Android bridge ───┘
```

پل جاوااسکریپت این متدها را ارائه می‌کند: `requestLocation`، `requestFreshLocation`، `printHtml`، `share`، `call`، `sms`، `copy`، `open`، `toast`، `theme` و `exit`.

## فایل‌های اصلی

- `calculators.js`: آرایه‌های `GROUPS` و `CALCS`، فرمول‌ها و توابع کمکی
- `app.js`: رابط کاربری، مسیریابی، جستجو، تاریخچه، تاریخ شمسی، تم و صفحات جانبی
- `styles.css`: طراحی روشن/تیره و انیمیشن‌ها
- `property.js` و `property.css`: نقشه اصلی، موقعیت، ورود و ثبت ملک
- `utm.js` و `utm.css`: تبدیل WGS84/UTM، ترسیم محدوده، محاسبه هندسی و گزارش چاپ
- `index.html`: نوار بالا، منو، اسپلش و محل رندر صفحات
- `MainActivity.java`: WebView، مجوز/GPS و پل چاپ بومی اندروید

## افزودن ماشین‌حساب

یک شیء به `CALCS` اضافه کنید:

```javascript
{
  id: 'sample',
  g: 'material',
  em: '🧱',
  title: 'عنوان ابزار',
  sub: 'توضیح کوتاه',
  desc: 'توضیح بالای فرم',
  fields: [
    { k: 'area', t: 'num', label: 'مساحت', unit: 'متر مربع', def: 100 },
    { k: 'waste', t: 'num', label: 'پرت', unit: 'درصد', def: 5, allowZero: true },
    { k: 'type', t: 'sel', label: 'نوع', opts: [['حالت اول', 1], ['حالت دوم', 1.2]] }
  ],
  calc: function (v) {
    var result = v.area * v.type * (1 + v.waste / 100);
    return {
      main: { label: 'نتیجه', value: r2(result), unit: 'واحد' },
      suggest: 'توضیح تکمیلی',
      rows: [['مقدار پایه', fa(v.area) + ' واحد']]
    };
  },
  notes: ['نکته اول', 'نکته دوم']
}
```

نوع فیلدها:

- `num`: عدد؛ به‌طور پیش‌فرض باید بزرگ‌تر از صفر باشد. با `allowZero: true` صفر نیز پذیرفته می‌شود.
- `sel`: فهرست انتخابی با آرایه `opts`
- `chip`: گزینه‌های دکمه‌ای
- `sw`: کلید روشن/خاموش و ضریب `on`

توابع کمکی: `r0`، `r1`، `r2`، `r3safe`، `ceilTo`، `pct` و `fa`.

## تست فرمول‌ها

```bash
node --check android/src/main/assets/www/calculators.js
node --check android/src/main/assets/www/app.js
```

پیش‌نمایش در مرورگر:

```bash
python3 -m http.server 3000 --directory android/src/main/assets/www
```

## ساخت اندروید

```bash
bash tools/setup-env.sh
bash build.sh
```

شماره نسخه با متغیرهای محیطی قابل تغییر است:

```bash
VCODE=2 VNAME=0.2 bash build.sh
```

برای انتشار رسمی باید یک keystore اختصاصی و `keystore.properties` امن تهیه شود. کلید انتشار و رمزها نباید وارد Git شوند.

## نکات نسخه‌های بعد

- نرخ کمیسیون و مالیات باید پیش از انتشار با تعرفه‌های روز کنترل شود.
- ضرایب مصرف مصالح باید با نظر مهندس عمران و مشخصات فنی پروژه بازبینی شوند.
- برای ماشین‌حساب‌های هندسی پیچیده، شکل شماتیک و حالت‌های چندمقطعی اضافه شود.
- اطلاعات توسعه‌دهنده در `DEV` داخل `app.js` قرار دارد و باید حفظ شود.
