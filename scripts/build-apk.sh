#!/bin/bash
set -e

echo "=== Building Findit Harare Android APK ==="

export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export PATH="$JAVA_HOME/bin:$PATH"

JAVA_BIN="$JAVA_HOME/bin"
ANDROID_TOOLS="/opt/homebrew/share/android-commandlinetools/build-tools/36.0.0"
ANDROID_JAR="/opt/homebrew/share/android-commandlinetools/platforms/android-36/android.jar"

BUILD_DIR="build-android"
OUTPUT_APK="FinditHarare.apk"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/gen" "$BUILD_DIR/classes" "$BUILD_DIR/dex"

echo "1. Compiling Android Resources..."
"$ANDROID_TOOLS/aapt2" compile --dir android/app/src/main/res -o "$BUILD_DIR/res.zip"

echo "2. Linking APK & Generating R.java..."
"$ANDROID_TOOLS/aapt2" link \
  -I "$ANDROID_JAR" \
  --manifest android/app/src/main/AndroidManifest.xml \
  --java "$BUILD_DIR/gen" \
  -o "$BUILD_DIR/unaligned.apk" \
  "$BUILD_DIR/res.zip" \
  --auto-add-overlay

echo "3. Compiling Java Source Files..."
"$JAVA_BIN/javac" \
  --release 17 \
  -cp "$ANDROID_JAR" \
  -d "$BUILD_DIR/classes" \
  "$BUILD_DIR/gen/zw/co/finditharare/R.java" \
  android/app/src/main/java/zw/co/finditharare/*.java

echo "4. Converting Bytecode to DEX with D8..."
"$ANDROID_TOOLS/d8" \
  --release \
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
  --out "$OUTPUT_APK" \
  "$BUILD_DIR/aligned.apk"

echo "9. Verifying APK Signature..."
"$ANDROID_TOOLS/apksigner" verify "$OUTPUT_APK"

echo "=== SUCCESS! FinditHarare.apk built successfully ==="
ls -lh "$OUTPUT_APK"
