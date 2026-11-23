# AutoMusic Pro

**AutoMusic Pro**, siyah ve altın vurgulu modern arayüzü, 17 müzik kategorisi, 114 surelik Kur'an-ı Kerim arşivi, canlı 5 bantlı ekolayzırı, akıllı tek seferlik çevrimdışı indirme motoru ve sürüş güvenliğine uygun **Araba Modu** ile telefon, tablet ve masaüstüne doğrudan kurulabilen **Progressive Web App (PWA)** müzik ve Kur'an dinleme uygulamasıdır.

## Öne Çıkan Özellikler

- **Tek Dokunuşla Kurulum (PWA)**: Android (Chrome), iOS (Safari) ve masaüstü tarayıcılardan uygulama mağazasına veya Android Studio derlemesine gerek kalmadan ana ekrana kurulur ve tam ekran (`standalone`) çalışır.
- **17 Ayrı Müzik Kategorisi**: Nostalji, Karadeniz, Arapça müzik, Azerice müzik, Lazca müzik, Türküler, Arabesk, Türk sanat müziği, Türk pop, Türk rock, Özgün müzik, İlahi, Ezgi, Neşid, Zikirli ilahiler, Tasavvuf müziği ve Kur'an-ı Kerim. Yeni kategoriler eklenebilir ve birden fazla kategori seçilerek ortak çalma listesi oluşturulabilir.
- **Kur'an-ı Kerim (114 Sure & 6 Kari)**: Abdurrahman el-Ussi, Mişari Raşid el-Afasi, Abdurrahman es-Sudeys, Maher el-Muaykıli, Abdülbasit Abdüssamed ve Mahmud Halil el-Husari tilavetleri, Diyanet İşleri Türkçe Meali, ayet ayet dinleme ve kaldığı yerden devam etme.
- **Akıllı Tek Seferlik İndirme**: İzinli içerikler çalınmaya başladığında otomatik olarak yerel IndexedDB uygulama arşivine kaydedilir, aynı dosya ikinci kez indirilmez, 2 GB boş alan koruması uygulanır ve kullanıcı izni olmadan silinmez.
- **Canlı Ses Motoru & Ekolayzır**: 5 bantlı ekolayzır, Bas/Tiz kontrolü, Araba, Kulaklık, Vokal/Kur'an ve Tasavvuf profilleri ile kilit ekranı / Bluetooth / direksiyon medya kumandası (`Media Session API`).
- **Sürüş Güvenliğine Uygun Araba Modu**: Büyük dokunmatik hedeflerle dikkat dağıtmayan araç içi arayüz.

## Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Ortam değişkenleri dosyasını oluşturun (isteğe bağlı)
cp .env.example .env

# Geliştirme sunucusunu başlatın (http://localhost:3000)
npm run dev

# Üretim derlemesi ve başlatma
npm run build
NODE_ENV=production npm start
```

## Ortam Değişkenleri

| Değişken | Zorunlu | Açıklama |
| --- | --- | --- |
| `JAMENDO_CLIENT_ID` | Hayır | Jamendo Creative Commons müzik kataloğu için isteğe bağlı istemci kimliği. Boş bırakıldığında dahili Kur'an, Internet Archive açık ses arşivi ve yerel ses dosyalarıyla çalışır. |

## Telefona / Cihaza PWA Olarak Yükleme

- **Android (Chrome / Edge)**: Uygulama içindeki **Uygulamayı Yükle** düğmesine dokunun veya tarayıcı menüsünden *Uygulamayı yükle / Ana ekrana ekle* seçeneğini seçin.
- **iPhone / iPad (Safari)**: Alt menüdeki **Paylaş** düğmesine dokunun ve **Ana Ekrana Ekle** seçeneğini seçin.
- **Masaüstü (Chrome / Edge)**: Uygulama içindeki **Uygulamayı Yükle** düğmesini veya adres çubuğundaki yükleme simgesini kullanın.
