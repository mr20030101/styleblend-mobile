/**
 * Fixes @vardrz/react-native-bluetooth-escpos-printer's build.gradle:
 * - Removes legacy buildscript block (classpath conflict with root project)
 * - Replaces deprecated react-native artifact with react-android (RN 0.71+)
 * - Removes deprecated jcenter/spring.io repositories
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const target = path.join(
  root,
  'node_modules',
  '@vardrz',
  'react-native-bluetooth-escpos-printer',
  'android',
  'build.gradle'
);

const fixed = `apply plugin: 'com.android.library'

android {
    compileSdkVersion 35

    defaultConfig {
        minSdkVersion 24
        targetSdkVersion 35
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
    implementation "androidx.appcompat:appcompat:1.4.2"
    implementation "androidx.core:core:1.10.1"
    implementation "com.google.zxing:core:3.3.0"
}
`;

if (fs.existsSync(target)) {
  fs.writeFileSync(target, fixed, 'utf8');
  console.log('✅ Fixed @vardrz/react-native-bluetooth-escpos-printer/android/build.gradle');
} else {
  console.warn('⚠️  @vardrz/react-native-bluetooth-escpos-printer not found at:', target);
}
