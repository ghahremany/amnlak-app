/* ===========================================================
   امنلاک – موتور محاسبات ساختمان‌سازی و معاملات ملکی
   نسخه اولیه ۰.۱
   =========================================================== */

/* --- ابزارهای کمکی --- */
function r0(x) { return Math.round(x); }
function r1(x) { return Math.round(x * 10) / 10; }
function r2(x) { return Math.round(x * 100) / 100; }
function ceilTo(x, step) { return Math.ceil(x / step) * step; }
function pct(x, p) { return x * p / 100; }

/* ===========================================================
   گروه‌ها
   =========================================================== */
var GROUPS = [
  { id: 'structure', name: 'سازه، بتن و آهن', em: '🏗️', color: '#075FB5', sub: 'بتن، ستون، تیر، میلگرد و فولاد' },
  { id: 'material',  name: 'دیوار و مصالح',   em: '🧱', color: '#D88B00', sub: 'بلوک، آجر، ملات، سیمان و ماسه' },
  { id: 'finish',    name: 'نازک‌کاری',       em: '🎨', color: '#168AAD', sub: 'کاشی، رنگ، سنگ، ایزوگام و گچ' },
  { id: 'measure',   name: 'متره و عملیات',   em: '📐', color: '#5C63C7', sub: 'خاکبرداری، خاکریزی، قالب و مساحت' },
  { id: 'cost',      name: 'هزینه ساخت',      em: '💰', color: '#16875B', sub: 'برآورد ساخت، ردیف کار و پیمانکار' },
  { id: 'estate',    name: 'املاک و معاملات', em: '🏠', color: '#E06C3B', sub: 'کمیسیون، رهن، اجاره و قیمت ملک' }
];

/* ===========================================================
   ماشین‌حساب‌ها — ۲۹ ابزار در ۶ گروه
   =========================================================== */
var CALCS = [

/* ---------------- سازه، بتن و آهن ---------------- */
{
  id: 'foundationConcrete', g: 'structure', em: '🧱', title: 'حجم بتن فونداسیون',
  sub: 'محاسبه بتن پی نواری یا منفرد',
  desc: 'حجم بتن مورد نیاز فونداسیون‌های مستطیلی را با لحاظ پرت اجرایی برآورد می‌کند.',
  fields: [
    { k: 'length', t: 'num', label: 'طول هر پی یا مجموع طول نوار', unit: 'متر', def: 20 },
    { k: 'width', t: 'num', label: 'عرض پی', unit: 'متر', def: 0.8 },
    { k: 'height', t: 'num', label: 'ارتفاع بتن', unit: 'متر', def: 0.5 },
    { k: 'count', t: 'num', label: 'تعداد پی مشابه', unit: 'عدد', def: 1 },
    { k: 'waste', t: 'num', label: 'پرت و اضافه سفارش', unit: 'درصد', def: 5 }
  ],
  calc: function (v) {
    var net = v.length * v.width * v.height * v.count;
    var total = net * (1 + v.waste / 100);
    return {
      main: { label: 'بتن پیشنهادی برای سفارش', value: r2(total), unit: 'متر مکعب' },
      suggest: 'تعداد تقریبی تراک‌میکسر ۷ مترمکعبی: ' + fa(Math.ceil(total / 7)) + ' دستگاه',
      rows: [['حجم خالص هندسی', fa(r2(net)) + ' m³'], ['پرت در نظر گرفته‌شده', fa(r2(total - net)) + ' m³'], ['وزن تقریبی بتن', fa(r0(total * 2400)) + ' kg']]
    };
  },
  notes: ['ابعاد نهایی باید از نقشه سازه و با تأیید مهندس ناظر برداشت شود.', 'حجم مگر، پاشنه، شناژ و تغییرات تراز در صورت وجود جداگانه محاسبه شود.', 'ظرفیت واقعی تراک‌میکسر و محدودیت دسترسی کارگاه را از تأمین‌کننده بپرسید.']
},
{
  id: 'slabConcrete', g: 'structure', em: '🏢', title: 'حجم بتن سقف و دال',
  sub: 'برآورد بتن دال توپر بر اساس مساحت',
  desc: 'حجم بتن دال یا سقف توپر را از روی مساحت، ضخامت و تعداد طبقات محاسبه می‌کند.',
  fields: [
    { k: 'area', t: 'num', label: 'مساحت هر سقف', unit: 'متر مربع', def: 120 },
    { k: 'thick', t: 'num', label: 'ضخامت متوسط دال', unit: 'سانتی‌متر', def: 15 },
    { k: 'floors', t: 'num', label: 'تعداد سقف مشابه', unit: 'عدد', def: 1 },
    { k: 'waste', t: 'num', label: 'پرت و اختلاف تراز', unit: 'درصد', def: 5 }
  ],
  calc: function (v) {
    var net = v.area * (v.thick / 100) * v.floors;
    var total = net * (1 + v.waste / 100);
    return {
      main: { label: 'حجم بتن سقف', value: r2(total), unit: 'متر مکعب' },
      suggest: 'سفارش تقریبی: ' + fa(Math.ceil(total / 7)) + ' تراک‌میکسر ۷ مترمکعبی',
      rows: [['حجم خالص', fa(r2(net)) + ' m³'], ['سیمان تقریبی با عیار ۳۵۰', fa(r0(total * 350 / 50)) + ' کیسه ۵۰ kg'], ['وزن تقریبی بتن', fa(r0(total * 2.4)) + ' تن']]
    };
  },
  notes: ['این محاسبه برای دال توپر است؛ تیرچه‌بلوک، وافل و عرشه فولادی ضرایب متفاوت دارند.', 'حجم تیرها، کتیبه‌ها، پله و بازشوها باید طبق نقشه اصلاح شود.', 'ضخامت دال را بدون تأیید طراح سازه تغییر ندهید.']
},
{
  id: 'columnConcrete', g: 'structure', em: '▥', title: 'حجم بتن ستون',
  sub: 'محاسبه ستون‌های بتنی مستطیلی',
  desc: 'حجم بتن مجموعه ستون‌های هم‌اندازه را با ابعاد سانتی‌متری و ارتفاع طبقه برآورد می‌کند.',
  fields: [
    { k: 'a', t: 'num', label: 'عرض ستون', unit: 'سانتی‌متر', def: 40 },
    { k: 'b', t: 'num', label: 'طول ستون', unit: 'سانتی‌متر', def: 40 },
    { k: 'height', t: 'num', label: 'ارتفاع هر ستون', unit: 'متر', def: 3.2 },
    { k: 'count', t: 'num', label: 'تعداد ستون در هر طبقه', unit: 'عدد', def: 12 },
    { k: 'floors', t: 'num', label: 'تعداد طبقات مشابه', unit: 'عدد', def: 1 },
    { k: 'waste', t: 'num', label: 'پرت بتن', unit: 'درصد', def: 5 }
  ],
  calc: function (v) {
    var net = (v.a / 100) * (v.b / 100) * v.height * v.count * v.floors;
    var total = net * (1 + v.waste / 100);
    return { main: { label: 'حجم بتن ستون‌ها', value: r2(total), unit: 'متر مکعب' },
      suggest: 'حجم متوسط هر ستون: ' + fa(r2(net / (v.count * v.floors))) + ' متر مکعب',
      rows: [['حجم خالص کل', fa(r2(net)) + ' m³'], ['تعداد کل ستون', fa(r0(v.count * v.floors)) + ' عدد'], ['وزن تقریبی بتن', fa(r0(total * 2400)) + ' kg']] };
  },
  notes: ['ابعاد ستون ممکن است در طبقات مختلف تغییر کند؛ هر تیپ را جدا محاسبه کنید.', 'حجم میلگرد از حجم بتن کسر نمی‌شود.', 'ارتفاع خالص بتن‌ریزی را از روی نقشه اجرایی وارد کنید.']
},
{
  id: 'beamConcrete', g: 'structure', em: '➖', title: 'حجم بتن تیر',
  sub: 'برآورد بتن تیرهای بتنی',
  desc: 'حجم تیرهای مستطیلی را بر اساس طول کل، عرض و ارتفاع مقطع محاسبه می‌کند.',
  fields: [
    { k: 'length', t: 'num', label: 'مجموع طول تیرها', unit: 'متر', def: 80 },
    { k: 'width', t: 'num', label: 'عرض تیر', unit: 'سانتی‌متر', def: 35 },
    { k: 'height', t: 'num', label: 'ارتفاع کل تیر', unit: 'سانتی‌متر', def: 50 },
    { k: 'waste', t: 'num', label: 'پرت بتن', unit: 'درصد', def: 5 }
  ],
  calc: function (v) {
    var net = v.length * (v.width / 100) * (v.height / 100);
    var total = net * (1 + v.waste / 100);
    return { main: { label: 'حجم بتن تیرها', value: r2(total), unit: 'متر مکعب' },
      suggest: 'بتن خالص بدون پرت: ' + fa(r2(net)) + ' متر مکعب',
      rows: [['سطح مقطع تیر', fa(r2(v.width * v.height / 10000)) + ' m²'], ['پرت اجرایی', fa(r2(total - net)) + ' m³'], ['وزن تقریبی بتن', fa(r0(total * 2400)) + ' kg']] };
  },
  notes: ['در تیرهای یکپارچه با دال، از دوباره‌شماری ضخامت مشترک دال و تیر جلوگیری کنید.', 'برای مقاطع متغیر یا تیرهای با تیپ متفاوت، محاسبات جدا انجام شود.', 'ابعاد اجرایی باید با نقشه مصوب سازه منطبق باشد.']
},
{
  id: 'rebarWeight', g: 'structure', em: '🔩', title: 'وزن میلگرد',
  sub: 'محاسبه وزن و تعداد شاخه میلگرد',
  desc: 'وزن میلگرد را با رابطه استاندارد وزن واحد طول d²/162 برآورد می‌کند.',
  fields: [
    { k: 'dia', t: 'num', label: 'قطر میلگرد', unit: 'میلی‌متر', def: 16 },
    { k: 'length', t: 'num', label: 'طول هر قطعه', unit: 'متر', def: 12 },
    { k: 'count', t: 'num', label: 'تعداد قطعه', unit: 'عدد', def: 100 },
    { k: 'waste', t: 'num', label: 'پرت برش و خم', unit: 'درصد', def: 7 }
  ],
  calc: function (v) {
    var unit = v.dia * v.dia / 162;
    var netLength = v.length * v.count;
    var totalLength = netLength * (1 + v.waste / 100);
    var weight = totalLength * unit;
    return { main: { label: 'وزن تقریبی میلگرد', value: r1(weight), unit: 'کیلوگرم' },
      suggest: 'معادل ' + fa(r2(weight / 1000)) + ' تن میلگرد',
      rows: [['وزن هر متر', fa(r3safe(unit)) + ' kg'], ['طول با احتساب پرت', fa(r1(totalLength)) + ' m'], ['شاخه ۱۲ متری مورد نیاز', fa(Math.ceil(totalLength / 12)) + ' شاخه']] };
  },
  notes: ['وزن واقعی کارخانه ممکن است در محدوده رواداری استاندارد با مقدار نظری تفاوت داشته باشد.', 'اورلب، خم، سنجاقی و ریشه ستون را در طول قطعات لحاظ کنید.', 'برای هر قطر میلگرد یک محاسبه جدا انجام دهید.']
},
{
  id: 'steelEstimate', g: 'structure', em: '⚙️', title: 'برآورد آهن مصرفی ساختمان',
  sub: 'تخمین اولیه فولاد بر اساس زیربنا',
  desc: 'تناژ تقریبی فولاد یا میلگرد کل پروژه را با ضرایب متداول سرانگشتی محاسبه می‌کند.',
  fields: [
    { k: 'area', t: 'num', label: 'زیربنای هر طبقه', unit: 'متر مربع', def: 150 },
    { k: 'floors', t: 'num', label: 'تعداد طبقات محاسباتی', unit: 'عدد', def: 5 },
    { k: 'rate', t: 'sel', label: 'ضریب تقریبی مصرف فولاد', opts: [['بتن‌آرمه سبک — ۴۰ kg/m²', 40], ['بتن‌آرمه معمولی — ۵۰ kg/m²', 50], ['اسکلت فولادی معمولی — ۶۰ kg/m²', 60], ['سازه سنگین — ۷۵ kg/m²', 75]] },
    { k: 'waste', t: 'num', label: 'پرت و اتصالات', unit: 'درصد', def: 7 }
  ],
  calc: function (v) {
    var totalArea = v.area * v.floors;
    var net = totalArea * v.rate;
    var gross = net * (1 + v.waste / 100);
    return { main: { label: 'فولاد تقریبی پروژه', value: r2(gross / 1000), unit: 'تن' },
      suggest: 'مصرف نهایی سرانگشتی: ' + fa(r1(gross / totalArea)) + ' کیلوگرم بر متر مربع',
      rows: [['زیربنای کل', fa(r0(totalArea)) + ' m²'], ['وزن خالص', fa(r0(net)) + ' kg'], ['پرت و اتصالات', fa(r0(gross - net)) + ' kg']] };
  },
  notes: ['این ضریب فقط برای امکان‌سنجی اولیه است و جایگزین لیستوفر نقشه سازه نیست.', 'دهانه‌ها، تعداد طبقات، سیستم لرزه‌ای، خاک و معماری بر وزن نهایی اثر جدی دارند.', 'برای خرید، وزن دقیق از نقشه‌های اجرایی و لیست برش استخراج شود.']
},

/* ---------------- دیوار و مصالح ---------------- */
{
  id: 'blockCount', g: 'material', em: '🧱', title: 'تعداد آجر و بلوک دیوار',
  sub: 'محاسبه تعداد مصالح دیوارچینی',
  desc: 'تعداد آجر یا بلوک مورد نیاز را از مساحت خالص دیوار و ابعاد نمای قطعه محاسبه می‌کند.',
  fields: [
    { k: 'length', t: 'num', label: 'مجموع طول دیوارها', unit: 'متر', def: 40 },
    { k: 'height', t: 'num', label: 'ارتفاع دیوار', unit: 'متر', def: 3 },
    { k: 'opening', t: 'num', label: 'مساحت در و پنجره‌ها', unit: 'متر مربع', def: 10, allowZero: true },
    { k: 'face', t: 'sel', label: 'نوع و سطح نمای قطعه با بند', opts: [['بلوک ۲۰×۴۰ — حدود ۱۲.۵ عدد/m²', 0.08], ['بلوک ۲۰×۵۰ — حدود ۱۰ عدد/m²', 0.10], ['آجر سفالی ۲۰×۲۰ — حدود ۲۵ عدد/m²', 0.04], ['آجر فشاری نما — حدود ۷۰ عدد/m²', 0.0143]] },
    { k: 'waste', t: 'num', label: 'پرت شکست و برش', unit: 'درصد', def: 7 }
  ],
  calc: function (v) {
    var gross = v.length * v.height;
    var net = Math.max(0, gross - v.opening);
    var count = Math.ceil(net / v.face * (1 + v.waste / 100));
    return { main: { label: 'تعداد مورد نیاز', value: count, unit: 'عدد' },
      suggest: 'تعداد خالص قبل از پرت: ' + fa(Math.ceil(net / v.face)) + ' عدد',
      rows: [['مساحت ناخالص دیوار', fa(r2(gross)) + ' m²'], ['مساحت خالص', fa(r2(net)) + ' m²'], ['پرت منظورشده', fa(v.waste) + '٪']] };
  },
  notes: ['ابعاد واقعی محصول و ضخامت بند ملات را از تولیدکننده کنترل کنید.', 'دیوارهای با ضخامت دو قطعه‌ای یا الگوی خاص باید با ضریب مناسب اصلاح شوند.', 'مقدار پرت در شکستگی زیاد و برش‌های متعدد افزایش می‌یابد.']
},
{
  id: 'mortarVolume', g: 'material', em: '🥣', title: 'حجم ملات دیوارچینی',
  sub: 'برآورد ملات بین آجر یا بلوک',
  desc: 'حجم ملات دیوارچینی را با درصد ملات از حجم کلی دیوار محاسبه می‌کند.',
  fields: [
    { k: 'area', t: 'num', label: 'مساحت خالص دیوار', unit: 'متر مربع', def: 100 },
    { k: 'thick', t: 'num', label: 'ضخامت دیوار', unit: 'سانتی‌متر', def: 20 },
    { k: 'ratio', t: 'sel', label: 'سهم تقریبی ملات از حجم دیوار', opts: [['بلوک دقیق — ۱۰٪', 10], ['بلوک یا سفال معمولی — ۱۵٪', 15], ['آجر با بند زیاد — ۲۰٪', 20]] },
    { k: 'waste', t: 'num', label: 'پرت ملات', unit: 'درصد', def: 10 }
  ],
  calc: function (v) {
    var wall = v.area * v.thick / 100;
    var net = wall * v.ratio / 100;
    var total = net * (1 + v.waste / 100);
    return { main: { label: 'حجم ملات مورد نیاز', value: r2(total), unit: 'متر مکعب' },
      suggest: 'برای کارگاه، حداقل ' + fa(r2(total)) + ' متر مکعب ملات آماده شود',
      rows: [['حجم هندسی دیوار', fa(r2(wall)) + ' m³'], ['ملات خالص', fa(r2(net)) + ' m³'], ['پرت ملات', fa(r2(total - net)) + ' m³']] };
  },
  notes: ['درصد ملات تابع ابعاد مصالح، ضخامت بند و مهارت اجراست.', 'ملات خشک حجمی بیشتر از ملات ساخته‌شده دارد؛ این محاسبه حجم ملات تر است.', 'برای دیوارهای هبلکس با چسب مخصوص از مقدار مصرف درج‌شده روی محصول استفاده کنید.']
},
{
  id: 'cementBags', g: 'material', em: '🛍️', title: 'تعداد کیسه سیمان بتن',
  sub: 'برآورد سیمان از حجم و عیار بتن',
  desc: 'تعداد کیسه‌های ۵۰ کیلویی سیمان را برای حجم مشخص بتن و عیار انتخابی محاسبه می‌کند.',
  fields: [
    { k: 'volume', t: 'num', label: 'حجم بتن', unit: 'متر مکعب', def: 10 },
    { k: 'grade', t: 'sel', label: 'عیار سیمان', opts: [['عیار ۲۵۰ kg/m³', 250], ['عیار ۳۰۰ kg/m³', 300], ['عیار ۳۵۰ kg/m³', 350], ['عیار ۴۰۰ kg/m³', 400]] },
    { k: 'waste', t: 'num', label: 'پرت و کسری کارگاه', unit: 'درصد', def: 5 }
  ],
  calc: function (v) {
    var kg = v.volume * v.grade * (1 + v.waste / 100);
    return { main: { label: 'سیمان مورد نیاز', value: Math.ceil(kg / 50), unit: 'کیسه ۵۰ کیلویی' },
      suggest: 'وزن کل سیمان: ' + fa(r0(kg)) + ' کیلوگرم',
      rows: [['سیمان خالص', fa(r0(v.volume * v.grade)) + ' kg'], ['پرت', fa(r0(kg - v.volume * v.grade)) + ' kg'], ['عیار انتخابی', fa(v.grade) + ' kg/m³']] };
  },
  notes: ['طرح اختلاط نهایی باید توسط آزمایشگاه یا مهندس پروژه تعیین شود.', 'عیار سیمان به‌تنهایی تضمین‌کننده مقاومت بتن نیست.', 'برای بتن آماده، عیار و رده مقاومتی را در سفارش رسمی درج کنید.']
},
{
  id: 'sandMortar', g: 'material', em: '⏳', title: 'ماسه و سیمان ملات',
  sub: 'محاسبه مصالح ملات ماسه‌سیمان',
  desc: 'مقدار تقریبی ماسه و سیمان را برای حجم ملات تر و نسبت اختلاط حجمی برآورد می‌کند.',
  fields: [
    { k: 'volume', t: 'num', label: 'حجم ملات تر مورد نیاز', unit: 'متر مکعب', def: 2 },
    { k: 'mix', t: 'sel', label: 'نسبت حجمی سیمان به ماسه', opts: [['۱ به ۳', 3], ['۱ به ۴', 4], ['۱ به ۵', 5], ['۱ به ۶', 6]] },
    { k: 'dry', t: 'num', label: 'ضریب تبدیل تر به خشک', unit: 'ضریب', def: 1.33 },
    { k: 'waste', t: 'num', label: 'پرت مصالح', unit: 'درصد', def: 5 }
  ],
  calc: function (v) {
    var dryVol = v.volume * v.dry * (1 + v.waste / 100);
    var cementVol = dryVol / (1 + v.mix);
    var sandVol = dryVol * v.mix / (1 + v.mix);
    var cementKg = cementVol * 1440;
    return { main: { label: 'ماسه مورد نیاز', value: r2(sandVol), unit: 'متر مکعب' },
      suggest: 'سیمان پیشنهادی: ' + fa(Math.ceil(cementKg / 50)) + ' کیسه ۵۰ کیلویی',
      rows: [['حجم خشک کل', fa(r2(dryVol)) + ' m³'], ['حجم سیمان', fa(r2(cementVol)) + ' m³'], ['وزن تقریبی سیمان', fa(r0(cementKg)) + ' kg']] };
  },
  notes: ['رطوبت و دانه‌بندی ماسه باعث تغییر حجم پیمانه‌ای می‌شود.', 'ضریب حجم خشک معمولاً بین ۱.۲۷ تا ۱.۳۵ در نظر گرفته می‌شود.', 'نسبت مناسب ملات باید با مشخصات فنی پروژه تطبیق داده شود.']
},
{
  id: 'wallPlaster', g: 'material', em: '🧰', title: 'حجم اندود سیمانی دیوار',
  sub: 'محاسبه ملات آستر یا پلاستر',
  desc: 'حجم ملات اندود سیمانی را از روی مساحت، ضخامت و تعداد لایه‌ها محاسبه می‌کند.',
  fields: [
    { k: 'area', t: 'num', label: 'مساحت سطح', unit: 'متر مربع', def: 100 },
    { k: 'thick', t: 'num', label: 'ضخامت هر لایه', unit: 'میلی‌متر', def: 15 },
    { k: 'layers', t: 'num', label: 'تعداد لایه', unit: 'عدد', def: 1 },
    { k: 'waste', t: 'num', label: 'پرت و ناهمواری سطح', unit: 'درصد', def: 15 }
  ],
  calc: function (v) {
    var net = v.area * v.thick / 1000 * v.layers;
    var total = net * (1 + v.waste / 100);
    return { main: { label: 'ملات اندود مورد نیاز', value: r2(total), unit: 'متر مکعب' },
      suggest: 'حجم خالص اندود: ' + fa(r2(net)) + ' متر مکعب',
      rows: [['ضخامت کل', fa(r1(v.thick * v.layers)) + ' mm'], ['اضافه ناهمواری و پرت', fa(r2(total - net)) + ' m³'], ['مساحت اجرا', fa(r1(v.area)) + ' m²']] };
  },
  notes: ['ناشاقولی دیوار و کروم‌بندی می‌تواند مصرف ملات را افزایش دهد.', 'ضخامت زیاد باید در چند لایه و مطابق دستور فنی اجرا شود.', 'مساحت بازشوها را پیش از ورود از سطح کل کم کنید.']
},

/* ---------------- نازک‌کاری ---------------- */
{
  id: 'tileCount', g: 'finish', em: '🔲', title: 'کاشی و سرامیک',
  sub: 'محاسبه تعداد قطعه و کارتن',
  desc: 'تعداد کاشی یا سرامیک لازم را بر اساس مساحت، ابعاد قطعه، پرت و تعداد داخل کارتن محاسبه می‌کند.',
  fields: [
    { k: 'area', t: 'num', label: 'مساحت خالص اجرا', unit: 'متر مربع', def: 80 },
    { k: 'length', t: 'num', label: 'طول هر قطعه', unit: 'سانتی‌متر', def: 60 },
    { k: 'width', t: 'num', label: 'عرض هر قطعه', unit: 'سانتی‌متر', def: 60 },
    { k: 'perBox', t: 'num', label: 'تعداد قطعه در هر کارتن', unit: 'عدد', def: 4 },
    { k: 'waste', t: 'num', label: 'پرت برش و ذخیره', unit: 'درصد', def: 10 }
  ],
  calc: function (v) {
    var pieceArea = v.length * v.width / 10000;
    var pieces = Math.ceil(v.area * (1 + v.waste / 100) / pieceArea);
    var boxes = Math.ceil(pieces / v.perBox);
    return { main: { label: 'تعداد کارتن مورد نیاز', value: boxes, unit: 'کارتن' },
      suggest: 'حداقل ' + fa(pieces) + ' قطعه کاشی یا سرامیک',
      rows: [['مساحت با پرت', fa(r2(v.area * (1 + v.waste / 100))) + ' m²'], ['مساحت هر قطعه', fa(r3safe(pieceArea)) + ' m²'], ['تعداد قطعه خرید', fa(boxes * v.perBox) + ' عدد']] };
  },
  notes: ['متراژ هر کارتن درج‌شده روی بسته را با نتیجه کنترل کنید.', 'برای نصب قطری، طرح‌های شلوغ و فضاهای پرشکست پرت بیشتری در نظر بگیرید.', 'چند قطعه سالم برای تعمیرات آینده نگهداری کنید.']
},
{
  id: 'paint', g: 'finish', em: '🪣', title: 'مقدار رنگ ساختمان',
  sub: 'برآورد لیتر رنگ دیوار و سقف',
  desc: 'مقدار رنگ را با توجه به مساحت، تعداد دست اجرا، پوشش هر لیتر و پرت محاسبه می‌کند.',
  fields: [
    { k: 'area', t: 'num', label: 'مساحت سطح قابل رنگ', unit: 'متر مربع', def: 150 },
    { k: 'coats', t: 'num', label: 'تعداد دست رنگ', unit: 'دست', def: 2 },
    { k: 'coverage', t: 'num', label: 'پوشش هر لیتر در یک دست', unit: 'm²/L', def: 10 },
    { k: 'waste', t: 'num', label: 'پرت و جذب سطح', unit: 'درصد', def: 10 }
  ],
  calc: function (v) {
    var net = v.area * v.coats / v.coverage;
    var total = net * (1 + v.waste / 100);
    return { main: { label: 'رنگ مورد نیاز', value: r1(total), unit: 'لیتر' },
      suggest: 'رو به بالا تهیه شود: حدود ' + fa(Math.ceil(total)) + ' لیتر',
      rows: [['مصرف خالص', fa(r1(net)) + ' L'], ['سطح معادل همه دست‌ها', fa(r0(v.area * v.coats)) + ' m²'], ['پرت و جذب', fa(r1(total - net)) + ' L']] };
  },
  notes: ['پوشش واقعی به جنس رنگ، رنگ زمینه، ابزار اجرا و کیفیت سطح وابسته است.', 'آستر و پرایمر را جداگانه و طبق دستور سازنده محاسبه کنید.', 'عدد پوشش روی ظرف رنگ، مرجع دقیق‌تری برای محصول انتخابی است.']
},
{
  id: 'facadeStone', g: 'finish', em: '🪨', title: 'سنگ نما و کف',
  sub: 'محاسبه متراژ و تعداد پلاک سنگ',
  desc: 'مقدار سنگ مورد نیاز را از مساحت خالص، ابعاد پلاک و پرت برش محاسبه می‌کند.',
  fields: [
    { k: 'area', t: 'num', label: 'مساحت ناخالص سطح', unit: 'متر مربع', def: 100 },
    { k: 'opening', t: 'num', label: 'مساحت بازشوها', unit: 'متر مربع', def: 15, allowZero: true },
    { k: 'length', t: 'num', label: 'طول پلاک', unit: 'سانتی‌متر', def: 80 },
    { k: 'width', t: 'num', label: 'عرض پلاک', unit: 'سانتی‌متر', def: 40 },
    { k: 'waste', t: 'num', label: 'پرت برش و سورت', unit: 'درصد', def: 12 }
  ],
  calc: function (v) {
    var net = Math.max(0, v.area - v.opening);
    var buyArea = net * (1 + v.waste / 100);
    var pieceArea = v.length * v.width / 10000;
    return { main: { label: 'متراژ سنگ برای خرید', value: r2(buyArea), unit: 'متر مربع' },
      suggest: 'تعداد تقریبی پلاک: ' + fa(Math.ceil(buyArea / pieceArea)) + ' عدد',
      rows: [['مساحت خالص', fa(r2(net)) + ' m²'], ['پرت خرید', fa(r2(buyArea - net)) + ' m²'], ['سطح هر پلاک', fa(r3safe(pieceArea)) + ' m²']] };
  },
  notes: ['برای سورت رنگ یکنواخت، سنگ را ترجیحاً از یک کوپ یا بچ تهیه کنید.', 'در نما، اسکوپ و الزامات ایمنی مطابق مقررات اجرا شود.', 'پرت سنگ‌های رگه‌دار، بوک‌مچ یا طرح‌دار معمولاً بیشتر است.']
},
{
  id: 'isogam', g: 'finish', em: '🛡️', title: 'رول عایق رطوبتی و ایزوگام',
  sub: 'محاسبه تعداد رول با همپوشانی',
  desc: 'تعداد رول عایق مورد نیاز را با لحاظ همپوشانی، بالاگرد و پرت محاسبه می‌کند.',
  fields: [
    { k: 'area', t: 'num', label: 'مساحت سطح', unit: 'متر مربع', def: 120 },
    { k: 'upturn', t: 'num', label: 'متراژ اضافه جان‌پناه و بالاگرد', unit: 'متر مربع', def: 12, allowZero: true },
    { k: 'coverage', t: 'num', label: 'پوشش مفید هر رول', unit: 'متر مربع', def: 9.5 },
    { k: 'waste', t: 'num', label: 'پرت و جزئیات', unit: 'درصد', def: 5 }
  ],
  calc: function (v) {
    var totalArea = (v.area + v.upturn) * (1 + v.waste / 100);
    var rolls = Math.ceil(totalArea / v.coverage);
    return { main: { label: 'تعداد رول مورد نیاز', value: rolls, unit: 'رول' },
      suggest: 'پوشش خریداری‌شده: ' + fa(r1(rolls * v.coverage)) + ' متر مربع مفید',
      rows: [['سطح پایه و بالاگرد', fa(r1(v.area + v.upturn)) + ' m²'], ['سطح با پرت', fa(r1(totalArea)) + ' m²'], ['پوشش مفید هر رول', fa(v.coverage) + ' m²']] };
  },
  notes: ['عرض همپوشانی و پوشش مفید هر رول را از مشخصات سازنده بگیرید.', 'شیب‌بندی، ماهیچه‌کشی و آماده‌سازی سطح جزو متراژ این ابزار نیست.', 'در آبروها و شکست‌ها مقدار اضافه در نظر بگیرید.']
},
{
  id: 'gypsum', g: 'finish', em: '⚪', title: 'گچ و سفیدکاری',
  sub: 'برآورد وزن و تعداد کیسه گچ',
  desc: 'مصرف گچ را بر اساس مساحت، مصرف واحد سطح، تعداد لایه و پرت کارگاهی محاسبه می‌کند.',
  fields: [
    { k: 'area', t: 'num', label: 'مساحت سطح', unit: 'متر مربع', def: 100 },
    { k: 'rate', t: 'num', label: 'مصرف گچ هر متر مربع', unit: 'kg/m²', def: 8.5 },
    { k: 'layers', t: 'num', label: 'ضریب یا تعداد لایه', unit: 'ضریب', def: 1 },
    { k: 'bag', t: 'num', label: 'وزن هر کیسه', unit: 'کیلوگرم', def: 30 },
    { k: 'waste', t: 'num', label: 'پرت', unit: 'درصد', def: 10 }
  ],
  calc: function (v) {
    var kg = v.area * v.rate * v.layers * (1 + v.waste / 100);
    return { main: { label: 'تعداد کیسه گچ', value: Math.ceil(kg / v.bag), unit: 'کیسه' },
      suggest: 'وزن تقریبی مورد نیاز: ' + fa(r0(kg)) + ' کیلوگرم',
      rows: [['مصرف خالص', fa(r0(v.area * v.rate * v.layers)) + ' kg'], ['پرت', fa(r0(kg - v.area * v.rate * v.layers)) + ' kg'], ['وزن هر کیسه', fa(v.bag) + ' kg']] };
  },
  notes: ['مصرف واقعی با ضخامت، کیفیت زیرکار و نوع گچ تغییر می‌کند.', 'گچ خاک، گچ زیرکار و سفیدکاری را در صورت تفاوت مصرف جدا محاسبه کنید.', 'کیسه‌ها در محیط خشک و دور از رطوبت نگهداری شوند.']
},

/* ---------------- متره و عملیات ---------------- */
{
  id: 'utmSketch', g: 'measure', em: '🗺️', title: 'ترسیم نقشه UTM زمین و ساختمان',
  sub: 'رسم محدوده، جدول مختصات، مساحت و خروجی چاپ/PDF',
  desc: 'محدوده زمین یا ساختمان را با لمس نقشه، GPS گوشی یا ورود مختصات UTM ترسیم می‌کند و گزارش قابل چاپ می‌سازد.',
  special: 'utm', fields: [], notes: []
},
{
  id: 'excavation', g: 'measure', em: '🚜', title: 'حجم خاکبرداری',
  sub: 'محاسبه گود یا ترانشه مستطیلی',
  desc: 'حجم خاک درجا، حجم خاک سست‌شده و تعداد تقریبی کامیون را محاسبه می‌کند.',
  fields: [
    { k: 'length', t: 'num', label: 'طول گود یا ترانشه', unit: 'متر', def: 20 },
    { k: 'width', t: 'num', label: 'عرض متوسط', unit: 'متر', def: 12 },
    { k: 'depth', t: 'num', label: 'عمق متوسط', unit: 'متر', def: 2 },
    { k: 'swell', t: 'num', label: 'افزایش حجم خاک پس از حفاری', unit: 'درصد', def: 25 },
    { k: 'truck', t: 'num', label: 'ظرفیت مفید کامیون', unit: 'متر مکعب', def: 10 }
  ],
  calc: function (v) {
    var bank = v.length * v.width * v.depth;
    var loose = bank * (1 + v.swell / 100);
    return { main: { label: 'حجم خاک درجا', value: r2(bank), unit: 'متر مکعب' },
      suggest: 'حمل تقریبی خاک سست: ' + fa(Math.ceil(loose / v.truck)) + ' سرویس کامیون',
      rows: [['حجم خاک سست', fa(r2(loose)) + ' m³'], ['ضریب تورم', fa(v.swell) + '٪'], ['ظرفیت هر سرویس', fa(v.truck) + ' m³']] };
  },
  notes: ['در گودهای شیبدار، شکل واقعی مقطع و رمپ دسترسی باید لحاظ شود.', 'نوع خاک ضریب تورم و ظرفیت واقعی حمل را تغییر می‌دهد.', 'پایداری گود و سازه نگهبان صرفاً باید توسط متخصص طراحی شود.']
},
{
  id: 'backfill', g: 'measure', em: '⛰️', title: 'خاکریزی و مصالح پرکننده',
  sub: 'حجم مصالح قبل از تراکم',
  desc: 'حجم مصالح خاکریزی لازم را با توجه به حجم متراکم نهایی و افت تراکم برآورد می‌کند.',
  fields: [
    { k: 'area', t: 'num', label: 'مساحت خاکریزی', unit: 'متر مربع', def: 100 },
    { k: 'height', t: 'num', label: 'ضخامت متراکم نهایی', unit: 'متر', def: 0.5 },
    { k: 'factor', t: 'num', label: 'ضریب مصالح سست به متراکم', unit: 'ضریب', def: 1.2 },
    { k: 'truck', t: 'num', label: 'ظرفیت مفید کامیون', unit: 'متر مکعب', def: 10 }
  ],
  calc: function (v) {
    var compact = v.area * v.height;
    var loose = compact * v.factor;
    return { main: { label: 'مصالح سست مورد نیاز', value: r2(loose), unit: 'متر مکعب' },
      suggest: 'حدود ' + fa(Math.ceil(loose / v.truck)) + ' سرویس کامیون',
      rows: [['حجم متراکم نهایی', fa(r2(compact)) + ' m³'], ['اضافه بابت تراکم', fa(r2(loose - compact)) + ' m³'], ['ضریب تراکم انتخابی', fa(v.factor)]] };
  },
  notes: ['مصالح باید در لایه‌های مناسب پخش، رطوبت‌دهی و متراکم شود.', 'ضریب تراکم با نوع خاک و روش کوبش تغییر می‌کند.', 'آزمایش دانسیته در محل برای کنترل تراکم پروژه‌های حساس ضروری است.']
},
{
  id: 'columnFormwork', g: 'measure', em: '🪵', title: 'مساحت قالب‌بندی ستون',
  sub: 'محاسبه سطح جانبی قالب ستون‌ها',
  desc: 'مساحت قالب مورد نیاز ستون‌های مستطیلی را از محیط مقطع، ارتفاع و تعداد محاسبه می‌کند.',
  fields: [
    { k: 'a', t: 'num', label: 'بعد اول ستون', unit: 'سانتی‌متر', def: 40 },
    { k: 'b', t: 'num', label: 'بعد دوم ستون', unit: 'سانتی‌متر', def: 40 },
    { k: 'height', t: 'num', label: 'ارتفاع قالب', unit: 'متر', def: 3.2 },
    { k: 'count', t: 'num', label: 'تعداد ستون', unit: 'عدد', def: 12 },
    { k: 'waste', t: 'num', label: 'پرت برش قالب', unit: 'درصد', def: 10 }
  ],
  calc: function (v) {
    var net = 2 * (v.a + v.b) / 100 * v.height * v.count;
    var buy = net * (1 + v.waste / 100);
    return { main: { label: 'سطح قالب‌بندی خالص', value: r2(net), unit: 'متر مربع' },
      suggest: 'سطح ورق یا تخته با پرت: ' + fa(r2(buy)) + ' متر مربع',
      rows: [['قالب هر ستون', fa(r2(net / v.count)) + ' m²'], ['پرت برش', fa(r2(buy - net)) + ' m²'], ['تعداد ستون', fa(v.count) + ' عدد']] };
  },
  notes: ['این مقدار سطح تماس بتن و قالب است؛ پشت‌بند و شمع جداگانه متره می‌شوند.', 'در صورت امکان استفاده مجدد قالب، تعداد ست کامل بر اساس برنامه زمان‌بندی تعیین شود.', 'ابعاد و ارتفاع هر تیپ ستون جداگانه محاسبه شود.']
},
{
  id: 'landArea', g: 'measure', em: '📏', title: 'مساحت تقریبی زمین چهارضلعی',
  sub: 'میانگین اضلاع روبه‌رو',
  desc: 'مساحت تقریبی قطعه چهارضلعی را با ضرب میانگین طول‌ها در میانگین عرض‌ها محاسبه می‌کند.',
  fields: [
    { k: 'north', t: 'num', label: 'ضلع شمالی', unit: 'متر', def: 10 },
    { k: 'south', t: 'num', label: 'ضلع جنوبی', unit: 'متر', def: 10 },
    { k: 'east', t: 'num', label: 'ضلع شرقی', unit: 'متر', def: 20 },
    { k: 'west', t: 'num', label: 'ضلع غربی', unit: 'متر', def: 20 }
  ],
  calc: function (v) {
    var avgW = (v.north + v.south) / 2;
    var avgL = (v.east + v.west) / 2;
    var area = avgW * avgL;
    return { main: { label: 'مساحت تقریبی زمین', value: r2(area), unit: 'متر مربع' },
      suggest: 'محیط زمین: ' + fa(r2(v.north + v.south + v.east + v.west)) + ' متر',
      rows: [['عرض متوسط', fa(r2(avgW)) + ' m'], ['طول متوسط', fa(r2(avgL)) + ' m'], ['اختلاف دو عرض', fa(r2(Math.abs(v.north - v.south))) + ' m']] };
  },
  notes: ['این روش برای زمین‌های تقریباً قائم مناسب است و ارزش ثبتی یا حقوقی ندارد.', 'برای قطعات نامنظم، قوسی یا با زوایای زیاد از نقشه UTM و نقشه‌بردار استفاده کنید.', 'مساحت سندی ملاک معاملات رسمی است.']
},

/* ---------------- هزینه ساخت ---------------- */
{
  id: 'constructionCost', g: 'cost', em: '🏗️', title: 'برآورد هزینه ساخت',
  sub: 'هزینه کل بر اساس زیربنا و نرخ هر متر',
  desc: 'بودجه اولیه ساخت را از زیربنای کل، هزینه واحد و ذخیره پیش‌بینی‌نشده محاسبه می‌کند.',
  fields: [
    { k: 'area', t: 'num', label: 'زیربنای هر طبقه', unit: 'متر مربع', def: 150 },
    { k: 'floors', t: 'num', label: 'تعداد طبقات محاسباتی', unit: 'عدد', def: 5 },
    { k: 'unit', t: 'num', label: 'هزینه برآوردی هر متر مربع', unit: 'تومان', def: 15000000 },
    { k: 'reserve', t: 'num', label: 'ذخیره ریسک و پیش‌بینی‌نشده', unit: 'درصد', def: 10 }
  ],
  calc: function (v) {
    var area = v.area * v.floors;
    var base = area * v.unit;
    var total = base * (1 + v.reserve / 100);
    return { main: { label: 'بودجه پیشنهادی کل', value: r0(total), unit: 'تومان' },
      suggest: 'هزینه نهایی با ذخیره: ' + fa(r0(total / area)) + ' تومان به‌ازای هر متر مربع',
      rows: [['زیربنای کل', fa(r0(area)) + ' m²'], ['هزینه پایه', fa(r0(base)) + ' تومان'], ['ذخیره ریسک', fa(r0(total - base)) + ' تومان']] };
  },
  notes: ['نرخ هر متر باید متناسب با شهر، کیفیت، زمان و مرحله پروژه به‌روز شود.', 'قیمت زمین، عوارض، طراحی، انشعابات و تأمین مالی ممکن است جدا باشند.', 'این نتیجه بودجه اولیه است و جایگزین متره و برآورد ریزمقادیر نیست.']
},
{
  id: 'itemCost', g: 'cost', em: '🧾', title: 'هزینه یک ردیف کار',
  sub: 'مقدار × بهای واحد + پرت و مالیات',
  desc: 'هزینه خرید یا اجرای یک ردیف را با بهای واحد، پرت و مالیات یا عوارض دلخواه محاسبه می‌کند.',
  fields: [
    { k: 'qty', t: 'num', label: 'مقدار کار یا کالا', unit: 'واحد', def: 100 },
    { k: 'price', t: 'num', label: 'بهای هر واحد', unit: 'تومان', def: 500000 },
    { k: 'waste', t: 'num', label: 'پرت یا اضافه مقدار', unit: 'درصد', def: 5, allowZero: true },
    { k: 'tax', t: 'num', label: 'مالیات و عوارض', unit: 'درصد', def: 10, allowZero: true }
  ],
  calc: function (v) {
    var base = v.qty * v.price;
    var withWaste = base * (1 + v.waste / 100);
    var tax = withWaste * v.tax / 100;
    return { main: { label: 'هزینه نهایی ردیف', value: r0(withWaste + tax), unit: 'تومان' },
      suggest: 'مقدار خرید با پرت: ' + fa(r2(v.qty * (1 + v.waste / 100))) + ' واحد',
      rows: [['هزینه پایه', fa(r0(base)) + ' تومان'], ['اثر پرت', fa(r0(withWaste - base)) + ' تومان'], ['مالیات و عوارض', fa(r0(tax)) + ' تومان']] };
  },
  notes: ['درصد مالیات را بر اساس نوع معامله و قوانین جاری وارد کنید.', 'حمل، تخلیه و نصب را در صورت نبودن در بهای واحد جدا اضافه کنید.', 'واحد مقدار و بهای واحد باید یکسان باشد.']
},
{
  id: 'contractorOffer', g: 'cost', em: '🤝', title: 'پیشنهاد قیمت پیمانکار',
  sub: 'هزینه مستقیم، بالاسری و سود',
  desc: 'مبلغ پیشنهادی پیمان را با افزودن بالاسری، سود و مالیات به هزینه مستقیم محاسبه می‌کند.',
  fields: [
    { k: 'direct', t: 'num', label: 'هزینه مستقیم برآوردی', unit: 'تومان', def: 1000000000 },
    { k: 'overhead', t: 'num', label: 'بالاسری', unit: 'درصد', def: 15, allowZero: true },
    { k: 'profit', t: 'num', label: 'سود روی هزینه و بالاسری', unit: 'درصد', def: 10, allowZero: true },
    { k: 'tax', t: 'num', label: 'مالیات و عوارض', unit: 'درصد', def: 10, allowZero: true }
  ],
  calc: function (v) {
    var overhead = pct(v.direct, v.overhead);
    var cost = v.direct + overhead;
    var profit = pct(cost, v.profit);
    var beforeTax = cost + profit;
    var tax = pct(beforeTax, v.tax);
    return { main: { label: 'مبلغ پیشنهادی با مالیات', value: r0(beforeTax + tax), unit: 'تومان' },
      suggest: 'مبلغ قبل از مالیات: ' + fa(r0(beforeTax)) + ' تومان',
      rows: [['بالاسری', fa(r0(overhead)) + ' تومان'], ['سود', fa(r0(profit)) + ' تومان'], ['مالیات و عوارض', fa(r0(tax)) + ' تومان']] };
  },
  notes: ['ساختار قرارداد، بیمه، تضمین‌ها و ریسک پروژه می‌تواند درصدها را تغییر دهد.', 'مالیات و کسورات قانونی باید با مقررات و نوع قرارداد تطبیق داده شود.', 'برنامه زمان‌بندی و جریان نقدی در پیشنهاد نهایی لحاظ شود.']
},

/* ---------------- املاک و معاملات ---------------- */
{
  id: 'saleCommission', g: 'estate', em: '🏷️', title: 'کمیسیون خرید و فروش ملک',
  sub: 'حق‌الزحمه هر طرف با مالیات',
  desc: 'کمیسیون هر طرف معامله را با نرخ درصدی قابل‌تغییر و مالیات بر ارزش افزوده محاسبه می‌کند.',
  fields: [
    { k: 'price', t: 'num', label: 'قیمت کل معامله', unit: 'تومان', def: 5000000000 },
    { k: 'rate', t: 'num', label: 'نرخ کمیسیون هر طرف', unit: 'درصد', def: 0.25 },
    { k: 'tax', t: 'num', label: 'مالیات بر ارزش افزوده کمیسیون', unit: 'درصد', def: 10, allowZero: true }
  ],
  calc: function (v) {
    var base = pct(v.price, v.rate);
    var tax = pct(base, v.tax);
    var each = base + tax;
    return { main: { label: 'پرداخت هر طرف با مالیات', value: r0(each), unit: 'تومان' },
      suggest: 'جمع دریافتی از دو طرف: ' + fa(r0(each * 2)) + ' تومان',
      rows: [['کمیسیون پایه هر طرف', fa(r0(base)) + ' تومان'], ['مالیات هر طرف', fa(r0(tax)) + ' تومان'], ['نرخ واردشده', fa(v.rate) + '٪']] };
  },
  notes: ['تعرفه کمیسیون می‌تواند بر اساس شهر، سال، بخشنامه و نوع قرارداد متفاوت باشد.', 'پیش از پرداخت، نرخ مصوب اتحادیه محل و صورتحساب رسمی را بررسی کنید.', 'نرخ و مالیات در این ابزار قابل تغییر است و مقدار پیش‌فرض الزام حقوقی ندارد.']
},
{
  id: 'rentCommission', g: 'estate', em: '🔑', title: 'کمیسیون رهن و اجاره',
  sub: 'تبدیل رهن به اجاره و محاسبه هر طرف',
  desc: 'ابتدا رهن را به اجاره ماهانه معادل تبدیل و سپس کمیسیون و مالیات هر طرف را محاسبه می‌کند.',
  fields: [
    { k: 'deposit', t: 'num', label: 'مبلغ رهن یا ودیعه', unit: 'تومان', def: 500000000, allowZero: true },
    { k: 'rent', t: 'num', label: 'اجاره ماهانه', unit: 'تومان', def: 10000000, allowZero: true },
    { k: 'convert', t: 'num', label: 'اجاره معادل هر یک میلیون رهن', unit: 'تومان', def: 30000 },
    { k: 'rate', t: 'num', label: 'درصد از یک اجاره ماهانه معادل برای هر طرف', unit: 'درصد', def: 25 },
    { k: 'tax', t: 'num', label: 'مالیات بر ارزش افزوده کمیسیون', unit: 'درصد', def: 10, allowZero: true }
  ],
  calc: function (v) {
    var equivalentRent = v.rent + (v.deposit / 1000000) * v.convert;
    var base = pct(equivalentRent, v.rate);
    var tax = pct(base, v.tax);
    var each = base + tax;
    return { main: { label: 'کمیسیون هر طرف با مالیات', value: r0(each), unit: 'تومان' },
      suggest: 'اجاره ماهانه معادل: ' + fa(r0(equivalentRent)) + ' تومان',
      rows: [['کمیسیون پایه هر طرف', fa(r0(base)) + ' تومان'], ['مالیات هر طرف', fa(r0(tax)) + ' تومان'], ['جمع دو طرف', fa(r0(each * 2)) + ' تومان']] };
  },
  notes: ['روش و نرخ کمیسیون اجاره ممکن است در اتحادیه‌های مختلف متفاوت باشد.', 'نرخ تبدیل رهن و اجاره توافقی و وابسته به بازار است؛ مقدار روز را وارد کنید.', 'مبلغ نهایی را با مشاور املاک و تعرفه رسمی محل تطبیق دهید.']
},
{
  id: 'depositRent', g: 'estate', em: '🔄', title: 'تبدیل رهن و اجاره',
  sub: 'محاسبه رهن کامل و اجاره معادل',
  desc: 'مجموع رهن و اجاره را به رهن کامل و نیز اجاره کامل معادل تبدیل می‌کند.',
  fields: [
    { k: 'deposit', t: 'num', label: 'مبلغ رهن فعلی', unit: 'تومان', def: 500000000, allowZero: true },
    { k: 'rent', t: 'num', label: 'اجاره ماهانه فعلی', unit: 'تومان', def: 10000000, allowZero: true },
    { k: 'convert', t: 'num', label: 'اجاره هر یک میلیون تومان رهن', unit: 'تومان', def: 30000 }
  ],
  calc: function (v) {
    var fullDeposit = v.deposit + (v.rent / v.convert) * 1000000;
    var fullRent = v.rent + (v.deposit / 1000000) * v.convert;
    return { main: { label: 'رهن کامل معادل', value: r0(fullDeposit), unit: 'تومان' },
      suggest: 'اجاره کامل معادل: ' + fa(r0(fullRent)) + ' تومان در ماه',
      rows: [['رهن فعلی', fa(r0(v.deposit)) + ' تومان'], ['اجاره فعلی', fa(r0(v.rent)) + ' تومان'], ['نرخ تبدیل هر یک میلیون', fa(r0(v.convert)) + ' تومان']] };
  },
  notes: ['نرخ تبدیل رهن و اجاره ثابت قانونی نیست و با شرایط بازار تغییر می‌کند.', 'این تبدیل برای مقایسه اقتصادی است؛ شرایط واقعی قرارداد با توافق طرفین تعیین می‌شود.', 'در قرارداد، مبلغ ودیعه و اجاره را دقیق و جداگانه درج کنید.']
},
{
  id: 'pricePerMeter', g: 'estate', em: '📊', title: 'قیمت هر متر مربع ملک',
  sub: 'قیمت کل تقسیم بر متراژ',
  desc: 'قیمت واحد ملک را از قیمت کل و مساحت محاسبه و با قیمت منطقه مقایسه می‌کند.',
  fields: [
    { k: 'price', t: 'num', label: 'قیمت کل ملک', unit: 'تومان', def: 8000000000 },
    { k: 'area', t: 'num', label: 'مساحت ملک', unit: 'متر مربع', def: 100 },
    { k: 'benchmark', t: 'num', label: 'قیمت مقایسه‌ای منطقه', unit: 'تومان/m²', def: 75000000, allowZero: true }
  ],
  calc: function (v) {
    var unit = v.price / v.area;
    var diff = v.benchmark > 0 ? (unit / v.benchmark - 1) * 100 : 0;
    return { main: { label: 'قیمت هر متر مربع', value: r0(unit), unit: 'تومان' },
      suggest: v.benchmark > 0 ? (diff >= 0 ? fa(r1(diff)) + '٪ بالاتر از قیمت مقایسه‌ای' : fa(r1(Math.abs(diff))) + '٪ پایین‌تر از قیمت مقایسه‌ای') : 'برای مقایسه، قیمت روز منطقه را وارد کنید',
      rows: [['قیمت کل', fa(r0(v.price)) + ' تومان'], ['مساحت', fa(r2(v.area)) + ' m²'], ['اختلاف هر متر با معیار', fa(r0(unit - v.benchmark)) + ' تومان']] };
  },
  notes: ['پارکینگ، انباری، طبقه، سن بنا، نور و کیفیت ساخت بر قیمت واحد اثر دارند.', 'مساحت سندی و وضعیت حقوقی ملک را بررسی کنید.', 'میانگین منطقه باید از فایل‌های مشابه و معاملات معتبر استخراج شود.']
},
{
  id: 'rentalYield', g: 'estate', em: '📈', title: 'بازده سالانه اجاره ملک',
  sub: 'اجاره سالانه و منفعت ودیعه نسبت به قیمت',
  desc: 'بازده تقریبی ملک را با جمع اجاره سالانه و منفعت فرضی ودیعه محاسبه می‌کند.',
  fields: [
    { k: 'price', t: 'num', label: 'ارزش روز ملک', unit: 'تومان', def: 8000000000 },
    { k: 'deposit', t: 'num', label: 'ودیعه دریافتی', unit: 'تومان', def: 500000000, allowZero: true },
    { k: 'rent', t: 'num', label: 'اجاره ماهانه', unit: 'تومان', def: 15000000, allowZero: true },
    { k: 'depositRate', t: 'num', label: 'بازده فرضی سالانه ودیعه', unit: 'درصد', def: 25, allowZero: true },
    { k: 'cost', t: 'num', label: 'هزینه و خالی‌ماندن سالانه', unit: 'درصد درآمد', def: 5, allowZero: true }
  ],
  calc: function (v) {
    var gross = v.rent * 12 + pct(v.deposit, v.depositRate);
    var net = gross * (1 - v.cost / 100);
    var yieldRate = net / v.price * 100;
    return { main: { label: 'بازده خالص تقریبی', value: r2(yieldRate), unit: 'درصد در سال' },
      suggest: 'درآمد و منفعت خالص سالانه: ' + fa(r0(net)) + ' تومان',
      rows: [['اجاره سالانه', fa(r0(v.rent * 12)) + ' تومان'], ['منفعت فرضی ودیعه', fa(r0(pct(v.deposit, v.depositRate))) + ' تومان'], ['کسر هزینه و خالی‌ماندن', fa(r0(gross - net)) + ' تومان']] };
  },
  notes: ['بازده فرضی ودیعه، هزینه تعمیرات، مالیات و دوره خالی‌ماندن را واقع‌بینانه وارد کنید.', 'رشد یا افت قیمت ملک در این بازده جاری لحاظ نشده است.', 'این ابزار مشاوره سرمایه‌گذاری نیست و فقط برای مقایسه اولیه ارائه می‌شود.']
}

];

/* --- جستجو و دسترسی --- */
function findCalc(id) { for (var i = 0; i < CALCS.length; i++) if (CALCS[i].id === id) return CALCS[i]; return null; }
function findGroup(id) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].id === id) return GROUPS[i]; return null; }
function calcsOf(g) { return CALCS.filter(function (c) { return c.g === g; }); }
function r3safe(x) { return Math.round(x * 1000) / 1000; }
