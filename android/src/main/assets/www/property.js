/* ===========================================================
   امنلاک ۰.۲ — نقشه و ثبت آزمایشی ملک
   اطلاعات ملک فقط روی گوشی ذخیره و متن آن برای تلگرام آماده می‌شود.
   =========================================================== */

var MAIN_MAP = null;
var USER_LOCATION_MARKER = null;
var USER_ACCURACY_CIRCLE = null;
var MAP_FOCUSING_PROPERTY = false;
var LOCATION_REQUESTED = false;
var LOCATION_MANUAL_REQUEST = false;
var LOCATION_BUTTON_TIMER = null;
var REGISTER_MAP = null;
var REGISTER_MARKER = null;
var REGISTER_POINT_TOUCHED = false;
var REG_LAT = 35.6892;
var REG_LNG = 51.3890;
var TELEGRAM_MANAGER = 'https://t.me/+989127285065';

function propsGet() {
  try { return JSON.parse(localStorage.getItem('amnlak_properties') || '[]'); }
  catch (e) { return []; }
}
function propsSave(list) {
  try { localStorage.setItem('amnlak_properties', JSON.stringify(list.slice(0, 100))); }
  catch (e) {}
}
function userGet() {
  try { return JSON.parse(localStorage.getItem('amnlak_user') || 'null'); }
  catch (e) { return null; }
}
function goTab(view) {
  history_ = [];
  render({ view: view });
  drawerOpen(false);
}
function updateBottomNav(view) {
  var active = view;
  if (view !== 'home' && view !== 'register' && view !== 'account') active = 'tools';
  var buttons = document.querySelectorAll('.bottomnav .bn');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.toggle('on', buttons[i].getAttribute('data-view') === active);
  }
}

/* ===================== صفحه نقشه ===================== */
function viewHome() {
  return '<div class="map-shell">' +
    '<div id="mainMap"></div>' +
    '<button class="map-location" id="mapLocationBtn" onclick="locateUserOnMap()" aria-label="نمایش موقعیت من" title="موقعیت من">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path></svg>' +
    '</button>' +
  '</div>';
}

function storedUserLocation() {
  try {
    var p = JSON.parse(localStorage.getItem('amnlak_user_location') || 'null');
    if (p && isFinite(p.lat) && isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180) return p;
  } catch (e) {}
  return null;
}

function showUserLocation(lat, lng, accuracy) {
  lat = Number(lat); lng = Number(lng); accuracy = Number(accuracy) || 0;
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
  try { localStorage.setItem('amnlak_user_location', JSON.stringify({ lat: lat, lng: lng, accuracy: accuracy, ts: Date.now() })); } catch (e) {}

  if (MAIN_MAP) {
    if (USER_LOCATION_MARKER) { try { MAIN_MAP.removeLayer(USER_LOCATION_MARKER); } catch (e) {} }
    if (USER_ACCURACY_CIRCLE) { try { MAIN_MAP.removeLayer(USER_ACCURACY_CIRCLE); } catch (e) {} }
    if (accuracy > 0 && accuracy < 5000) {
      USER_ACCURACY_CIRCLE = L.circle([lat, lng], {
        radius: accuracy, color: '#087ECC', weight: 1, opacity: .45,
        fillColor: '#2DAEF3', fillOpacity: .10, interactive: false
      }).addTo(MAIN_MAP);
    }
    USER_LOCATION_MARKER = L.circleMarker([lat, lng], {
      radius: 8, color: '#fff', weight: 3, fillColor: '#087ECC',
      fillOpacity: 1, opacity: 1
    }).addTo(MAIN_MAP);
    if (!MAP_FOCUSING_PROPERTY) MAIN_MAP.setView([lat, lng], 17);
  }

  if (REGISTER_MAP && REGISTER_MARKER && !REGISTER_POINT_TOUCHED) {
    REG_LAT = Math.round(lat * 1000000) / 1000000;
    REG_LNG = Math.round(lng * 1000000) / 1000000;
    REGISTER_MARKER.setLatLng([REG_LAT, REG_LNG]);
    REGISTER_MAP.setView([REG_LAT, REG_LNG], 17);
    if (el('latTxt')) el('latTxt').textContent = REG_LAT.toFixed(6);
    if (el('lngTxt')) el('lngTxt').textContent = REG_LNG.toFixed(6);
  }
  clearLocationButtonState();
  LOCATION_MANUAL_REQUEST = false;
}

function clearLocationButtonState() {
  if (LOCATION_BUTTON_TIMER) { clearTimeout(LOCATION_BUTTON_TIMER); LOCATION_BUTTON_TIMER = null; }
  var btn = el('mapLocationBtn');
  if (btn) btn.classList.remove('locating');
}

window.onNativeLocation = function (lat, lng, accuracy) {
  showUserLocation(lat, lng, accuracy);
};
window.onNativeLocationError = function () {
  clearLocationButtonState();
  if (LOCATION_MANUAL_REQUEST) toastMsg('موقعیت در دسترس نیست؛ GPS و مجوز مکان را بررسی کنید');
  LOCATION_MANUAL_REQUEST = false;
};

function requestCurrentLocation(force) {
  if (LOCATION_REQUESTED && !force) return;
  LOCATION_REQUESTED = true;
  if (force) LOCATION_MANUAL_REQUEST = true;
  if (window.Android && Android.requestLocation) {
    try { Android.requestLocation(); return; } catch (e) {}
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (p) {
      showUserLocation(p.coords.latitude, p.coords.longitude, p.coords.accuracy);
    }, function () {
      window.onNativeLocationError();
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: force ? 0 : 120000 });
  } else {
    window.onNativeLocationError();
  }
}

function locateUserOnMap() {
  MAP_FOCUSING_PROPERTY = false;
  var stored = storedUserLocation();
  if (stored && MAIN_MAP) MAIN_MAP.setView([stored.lat, stored.lng], 17);
  var btn = el('mapLocationBtn');
  if (btn) btn.classList.add('locating');
  if (LOCATION_BUTTON_TIMER) clearTimeout(LOCATION_BUTTON_TIMER);
  LOCATION_BUTTON_TIMER = setTimeout(function () {
    clearLocationButtonState();
    if (LOCATION_MANUAL_REQUEST) toastMsg('دریافت موقعیت طول کشید؛ GPS را بررسی کنید');
    LOCATION_MANUAL_REQUEST = false;
  }, 13000);
  requestCurrentLocation(true);
}

function initMainMap() {
  if (!window.L || !el('mainMap')) return;
  if (MAIN_MAP) { try { MAIN_MAP.remove(); } catch (e) {} MAIN_MAP = null; }
  USER_LOCATION_MARKER = null;
  USER_ACCURACY_CIRCLE = null;
  MAP_FOCUSING_PROPERTY = false;
  var stored = storedUserLocation();
  var start = stored ? [stored.lat, stored.lng] : [35.6892, 51.3890];
  MAIN_MAP = L.map('mainMap', { zoomControl: true, attributionControl: true }).setView(start, stored ? 16 : 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(MAIN_MAP);

  var list = propsGet(), focusId = null;
  try { focusId = localStorage.getItem('amnlak_focus_property'); localStorage.removeItem('amnlak_focus_property'); } catch (e) {}
  var focusMarker = null;
  list.forEach(function (p) {
    if (!p.lat || !p.lng) return;
    var m = L.marker([p.lat, p.lng]).addTo(MAIN_MAP);
    m.bindPopup('<div class="p-popup"><b>' + esc(p.title) + '</b><small>' + esc(p.typeLabel) + ' • ' + esc(p.dealLabel) + '</small><small>' + esc(p.priceLabel) + '</small><span>' + esc(p.status) + '</span></div>');
    if (String(p.id) === String(focusId)) focusMarker = m;
  });
  if (focusMarker) {
    MAP_FOCUSING_PROPERTY = true;
    MAIN_MAP.setView(focusMarker.getLatLng(), 17);
    focusMarker.openPopup();
  }
  if (stored) showUserLocation(stored.lat, stored.lng, stored.accuracy);
  requestCurrentLocation();
  setTimeout(function () { if (MAIN_MAP) MAIN_MAP.invalidateSize(); }, 250);
}

/* ===================== ورود آزمایشی ===================== */
function sendPrototypeOtp() {
  var n = el('authPhone');
  var phone = n ? toEn(n.value).replace(/\D/g, '') : '';
  if (!/^09\d{9}$/.test(phone)) {
    if (n) n.style.borderColor = '#D13D4D';
    toastMsg('شماره موبایل معتبر وارد کنید');
    return;
  }
  n.style.borderColor = '';
  try { localStorage.setItem('amnlak_otp_phone', phone); } catch (e) {}
  var box = el('otpBox'); if (box) box.style.display = 'block';
  var hint = el('otpHint'); if (hint) hint.classList.add('on');
  toastMsg('کد آزمایشی ساخته شد');
}
function verifyPrototypeOtp() {
  var code = el('authCode') ? toEn(el('authCode').value).replace(/\D/g, '') : '';
  var phone = '';
  try { phone = localStorage.getItem('amnlak_otp_phone') || ''; } catch (e) {}
  if (code !== '12345' || !phone) {
    toastMsg('کد آزمایشی صحیح ۱۲۳۴۵ است');
    return;
  }
  try { localStorage.setItem('amnlak_user', JSON.stringify({ phone: phone, verified: true, ts: Date.now() })); } catch (e) {}
  render({ view: 'register' });
  toastMsg('شماره با موفقیت تأیید شد');
}
function logoutPropertyUser() {
  try { localStorage.removeItem('amnlak_user'); localStorage.removeItem('amnlak_otp_phone'); } catch (e) {}
  render({ view: 'account' });
}
function toastMsg(msg) {
  if (window.Android && Android.toast) { try { Android.toast(msg); return; } catch (e) {} }
  var old = el('webToast'); if (old && old.parentNode) old.parentNode.removeChild(old);
  var t = document.createElement('div'); t.id = 'webToast'; t.textContent = msg;
  t.style.cssText = 'position:fixed;z-index:999;bottom:86px;left:50%;transform:translateX(-50%);background:#152238;color:#fff;border-radius:12px;padding:9px 14px;font:12px Vazirmatn;box-shadow:0 5px 20px #0004';
  document.body.appendChild(t); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2200);
}

/* ===================== ثبت ملک ===================== */
function viewRegister() {
  var user = userGet();
  if (!user || !user.verified) {
    return '<div class="prop-wrap">' +
      '<div class="proto-alert"><b>نسخه آزمایشی ثبت ملک</b>در این نسخه پیامک واقعی ارسال نمی‌شود. برای ورود، کد آزمایشی ۱۲۳۴۵ را وارد کنید.</div>' +
      '<div class="card auth-card">' +
        '<img class="auth-logo" src="img/logo.png" alt="امنلاک"><h2>ورود مالک</h2><p>برای ثبت و پیگیری ملک، شماره موبایل خود را تأیید کنید.</p>' +
        '<div class="pf"><label>شماره موبایل</label><input id="authPhone" inputmode="tel" maxlength="11" placeholder="مثلاً 09121234567"></div>' +
        '<button class="btn" onclick="sendPrototypeOtp()">دریافت کد آزمایشی</button>' +
        '<div class="otp-hint" id="otpHint">کد نسخه آزمایشی: <b>۱۲۳۴۵</b></div>' +
        '<div id="otpBox" style="display:none"><div class="pf"><label>کد تأیید</label><input id="authCode" inputmode="numeric" maxlength="5" placeholder="کد پنج‌رقمی"></div>' +
        '<button class="btn" onclick="verifyPrototypeOtp()">تأیید و ادامه</button></div>' +
      '</div></div>';
  }

  return '<div class="prop-wrap">' +
    '<div class="proto-alert"><b>ثبت آزمایشی برای بررسی مدیر</b>ملک روی همین گوشی ذخیره می‌شود و متن آن برای تلگرام توسعه‌دهنده آماده خواهد شد. تصاویر را پس از بازشدن تلگرام ارسال کنید.</div>' +

    '<div class="form-section"><h3>' + uiIcon('location') + '<span>۱. موقعیت ملک</span></h3><p class="loc-help">نقطه دقیق ملک را روی نقشه لمس کنید.</p>' +
      '<div id="pickMap"></div><div class="coord"><span id="latTxt">35.689200</span><span id="lngTxt">51.389000</span></div></div>' +

    '<div class="form-section"><h3>' + uiIcon('tag') + '<span>۲. نوع آگهی</span></h3>' +
      '<div class="trx"><button id="trxSale" class="on" onclick="pickDeal(\'sale\')">فروش</button><button id="trxRent" onclick="pickDeal(\'rent\')">رهن و اجاره</button></div>' +
      '<input type="hidden" id="propDeal" value="sale"></div>' +

    '<div class="form-section"><h3>' + uiIcon('estate') + '<span>۳. مشخصات ملک</span></h3><div class="form-grid">' +
      '<div class="pf wide"><label>عنوان آگهی</label><input id="propTitle" placeholder="مثلاً آپارتمان دوخوابه خوش‌نقشه"></div>' +
      '<div class="pf"><label>نوع ملک</label><select id="propType"><option value="apartment">آپارتمان</option><option value="villa">ویلایی</option><option value="land">زمین</option><option value="shop">مغازه</option><option value="office">اداری</option><option value="warehouse">انبار و صنعتی</option></select></div>' +
      '<div class="pf"><label>متراژ</label><input id="propArea" inputmode="decimal" placeholder="متر مربع"></div>' +
      '<div class="pf"><label>تعداد اتاق</label><select id="propRooms"><option value="0">بدون اتاق</option><option value="1">۱ اتاق</option><option value="2">۲ اتاق</option><option value="3">۳ اتاق</option><option value="4">۴ اتاق و بیشتر</option></select></div>' +
      '<div class="pf"><label>سال ساخت</label><input id="propYear" inputmode="numeric" placeholder="مثلاً 1400"></div>' +
      '<div class="pf wide"><label>نشانی</label><input id="propAddress" placeholder="استان، شهر، محله و نشانی تقریبی"></div>' +
    '</div></div>' +

    '<div class="form-section"><h3>' + uiIcon('cost') + '<span>۴. قیمت</span></h3>' +
      '<div class="price-sale on" id="priceSale"><div class="pf"><label>قیمت کل فروش (تومان)</label><input id="propPrice" inputmode="numeric" placeholder="مثلاً 8000000000"></div></div>' +
      '<div class="price-rent" id="priceRent"><div class="form-grid"><div class="pf"><label>رهن (تومان)</label><input id="propDeposit" inputmode="numeric" placeholder="500000000"></div><div class="pf"><label>اجاره ماهانه</label><input id="propRent" inputmode="numeric" placeholder="15000000"></div></div></div>' +
    '</div>' +

    '<div class="form-section"><h3>' + uiIcon('sparkles') + '<span>۵. امکانات و توضیحات</span></h3>' +
      '<div class="feature-picks"><label><input type="checkbox" name="feat" value="پارکینگ"> پارکینگ</label><label><input type="checkbox" name="feat" value="انباری"> انباری</label><label><input type="checkbox" name="feat" value="آسانسور"> آسانسور</label><label><input type="checkbox" name="feat" value="بالکن"> بالکن</label><label><input type="checkbox" name="feat" value="سند رسمی"> سند رسمی</label></div>' +
      '<div class="pf" style="margin-top:10px"><label>توضیحات</label><textarea id="propDesc" placeholder="ویژگی‌ها و شرایط ملک را بنویسید"></textarea></div>' +
      '<div class="filebox"><b class="file-title">' + uiIcon('camera') + '<span>تصاویر ملک</span></b><br><input type="file" id="propImages" accept="image/*" multiple onchange="previewPropertyFiles(this)"><div class="file-preview" id="filePreview">حداکثر چند تصویر برای بررسی انتخاب کنید</div></div>' +
    '</div>' +

    '<button class="btn send-btn with-icon" onclick="submitProperty()">' + uiIcon('send') + '<span>ثبت و ارسال برای تلگرام مدیر</span></button>' +
    '<p class="submit-note">با ثبت ملک، صحت اطلاعات و اجازه ارسال آن برای بررسی مدیر را تأیید می‌کنید.</p>' +
  '</div>';
}

function initRegisterPage() {
  if (!window.L || !el('pickMap')) return;
  if (REGISTER_MAP) { try { REGISTER_MAP.remove(); } catch (e) {} REGISTER_MAP = null; }
  var stored = storedUserLocation();
  if (stored) { REG_LAT = stored.lat; REG_LNG = stored.lng; }
  REGISTER_POINT_TOUCHED = false;
  REGISTER_MAP = L.map('pickMap', { zoomControl: true, attributionControl: false }).setView([REG_LAT, REG_LNG], stored ? 17 : 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(REGISTER_MAP);
  REGISTER_MARKER = L.marker([REG_LAT, REG_LNG], { draggable: true }).addTo(REGISTER_MAP);
  function setPoint(lat, lng, selectedByUser) {
    if (selectedByUser) REGISTER_POINT_TOUCHED = true;
    REG_LAT = Math.round(lat * 1000000) / 1000000;
    REG_LNG = Math.round(lng * 1000000) / 1000000;
    REGISTER_MARKER.setLatLng([REG_LAT, REG_LNG]);
    if (el('latTxt')) el('latTxt').textContent = REG_LAT.toFixed(6);
    if (el('lngTxt')) el('lngTxt').textContent = REG_LNG.toFixed(6);
  }
  setPoint(REG_LAT, REG_LNG, false);
  REGISTER_MAP.on('click', function (e) { setPoint(e.latlng.lat, e.latlng.lng, true); });
  REGISTER_MARKER.on('dragend', function () { var p = REGISTER_MARKER.getLatLng(); setPoint(p.lat, p.lng, true); });
  requestCurrentLocation();
  setTimeout(function () { if (REGISTER_MAP) REGISTER_MAP.invalidateSize(); }, 250);
}
function pickDeal(deal) {
  if (el('propDeal')) el('propDeal').value = deal;
  if (el('trxSale')) el('trxSale').classList.toggle('on', deal === 'sale');
  if (el('trxRent')) el('trxRent').classList.toggle('on', deal === 'rent');
  if (el('priceSale')) el('priceSale').classList.toggle('on', deal === 'sale');
  if (el('priceRent')) el('priceRent').classList.toggle('on', deal === 'rent');
}
function previewPropertyFiles(input) {
  var n = input && input.files ? input.files.length : 0;
  if (el('filePreview')) el('filePreview').textContent = n ? fa(n) + ' تصویر انتخاب شد؛ پس از بازشدن تلگرام آن‌ها را نیز ارسال کنید.' : 'تصویری انتخاب نشده است';
}
function numVal(id) {
  var n = el(id); if (!n) return 0;
  return parseFloat(toEn(n.value).replace(/[^\d.]/g, '')) || 0;
}
function typeLabel(v) {
  return ({apartment:'آپارتمان',villa:'ویلایی',land:'زمین',shop:'مغازه',office:'اداری',warehouse:'انبار و صنعتی'})[v] || v;
}
function submitProperty() {
  var title = (el('propTitle').value || '').trim();
  var area = numVal('propArea');
  var address = (el('propAddress').value || '').trim();
  if (!title || !area || !address) {
    toastMsg('عنوان، متراژ و نشانی را کامل کنید'); return;
  }
  var deal = el('propDeal').value;
  var type = el('propType').value;
  var phone = userGet() ? userGet().phone : '';
  var feats = [], checks = document.querySelectorAll('input[name="feat"]:checked');
  for (var i = 0; i < checks.length; i++) feats.push(checks[i].value);
  var priceLabel = '';
  if (deal === 'sale') {
    var price = numVal('propPrice'); if (!price) { toastMsg('قیمت فروش را وارد کنید'); return; }
    priceLabel = fa(r0(price)) + ' تومان';
  } else {
    var deposit = numVal('propDeposit'), rent = numVal('propRent');
    if (!deposit && !rent) { toastMsg('مبلغ رهن یا اجاره را وارد کنید'); return; }
    priceLabel = 'رهن ' + fa(r0(deposit)) + ' — اجاره ' + fa(r0(rent)) + ' تومان';
  }
  var imageCount = el('propImages') && el('propImages').files ? el('propImages').files.length : 0;
  var p = {
    id: Date.now(), title: title, deal: deal, dealLabel: deal === 'sale' ? 'فروش' : 'رهن و اجاره',
    type: type, typeLabel: typeLabel(type), area: area, rooms: el('propRooms').value,
    year: (el('propYear').value || '').trim(), address: address,
    priceLabel: priceLabel, features: feats, desc: (el('propDesc').value || '').trim(),
    phone: phone, lat: REG_LAT, lng: REG_LNG, images: imageCount,
    status: 'در انتظار بررسی', ts: Date.now()
  };
  var list = propsGet(); list.unshift(p); propsSave(list);
  var text = '🏠 ثبت ملک جدید در امنلاک\n\n' +
    'عنوان: ' + p.title + '\nنوع معامله: ' + p.dealLabel + '\nنوع ملک: ' + p.typeLabel +
    '\nمتراژ: ' + p.area + ' متر مربع\nاتاق: ' + p.rooms + '\nسال ساخت: ' + (p.year || 'ثبت نشده') +
    '\nقیمت: ' + p.priceLabel + '\nنشانی: ' + p.address +
    '\nامکانات: ' + (p.features.length ? p.features.join('، ') : 'ثبت نشده') +
    '\nتوضیحات: ' + (p.desc || 'ندارد') + '\nشماره مالک: ' + p.phone +
    '\nتعداد تصاویر انتخابی: ' + imageCount +
    '\nموقعیت: https://www.google.com/maps?q=' + p.lat + ',' + p.lng +
    '\n\nارسال‌شده از نسخه آزمایشی امنلاک';

  if (window.Android && Android.copy) { try { Android.copy(text); } catch (e) {} }
  else if (navigator.clipboard) { navigator.clipboard.writeText(text).catch(function () {}); }
  try { localStorage.setItem('amnlak_last_submission', text); } catch (e) {}
  goTab('account');
  toastMsg('ملک ذخیره شد؛ متن برای تلگرام کپی شد');
  setTimeout(function () { openUrl(TELEGRAM_MANAGER); }, 650);
}

/* ===================== حساب من ===================== */
function viewAccount() {
  var user = userGet(), list = propsGet();
  if (!user || !user.verified) {
    return '<div class="prop-wrap"><div class="profile-head"><div class="avatar">' + uiIcon('user') + '</div><b>هنوز وارد نشده‌اید</b><small>برای ثبت و پیگیری ملک وارد شوید</small></div>' +
      '<button class="btn" style="margin-top:14px" onclick="goTab(\'register\')">ورود با شماره موبایل</button></div>';
  }
  var h = '<div class="prop-wrap"><div class="profile-head"><div class="avatar">' + uiIcon('user') + '</div><b>مالک تأییدشده آزمایشی</b><small>' + fa(user.phone) + '</small>' +
    '<div class="profile-stat"><div><strong>' + fa(list.length) + '</strong><span>ملک ثبت‌شده</span></div><div><strong>' + fa(list.filter(function(p){return p.status === 'در انتظار بررسی';}).length) + '</strong><span>در انتظار بررسی</span></div></div></div>';
  h += '<div class="sectitle">ملک‌های من</div>';
  if (!list.length) h += '<div class="card empty-props">هنوز ملکی ثبت نکرده‌اید.<br><a onclick="goTab(\'register\')">ثبت اولین ملک</a></div>';
  list.forEach(function (p) {
    h += '<div class="property-row" onclick="focusProperty(' + p.id + ')"><div class="ico">' + uiIcon('estate') + '</div><div class="body"><b>' + esc(p.title) + '</b><small>' + esc(p.typeLabel) + ' • ' + fa(p.area) + ' متر • ' + esc(p.priceLabel) + '</small></div><span class="status">' + esc(p.status) + '</span></div>';
  });
  h += '<button class="btn ghost logout" onclick="logoutPropertyUser()">خروج از حساب آزمایشی</button></div>';
  return h;
}
function focusProperty(id) {
  try { localStorage.setItem('amnlak_focus_property', String(id)); } catch (e) {}
  goTab('home');
}
