#!/bin/bash
set -e

echo "=== Building Findit Harare Android APK ==="

if [ -d "/opt/homebrew/opt/openjdk@17" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

if [ -n "$JAVA_HOME" ] && [ -d "$JAVA_HOME/bin" ]; then
  JAVA_BIN="$JAVA_HOME/bin"
else
  JAVA_BIN="$(dirname "$(command -v javac)")"
fi

if [ -d "/opt/homebrew/share/android-commandlinetools/build-tools/36.0.0" ]; then
  ANDROID_TOOLS="/opt/homebrew/share/android-commandlinetools/build-tools/36.0.0"
  ANDROID_JAR="/opt/homebrew/share/android-commandlinetools/platforms/android-36/android.jar"
else
  SDK_ROOT="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
  ANDROID_TOOLS="$(ls -d "$SDK_ROOT"/build-tools/* | sort -V | tail -n 1)"
  ANDROID_JAR="$(ls "$SDK_ROOT"/platforms/android-*/android.jar | sort -V | tail -n 1)"
fi

BUILD_DIR="build-android"
OUTPUT_APK="FinditHarare.apk"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/gen" "$BUILD_DIR/classes" "$BUILD_DIR/dex"

echo "0. Syncing frontend web assets into android/app/src/main/assets..."
mkdir -p android/app/src/main/assets
rsync -av --delete --exclude="FinditHarare.apk" public/ android/app/src/main/assets/

echo "1. Compiling Android Resources..."
"$ANDROID_TOOLS/aapt2" compile --dir android/app/src/main/res -o "$BUILD_DIR/res.zip"

echo "2. Linking APK & Generating R.java with bundled local assets..."
"$ANDROID_TOOLS/aapt2" link \
  -I "$ANDROID_JAR" \
  --manifest android/app/src/main/AndroidManifest.xml \
  -A android/app/src/main/assets \
  --min-sdk-version 24 \
  --target-sdk-version 34 \
  --version-code 1 \
  --version-name "1.0.0" \
  --java "$BUILD_DIR/gen" \
  -o "$BUILD_DIR/unaligned.apk" \
  "$BUILD_DIR/res.zip" \
  --auto-add-overlay

echo "3. Compiling Java Source Files..."
"$JAVA_BIN/javac" \
  --release 8 \
  -cp "$ANDROID_JAR" \
  -d "$BUILD_DIR/classes" \
  "$BUILD_DIR/gen/zw/co/finditharare/R.java" \
  android/app/src/main/java/zw/co/finditharare/*.java

echo "4. Converting Bytecode to DEX with D8..."
"$ANDROID_TOOLS/d8" \
  --release \
  --min-api 24 \
  --lib "$ANDROID_JAR" \
  --output "$BUILD_DIR/dex" \
  $(find "$BUILD_DIR/classes" -name "*.class")

echo "5. Packaging DEX into APK..."
cd "$BUILD_DIR/dex"
zip -u "../unaligned.apk" classes.dex
cd ../..

echo "6. Aligning APK with zipalign..."
"$ANDROID_TOOLS/zipalign" -v -p 4 "$BUILD_DIR/unaligned.apk" "$BUILD_DIR/aligned.apk"

echo "7. Generating Debug Keystore if needed..."
KEYSTORE="$BUILD_DIR/debug.keystore"
if [ ! -f "$KEYSTORE" ]; then
  "$JAVA_BIN/keytool" -genkey -v \
    -keystore "$KEYSTORE" \
    -storepass android \
    -alias androiddebugkey \
    -keypass android \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "CN=Findit Harare Debug,O=Findit,C=ZW"
fi

echo "8. Signing APK with apksigner..."
"$ANDROID_TOOLS/apksigner" sign \
  --ks "$KEYSTORE" \
  --ks-pass pass:android \
  --ks-key-alias androiddebugkey \
  --key-pass pass:android \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --out "$OUTPUT_APK" \
  "$BUILD_DIR/aligned.apk"

echo "9. Verifying APK Signature..."
"$ANDROID_TOOLS/apksigner" verify -v "$OUTPUT_APK"

cp "$OUTPUT_APK" public/FinditHarare.apk

echo "=== SUCCESS! FinditHarare.apk built successfully ==="
ls -lh "$OUTPUT_APK" public/FinditHarare.apk
