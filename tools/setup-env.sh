#!/usr/bin/env bash
# ---------------------------------------------------------------
# نصب ابزارهای لازم برای ساخت APK (JDK 17 + Android SDK)
# اجرا:  bash tools/setup-env.sh
# ---------------------------------------------------------------
set -e
JDK_DIR="$HOME/jdk17"
SDK_DIR="$HOME/android-sdk"
CLT_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
JDK_URL="https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%2B7/OpenJDK17U-jdk_x64_linux_hotspot_17.0.12_7.tar.gz"

need_jdk=1
[ -x "$JDK_DIR/bin/javac" ] && [ -f "$JDK_DIR/lib/server/libjvm.so" ] && "$JDK_DIR/bin/java" -version >/dev/null 2>&1 && need_jdk=0

if [ $need_jdk -eq 1 ]; then
  echo "▸ نصب JDK 17 …"
  rm -rf "$JDK_DIR"; mkdir -p "$JDK_DIR"
  curl -sL -o /tmp/jdk17.tar.gz "$JDK_URL"
  tar xzf /tmp/jdk17.tar.gz -C "$JDK_DIR" --strip-components=1
  rm -f /tmp/jdk17.tar.gz
fi
export JAVA_HOME="$JDK_DIR"; export PATH="$JAVA_HOME/bin:$PATH"
chmod -R +x "$JDK_DIR/bin" 2>/dev/null || true
java -version 2>&1 | head -1

if [ ! -x "$SDK_DIR/build-tools/34.0.0/aapt2" ] || [ ! -f "$SDK_DIR/platforms/android-34/android.jar" ]; then
  echo "▸ نصب Android SDK (platform 34 + build-tools 34) …"
  mkdir -p "$SDK_DIR"; cd "$SDK_DIR"
  if [ ! -x "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" ]; then
    curl -sL -o clt.zip "$CLT_URL"; unzip -q -o clt.zip; rm -f clt.zip
    mkdir -p cmdline-tools/latest
    cp -r cmdline-tools/bin cmdline-tools/lib cmdline-tools/source.properties cmdline-tools/latest/ 2>/dev/null || true
    chmod -R +x cmdline-tools/latest/bin
  fi
  yes | ./cmdline-tools/latest/bin/sdkmanager --sdk_root="$SDK_DIR" --licenses >/dev/null 2>&1 || true
  ./cmdline-tools/latest/bin/sdkmanager --sdk_root="$SDK_DIR" "platforms;android-34" "build-tools;34.0.0" >/dev/null 2>&1
fi
chmod -R +x "$SDK_DIR/build-tools/34.0.0" 2>/dev/null || true
echo "▸ Android SDK: $(ls "$SDK_DIR/build-tools")  |  $(ls "$SDK_DIR/platforms")"
echo "✅ محیط ساخت آماده است."
