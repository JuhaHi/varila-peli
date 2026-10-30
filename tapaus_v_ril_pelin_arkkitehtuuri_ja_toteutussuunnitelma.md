# TAPAUS VÄRILÄ // PROTOKOLLA 1888
## Tekninen arkkitehtuuri ja toteutusohje (Antigravity Specification)

> **KRIITTINEN ARKKITEHTUURILIIKUTA (TÄRKEÄ):**
> **NFC-TAGIT ON POISTETTU KOKONAAN KÄYTÖSTÄ.**
> Pelissä **EI OLE** lainkaan fyysisiä NFC-tageja, NDEF-lukijoita, `?nfc=`-URL-parametreja tai ulkoista tarraskannausta.
> Peliä hallinnoidaan keskitetysti salaisesta **Admin-hallintapaneelista (`/admin`)** ja herätteet osallistujille jaetaan **WhatsApp-ryhmässä**.

---

### 1. Järjestelmäarkkitehtuuri ja ilmaiset palvelut

Peli toteutetaan Fullstack-arkkitehtuurina, jossa käyttöliittymä, logiikka, tietokanta ja raskaat videot on eriytetty toisistaan:

```
[ PWA Pelaajan Puhelimessa (Next.js / Tailwind / Canvas / Web Audio) ]
    │
    ├── 1. PWA Runko, UI & Serverless API Routes ──> [ Vercel (Hobby Tier) ]
    │      ├── /api/auth/login (Rekisteröinti & PIN-tarkistus)
    │      ├── /api/game/start-task (Aloitusajan palvelinleima)
    │      ├── /api/check-code (Koodintarkistus & nopeuspisteet)
    │      ├── /api/leaderboard (Reaaliaikaiset pisteet)
    │      └── /api/admin/* (Järjestäjän ohjauskomennot)
    │
    ├── 2. Tilatietokanta & Reaaliaikaisuus ───────> [ Supabase (PostgreSQL) ]
    │      ├── players, game_nodes, task_attempts
    │
    └── 3. Veo 3.1 -suoratoistovideot ────────────> [ Cloudflare R2 (Object Storage) ]
           └── Julkinen bucket (10 GB ilmainen, 0 € ulosmenevä kaistakulu)
```

---

### 2. Pelin keskeiset säännöt ja mekaniikka

1. **Ei tiimejä:** Jokainen 11 osallistujasta pelaa henkilökohtaisesti omalla puhelimellaan.
2. **Käyttäjähallinta ilman valmista listaa:**
   - Ensimmäisellä käynnistyksellä pelaaja kirjoittaa itse nimensä ja valitsee oman 4-numeroisen PIN-koodinsa.
   - Jos nimi on uusi, järjestelmä luo pelaajan. Jos nimi on olemassa, tarkistetaan PIN.
   - Sessio tallennetaan pysyvästi laitteen muistiin (`localStorage`).
3. **Admin-ohjattu pelirytmi:**
   - Järjestäjä avaa tehtäviä satunnaisesti lokakuun aikana `/admin`-paneelista (PIN-suojattu).
   - Aktivoinnin jälkeen järjestäjä jakaa herätteen WhatsApp-ryhmään (paneelissa 1-klikkauksen `wa.me`-jakopainike).
4. **Reilu aikalaskenta ja nopeuspisteet:**
   - Ajanotto **EI ALA** silloin, kun tehtävä aktivoidaan WhatsAppiin, vaan **täsmälleen sillä sekunnilla, kun kyseinen pelaaja avaa tehtävän ensimmäisen kerran omalla laitteellaan**.
   - Aloitusaikaleima (`started_at`) lukitaan Supabasen palvelinaikaan (ei voi huijata selaimesta).
   - Nopein ratkaisija saa parhaat pisteet suhteellisella skaalauksella per tehtävä:
     - Nopein aika (`minTime`): **100 p**
     - Hitain aika (`maxTime`): **10 p**
     - Muut suoritukset: **Lineaarisesti 10–100 p** suhteessa nopeimman ja hitaimman ajan erotukseen (pisteet päivittyvät dynaamisesti uusien suoritusten valmistuessa).

---

### 3. Tietokantarakenne (Supabase SQL)

Aja seuraava skeema Supabasen SQL Editorissa:

```sql
-- 1. Pelaajat (Dynaaminen rekisteröinti)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  pin_code TEXT NOT NULL,
  total_score INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tehtäväsolmut (11 kpl)
CREATE TABLE IF NOT EXISTS game_nodes (
  node_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  target_person TEXT DEFAULT '',
  secret_code TEXT NOT NULL,
  video_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  story_text TEXT,
  role_hint TEXT
);

-- 3. Ajanotto ja suoritushistoria
CREATE TABLE IF NOT EXISTS task_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  node_key TEXT REFERENCES game_nodes(node_key),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INT,
  awarded_points INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  UNIQUE(player_id, node_key)
);

-- Pisteiden atominen päivitysfunktio
CREATE OR REPLACE FUNCTION increment_player_score(p_id UUID, pts INT)
RETURNS VOID AS $$
BEGIN
  UPDATE players
  SET total_score = total_score + pts
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Alustetaan 11 tehtävää (vaihda pub-xxxxxx.r2.dev omaan R2-osoitteeseesi)
INSERT INTO game_nodes (node_key, title, target_person, secret_code, video_url, is_active, story_text, role_hint)
VALUES
  ('NODE-01', 'Panssarilukon leikkauskuva', 'Insinööri / Myyntipäällikkö', '382NM', 'https://pub-xxxxxx.r2.dev/node01.mp4', TRUE,
   'Lokakuun yönä 1888 Nuoramoisten kappalainen tilasi konepajalta kolmipulttisen terässalvan, jota yksikään tiirikka ei pystyisi avaamaan. Arkistosta löytynyt sinikopio paljastaa rattaiston hammasluvut ja karkaistun pääakselin leikkauslujuuden – vain täsmälleen oikea vääntömomentti murtaa lukituksen rikkomatta kirstun sisuksia.',
   'Laske hammasrattaiden välityssuhteesta ja ensiömomentista pääakselin murtomomentti (Nm).'),
  ('NODE-02', 'Kappalaisen viljatase', 'Kirjanpitäjä', '142.85', 'https://pub-xxxxxx.r2.dev/node02.mp4', FALSE,
   'Syksyllä 1888 kappalainen huomasi, että virkatalon viljamakasiinista katosi öisin jyväsäkkejä, vaikka ovet olivat teljettyinä. Ennen katoamistaan hän kaatoi mustetta tilikirjan kolmen kriittisen merkinnän päälle, jotta ulkopuoliset eivät näkisi puuttuvaa tase-erotusta ilman arkistoluuppia.',
   'Paljasta luupilla mustetahrojen alaiset erät, laske Debet ja Kredit yhteen ja ratkaise tase-ero.'),
  ('NODE-03', 'Höyrykoneen luistiventtiili', 'Vanhempi asentaja / AY', 'AKSELI-48-1888', 'https://pub-xxxxxx.r2.dev/node03.mp4', FALSE,
   'Lahden konepajan höyryveturi kuljetti salaisen rautakirstun kohti Nuoramoisten jyrkkiä syysnousuja. Veturin pääakselin laippa ja höyrykattilan paine oli mitoitettava äärimmilleen, ja konepajan asentajat vannoivat vaitiolovalan lukiten piirustuksen mitoituskoodin.',
   'Mitoita akselin harvinainen kierrekoko ja Nuoramoisten nousun maksimipaine.'),
  ('NODE-04', 'Pioneerikoordinaatit', 'Nuorempi asentaja (intti)', 'PIONEERI-460', 'https://pub-xxxxxx.r2.dev/node04.mp4', FALSE,
   'Sysmän ja Nuoramoisten välisen maantien 410 varrella suoritettiin syysmyrskyssä salainen kenttämittaus. Magneettinen häiriö vääristi kompassia Tainionvirran ylityksessä, joten kalliokätkön todellinen sijainti tallennettiin kolmen mittauspisteen ja kaltevuuskorjatun suuntiman taakse.',
   'Valitse kolme mittauspistettä ja vähennä maaston kaltevuuskorjaus.'),
  ('NODE-05', 'Kappalaisen aikajana & harhat', 'Sairaanhoitaja (MT)', 'HARHA-1888', 'https://pub-xxxxxx.r2.dev/node05.mp4', FALSE,
   'Valvottuaan yhdeksän yötä kynttilänvalossa kappalaisen mieli alkoi horjua. Hän repi päiväkirjastaan neljä sivua ja piilotti ne sakastin lattialankkujen alle. Vain järjestämällä kellonlyönnit, sillan varjot, kellariluukun koputukset ja viimeisen sinetin oikeaan aikajärjestykseen totuus paljastuu.',
   'Järjestä neljä revittyä päiväkirjamerkintää oikeaan kronologiseen aikajärjestykseen.'),
  ('NODE-06', 'Orpopojan traumakartta', 'Lähihoitaja (Nuorisopsyk)', 'LEIVINUUNI-18', 'https://pub-xxxxxx.r2.dev/node06.mp4', FALSE,
   'Pappilan nuori kasvattipoika todisti pimeässä tuvassa, kuinka raskas arkku kannettiin kellarin salakäytävään. Pelästynyt poika piiloutui lämpimän leivinuunin taakse ja piirsi hiilellä muistiin neljä huonetta siinä järjestyksessä, jossa tunkeutujat kulkivat.',
   'Tutki pappilan pohjapiirroksen neljä huonetta oikeassa kulkujärjestyksessä.'),
  ('NODE-07', 'Tinktuuran letaaliannos', 'Päihdesairaanhoitaja', 'ROHDOS-70', 'https://pub-xxxxxx.r2.dev/node07.mp4', FALSE,
   'Heinolan piirilääkärin lukitusta lääkekaapista löytyi kolme meripihkapulloa: Belladonnaa, Arsenikkia ja Valerianaa. Kappalainen oli merkinnyt pullojen kylkeen roomalaisilla numeroilla annosmäärät, joista vain tarkka vastavaikutuslaskelma estää myrkytyksen.',
   'Tulkitse pullojen roomalaiset numerot ja laske neutraloiva vastamyrkkyannos (ml).'),
  ('NODE-08', 'Kutojan silmukkalasku & kirjoneule', 'Eläkeläinen (Kutoja)', 'SILMUKKA-24', 'https://pub-xxxxxx.r2.dev/node08.mp4', FALSE,
   'Kappalaisen iäkäs täti istui keinutuolissa öljylampun valossa ja neuloi sukkaan perinteistä kirjoneuletta. Kukaan ulkopuolinen ei arvannut, että oikeat ja nurjat silmukat sekä kantapään kavennuslasku kätkivät sisäänsä suvun salaisen arkistokoodin.',
   'Täydennä 8 silmukan mallikerta symmetrisesti ja laske 6. kerroksen kavennussilmukat.'),
  ('NODE-09', 'Stunt-pyramidin tasapaino', 'Kasiluokkalainen (Cheer)', 'STUNT-VAKAUS', 'https://pub-xxxxxx.r2.dev/node09.mp4', FALSE,
   'Pitäjän syysjuhlassa voimistelijaryhmä muodosti korkean ihmispyramidin yleisön hurratessa, jotta kappalaisen apulainen ylettyi kirkon parven kätköön. Pyramidin jokaisen kerroksen kuorman on oltava täydellisessä symmetriassa.',
   'Tasapainota kolmikerroksisen pyramidin pohja-, keski- ja huippukerrokset.'),
  ('NODE-10', 'Pikselikirves ja Tappara', 'Ekaluokkalainen', 'KIRVES-CHAMP', 'https://pub-xxxxxx.r2.dev/node10.mp4', FALSE,
   'Värilän rautakirstun sisäkanteen oli taottu 5x5-ruudukko pieniä metallilaattoja. Vanha seppä kertoi, että kun ruudukkoon sytyttää täsmälleen kolmetoista oikeaa ruutua, esiin piirtyy muinaisen tapparakirveen tunnus.',
   'Valitse 5x5-ruudukosta ne 13 ruutua, jotka muodostavat tapparakirveen kuvion.'),
  ('NODE-11', 'Kuraiset jäljet ja lätäköt', 'Eskarilainen (Pipsa)', '7', 'https://pub-xxxxxx.r2.dev/node11.mp4', FALSE,
   'Aamun valjetessa lokakuun sateen jälkeen pappilan pihamaalla näkyi kymmenen vesilätäkköä. Osa lätäköistä oli peilityyniä hämäyksiä, mutta karkurin raskaat saappaat olivat jättäneet tuoreet kuraroiskeet vain osaan lätäköistä.',
   'Etsi ja valitse kaikki lätäköt, joissa näkyy tuore kurainen saappaanjälki, ja laske niiden lukumäärä.')
ON CONFLICT (node_key) DO UPDATE SET
  title = EXCLUDED.title,
  secret_code = EXCLUDED.secret_code,
  video_url = EXCLUDED.video_url,
  story_text = EXCLUDED.story_text,
  role_hint = EXCLUDED.role_hint;
```

---

### 4. API-rajapinnat (Next.js App Router)

#### 4.1 Kirjautuminen / Rekisteröinti (`src/app/api/auth/login/route.ts`)
- Tarkistaa, löytyykö syötetty nimi.
- Jos löytyy: vertaa PIN-koodia.
- Jos ei löydy: luo uuden käyttäjän annetulla PIN-koodilla.

#### 4.2 Tehtävän avaaminen ja aikalaskurin käynnistys (`src/app/api/game/start-task/route.ts`)
- Kutsutaan heti, kun pelaaja avaa aktiivisen tehtävän ruudulleen.
- Tallentaa `task_attempts`-tauluun `started_at = NOW()`.
- Jos pelaaja on jo avannut tehtävän aiemmin, palauttaa olemassa olevan aloitustiedon (aika ei nollaudu sulkemalla selainta).

#### 4.3 Koodin tarkistus ja pisteytys (`src/app/api/check-code/route.ts`)
- Vertaa pelaajan antamaa syötettä `game_nodes.secret_code`-arvoon.
- Laskee keston: `duration_seconds = completed_at - started_at`.
- Myöntää pisteet ja päivittää kokonaistuloksen `increment_player_score`-funktiolla.

#### 4.4 Hallintapaneelin ohjaus (`src/app/api/admin/toggle-node/route.ts`)
- Vahvistaa ylläpitäjän PIN-koodin (`ADMIN_SECRET_PIN`).
- Asettaa `is_active = true / false` ja tallentaa aktivointiajan.

---

### 5. Käyttöliittymä ja interaktiiviset pelikomponentit

Peli ei ole tavallinen tekstilomake, vaan **diegeettinen Värilän vuoden 1888 arkistopääte**:
1. **Teemallinen ulkoasu:** Musta tausta (`#0a0c0a`), fosforinvihreät tekstit (`#25e24c`), CRT scanline -viivat ja vanhanaikainen fontti (`Share Tech Mono` / `Courier`).
2. **Käsin kosketeltavat minipelit:**
   - *Momenttiavain & panssarilukko:* Interaktiivinen asteikko (100–500 Nm), joka laukaisee 3 fyysistä pulttia arvolla 382 Nm.
   - *Tilikirja & luuppi:* Hiirellä/sormella liikuteltava suurennuslasi mustetahrojen yli vesileiman ja kirjausvirheen paljastamiseksi.
   - *Radiokohina (Web Audio API):* Liukusäätimillä vaimennettava kohinasuodatus ja taajuuden viritys.
   - *Stunt-vakaus:* Tasapainon pito vihreällä vyöhykkeellä vähintään 4 sekuntia.
3. **PWA-määrittely (`public/manifest.json`):**
   - `"display": "standalone"`
   - Koko ruudun immersio ilman selaimen painikkeita tai osoiteriviä.

---

### 6. Admin-hallintapaneeli & WhatsApp-integraatio (`/admin`)

Paneelissa on suojatut kytkimet kullekin 11 tehtävälle sekä dynaaminen WhatsApp-jakolinkki:

```text
[ Aktivoi ryhmälle ] ──> Kantaan: is_active = true
                     └──> Ruudulle ilmestyy: [ Jaa WhatsAppiin ]
```

**WhatsApp-jakolinkin logiikka:**
```typescript
const shareUrl = `https://wa.me/?text=${encodeURIComponent(
  `⚠️ HÄLYTYS: Uusi Värilä-anomalia havaittu! Tehtävä avattu päätteelle: https://${window.location.host}`
)}`;
window.open(shareUrl, '_blank');
```

---

### 7. Kehityksen ja asennuksen tarkistuslista (Deployment Checklist)

1. [ ] **Cloudflare R2:** Luo bucket `varila-media`, salli julkinen pääsy (`r2.dev`) ja siirrä sinne Veo 3.1 MP4-videot.
2. [ ] **Supabase:** Luo ilmainen projekti, aja annettu SQL-koodi ja kopioi `SUPABASE_URL` sekä `SUPABASE_SERVICE_ROLE_KEY`.
3. [ ] **Vercel & Next.js:**
   - Alusta projekti: `npx create-next-app@latest`.
   - Aseta ympäristömuuttujat Verceliin (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET_PIN`).
4. [ ] **Testaa ilman NFC:tä:**
   - Rekisteröidy yhdellä nimellä ja PIN-koodilla.
   - Avaa `/admin`, aktivoi `NODE-01`.
   - Varmista, että pelaajan ruudulle ilmestyy video ja aikalaskuri lähtee käyntiin ensiavauksesta.