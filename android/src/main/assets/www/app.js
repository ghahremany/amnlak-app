/* ===========================================================
   امنلاک – رابط کاربری
   =========================================================== */

var FA_D = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function fa(n) {
  if (n === null || n === undefined || n === '') return '';
  var s = (typeof n === 'number') ? sep(n) : String(n);
  return s.replace(/[0-9]/g, function (d) { return FA_D[+d]; });
}
function sep(n) {
  var neg = n < 0; n = Math.abs(n);
  var p = String(n).split('.');
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return (neg ? '-' : '') + p.join('.');
}
function toEn(s) {
  return String(s).replace(/[۰-۹]/g, function (d) { return String(FA_D.indexOf(d)); })
                  .replace(/[٬,]/g, '');
}
function el(id) { return document.getElementById(id); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

/* ---------- وضعیت ---------- */
var state = { view: 'home', gid: null, cid: null };
var history_ = [];
var lastResultText = '';

/* ---------- کشوی منو ---------- */
function drawerOpen(on) {
  el('drawer').classList.toggle('on', on);
  el('scrim').classList.toggle('on', on);
}
function isDrawerOpen() { return el('drawer').classList.contains('on'); }

window.appBack = function () {
  if (tourActive()) { endTour(true); return true; }
  if (isDrawerOpen()) { drawerOpen(false); return true; }
  if (history_.length) { var s = history_.pop(); render(s, true); return true; }
  return false;
};

function go(view, gid, cid) {
  history_.push({ view: state.view, gid: state.gid, cid: state.cid });
  render({ view: view, gid: gid || null, cid: cid || null });
  drawerOpen(false);
}

/* ---------- ساخت منو ---------- */
function buildDrawer() {
  var h = '';
  h += '<div class="ditem" onclick="go(\'home\')"><div class="dico">🏠</div><div>صفحه اصلی</div></div>';
  h += '<div class="ditem" onclick="go(\'history\')"><div class="dico">🕘</div><div>تاریخچه محاسبات</div><div class="cnt">' + fa(histGet().length) + '</div></div>';
  h += '<div class="dsep"></div>';
  GROUPS.forEach(function (g, i) {
    var items = calcsOf(g.id);
    h += '<div class="ditem" onclick="toggleSub(' + i + ',this)"><div class="dico" style="background:' + g.color + '18">' + g.em + '</div>' +
         '<div>' + g.name + '</div><div class="chev">▼</div></div>';
    h += '<div class="dsub" id="sub' + i + '">';
    items.forEach(function (c) {
      h += '<div onclick="go(\'calc\',\'' + g.id + '\',\'' + c.id + '\')">' + c.title + '</div>';
    });
    h += '<div onclick="go(\'group\',\'' + g.id + '\')" style="color:#0B4EA2;font-weight:700">مشاهده همه (' + fa(items.length) + ')</div>';
    h += '</div>';
  });
  el('dscroll').innerHTML = h;

  var b = '';
  b += '<div class="ditem" onclick="go(\'about\')"><div class="dico">ℹ️</div><div>درباره ما و راهنمای استفاده</div></div>';
  b += '<div class="ditem" onclick="go(\'contact\')"><div class="dico">📞</div><div>تماس با کارشناسان</div></div>';
  b += '<div class="ditem" onclick="go(\'dev\')"><div class="dico" style="background:#0B4EA218">👨‍💻</div><div>ارتباط با توسعه‌دهنده</div></div>';
  el('dbottom').innerHTML = b;
}

function toggleSub(i, node) {
  var s = el('sub' + i);
  var open = s.classList.contains('open');
  s.classList.toggle('open', !open);
  node.classList.toggle('open', !open);
}

/* ---------- صفحات ---------- */
function render(s, isBack) {
  state = { view: s.view, gid: s.gid || null, cid: s.cid || null };
  if (!isBack) window.scrollTo(0, 0);
  var m = el('main');
  var title = 'امنلاک';
  var html = '';

  if (s.view === 'home') { html = viewHome(); title = 'امنلاک'; }
  else if (s.view === 'group') { var g = findGroup(s.gid); html = viewGroup(g); title = g.name; }
  else if (s.view === 'calc') { var c = findCalc(s.cid); html = viewCalc(c); title = c.title; }
  else if (s.view === 'about') { html = viewAbout(); title = 'درباره ما'; }
  else if (s.view === 'contact') { html = viewContact(); title = 'تماس با ما'; }
  else if (s.view === 'dev') { html = viewDev(); title = 'ارتباط با توسعه‌دهنده'; }
  else if (s.view === 'history') { html = viewHistory(); title = 'تاریخچه محاسبات'; }

  el('bartitle').textContent = title;
  el('backbtn').style.display = (s.view === 'home') ? 'none' : 'flex';
  m.innerHTML = html;
  m.className = 'fade';
  stagger(m);
  if (s.view === 'calc') initCalcPage(findCalc(s.cid));
}

function viewHome() {
  var h = '';
  h += '<div class="hero"><img src="img/logo.png" alt="امنلاک">' +
       '<h1>محاسبات هوشمند ساختمان و املاک</h1>' +
       '<p>مقدار مصالح، هزینه ساخت و محاسبات معاملات ملکی را سریع، ساده و آفلاین برآورد کنید.</p>' +
       '<div style="clear:both"></div></div>';
  h += '<div class="searchwrap"><span class="si">🔎</span>' +
       '<input id="q" placeholder="جستجوی ماشین‌حساب… مثلا بتن یا کمیسیون" oninput="doSearch()"></div>';
  h += '<div id="sres"></div>';
  h += '<div id="homebody">';
  h += '<div class="sectitle">گروه محاسبات</div><div class="grid">';
  GROUPS.forEach(function (g) {
    h += '<div class="gcard" onclick="go(\'group\',\'' + g.id + '\')">' +
         '<span class="em">' + g.em + '</span><b>' + g.name + '</b><small>' + g.sub + '</small>' +
         '<i class="bar" style="background:' + g.color + '"></i></div>';
  });
  h += '</div>';

  var hl = histGet();
  if (hl.length) {
    h += '<div class="sectitle">آخرین محاسبات شما</div><div class="list">';
    hl.slice(0, 3).forEach(function (e, i) {
      h += '<div class="hrow" onclick="histOpen(' + i + ')"><div class="em">' + e.em + '</div>' +
           '<div class="hb"><b>' + e.title + '</b><small>' + jalaliDate(e.ts) + '</small></div>' +
           '<div class="hv">' + fa(e.value) + '</div></div>';
    });
    h += '</div><div style="text-align:center;margin:-2px 0 4px"><a onclick="go(\'history\')" style="font-size:12.5px">مشاهده همه تاریخچه ›</a></div>';
  }
  h += '<div class="sectitle">پرکاربردترین محاسبات</div><div class="list">';
  ['foundationConcrete', 'rebarWeight', 'blockCount', 'constructionCost', 'saleCommission', 'rentCommission'].forEach(function (id) {
    var c = findCalc(id);
    h += rowCalc(c);
  });
  h += '</div>';
  h += '<p class="disc">نتایج امنلاک برای برآورد اولیه هستند. برای اجرا، خرید قطعی یا قرارداد رسمی، نقشه‌ها و تعرفه‌های روز را با مهندس یا کارشناس مربوطه کنترل کنید.</p>';
  h += '</div>';
  return h;
}

function rowCalc(c) {
  return '<div class="row" onclick="go(\'calc\',\'' + c.g + '\',\'' + c.id + '\')">' +
         '<div class="em">' + c.em + '</div><div><b>' + c.title + '</b><small>' + c.sub + '</small></div>' +
         '<div class="go">❮</div></div>';
}

function doSearch() {
  var q = (el('q').value || '').trim();
  var res = el('sres'), body = el('homebody');
  if (!q) { res.innerHTML = ''; body.style.display = ''; return; }
  body.style.display = 'none';
  var hits = CALCS.filter(function (c) {
    return (c.title + ' ' + c.sub + ' ' + c.desc).indexOf(q) > -1;
  });
  var h = '<div class="sectitle">نتایج جستجو (' + fa(hits.length) + ')</div><div class="list">';
  if (!hits.length) h += '<div class="empty">موردی یافت نشد. عبارت دیگری را امتحان کنید.</div>';
  hits.forEach(function (c) { h += rowCalc(c); });
  res.innerHTML = h + '</div>';
}

function viewGroup(g) {
  var items = calcsOf(g.id);
  var h = '<div class="cbanner" style="background:linear-gradient(135deg,' + g.color + ',' + g.color + 'CC)">' +
          '<div class="em">' + g.em + '</div><div><b>' + g.name + '</b><span>' + fa(items.length) + ' ماشین‌حساب – ' + g.sub + '</span></div></div>';
  h += '<div class="list">';
  items.forEach(function (c) { h += rowCalc(c); });
  h += '</div>';
  return h;
}

function viewCalc(c) {
  var g = findGroup(c.g);
  var h = '<div class="cbanner" style="background:linear-gradient(135deg,' + g.color + ',' + g.color + 'BB)">' +
          '<div class="em">' + c.em + '</div><div><b>' + c.title + '</b><span>' + c.desc + '</span></div></div>';

  h += '<div class="card" id="form">';
  c.fields.forEach(function (f) {
    h += '<div class="f">';
    if (f.t === 'num') {
      h += '<label>' + f.label + (f.hint ? ' <span class="hint">' + f.hint + '</span>' : '') + '</label>' +
           '<div class="inpwrap"><input inputmode="decimal" id="f_' + f.k + '" value="' + f.def + '">' +
           '<span class="unit">' + f.unit + '</span></div>';
    } else if (f.t === 'sel') {
      h += '<label>' + f.label + '</label><select id="f_' + f.k + '">';
      f.opts.forEach(function (o, i) { h += '<option value="' + o[1] + '">' + o[0] + '</option>'; });
      h += '</select>';
    } else if (f.t === 'chip') {
      h += '<label>' + f.label + '</label><div class="chips" id="f_' + f.k + '" data-v="' + f.opts[0][1] + '">';
      f.opts.forEach(function (o, i) {
        h += '<div class="chip' + (i === 0 ? ' on' : '') + '" onclick="pickChip(this,' + o[1] + ')">' + o[0] + '</div>';
      });
      h += '</div>';
    } else if (f.t === 'sw') {
      h += '<div class="switch" id="f_' + f.k + '" data-on="' + f.on + '" onclick="toggleSw(this)">' +
           '<div style="font-size:13px">' + f.label + '</div><div class="sw"></div></div>';
    }
    h += '</div>';
  });
  h += '</div>';

  h += '<button class="btn" onclick="doCalc(\'' + c.id + '\')">محاسبه کن</button>';
  h += '<div id="out" style="margin-top:14px"></div>';

  h += '<div class="notes" style="margin-top:14px"><b>نکات مهم درباره ' + c.title + '</b><ol>';
  c.notes.forEach(function (n) { h += '<li>' + n + '</li>'; });
  h += '</ol></div>';
  h += '<p class="disc">اعداد به‌دست‌آمده برای برآورد اولیه‌اند. پیش از اجرا یا تنظیم قرارداد، نتیجه را با مدارک پروژه و نظر متخصص کنترل کنید.</p>';
  return h;
}

function pickChip(node, v) {
  var p = node.parentNode;
  p.setAttribute('data-v', v);
  var ch = p.children;
  for (var i = 0; i < ch.length; i++) ch[i].classList.remove('on');
  node.classList.add('on');
}
function toggleSw(node) { node.classList.toggle('on'); }

function initCalcPage(c) {
  var inputs = document.querySelectorAll('#form input');
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener('focus', function () { this.select(); });
  }
  if (PREFILL) {
    var v = PREFILL; PREFILL = null;
    c.fields.forEach(function (f) {
      var n = el('f_' + f.k); if (!n || !(f.k in v)) return;
      if (f.t === 'num') n.value = v[f.k];
      else if (f.t === 'sel') n.value = v[f.k];
      else if (f.t === 'chip') {
        n.setAttribute('data-v', v[f.k]);
        var ch = n.children;
        for (var j = 0; j < ch.length; j++) {
          ch[j].classList.toggle('on', parseFloat(f.opts[j][1]) === parseFloat(v[f.k]));
        }
      } else if (f.t === 'sw') n.classList.toggle('on', parseFloat(v[f.k]) !== 1);
    });
    setTimeout(function () { doCalc(c.id); }, 120);
  }
}

function readFields(c) {
  var v = {}, ok = true;
  c.fields.forEach(function (f) {
    var n = el('f_' + f.k);
    if (f.t === 'num') {
      var x = parseFloat(toEn(n.value).replace(/[^\d.\-]/g, ''));
      var invalid = isNaN(x) || (f.allowZero ? x < 0 : x <= 0);
      if (invalid) { ok = false; n.style.borderColor = '#C5192D'; }
      else n.style.borderColor = '';
      v[f.k] = x;
    } else if (f.t === 'sel') v[f.k] = parseFloat(n.value);
    else if (f.t === 'chip') v[f.k] = parseFloat(n.getAttribute('data-v'));
    else if (f.t === 'sw') v[f.k] = n.classList.contains('on') ? parseFloat(n.getAttribute('data-on')) : 1;
  });
  return ok ? v : null;
}

function doCalc(id) {
  var c = findCalc(id);
  var v = readFields(c);
  if (!v) {
    el('out').innerHTML = '<div class="notes" style="background:#FDECEE;border-color:#F3C3C9;color:#8E1220">لطفاً مقادیر عددی را به‌درستی وارد کنید؛ بیشتر فیلدها باید بزرگ‌تر از صفر باشند.</div>';
    return;
  }
  var r = c.calc(v);
  var h = '<div class="result">';
  h += '<div class="lbl">' + r.main.label + '</div>';
  h += '<div class="val">' + fa(r.main.value) + '</div>';
  h += '<div class="un">' + r.main.unit + '</div>';
  if (r.suggest) h += '<div class="sug">' + r.suggest + '</div>';
  if (r.rows && r.rows.length) {
    h += '<div class="rrows">';
    r.rows.forEach(function (x) { h += '<div><span>' + x[0] + '</span><span>' + x[1] + '</span></div>'; });
    h += '</div>';
  }
  h += '</div>';
  h += '<button class="btn ghost" onclick="shareResult()">📤 اشتراک‌گذاری نتیجه</button>';

  lastResultText = c.title + '\n' + r.main.label + ': ' + fa(r.main.value) + ' ' + r.main.unit +
    (r.suggest ? '\n' + r.suggest : '') +
    '\n\nمحاسبه شده با اپلیکیشن امنلاک\nhttps://amnlak.ir';

  el('out').innerHTML = h;
  var vn = el('out').querySelector('.val');
  if (vn) countUp(vn, r.main.value);
  el('out').scrollIntoView({ behavior: 'smooth', block: 'center' });

  histAdd({ cid: c.id, g: c.g, em: c.em, title: c.title, label: r.main.label,
            value: r.main.value, unit: r.main.unit, ts: Date.now(), vals: v });
}

function shareResult() {
  if (window.Android && Android.share) Android.share(lastResultText);
}
function callUs(n) { if (window.Android && Android.call) Android.call(n); }
function openUrl(u) { if (window.Android && Android.open) Android.open(u); else window.open(u); }

function viewAbout() {
  return '<div class="cbanner"><div class="em">ℹ️</div><div><b>امنلاک</b><span>درباره برنامه و راهنمای استفاده</span></div></div>' +
    '<div class="tourcard"><div class="tc-em">🧭</div>' +
    '<div class="tc-b"><b>تور راهنمای برنامه</b><small>معرفی گام‌به‌گام بخش‌های مختلف</small></div>' +
    '<button onclick="startTour(true)">نمایش دوباره</button></div>' +
    '<div class="infocard"><h3>درباره امنلاک</h3>' +
    'امنلاک یک جعبه‌ابزار فارسی و آفلاین برای برآوردهای اولیه ساختمان‌سازی و معاملات ملکی است. ' +
    'این نسخه شامل محاسبات بتن، آهن، مصالح، نازک‌کاری، متره، هزینه ساخت، کمیسیون، رهن و اجاره است.</div>' +
    '<div class="infocard"><h3>مناسب چه کسانی است؟</h3>' +
    'مالکین، سازندگان، مهندسان، مجریان، فروشندگان مصالح، مشاوران املاک، دانشجویان و همه افرادی که به یک برآورد سریع اولیه نیاز دارند.</div>' +
    '<div class="infocard"><h3>ویژگی‌ها</h3>' +
    '• کاملاً آفلاین و بدون نیاز به ثبت‌نام<br>• جستجوی سریع بین ابزارها<br>• حالت شب و رابط فارسی راست‌چین<br>' +
    '• تاریخچه محاسبات و بازکردن دوباره ورودی‌ها<br>• اشتراک‌گذاری نتیجه<br>• ' + fa(CALCS.length) + ' ماشین‌حساب در ' + fa(GROUPS.length) + ' گروه کاربردی</div>' +

    '<div class="sectitle">راهنمای استفاده</div>' +
    '<div class="infocard"><h3>روش کار</h3>' +
    '۱. از صفحه اصلی یا منوی همبرگری، گروه مورد نظر را باز کنید.<br>' +
    '۲. ماشین‌حساب مورد نیاز را انتخاب کنید.<br>' +
    '۳. مقادیر را با واحد درج‌شده وارد کنید.<br>' +
    '۴. دکمه «محاسبه کن» را بزنید تا نتیجه و جزئیات نمایش داده شود.<br>' +
    '۵. نتیجه خودکار در تاریخچه ذخیره می‌شود و قابلیت اشتراک‌گذاری دارد.</div>' +
    '<div class="infocard"><h3>واحد پول و اعداد</h3>' +
    'مبالغ مالی برنامه بر حسب تومان هستند. برای اعداد بزرگ می‌توانید رقم را بدون جداکننده وارد کنید. ' +
    'واحد هر ورودی کنار همان کادر نوشته شده است؛ متر، سانتی‌متر و میلی‌متر را با یکدیگر اشتباه نگیرید.</div>' +
    '<div class="infocard"><h3>دقت و مسئولیت استفاده</h3>' +
    'فرمول‌ها برای برآورد اولیه ساده‌سازی شده‌اند. نتیجه جایگزین نقشه مصوب، متره تفصیلی، نظر مهندس ناظر، تعرفه رسمی اتحادیه یا مشاوره حقوقی و مالی نیست. ' +
    'نرخ‌ها و ضرایب قابل تغییر را مطابق شرایط روز وارد کنید.</div>' +
    '<div class="infocard"><h3>وب‌سایت رسمی</h3><a onclick="openUrl(\'https://amnlak.ir\')">amnlak.ir</a></div>' +
    '<p class="disc">نسخه اولیه ۰.۱ امنلاک<br>طراحی و توسعه: محمد جواد قهرمانی</p>';
}

function viewContact() {
  return '<div class="cbanner"><div class="em">📞</div><div><b>پشتیبانی امنلاک</b><span>ثبت پیشنهاد، گزارش خطا و سفارش توسعه</span></div></div>' +
    '<div class="contact" onclick="callUs(\'09127285065\')"><div class="em">☎️</div><div><b>تماس با توسعه‌دهنده</b><small>0912-728-5065</small></div></div>' +
    '<div class="contact" onclick="smsTo(\'09127285065\')"><div class="em">✉️</div><div><b>ارسال پیامک</b><small>0912-728-5065</small></div></div>' +
    '<div class="contact" onclick="openUrl(\'https://wa.me/989127285065\')"><div class="em">💬</div><div><b>واتساپ</b><small>+98 912 728 5065</small></div></div>' +
    '<div class="contact" onclick="openUrl(\'https://t.me/+989127285065\')"><div class="em">✈️</div><div><b>تلگرام</b><small>+98 912 728 5065</small></div></div>' +
    '<div class="contact" onclick="openUrl(\'https://amnlak.ir\')"><div class="em">🌐</div><div><b>وب‌سایت امنلاک</b><small>amnlak.ir</small></div></div>' +
    '<div class="infocard" style="margin-top:12px">اگر ماشین‌حساب جدیدی نیاز دارید، ضریبی را نادرست می‌دانید یا پیشنهادی برای بهترشدن برنامه دارید، از راه‌های بالا با توسعه‌دهنده در ارتباط باشید.</div>';
}


/* ---------- ارتباط با توسعه‌دهنده ---------- */
var DEV = {
  name: 'محمد جواد قهرمانی',
  role: 'طراح و توسعه‌دهنده اپلیکیشن امنلاک',
  phone: '09127285065',
  intl: '989127285065'
};

function smsTo(n) { if (window.Android && Android.sms) Android.sms(n, ''); }
function copyTxt(t) { if (window.Android && Android.copy) Android.copy(t); }

function soc(label, emoji, bg, url) {
  return '<div class="soc" onclick="openUrl(\'' + url + '\')">' +
         '<div class="ic" style="background:' + bg + '">' + emoji + '</div><small>' + label + '</small></div>';
}

function viewDev() {
  var p = DEV.phone, i = DEV.intl;
  var h = '';
  h += '<div class="devhead">' +
       '<div class="devava"><img src="img/dev-avatar.jpg" alt="محمد جواد قهرمانی"></div>' +
       '<b>' + DEV.name + '</b>' +
       '<span>' + DEV.role + '</span>' +
       '<div class="badge">+98 912 728 5065</div>' +
       '</div>';

  h += '<div class="phonebox"><div><small style="color:var(--muted);font-size:11px">شماره همراه</small>' +
       '<div class="num">' + fa(p) + '</div></div>' +
       '<button class="cp" onclick="copyTxt(\'' + p + '\')">کپی شماره</button></div>';

  h += '<div class="actrow">' +
       '<button class="actbtn call" onclick="callUs(\'' + p + '\')">📞 تماس تلفنی</button>' +
       '<button class="actbtn sms" onclick="smsTo(\'' + p + '\')">✉️ ارسال پیامک</button>' +
       '</div>';

  h += '<div class="sectitle">شبکه‌های اجتماعی و پیام‌رسان‌ها</div>';
  h += '<div class="socgrid">' +
       soc('بله', 'ب', 'linear-gradient(135deg,#1CA9A0,#0E7E78)', 'https://ble.ir/' + p) +
       soc('روبیکا', 'ر', 'linear-gradient(135deg,#8B44F7,#5B1FC0)', 'https://rubika.ir/' + p) +
       soc('ایتا', 'ا', 'linear-gradient(135deg,#FF8A00,#E06100)', 'https://eitaa.com/' + p) +
       soc('واتساپ', '💬', 'linear-gradient(135deg,#25D366,#0F9D58)', 'https://wa.me/' + i) +
       soc('تلگرام', '✈️', 'linear-gradient(135deg,#31A9E0,#1C7CB3)', 'https://t.me/+' + i) +
       '<div class="soc" onclick="shareDev()"><div class="ic" style="background:linear-gradient(135deg,#6B7A90,#41506A)">↗</div><small>اشتراک‌گذاری</small></div>' +
       '</div>';

  h += '<div class="sectitle">درباره توسعه‌دهنده</div>';
  h += '<div class="infocard">' +
       '<img class="devphoto" src="img/dev.jpg" alt="محمد جواد قهرمانی">' +
       '<b>' + DEV.name + '</b> توسعه‌دهنده نرم‌افزارهای موبایل و وب است که این اپلیکیشن را با هدف ساده‌سازی محاسبات ' +
       'ساختمان‌سازی و معاملات ملکی برای مهندسان، سازندگان، مشاوران املاک و عموم کاربران طراحی و پیاده‌سازی کرده است.<br><br>' +
       'تمرکز او بر ساخت ابزارهای کاربردی، سریع و کاملاً فارسی است؛ ابزارهایی که بدون نیاز به اینترنت و دانش تخصصی، ' +
       'نتیجه‌ای سریع و شفاف برای برآورد اولیه مقدار مصالح، هزینه‌ها و معاملات در اختیار کاربر بگذارند.<br><br>' +
       'طراحی رابط کاربری، موتور محاسباتی، فرمول‌نویسی و بسته‌بندی نسخه اندروید این برنامه توسط ایشان انجام شده است.' +
       '<div class="skills"><span>اپلیکیشن اندروید</span><span>طراحی رابط کاربری</span><span>وب اپلیکیشن</span>' +
       '<span>ابزارهای ساختمانی</span><span>پشتیبانی و توسعه</span></div></div>';

  h += '<div class="infocard"><h3>پیشنهاد، انتقاد و سفارش پروژه</h3>' +
       'اگر ایده‌ای برای بهبود این برنامه دارید، خطایی در محاسبات دیدید، یا به ساخت اپلیکیشن اختصاصی برای کسب‌وکار خود ' +
       'نیاز دارید، از راه‌های بالا در ارتباط باشید. پاسخگویی در پیام‌رسان‌ها سریع‌تر انجام می‌شود.</div>';

  h += '<p class="disc">نسخه اولیه ۰.۱ اپلیکیشن امنلاک<br>طراحی و توسعه: ' + DEV.name + '</p>';
  return h;
}

function shareDev() {
  var t = 'ارتباط با ' + DEV.name + '\n' + 'توسعه‌دهنده اپلیکیشن امنلاک' + '\n' +
          'شماره همراه: ' + DEV.phone + '\n' +
          'تلگرام: t.me/+' + DEV.intl + '\n' + 'واتساپ: wa.me/' + DEV.intl + '\n' +
          'ایتا: eitaa.com/' + DEV.phone + '\n' + 'بله: ble.ir/' + DEV.phone + '\n' + 'روبیکا: rubika.ir/' + DEV.phone;
  if (window.Android && Android.share) Android.share(t);
}


/* ===================== تم روشن / شب ===================== */
var ICON_MOON = '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>';
var ICON_SUN  = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>';

function isDark() { return document.body.classList.contains('dark'); }
function applyTheme(dark, save) {
  document.body.classList.toggle('dark', !!dark);
  var b = el('themebtn'); if (b) b.innerHTML = dark ? ICON_SUN : ICON_MOON;
  if (save) { try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {} }
  if (window.Android && Android.theme) { try { Android.theme(!!dark); } catch (e) {} }
}
function toggleTheme() { applyTheme(!isDark(), true); }
function initTheme() {
  var t = null; try { t = localStorage.getItem('theme'); } catch (e) {}
  var dark = t ? (t === 'dark')
               : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  applyTheme(!!dark, false);
}

/* ===================== تاریخ شمسی ===================== */
function jalaliDate(ts) {
  var d = new Date(ts);
  var gy = d.getFullYear(), gm = d.getMonth() + 1, gd = d.getDate();
  var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  var jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  var gy2 = (gm > 2) ? (gy + 1) : gy;
  var days = (365 * gy) + parseInt((gy2 + 3) / 4) - parseInt((gy2 + 99) / 100) +
             parseInt((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * parseInt(days / 12053); days %= 12053;
  jy += 4 * parseInt(days / 1461); days %= 1461;
  if (days > 365) { jy += parseInt((days - 1) / 365); days = (days - 1) % 365; }
  var jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
  var jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  function p2(x) { return (x < 10 ? '0' : '') + x; }
  return fa(jy + '/' + p2(jm) + '/' + p2(jd)) + ' – ' + fa(p2(d.getHours()) + ':' + p2(d.getMinutes()));
}

/* ===================== تاریخچه محاسبات ===================== */
var PREFILL = null;
function histGet() { try { return JSON.parse(localStorage.getItem('hist') || '[]'); } catch (e) { return []; } }
function histSave(l) { try { localStorage.setItem('hist', JSON.stringify(l.slice(0, 50))); } catch (e) {} }
function histAdd(e) { var l = histGet(); l.unshift(e); histSave(l); }
function histClearAll() {
  histSave([]);
  if (window.Android && Android.toast) Android.toast('تاریخچه پاک شد');
  render({ view: 'history' });
}
function histDel(i, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  var l = histGet(); l.splice(i, 1); histSave(l); render({ view: 'history' });
}
function histOpen(i) {
  var e = histGet()[i]; if (!e) return;
  PREFILL = e.vals || null;
  go('calc', e.g, e.cid);
}
function viewHistory() {
  var l = histGet();
  var h = '<div class="cbanner" style="background:linear-gradient(135deg,#41506A,#1F2A3D)">' +
          '<div class="em">🕘</div><div><b>تاریخچه محاسبات</b><span>' +
          (l.length ? fa(l.length) + ' محاسبه ذخیره شده – برای باز کردن مجدد لمس کنید' : 'هنوز محاسبه‌ای ذخیره نشده است') +
          '</span></div></div>';
  if (!l.length) {
    h += '<div class="empty">هر محاسبه‌ای که انجام دهید به‌صورت خودکار اینجا ذخیره می‌شود<br>و بعداً می‌توانید با همان ورودی‌ها بازش کنید.</div>';
    return h;
  }
  h += '<div class="histbar"><button onclick="histClearAll()">🗑 پاک کردن همه</button>' +
       '<button onclick="shareHistory()">📤 اشتراک‌گذاری فهرست</button></div>';
  l.forEach(function (e, i) {
    h += '<div class="hrow" onclick="histOpen(' + i + ')">' +
         '<div class="em">' + e.em + '</div>' +
         '<div class="hb"><b>' + e.title + '</b><small>' + jalaliDate(e.ts) + '</small></div>' +
         '<div class="hv">' + fa(e.value) + ' <small style="font-size:10px">' + e.unit + '</small></div>' +
         '<button class="del" onclick="histDel(' + i + ',event)">✕</button></div>';
  });
  return h;
}
function shareHistory() {
  var l = histGet(), t = 'تاریخچه محاسبات – اپلیکیشن امنلاک\n\n';
  l.forEach(function (e) { t += '• ' + e.title + ': ' + fa(e.value) + ' ' + e.unit + '  (' + jalaliDate(e.ts) + ')\n'; });
  if (window.Android && Android.share) Android.share(t);
}

/* ===================== انیمیشن ===================== */
function stagger(root) {
  var it = root.querySelectorAll('.grid .gcard, .list .row, .hrow, .socgrid .soc');
  for (var i = 0; i < it.length; i++) it[i].style.animationDelay = Math.min(i * 45, 500) + 'ms';
}
function countUp(node, target) {
  var txt = String(target), num = parseFloat(String(target).replace(/[^\d.]/g, ''));
  if (isNaN(num) || num > 5000000) { node.innerHTML = fa(target); return; }
  var dec = (String(target).indexOf('.') > -1) ? 1 : 0;
  var t0 = null, dur = 650;
  function step(ts) {
    if (!t0) t0 = ts;
    var k = Math.min((ts - t0) / dur, 1);
    var e = 1 - Math.pow(1 - k, 3);
    var v = num * e;
    node.innerHTML = fa(dec ? Math.round(v * 10) / 10 : Math.round(v));
    if (k < 1) requestAnimationFrame(step); else node.innerHTML = fa(target);
  }
  requestAnimationFrame(step);
}


/* ===================== تور راهنمای اولین اجرا ===================== */
var TOUR = [
  { sel: '#menubtn', em: '📂', t: 'منوی اصلی برنامه',
    d: 'با لمس این دکمه منوی همبرگری باز می‌شود؛ همه گروه‌های ساختمانی و ملکی، تاریخچه، راهنما، پشتیبانی و اطلاعات توسعه‌دهنده از همین‌جا در دسترس است.' },
  { sel: '#q', em: '🔎', t: 'جستجوی سریع',
    d: 'نام ابزار مورد نظرتان را بنویسید؛ مثلاً «بتن»، «میلگرد»، «هزینه ساخت» یا «کمیسیون».' },
  { sel: '.grid', em: '🧮', t: 'گروه‌های محاسبات',
    d: 'ابزارها در شش گروه دسته‌بندی شده‌اند: سازه و بتن، دیوار و مصالح، نازک‌کاری، متره و عملیات، هزینه ساخت و املاک و معاملات.' },
  { sel: '#themebtn', em: '🌙', t: 'حالت شب',
    d: 'با این دکمه بین حالت روشن و شب جابه‌جا شوید؛ انتخاب شما ذخیره می‌شود.' },
  { sel: null, em: '✅', t: 'آماده‌اید!',
    d: 'هر محاسبه خودکار در تاریخچه ذخیره می‌شود و می‌توانید نتیجه را در پیام‌رسان‌ها به اشتراک بگذارید.<br><br>این راهنما از بخش «درباره ما و راهنمای استفاده» دوباره قابل اجراست.' }
];
var tourIdx = -1;

function tourActive() { return !!el('tourWrap'); }
function endTour(markDone) {
  var w = el('tourWrap'); if (w) w.parentNode.removeChild(w);
  tourIdx = -1;
  if (markDone) { try { localStorage.setItem('tourDone', '1'); } catch (e) {} }
}
function startTour(force) {
  if (!force) { try { if (localStorage.getItem('tourDone')) return; } catch (e) {} }
  if (state.view !== 'home') render({ view: 'home' });
  drawerOpen(false);
  endTour(false);
  var w = document.createElement('div');
  w.id = 'tourWrap';
  w.innerHTML = '<div class="tour-spot" id="tourSpot"></div><div class="tour-tip" id="tourTip"></div>';
  document.body.appendChild(w);
  tourIdx = 0;
  showTourStep();
}
function tourNext() { if (tourIdx < TOUR.length - 1) { tourIdx++; showTourStep(); } else endTour(true); }
function tourPrev() { if (tourIdx > 0) { tourIdx--; showTourStep(); } }

function showTourStep() {
  var st = TOUR[tourIdx], spot = el('tourSpot'), tip = el('tourTip');
  if (!spot || !tip) return;
  var node = st.sel ? document.querySelector(st.sel) : null;
  var r = node ? node.getBoundingClientRect() : null;

  if (r && r.width) {
    var pad = 6;
    spot.style.top = (r.top - pad) + 'px';
    spot.style.left = (r.left - pad) + 'px';
    spot.style.width = (r.width + pad * 2) + 'px';
    spot.style.height = (r.height + pad * 2) + 'px';
  } else {
    spot.style.top = '50%'; spot.style.left = '50%';
    spot.style.width = '0px'; spot.style.height = '0px';
  }

  var dots = '';
  for (var i = 0; i < TOUR.length; i++) dots += '<i class="' + (i === tourIdx ? 'on' : '') + '"></i>';
  tip.innerHTML =
    '<h4>' + st.em + ' ' + st.t + '</h4>' +
    '<p>' + st.d + '</p>' +
    '<div class="tour-actions">' +
      '<div class="tour-dots">' + dots + '</div><div class="sp"></div>' +
      '<button class="tour-btn g" onclick="endTour(true)">لغو</button>' +
      (tourIdx > 0 ? '<button class="tour-btn g" onclick="tourPrev()">قبلی</button>' : '') +
      '<button class="tour-btn" onclick="tourNext()">' + (tourIdx === TOUR.length - 1 ? 'شروع کنیم' : 'بعدی') + '</button>' +
    '</div>';

  var th = tip.offsetHeight || 190, vh = window.innerHeight;
  var top;
  if (r && r.width) top = (r.bottom + 14 + th < vh) ? (r.bottom + 14) : Math.max(12, r.top - th - 14);
  else top = Math.max(12, (vh - th) / 2);
  tip.style.top = top + 'px';
  tip.style.left = Math.max(16, (window.innerWidth - tip.offsetWidth) / 2) + 'px';
}
window.addEventListener('resize', function () { if (tourActive()) showTourStep(); });


/* ===================== اسپلش تمام‌صفحه ===================== */
var splashDone = false;
function endSplash() {
  if (splashDone) return; splashDone = true;
  var sp = el('splash');
  if (sp) {
    sp.classList.add('out');
    setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 500);
  }
  applyTheme(isDark(), false);                 // بازگرداندن رنگ نوار وضعیت
  setTimeout(function () { startTour(false); }, 450);
}
function runSplash() {
  var sp = el('splash');
  if (!sp) { endSplash(); return; }
  if (window.Android && Android.theme) { try { Android.theme(true); } catch (e) {} }
  sp.addEventListener('click', endSplash);
  setTimeout(function () {
    var g = el('spgif'); if (g) g.classList.add('up');
    var t = el('sptxt'); if (t) t.classList.add('show');
    var hi = el('sphint'); if (hi) hi.classList.add('show');
  }, 1500);
  setTimeout(endSplash, 3900);
}

/* ---------- شروع ---------- */
document.addEventListener('DOMContentLoaded', function () {
  buildDrawer();
  render({ view: 'home' });
  initTheme();
  el('themebtn').onclick = toggleTheme;
  el('menubtn').onclick = function () { drawerOpen(!isDrawerOpen()); };
  el('scrim').onclick = function () { drawerOpen(false); };
  el('backbtn').onclick = function () { if (!window.appBack()) render({ view: 'home' }); };
  runSplash();
});
