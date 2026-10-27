# Mobil Uygulama (Capacitor) Görev Takip Listesi

- [x] **Aşama 1: Proje Mimarisi ve Altyapı Kurulumu**
  - [x] Capacitor çekirdek, CLI ve platform paketlerini kur (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`)
  - [x] Eklenti paketlerini kur (`@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/network`, `@capacitor/push-notifications`)
  - [x] `capacitor.config.ts` dosyasını oluştur (App ID: `tr.com.isyurtlari.app`, `server.url: "https://isyurtlari.com.tr"`)

- [x] **Aşama 2: Platformların Eklenmesi & Yerel Yapılandırmalar**
  - [x] Android platformunu projeye ekle (`npx cap add android`)
  - [x] `android/app/build.gradle` (SDK 24-36) ve `AndroidManifest.xml` izinlerini yapılandır
  - [x] iOS platformunu projeye ekle (`npx cap add ios`)
  - [x] `ios/App/App/Info.plist` ve `PrivacyInfo.xcprivacy` yapılandırmasını tamamla

- [x] **Aşama 3: Yerel Köprü (Bridge) & Kullanıcı Deneyimi**
  - [x] `src/lib/capacitor/mobileBridge.ts` köprü modülünü yaz (StatusBar, Splash, Back Button, Network, Push Notifications)
  - [x] `src/app/layout.tsx` içerisine mobil köprü entegrasyonunu (`MobilKopru.tsx`) bağla
  - [x] `src/app/globals.css` içerisine Safe Area (çentik/nav bar) kurallarını uygula

- [x] **Aşama 4: Senkronizasyon ve Doğrulama**
  - [x] `pnpm exec cap sync` çalıştırılarak tüm native kodlar senkronize edildi

- [ ] **Aşama 5: Mağaza İmzaları & Yerel Derleme Testi**
  - [x] Android Studio başlatıldı (`pnpm exec cap open android`)
  - [x] Gradle JDK 21 (LTS) ortamı sabitlendi (`android/gradle.properties`)
  - [x] Android derlemesi doğrulandı (`./gradlew assembleDebug` -> `BUILD SUCCESSFUL`)
  - [x] Test APK üretildi: `android/app/build/outputs/apk/debug/app-debug.apk` (19 MB)
  - [x] Google Play Release Bundle (`./gradlew bundleRelease` -> `app-release.aab`, 15 MB) üretildi
  - [x] Standalone Release APK (`./gradlew assembleRelease` -> `app-release-unsigned.apk`, 15 MB) üretildi
  - [ ] Xcode / iOS ortamı açılış ve arşiv testi (`pnpm exec cap open ios`)
