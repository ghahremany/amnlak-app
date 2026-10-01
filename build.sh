#!/usr/bin/env bash
# ===============================================================
#  ساخت APK اپلیکیشن «امنلاک» بدون نیاز به Gradle
#  استفاده:
#     bash build.sh            → نسخه تست (امضا با کلید debug)
#     bash build.sh release    → نسخه انتشار (کلید اختصاصی از keystore.properties)
#  متغیرهای اختیاری:  VCODE=1 VNAME=0.1 bash build.sh release
# ===============================================================
set -e
MODE=${1:-debug}
PROJ=$(cd "$(dirname "$0")" && pwd)

# --- ابزارها ---
export JAVA_HOME=${JAVA_HOME:-$HOME/jdk17}
export PATH=$JAVA_HOME/bin:$PATH
SDK=${ANDROID_SDK:-$HOME/android-sdk}
BT=$SDK/build-tools/34.0.0
PLATFORM=$SDK/platforms/android-34/android.jar
if [ ! -x "$BT/aapt2" ] || [ ! -x "$JAVA_HOME/bin/javac" ]; then
  echo "▸ محیط ساخت آماده نیست؛ اجرای tools/setup-env.sh …"
  bash "$PROJ/tools/setup-env.sh"
fi
chmod -R +x "$JAVA_HOME/bin" "$BT" 2>/dev/null || true

VCODE=${VCODE:-1}
VNAME=${VNAME:-0.1}
SRC=$PROJ/android/src/main
OUT=$PROJ/build

if [ "$MODE" = "release" ]; then
  APKNAME=${APKNAME:-amnlak-v$VNAME-release.apk}
  PROPS=$PROJ/keystore.properties
  [ -f "$PROPS" ] || { echo "❌ فایل keystore.properties پیدا نشد."; exit 1; }
  KS=$PROJ/$(grep '^storeFile=' "$PROPS" | cut -d= -f2-)
  KSPASS=$(grep '^storePassword=' "$PROPS" | cut -d= -f2-)
  ALIAS=$(grep '^keyAlias=' "$PROPS" | cut -d= -f2-)
  KEYPASS=$(grep '^keyPassword=' "$PROPS" | cut -d= -f2-)
else
  APKNAME=${APKNAME:-amnlak-v$VNAME.apk}
  KS=$PROJ/keystore/amnlak-debug.keystore
  KSPASS=amnlak1234; KEYPASS=amnlak1234; ALIAS=amnlak
  if [ ! -f "$KS" ]; then
    mkdir -p "$PROJ/keystore"
    keytool -genkeypair -v -keystore "$KS" -storepass $KSPASS -keypass $KEYPASS \
      -alias $ALIAS -keyalg RSA -keysize 2048 -validity 10950 \
      -dname "CN=amnlak Debug, O=amnlak, C=IR" >/dev/null 2>&1
  fi
fi

rm -rf "$OUT"; mkdir -p "$OUT/flat" "$OUT/gen" "$OUT/classes"

echo "▸ ۱/۶ کامپایل منابع (aapt2 compile)"
"$BT/aapt2" compile --dir "$SRC/res" -o "$OUT/flat/res.zip"

echo "▸ ۲/۶ لینک منابع و دارایی‌ها (aapt2 link)"
"$BT/aapt2" link -o "$OUT/base.apk" -I "$PLATFORM" \
  --manifest "$SRC/AndroidManifest.xml" -A "$SRC/assets" --java "$OUT/gen" \
  --min-sdk-version 21 --target-sdk-version 34 \
  --version-code "$VCODE" --version-name "$VNAME" "$OUT/flat/res.zip"

echo "▸ ۳/۶ کامپایل جاوا"
find "$SRC/java" "$OUT/gen" -name "*.java" > "$OUT/sources.txt"
javac -source 11 -target 11 -nowarn -encoding UTF-8 -classpath "$PLATFORM" \
  -d "$OUT/classes" @"$OUT/sources.txt" 2>&1 | grep -v "^Note" || true

echo "▸ ۴/۶ تبدیل به dex"
"$BT/d8" --release --min-api 21 --lib "$PLATFORM" --output "$OUT" $(find "$OUT/classes" -name "*.class")

echo "▸ ۵/۶ بسته‌بندی"
cd "$OUT" && cp base.apk unsigned.apk && zip -q -u unsigned.apk classes.dex && cd "$PROJ"

echo "▸ ۶/۶ امضا و بهینه‌سازی ($MODE)"
"$BT/zipalign" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
"$BT/apksigner" sign --ks "$KS" --ks-pass "pass:$KSPASS" --key-pass "pass:$KEYPASS" --ks-key-alias "$ALIAS" \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  --out "$PROJ/$APKNAME" "$OUT/aligned.apk"
rm -f "$PROJ/$APKNAME.idsig"
"$BT/apksigner" verify --print-certs "$PROJ/$APKNAME" | head -3

echo
echo "✅ ساخته شد: $PROJ/$APKNAME  ($(du -h "$PROJ/$APKNAME" | cut -f1))  نسخه $VNAME (کد $VCODE)"
