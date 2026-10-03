/* ===========================================================
   امنلاک — ترسیم و گزارش UTM زمین و ساختمان
   ترسیم روی نقشه، ورود مختصات، محاسبه مساحت و خروجی چاپ/PDF
   =========================================================== */

var UTM_MAP = null;
var UTM_LAYER = null;
var UTM_POINTS = [];
var UTM_ZONE = null;
var UTM_HEMISPHERE = 'N';
var UTM_LOCATION_ACTION = null;
var UTM_MAX_POINTS = 50;

if (typeof UI_ICONS !== 'undefined') {
  UI_ICONS.print = '<path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/><path d="M17 11h.01"/>';
  UI_ICONS.undo = '<path d="m9 7-5 5 5 5"/><path d="M4 12h9a6 6 0 0 1 6 6v1"/>';
  UI_ICONS.crosshair = '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>';
}

function viewUtmTool(c) {
  var h = '<div class="cbanner" style="background:linear-gradient(135deg,#4B4FA8,#7169D7)">' +
          '<div class="em">' + uiIcon('measure') + '</div><div><b>' + c.title + '</b><span>' + c.desc + '</span></div></div>';
  h += '<div class="utm-warning"><b>کاربرد و دقت</b>این ابزار برای برداشت اولیه، ترسیم و گزارش کارگاهی است. GPS معمولی گوشی دقت نقشه‌برداری ثبتی ندارد؛ برای سند، جانمایی حقوقی و اجرای دقیق از نقشه‌بردار و گیرنده GNSS/RTK استفاده کنید.</div>';
  h += '<div class="card utm-project">' +
       '<div class="utm-project-grid"><div class="f"><label>عنوان پروژه یا ملک</label><div class="inpwrap"><input id="utmTitle" value="نقشه UTM ملک" oninput="utmProjectChanged()"></div></div>' +
       '<div class="f"><label>نوع محدوده</label><select id="utmKind" onchange="utmProjectChanged()"><option value="زمین">زمین</option><option value="ساختمان">ساختمان</option><option value="محوطه">محوطه</option></select></div></div>' +
       '<div class="utm-help">برای افزودن رأس روی نقشه لمس کنید؛ رأس‌ها قابل جابه‌جایی هستند. برای برداشت میدانی کنار هر گوشه بایستید و «افزودن نقطه GPS» را بزنید.</div>' +
       '<div id="utmMap"></div>' +
       '<div class="utm-actions">' +
         '<button onclick="utmUseMyLocation(\'center\')">' + uiIcon('location') + '<span>مرکز روی من</span></button>' +
         '<button class="primary" onclick="utmUseMyLocation(\'add\')">' + uiIcon('crosshair') + '<span>افزودن نقطه GPS</span></button>' +
         '<button onclick="utmUndoPoint()">' + uiIcon('undo') + '<span>حذف آخرین</span></button>' +
         '<button class="danger" onclick="utmClearPoints()">' + uiIcon('trash') + '<span>پاک‌کردن</span></button>' +
       '</div>' +
       '<div id="utmStatus" class="utm-status"></div>' +
       '</div>';

  h += '<details class="card utm-manual"><summary>افزودن نقطه با مختصات UTM</summary>' +
       '<p>اگر مختصات برداشت‌شده دارید، Easting و Northing را همراه زون وارد کنید.</p>' +
       '<div class="utm-manual-grid">' +
         '<div class="f"><label>Easting (X)</label><div class="inpwrap"><input id="utmEasting" inputmode="decimal" placeholder="مثلاً 535200"><span class="unit">m</span></div></div>' +
         '<div class="f"><label>Northing (Y)</label><div class="inpwrap"><input id="utmNorthing" inputmode="decimal" placeholder="مثلاً 3950000"><span class="unit">m</span></div></div>' +
         '<div class="f"><label>Zone</label><div class="inpwrap"><input id="utmZoneInput" inputmode="numeric" value="39"><span class="unit">1–60</span></div></div>' +
         '<div class="f"><label>نیم‌کره</label><select id="utmHemisphere"><option value="N">شمالی (N)</option><option value="S">جنوبی (S)</option></select></div>' +
       '</div><button class="btn ghost" onclick="utmAddManualPoint()">افزودن این مختصات</button></details>';

  h += '<div class="card utm-points-card"><div class="utm-card-title"><b>رئوس و مختصات</b><span id="utmPointCount">۰ نقطه</span></div><div id="utmPoints"></div></div>';
  h += '<div id="utmReportWrap"></div>';
  h += '<div class="notes utm-notes"><b>راهنما</b><ol>' +
       '<li>حداقل سه نقطه برای تشکیل محدوده وارد کنید.</li>' +
       '<li>همه نقاط یک نقشه باید در یک زون UTM و یک نیم‌کره باشند.</li>' +
       '<li>خروجی چاپ، پلان شماتیک، جدول مختصات، طول اضلاع، مساحت و محیط را دارد.</li>' +
       '<li>در پنجره چاپ اندروید می‌توانید پرینتر را انتخاب یا فایل PDF ذخیره کنید.</li>' +
       '</ol></div>';
  return h;
}

function initUtmTool() {
  if (!window.L || !el('utmMap')) return;
  if (UTM_MAP) { try { UTM_MAP.remove(); } catch (e) {} UTM_MAP = null; }
  UTM_POINTS = [];
  UTM_ZONE = null;
  UTM_HEMISPHERE = 'N';

  var draft = utmLoadDraft();
  if (draft) {
    if (draft.title && el('utmTitle')) el('utmTitle').value = draft.title;
    if (draft.kind && el('utmKind')) el('utmKind').value = draft.kind;
    if (draft.zone >= 1 && draft.zone <= 60) UTM_ZONE = draft.zone;
    if (draft.hemisphere === 'S') UTM_HEMISPHERE = 'S';
    if (draft.points && draft.points.length) {
      for (var i = 0; i < draft.points.length && i < UTM_MAX_POINTS; i++) {
        var p = draft.points[i];
        if (isFinite(p.lat) && isFinite(p.lng) && Math.abs(p.lat) <= 84 && Math.abs(p.lng) <= 180) {
          UTM_POINTS.push({ lat:Number(p.lat), lng:Number(p.lng), source:p.source || 'saved', accuracy:Number(p.accuracy) || 0 });
        }
      }
    }
  }

  var stored = (typeof storedUserLocation === 'function') ? storedUserLocation() : null;
  var start = stored ? [stored.lat, stored.lng] : [35.6892, 51.3890];
  if (UTM_POINTS.length) start = [UTM_POINTS[0].lat, UTM_POINTS[0].lng];
  UTM_MAP = L.map('utmMap', { zoomControl:true, attributionControl:false }).setView(start, UTM_POINTS.length ? 19 : 17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(UTM_MAP);
  UTM_LAYER = L.layerGroup().addTo(UTM_MAP);
  UTM_MAP.on('click', function (e) { utmAddPoint(e.latlng.lat, e.latlng.lng, 'map', 0, false); });

  if (UTM_POINTS.length && !UTM_ZONE) UTM_ZONE = utmZoneNumber(UTM_POINTS[0].lng);
  if (UTM_POINTS.length) UTM_HEMISPHERE = UTM_POINTS[0].lat >= 0 ? 'N' : 'S';
  utmSetManualDefaults();
  utmRenderGeometry(true);
  setTimeout(function () { if (UTM_MAP) UTM_MAP.invalidateSize(); }, 250);
}

function utmLoadDraft() {
  try {
    var d = JSON.parse(localStorage.getItem('amnlak_utm_draft') || 'null');
    return d && typeof d === 'object' ? d : null;
  } catch (e) { return null; }
}

function utmSaveDraft() {
  try {
    localStorage.setItem('amnlak_utm_draft', JSON.stringify({
      title:el('utmTitle') ? el('utmTitle').value.trim() : 'نقشه UTM ملک',
      kind:el('utmKind') ? el('utmKind').value : 'زمین',
      zone:UTM_ZONE,
      hemisphere:UTM_HEMISPHERE,
      points:UTM_POINTS
    }));
  } catch (e) {}
}

function utmProjectChanged() {
  utmSaveDraft();
  utmUpdatePanel();
}

function utmZoneNumber(lng) {
  var z = Math.floor((Number(lng) + 180) / 6) + 1;
  return Math.max(1, Math.min(60, z));
}

function utmSetManualDefaults() {
  var z = el('utmZoneInput');
  var h = el('utmHemisphere');
  var center = UTM_MAP ? UTM_MAP.getCenter() : { lng:51.3890, lat:35.6892 };
  if (z) z.value = UTM_ZONE || utmZoneNumber(center.lng);
  if (h) h.value = UTM_POINTS.length ? UTM_HEMISPHERE : (center.lat >= 0 ? 'N' : 'S');
}

function utmAddPoint(lat, lng, source, accuracy, moveMap) {
  lat = Number(lat); lng = Number(lng);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 84 || Math.abs(lng) > 180) {
    toastMsg('مختصات واردشده معتبر نیست');
    return;
  }
  if (UTM_POINTS.length >= UTM_MAX_POINTS) {
    toastMsg('حداکثر ۵۰ رأس قابل ثبت است');
    return;
  }
  var hemisphere = lat >= 0 ? 'N' : 'S';
  if (UTM_POINTS.length && hemisphere !== UTM_HEMISPHERE) {
    toastMsg('همه نقاط باید در یک نیم‌کره باشند');
    return;
  }
  if (!UTM_POINTS.length) {
    if (!UTM_ZONE) UTM_ZONE = utmZoneNumber(lng);
    UTM_HEMISPHERE = hemisphere;
  }
  UTM_POINTS.push({ lat:lat, lng:lng, source:source || 'map', accuracy:Number(accuracy) || 0 });
  if (moveMap && UTM_MAP) UTM_MAP.setView([lat, lng], Math.max(UTM_MAP.getZoom(), 19));
  utmRenderGeometry(false);
  utmSaveDraft();
}

function utmDeletePoint(index) {
  if (index < 0 || index >= UTM_POINTS.length) return;
  UTM_POINTS.splice(index, 1);
  if (!UTM_POINTS.length) { UTM_ZONE = null; UTM_HEMISPHERE = 'N'; }
  utmRenderGeometry(false);
  utmSaveDraft();
}

function utmUndoPoint() {
  if (!UTM_POINTS.length) { toastMsg('نقطه‌ای برای حذف وجود ندارد'); return; }
  UTM_POINTS.pop();
  if (!UTM_POINTS.length) { UTM_ZONE = null; UTM_HEMISPHERE = 'N'; }
  utmRenderGeometry(false);
  utmSaveDraft();
}

function utmClearPoints() {
  if (!UTM_POINTS.length) return;
  if (!window.confirm('همه نقاط نقشه پاک شوند؟')) return;
  UTM_POINTS = [];
  UTM_ZONE = null;
  UTM_HEMISPHERE = 'N';
  utmRenderGeometry(false);
  utmSetManualDefaults();
  utmSaveDraft();
}

function utmRenderGeometry(fit) {
  if (!UTM_LAYER || !UTM_MAP) return;
  UTM_LAYER.clearLayers();
  var latlngs = [];
  for (var i = 0; i < UTM_POINTS.length; i++) latlngs.push([UTM_POINTS[i].lat, UTM_POINTS[i].lng]);
  if (latlngs.length >= 3) {
    L.polygon(latlngs, { color:'#5C63C7', weight:3, fillColor:'#7169D7', fillOpacity:.20 }).addTo(UTM_LAYER);
  } else if (latlngs.length >= 2) {
    L.polyline(latlngs, { color:'#5C63C7', weight:3, dashArray:'7 6' }).addTo(UTM_LAYER);
  }
  for (var j = 0; j < UTM_POINTS.length; j++) {
    (function (index) {
      var icon = L.divIcon({
        className:'utm-vertex-holder',
        html:'<span>' + fa(index + 1) + '</span>',
        iconSize:[30,30], iconAnchor:[15,15]
      });
      var marker = L.marker([UTM_POINTS[index].lat, UTM_POINTS[index].lng], { draggable:true, icon:icon }).addTo(UTM_LAYER);
      marker.on('dragend', function () {
        var p = marker.getLatLng();
        UTM_POINTS[index].lat = p.lat;
        UTM_POINTS[index].lng = p.lng;
        UTM_POINTS[index].source = 'edited';
        UTM_POINTS[index].accuracy = 0;
        utmRenderGeometry(false);
        utmSaveDraft();
      });
    })(j);
  }
  if (fit && latlngs.length) {
    if (latlngs.length === 1) UTM_MAP.setView(latlngs[0], 19);
    else UTM_MAP.fitBounds(L.latLngBounds(latlngs).pad(.28), { maxZoom:19 });
  }
  utmSetManualDefaults();
  utmUpdatePanel();
}

function utmUseMyLocation(action) {
  if (!UTM_MAP) return;
  UTM_LOCATION_ACTION = action;
  toastMsg(action === 'add' ? 'در حال دریافت نقطه دقیق‌تر GPS…' : 'در حال دریافت موقعیت…');
  if (window.Android) {
    try {
      if (action === 'add' && Android.requestFreshLocation) { Android.requestFreshLocation(); return; }
      if (Android.requestLocation) { Android.requestLocation(); return; }
    } catch (e) {}
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (p) {
      window.onUtmLocation(p.coords.latitude, p.coords.longitude, p.coords.accuracy);
    }, function () {
      window.onUtmLocationError();
    }, { enableHighAccuracy:true, timeout:20000, maximumAge:action === 'add' ? 0 : 60000 });
  } else window.onUtmLocationError();
}

window.onUtmLocation = function (lat, lng, accuracy) {
  if (!UTM_MAP || !UTM_LOCATION_ACTION) return;
  var action = UTM_LOCATION_ACTION;
  UTM_LOCATION_ACTION = null;
  if (action === 'add') utmAddPoint(lat, lng, 'gps', accuracy, true);
  else UTM_MAP.setView([Number(lat), Number(lng)], 19);
};

window.onUtmLocationError = function () {
  if (!UTM_LOCATION_ACTION) return;
  UTM_LOCATION_ACTION = null;
  toastMsg('دریافت موقعیت انجام نشد؛ GPS و مجوز مکان را بررسی کنید');
};

function utmAddManualPoint() {
  var e = parseFloat(toEn(el('utmEasting').value).replace(/[^\d.\-]/g, ''));
  var n = parseFloat(toEn(el('utmNorthing').value).replace(/[^\d.\-]/g, ''));
  var zone = parseInt(toEn(el('utmZoneInput').value).replace(/\D/g, ''), 10);
  var hemisphere = el('utmHemisphere').value === 'S' ? 'S' : 'N';
  if (!isFinite(e) || e < 100000 || e > 900000 || !isFinite(n) || n < 0 || n > 10000000 || !zone || zone < 1 || zone > 60) {
    toastMsg('Easting، Northing و Zone را صحیح وارد کنید');
    return;
  }
  if (UTM_POINTS.length && (zone !== UTM_ZONE || hemisphere !== UTM_HEMISPHERE)) {
    toastMsg('زون و نیم‌کره این نقطه با نقشه فعلی یکسان نیست');
    return;
  }
  var ll = utmToLatLng(e, n, zone, hemisphere);
  if (!ll || !isFinite(ll.lat) || !isFinite(ll.lng) || Math.abs(ll.lat) > 84) {
    toastMsg('تبدیل این مختصات ممکن نشد');
    return;
  }
  if (!UTM_POINTS.length) { UTM_ZONE = zone; UTM_HEMISPHERE = hemisphere; }
  el('utmEasting').value = '';
  el('utmNorthing').value = '';
  utmAddPoint(ll.lat, ll.lng, 'utm', 0, true);
}

function latLngToUtm(lat, lon, forcedZone) {
  lat = Number(lat); lon = Number(lon);
  var a = 6378137.0;
  var eccSquared = 0.00669438;
  var k0 = 0.9996;
  var zoneNumber = forcedZone || utmZoneNumber(lon);
  zoneNumber = Math.max(1, Math.min(60, Number(zoneNumber)));
  var longOrigin = (zoneNumber - 1) * 6 - 180 + 3;
  var latRad = lat * Math.PI / 180;
  var lonRad = lon * Math.PI / 180;
  var longOriginRad = longOrigin * Math.PI / 180;
  var eccPrimeSquared = eccSquared / (1 - eccSquared);
  var sinLat = Math.sin(latRad), cosLat = Math.cos(latRad), tanLat = Math.tan(latRad);
  var N = a / Math.sqrt(1 - eccSquared * sinLat * sinLat);
  var T = tanLat * tanLat;
  var C = eccPrimeSquared * cosLat * cosLat;
  var A = cosLat * (lonRad - longOriginRad);
  var M = a * ((1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * Math.pow(eccSquared, 3) / 256) * latRad
      - (3 * eccSquared / 8 + 3 * eccSquared * eccSquared / 32 + 45 * Math.pow(eccSquared, 3) / 1024) * Math.sin(2 * latRad)
      + (15 * eccSquared * eccSquared / 256 + 45 * Math.pow(eccSquared, 3) / 1024) * Math.sin(4 * latRad)
      - (35 * Math.pow(eccSquared, 3) / 3072) * Math.sin(6 * latRad));
  var easting = k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6
      + (5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) * Math.pow(A, 5) / 120) + 500000.0;
  var northing = k0 * (M + N * tanLat * (A * A / 2
      + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24
      + (61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) * Math.pow(A, 6) / 720));
  var hemisphere = lat < 0 ? 'S' : 'N';
  if (lat < 0) northing += 10000000.0;
  return { e:easting, n:northing, zone:zoneNumber, hemisphere:hemisphere };
}

function utmToLatLng(easting, northing, zoneNumber, hemisphere) {
  var a = 6378137.0;
  var eccSquared = 0.00669438;
  var k0 = 0.9996;
  var eccPrimeSquared = eccSquared / (1 - eccSquared);
  var e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared));
  var x = Number(easting) - 500000.0;
  var y = Number(northing);
  if (hemisphere === 'S') y -= 10000000.0;
  var longOrigin = (Number(zoneNumber) - 1) * 6 - 180 + 3;
  var M = y / k0;
  var mu = M / (a * (1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * Math.pow(eccSquared, 3) / 256));
  var phi1Rad = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu)
      + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu)
      + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu)
      + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);
  var sinPhi = Math.sin(phi1Rad), cosPhi = Math.cos(phi1Rad), tanPhi = Math.tan(phi1Rad);
  var N1 = a / Math.sqrt(1 - eccSquared * sinPhi * sinPhi);
  var T1 = tanPhi * tanPhi;
  var C1 = eccPrimeSquared * cosPhi * cosPhi;
  var R1 = a * (1 - eccSquared) / Math.pow(1 - eccSquared * sinPhi * sinPhi, 1.5);
  var D = x / (N1 * k0);
  var lat = phi1Rad - (N1 * tanPhi / R1) * (D * D / 2
      - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * Math.pow(D, 4) / 24
      + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * eccPrimeSquared - 3 * C1 * C1) * Math.pow(D, 6) / 720);
  var lon = (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6
      + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) * Math.pow(D, 5) / 120) / cosPhi;
  return { lat:lat * 180 / Math.PI, lng:longOrigin + lon * 180 / Math.PI };
}

function utmMetrics() {
  var zone = UTM_ZONE || (UTM_POINTS.length ? utmZoneNumber(UTM_POINTS[0].lng) : 39);
  var projected = [];
  for (var i = 0; i < UTM_POINTS.length; i++) projected.push(latLngToUtm(UTM_POINTS[i].lat, UTM_POINTS[i].lng, zone));
  var area2 = 0, perimeter = 0, sides = [];
  if (projected.length >= 2) {
    var limit = projected.length >= 3 ? projected.length : projected.length - 1;
    for (var j = 0; j < limit; j++) {
      var k = (j + 1) % projected.length;
      var dx = projected[k].e - projected[j].e;
      var dy = projected[k].n - projected[j].n;
      var d = Math.sqrt(dx * dx + dy * dy);
      sides.push(d);
      perimeter += d;
      if (projected.length >= 3) area2 += projected[j].e * projected[k].n - projected[k].e * projected[j].n;
    }
  }
  return { zone:zone, hemisphere:UTM_HEMISPHERE, utm:projected, sides:sides, perimeter:perimeter, area:Math.abs(area2) / 2 };
}

function utmSourceLabel(p) {
  if (p.source === 'gps') return p.accuracy > 0 ? 'GPS ±' + utmFixed(p.accuracy, 1) + 'm' : 'GPS';
  if (p.source === 'utm') return 'ورودی UTM';
  if (p.source === 'edited') return 'ویرایش روی نقشه';
  if (p.source === 'saved') return 'ذخیره‌شده';
  return 'روی نقشه';
}

function utmFixed(n, digits) {
  return Number(n).toFixed(digits);
}

function utmFa(n, digits) {
  return fa(utmFixed(n, digits));
}

function utmUpdatePanel() {
  var count = UTM_POINTS.length;
  var countNode = el('utmPointCount');
  if (countNode) countNode.textContent = fa(count) + ' نقطه';
  var metrics = utmMetrics();
  var status = el('utmStatus');
  if (status) {
    status.innerHTML = '<span>Zone <b>' + fa(metrics.zone) + metrics.hemisphere + '</b></span>' +
      '<span>رأس <b>' + fa(count) + '</b></span>' +
      '<span>مساحت <b>' + (count >= 3 ? utmFa(metrics.area, 2) + ' m²' : '—') + '</b></span>' +
      '<span>محیط <b>' + (count >= 3 ? utmFa(metrics.perimeter, 2) + ' m' : '—') + '</b></span>';
  }

  var list = el('utmPoints');
  if (list) {
    if (!count) {
      list.innerHTML = '<div class="utm-empty">هنوز نقطه‌ای ثبت نشده است؛ روی نقشه لمس کنید یا مختصات UTM وارد کنید.</div>';
    } else {
      var h = '<div class="utm-table-wrap"><table class="utm-table"><thead><tr><th>نقطه</th><th>Easting</th><th>Northing</th><th>منبع</th><th></th></tr></thead><tbody>';
      for (var i = 0; i < count; i++) {
        h += '<tr><td>P' + fa(i + 1) + '</td><td class="coord-ltr">' + utmFixed(metrics.utm[i].e, 3) + '</td>' +
             '<td class="coord-ltr">' + utmFixed(metrics.utm[i].n, 3) + '</td><td>' + esc(utmSourceLabel(UTM_POINTS[i])) + '</td>' +
             '<td><button onclick="utmDeletePoint(' + i + ')" aria-label="حذف نقطه">×</button></td></tr>';
      }
      list.innerHTML = h + '</tbody></table></div>';
    }
  }

  var wrap = el('utmReportWrap');
  if (wrap) {
    if (count < 3) wrap.innerHTML = '<div class="utm-report-placeholder">برای ساخت گزارش و خروجی چاپ، حداقل سه رأس اضافه کنید.</div>';
    else wrap.innerHTML = '<div class="utm-report-actions"><button class="btn" onclick="utmPrintReport()">' + uiIcon('print') + '<span>چاپ یا ذخیره PDF</span></button>' +
         '<button class="btn ghost" onclick="utmShareReport()">' + uiIcon('share') + '<span>اشتراک خلاصه</span></button></div>' + utmReportFragment(metrics, false);
  }
}

function utmPlanSvg(metrics) {
  var pts = metrics.utm;
  if (!pts.length) return '';
  var minE = pts[0].e, maxE = pts[0].e, minN = pts[0].n, maxN = pts[0].n;
  for (var i = 1; i < pts.length; i++) {
    minE = Math.min(minE, pts[i].e); maxE = Math.max(maxE, pts[i].e);
    minN = Math.min(minN, pts[i].n); maxN = Math.max(maxN, pts[i].n);
  }
  var w = 800, h = 500, pad = 80;
  var spanE = Math.max(maxE - minE, 1), spanN = Math.max(maxN - minN, 1);
  var scale = Math.min((w - pad * 2) / spanE, (h - pad * 2) / spanN);
  function sx(e) { return pad + (e - minE) * scale; }
  function sy(n) { return h - pad - (n - minN) * scale; }
  var points = [];
  for (var j = 0; j < pts.length; j++) points.push(utmFixed(sx(pts[j].e), 1) + ',' + utmFixed(sy(pts[j].n), 1));
  var svg = '<svg class="utm-plan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" direction="ltr" role="img" aria-label="پلان UTM">' +
    '<rect x="1" y="1" width="798" height="498" rx="18" fill="#fbfcff" stroke="#dbe3ef"/>' +
    '<g opacity=".45" stroke="#d8e1ee" stroke-width="1">';
  for (var gx = 100; gx < 800; gx += 100) svg += '<path d="M' + gx + ' 15V485"/>';
  for (var gy = 100; gy < 500; gy += 100) svg += '<path d="M15 ' + gy + 'H785"/>';
  svg += '</g><polygon points="' + points.join(' ') + '" fill="#7169D733" stroke="#4B4FA8" stroke-width="5" stroke-linejoin="round"/>';
  for (var k = 0; k < pts.length; k++) {
    var next = (k + 1) % pts.length;
    var x = sx(pts[k].e), y = sy(pts[k].n);
    svg += '<circle cx="' + utmFixed(x, 1) + '" cy="' + utmFixed(y, 1) + '" r="13" fill="#4B4FA8" stroke="#fff" stroke-width="4"/>' +
      '<text x="' + utmFixed(x, 1) + '" y="' + utmFixed(y + 5, 1) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">' + (k + 1) + '</text>';
    if (metrics.sides[k] !== undefined) {
      var mx = (x + sx(pts[next].e)) / 2, my = (y + sy(pts[next].n)) / 2;
      svg += '<rect x="' + utmFixed(mx - 30, 1) + '" y="' + utmFixed(my - 13, 1) + '" width="60" height="23" rx="8" fill="#fff" stroke="#cfd9e8"/>' +
        '<text x="' + utmFixed(mx, 1) + '" y="' + utmFixed(my + 4, 1) + '" text-anchor="middle" font-size="12" fill="#243653">' + utmFixed(metrics.sides[k], 2) + 'm</text>';
    }
  }
  svg += '<g transform="translate(735 45)" stroke="#152238" fill="none" stroke-width="3"><path d="M0 38V0M0 0l-8 14M0 0l8 14"/><text x="0" y="-7" text-anchor="middle" fill="#152238" stroke="none" font-size="18" font-weight="700">N</text></g>' +
    '<text x="24" y="475" font-size="13" fill="#6b7a90">Zone ' + metrics.zone + metrics.hemisphere + ' — WGS84 / UTM</text></svg>';
  return svg;
}

function utmReportFragment(metrics, forPrint) {
  var title = el('utmTitle') ? el('utmTitle').value.trim() : 'نقشه UTM ملک';
  var kind = el('utmKind') ? el('utmKind').value : 'زمین';
  if (!title) title = 'نقشه UTM ملک';
  var date = (typeof jalaliDate === 'function') ? jalaliDate(Date.now()) : new Date().toLocaleDateString('fa-IR');
  var h = '<section class="utm-report' + (forPrint ? ' print' : '') + '">' +
    '<header><div><h2>' + esc(title) + '</h2><p>گزارش ترسیم UTM ' + esc(kind) + '</p></div><div class="utm-brand">امنلاک<small>amnlak.ir</small></div></header>' +
    '<div class="utm-report-meta"><span>تاریخ: <b>' + date + '</b></span><span>سیستم: <b>WGS84 / UTM Zone ' + fa(metrics.zone) + metrics.hemisphere + '</b></span></div>' +
    '<div class="utm-report-summary"><div><small>مساحت</small><b>' + utmFa(metrics.area, 2) + '</b><span>متر مربع</span></div>' +
      '<div><small>محیط</small><b>' + utmFa(metrics.perimeter, 2) + '</b><span>متر</span></div>' +
      '<div><small>تعداد رأس</small><b>' + fa(UTM_POINTS.length) + '</b><span>نقطه</span></div></div>' +
    '<div class="utm-plan-wrap">' + utmPlanSvg(metrics) + '</div>' +
    '<h3>جدول مختصات رئوس و طول اضلاع</h3><table><thead><tr><th>نقطه</th><th>Easting (m)</th><th>Northing (m)</th><th>طول تا رأس بعد (m)</th><th>روش ثبت</th></tr></thead><tbody>';
  for (var i = 0; i < UTM_POINTS.length; i++) {
    h += '<tr><td>P' + fa(i + 1) + '</td><td class="coord-ltr">' + utmFixed(metrics.utm[i].e, 3) + '</td>' +
      '<td class="coord-ltr">' + utmFixed(metrics.utm[i].n, 3) + '</td><td class="coord-ltr">' + utmFixed(metrics.sides[i], 2) + '</td>' +
      '<td>' + esc(utmSourceLabel(UTM_POINTS[i])) + '</td></tr>';
  }
  h += '</tbody></table><div class="utm-report-warning"><b>تذکر فنی:</b> خروجی نقاط ثبت‌شده با GPS معمولی گوشی تقریبی است و نقشه ثبتی، سند رسمی یا برداشت نقشه‌برداری دارای اعتبار حقوقی محسوب نمی‌شود. برای کار دقیق از نقشه‌بردار مجاز و تجهیزات GNSS/RTK استفاده کنید.</div>' +
    '<footer>تهیه‌شده با اپلیکیشن امنلاک — amnlak.ir</footer></section>';
  return h;
}

function utmPrintDocumentHtml(metrics) {
  var body = utmReportFragment(metrics, true);
  return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>@page{size:A4;margin:10mm}*{box-sizing:border-box}body{margin:0;color:#152238;background:#fff;font-family:Tahoma,Arial,sans-serif;direction:rtl;font-size:11px}.utm-report{width:100%;border:1px solid #dbe3ef;border-radius:12px;padding:14px}.utm-report header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #4B4FA8;padding-bottom:9px;margin-bottom:9px}.utm-report h2{font-size:20px;margin:0}.utm-report header p{margin:3px 0 0;color:#6b7a90}.utm-brand{font-size:19px;font-weight:bold;color:#075FB5;text-align:left}.utm-brand small{display:block;font-size:9px;color:#6b7a90}.utm-report-meta{display:flex;justify-content:space-between;background:#f3f6fb;border-radius:8px;padding:7px 9px;margin-bottom:8px}.utm-report-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:8px}.utm-report-summary div{text-align:center;border:1px solid #dbe3ef;border-radius:9px;padding:6px}.utm-report-summary small,.utm-report-summary span{display:block;color:#6b7a90}.utm-report-summary b{font-size:18px;color:#4B4FA8}.utm-plan-wrap{height:280px;margin:4px 0 8px}.utm-plan{width:100%;height:100%;display:block}.utm-report h3{font-size:12px;margin:8px 0 5px}table{width:100%;border-collapse:collapse;font-size:9px}th,td{border:1px solid #cfd9e8;padding:4px 5px;text-align:center}th{background:#edf1fb}.coord-ltr{direction:ltr;font-family:monospace}.utm-report-warning{margin-top:8px;padding:7px;border:1px solid #edc978;background:#fff8e9;border-radius:7px;color:#6a5220;line-height:1.7}.utm-report footer{text-align:center;border-top:1px solid #dbe3ef;margin-top:8px;padding-top:6px;color:#6b7a90}</style></head><body>' + body + '</body></html>';
}

function utmPrintReport() {
  if (UTM_POINTS.length < 3) { toastMsg('حداقل سه رأس برای خروجی لازم است'); return; }
  var metrics = utmMetrics();
  var title = el('utmTitle') ? el('utmTitle').value.trim() : 'نقشه UTM ملک';
  if (!title) title = 'نقشه UTM ملک';
  var html = utmPrintDocumentHtml(metrics);
  if (window.Android && Android.printHtml) {
    try { Android.printHtml(title, html); return; } catch (e) {}
  }
  toastMsg('سرویس چاپ اندروید در دسترس نیست');
  try { window.print(); } catch (ignore) {}
}

function utmShareReport() {
  if (UTM_POINTS.length < 3) return;
  var metrics = utmMetrics();
  var title = el('utmTitle') ? el('utmTitle').value.trim() : 'نقشه UTM ملک';
  var text = title + '\nWGS84 / UTM Zone ' + metrics.zone + metrics.hemisphere + '\n' +
    'مساحت: ' + utmFixed(metrics.area, 2) + ' متر مربع\nمحیط: ' + utmFixed(metrics.perimeter, 2) + ' متر\n\nمختصات رئوس:\n';
  for (var i = 0; i < metrics.utm.length; i++) {
    text += 'P' + (i + 1) + ': E ' + utmFixed(metrics.utm[i].e, 3) + ' / N ' + utmFixed(metrics.utm[i].n, 3) + '\n';
  }
  text += '\nخروجی تقریبی اپلیکیشن امنلاک — https://amnlak.ir';
  if (window.Android && Android.share) Android.share(text);
}
