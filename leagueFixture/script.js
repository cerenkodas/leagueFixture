const fs = require('fs');
const readline = require('readline');
 
// JSON dosyalarını okuma
function jsonOku(dosyaAdi) {
    try {
        const data = fs.readFileSync(dosyaAdi, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log(`Hata: ${dosyaAdi} dosyası okunurken bir hata oluştu!`);
        return null;
    }
}
 
 
let ayarlar = jsonOku('ayarlar.json');
const takimlar = jsonOku('takimlar.json');
 
// Takımların bilgilerini tutan bir nesne
let takimlarMap = new Map();
 
// Daha önce okunan dosyaların isimlerini tutan bir Set
let okunanDosyalar = new Set();
 
// Takım istatistiklerini başlatan fonksiyon
function takimOlustur(kisaAd, uzunAd) {
    return {
        kisaAd: kisaAd,
        uzunAd: uzunAd,
        macSayisi: 0,
        galibiyet: 0,
        beraberlik: 0,
        maglubiyet: 0,
        attigiGol: 0,
        yedigiGol: 0,
        puan: 0,
        averaj: 0,
        oynananMaclar: new Set()
    };
}
 
// Lig fonksiyonları
function ligOlustur() {
    takimlar.forEach(takim => {
        takimlarMap.set(
            takim.takimKisaAdi,
            takimOlustur(takim.takimKisaAdi, takim.takimAdi)
        );
    });
}
 
// Maç sonucunu kaydetme fonksiyonu
function macSonucunuKaydet(evSahibi, evSahibiGol, misafir, misafirGol, mesajGoster = true) {
    // Ayarları her defasında yeniden okuyalım
    ayarlar = jsonOku('ayarlar.json');
 
    const macKodu = `${evSahibi}-${misafir}`;
    const evSahibiTakim = takimlarMap.get(evSahibi);
    const misafirTakim = takimlarMap.get(misafir);
 
    // Eğer takımlar geçersizse
    if (!evSahibiTakim || !misafirTakim) {
        console.log('Geçersiz takım kısaltması!');
        return false; // Geçersiz takım durumunda işlemi sonlandır
    }
 
    // Maç daha önce oynandı mı kontrolü
    if (evSahibiTakim.oynananMaclar.has(macKodu)) {
        console.log('Bu maç daha önce oynanmış!');
        return false; // Daha önce oynanmış maçta işlemi sonlandır
    }
 
    // Maç sonuçlarını işle
    evSahibiTakim.macSayisi++;
    misafirTakim.macSayisi++;
    evSahibiTakim.attigiGol += evSahibiGol;
    evSahibiTakim.yedigiGol += misafirGol;
    misafirTakim.attigiGol += misafirGol;
    misafirTakim.yedigiGol += evSahibiGol;
 
    if (evSahibiGol > misafirGol) {
        evSahibiTakim.galibiyet++;
        misafirTakim.maglubiyet++;
        evSahibiTakim.puan += ayarlar.galibiyetPuan;
        misafirTakim.puan += ayarlar.maglubiyetPuan;
    } else if (evSahibiGol < misafirGol) {
        evSahibiTakim.maglubiyet++;
        misafirTakim.galibiyet++;
        misafirTakim.puan += ayarlar.galibiyetPuan;
        evSahibiTakim.puan += ayarlar.maglubiyetPuan;
    } else {
        evSahibiTakim.beraberlik++;
        misafirTakim.beraberlik++;
        evSahibiTakim.puan += ayarlar.beraberlikPuan;
        misafirTakim.puan += ayarlar.beraberlikPuan;
    }
 
    evSahibiTakim.averaj = evSahibiTakim.attigiGol - evSahibiTakim.yedigiGol;
    misafirTakim.averaj = misafirTakim.attigiGol - misafirTakim.yedigiGol;
 
    evSahibiTakim.oynananMaclar.add(macKodu); // Maç kodunu ekle
 
    if (mesajGoster) {
        console.log('Maç sonucu başarıyla kaydedildi!');
    }
    return true;
}
 
// Puan durumu gösterme fonksiyonu
function puanDurumuGoster(siralamaMetodu = 'puan', buyukHarf = false) {
    let takimlarArray = Array.from(takimlarMap.values());
 
    // Sıralama metoduna göre sırala
    switch (siralamaMetodu) {
        case 'puan':
            takimlarArray.sort((a, b) => b.puan - a.puan || b.averaj - a.averaj);
            break;
        case 'alfabetik':
            takimlarArray.sort((a, b) => a.uzunAd.localeCompare(b.uzunAd));
            break;
        case 'takmaIsim':
            takimlarArray.sort((a, b) => a.kisaAd.localeCompare(b.kisaAd));
            break;
    }
 
    console.log('\nPuan Durumu Tablosu:');
    console.log('-'.repeat(83)); // Çizgi
    console.log(
        '| Sıra | Takma İsim  | Uzun İsim       |  O  |  G  |  B  |  M  | AG  | YG  | AV  |  P  |'
    );
    console.log('-'.repeat(83));
 
    takimlarArray.forEach((takim, index) => {
        const uzunIsim = buyukHarf ? takim.uzunAd.toUpperCase() : takim.uzunAd;
 
        console.log(
            `| ${String(index + 1).padStart(4)} | ${takim.kisaAd.padEnd(11)} | ${uzunIsim.padEnd(15)} | ${String(
                takim.macSayisi
            ).padStart(3)} | ${String(takim.galibiyet).padStart(3)} | ${String(takim.beraberlik).padStart(
                3
            )} | ${String(takim.maglubiyet).padStart(3)} | ${String(takim.attigiGol).padStart(
                3
            )} | ${String(takim.yedigiGol).padStart(3)} | ${String(takim.averaj).padStart(
                3
            )} | ${String(takim.puan).padStart(3)} |`
        );
    });
 
    console.log('-'.repeat(83));
}
 
// Büyük/küçük harf hassasiyetiyle dosya adı doğrulama fonksiyonu
function dosyaAdiKontrol(dosyaAdi) {
    const mevcutDosyalar = fs.readdirSync('./'); // Bulunduğunuz dizindeki tüm dosyaları alır
    return mevcutDosyalar.includes(dosyaAdi) ? dosyaAdi : null; // Dosya adı tam olarak eşleşirse döner, aksi halde null
}
 
// Dosyadan maçları okuma fonksiyonu
function dosyadanMaclariOku(dosyaAdi) {
    // Dosya adı kontrolü: Yalnızca .txt uzantılı dosyalar geçerli
    if (!dosyaAdi.endsWith('.txt')) {
        console.log('Lütfen geçerli bir maç dosyası (.txt) girin!');
        return;
    }
 
    const dogruDosyaAdi = dosyaAdiKontrol(dosyaAdi);
    if (!dogruDosyaAdi) {
        console.log('Dosya bulunamadı! Dosya adını düzgün bir şekilde tekrar girin!');
        return;
    }
 
    // Eğer dosya daha önce okunduysa, uyarı ver
    if (okunanDosyalar.has(dosyaAdi)) {
        console.log('Bu dosya daha önce okundu!');
        return;
    }
 
    try {
        const maclar = fs.readFileSync(dogruDosyaAdi, 'utf8').split('\n');
        let okunanMacSayisi = 0;
        maclar.forEach(mac => {
            const [evSahibi, evSahibiGol, misafir, misafirGol] = mac.trim().split(' ');
 
            if (evSahibi && evSahibiGol && misafir && misafirGol) {
                const macKodu = `${evSahibi}-${misafir}`;
                const evSahibiTakim = takimlarMap.get(evSahibi);
                const misafirTakim = takimlarMap.get(misafir);
 
                if (evSahibiTakim && misafirTakim && !evSahibiTakim.oynananMaclar.has(macKodu)) {
                    evSahibiTakim.oynananMaclar.add(macKodu); // Bu maç ekleniyor
                    evSahibiTakim.macSayisi++;
                    misafirTakim.macSayisi++;
                    evSahibiTakim.attigiGol += parseInt(evSahibiGol);
                    evSahibiTakim.yedigiGol += parseInt(misafirGol);
                    misafirTakim.attigiGol += parseInt(misafirGol);
                    misafirTakim.yedigiGol += parseInt(evSahibiGol);
 
                    if (evSahibiGol > misafirGol) {
                        evSahibiTakim.galibiyet++;
                        misafirTakim.maglubiyet++;
                        evSahibiTakim.puan += ayarlar.galibiyetPuan;
                        misafirTakim.puan += ayarlar.maglubiyetPuan;
                    } else if (evSahibiGol < misafirGol) {
                        evSahibiTakim.maglubiyet++;
                        misafirTakim.galibiyet++;
                        misafirTakim.puan += ayarlar.galibiyetPuan;
                        evSahibiTakim.puan += ayarlar.maglubiyetPuan;
                    } else {
                        evSahibiTakim.beraberlik++;
                        misafirTakim.beraberlik++;
                        evSahibiTakim.puan += ayarlar.beraberlikPuan;
                        misafirTakim.puan += ayarlar.beraberlikPuan;
                    }
 
                    evSahibiTakim.averaj = evSahibiTakim.attigiGol - evSahibiTakim.yedigiGol;
                    misafirTakim.averaj = misafirTakim.attigiGol - misafirTakim.yedigiGol;
                    okunanMacSayisi++;
                } else {
                    console.log(`Bu maç daha önce oynanmış: ${evSahibi} ${evSahibiGol} ${misafir} ${misafirGol}`);
                }
            }
        });
 
        // Dosya okunduktan sonra, okunan dosyalar listesine ekle
        okunanDosyalar.add(dosyaAdi);
 
        if (okunanMacSayisi > 0) {
            console.log('Dosyadaki bütün maçlar başarıyla okundu!');
        } else {
            console.log('Dosyada okunan maç bulunamadı ya da hepsi zaten oynanmış!');
        }
    } catch (error) {
        console.log(`Hata: Maçlar dosyası okunurken bir hata oluştu! ${error.message}`);
    }
}
 
// Kullanıcı arayüzü
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
 
ligOlustur();
 
function menuGoster() {
    console.log('\nTÜRKİYE SANAL SÜPER LİG FİGSTÜRÜ');
    console.log('Dosyadan Maç Sonuçlarını Okutmak İsterseniz 1 i Tuşlayın');
    console.log('Yeni Maç Sonucu Girmek İçin 2 yi Tuşlayın');
    console.log('Puan Durumu Tablosunu Görmek İçin 3 ü Tuşlayın');
    console.log('Çıkış Yapmak İçin 4 ü Tuşlayın');
    rl.question('Lütfen (1-4) Arası Bir Seçenek Girin: ', (secim) => {
        secim = secim.trim();
        switch (secim) {
            case '1':
                rl.question('Dosya Adını Girin: ', (dosyaAdi) => {
                    dosyadanMaclariOku(dosyaAdi);
                    menuGoster();
                });
                break;
            case '2':
                const tekrarGiris = () => {
                    rl.question('Maç sonucunu girin (Örnek: C 4 B 2 - Ev Sahibi Takım 4, Misafir Takım 2): ', (sonuc) => {
                        const temizlenmisSonuc = sonuc.replace(/\s+/g, ' ').trim();
                        const [ev, evGol, misafir, misafirGol] = temizlenmisSonuc.split(' ');
 
                        if (ev && evGol && misafir && misafirGol) {
                            const sonucKaydedildi = macSonucunuKaydet(ev, parseInt(evGol), misafir, parseInt(misafirGol));
                            if (sonucKaydedildi) {
                                menuGoster();
                            } else {
                                rl.question('Tekrar giriş yapmak ister misiniz? (E/H): ', (cevap) => {
                                    if (cevap.toUpperCase() === 'E') {
                                        tekrarGiris();
                                    } else if (cevap.toUpperCase() === 'H') {
                                        menuGoster();
                                    } else {
                                        console.log('Geçersiz cevap! Lütfen yalnızca "E" veya "H" girin.');
                                    }
                                });
                            }
                        } else {
                            console.log('Geçersiz maç sonucu formatı!');
                            tekrarGiris();
                        }
                    });
                };
                tekrarGiris();
                break;
            case '3':
                rl.question('Puan tablosunu hangi özelliğe (puan/alfabetik/takma isim) göre sıralamak istersiniz? ', (siralamaMetodu) => {
                    rl.question('Büyük harfleri mi kullanayım? (evet/hayır): ', (buyukHarfSec) => {
                        puanDurumuGoster(siralamaMetodu, buyukHarfSec.toLowerCase() === 'evet');
                        menuGoster();
                    });
                });
                break;
            case '4':
                console.log('Çıkılıyor...');
                rl.close();
                break;
            default:
                console.log('Geçersiz seçenek!');
                menuGoster();
                break;
        }
    });
}
 
 
menuGoster();