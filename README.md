# 🕵️ Tapaus Värilä // Protokolla 1888

Progressive Web App (PWA) -tutkintaterminaali ja mysteeripeli Nuoramoisten virkatalon (Värilän pappilan) 1888 salaisuuksien purkamiseksi.

Sovelluksessa yhdistyvät fyysinen NFC-geokätköily, personoidut Veo-teaservideot, Web Audio API -radioskanneri ja suojattu taustapisteytys.

---

## ⚡ Pika-aloitus

### 1. Kehitysympäristön käynnistys
```bash
npm run dev
```
Avaa selaimessa: [http://localhost:3000](http://localhost:3000)

### 2. Tuotantopaketin luonti (Next.js)
```bash
npm run build
npm start
```

---

## 📱 PWA ja Mobiilikäyttö
- Sovellus on optimoitu asennettavaksi suoraan puhelimen kotivalikkoon (`display: standalone`, teemavärit `#0a0c0a` ja `#25e24c`).
- Tukee offline-välimuistia (`public/sw.js`).
- Kun puhelin lukee fyysisen NFC-tagin osoitteella `https://sinun-peli.vercel.app/?nfc=ASKO-1888`, PWA avaa automaattisesti kyseisen anomalian ja kuittaa ensilöytäjän bonuksen (+100 p).

---

## 🏷️ Fyysisten NFC-tarrojen ohjelmointi
Käytä NTAG213 tai NTAG215 -tarroja ja ilmaista **NFC Tools** -sovellusta (iOS / Android):
1. Avaa *NFC Tools* -> **Kirjoita (Write)** -> **Lisää tietue (Add a record)** -> **Mukautettu URL / URI**.
2. Syötä osoitteet:
   - **Viikko 1 (Lahti / Asko):** `https://sinun-peli.vercel.app/?nfc=ASKO-1888`
   - **Viikko 2 (Heinola / Maaherranpuisto):** `https://sinun-peli.vercel.app/?nfc=MAAHERRA-1888`
   - **Viikko 3 (Urheilukenttä):** `https://sinun-peli.vercel.app/?nfc=KENTTA-1888`
   - **Viikko 4 (Nuoramoinen Virkatalo):** `https://sinun-peli.vercel.app/?nfc=NUORAMOINEN-1888`

---

## 🗄️ Tietokanta (Supabase SQL)
1. Luo ilmainen projekti osoitteessa [supabase.com](https://supabase.com).
2. Avaa **SQL Editor** ja aja tiedoston [`schema.sql`](./schema.sql) sisältö.
3. Kopioi Supabasen URL ja anon-avain tiedostoon `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://projekti-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sinun-anon-avain
```
*(Huom: Jos avaimia ei aseteta, sovellus toimii saumattomasti sisäänrakennetussa muistivarastotilassa testauksen ja kehityksen aikana).*

---

## 🎬 Median jakelu (Cloudflare R2 & FFmpeg)
Pakkaa Google Veo -teaservideot keveiksi mobiililatausta varten:
```bash
ffmpeg -i veo_alkuperainen.mp4 -vcodec libx264 -crf 24 -preset slow -an teaser_sko.mp4
```
Lataa tiedostot julkiseen Cloudflare R2 -bucketiin ja liitä linkit kantaan tai `game_nodes.video_url` -kenttään.

---

## 🧩 Pelin Kulku ja Tehtävät
1. **Viikko 1: Konepajan Sepät & Höyryveturi (Lahti / Asko)** -> Koodi: `AKSELI-48-1888`
2. **Viikko 2: Apteekkarin Rohdos & Musta Kirjanpito (Heinola)** -> Koodi: `TINKTUURA-1888`
3. **Viikko 3: Taajuusskanneri & Kirvesvartija** -> Koodi: `SYSMA-61.42-1888`
4. **Viikko 4: Värilän Monilukkoarkku (Nuoramoinen)** -> Finaalikoodi: `VARILA-SINETTI-1888`
