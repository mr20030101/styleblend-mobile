/**
 * Fixes react-native-bluetooth-escpos-printer's outdated build.gradle
 * which uses deprecated Gradle 3.x syntax incompatible with RN 0.81+
 *
 * Run via postinstall: "node scripts/fix-bluetooth-printer.js"
 */
const fs = require('fs');
const path = require('path');

// Works from any working directory
const root = path.resolve(__dirname, '..');
const target = path.join(
  root,
  'node_modules',
  'react-native-bluetooth-escpos-printer',
  'android',
  'build.gradle'
);

const fixed = `apply plugin: 'com.android.library'

android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"

    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
    }
    lintOptions {
        abortOnError false
    }
    sourceSets {
        main {
            aidl.srcDirs = ['src/main/java']
        }
    }
    namespace 'cn.jystudio.bluetooth'
}

repositories {
    google()
    mavenCentral()
    maven {
        url "$rootDir/../node_modules/react-native/android"
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation 'com.facebook.react:react-android:+'
    implementation "com.google.zxing:core:3.3.0"
}
`;

if (fs.existsSync(target)) {
  fs.writeFileSync(target, fixed, 'utf8');
  console.log('✅ Fixed react-native-bluetooth-escpos-printer/android/build.gradle');
} else {
  console.warn('⚠️  react-native-bluetooth-escpos-printer not found at:', target);
}
