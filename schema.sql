-- ==========================================
-- TAPAUS VÄRILÄ // PROTOKOLLA 1888
-- Supabase PostgreSQL Tietokantarakenne
-- ==========================================

-- 1. Pelaajat (Dynaaminen rekisteröinti & PIN-koodi)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  pin_code TEXT NOT NULL,
  total_score INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tehtäväsolmut (11 kpl sukumysteeriä)
CREATE TABLE IF NOT EXISTS game_nodes (
  node_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  target_person TEXT NOT NULL,
  secret_code TEXT NOT NULL,
  video_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  story_text TEXT,
  role_hint TEXT
);

-- 3. Ajanotto ja suoritushistoria (Reilu palvelinaika)
CREATE TABLE IF NOT EXISTS task_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  node_key TEXT REFERENCES game_nodes(node_key) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INT,
  awarded_points INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  UNIQUE(player_id, node_key)
);

-- 4. Pisteiden atominen päivitysfunktio
CREATE OR REPLACE FUNCTION increment_player_score(p_id UUID, pts INT)
RETURNS VOID AS $$
BEGIN
  UPDATE players
  SET total_score = total_score + pts
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Alustetaan 11 tehtävää (is_active = FALSE oletuksena)
INSERT INTO game_nodes (node_key, title, target_person, secret_code, video_url, is_active, story_text, role_hint)
VALUES
  (
    'NODE-01',
    'Panssarilukon leikkauskuva',
    'Insinööri / Myyntipäällikkö',
    '382NM',
    'https://pub-xxx.r2.dev/node01.mp4',
    FALSE,
    'Vuoden 1888 tekninen leikkauspiirustus paljastaa Värilän kirstun 3-pulttisen teräsmekanismin. Etsi oikea murtolujuus ja vääntömomentti.',
    'Laske rattaiden välityssuhteesta ja akselin leikkausjännityksestä murtomomentti (Nm).'
  ),
  (
    'NODE-02',
    'Kappalaisen viljatase',
    'Kirjanpitäjä',
    '142.85',
    'https://pub-xxx.r2.dev/node02.mp4',
    FALSE,
    'Nahkakantisen tilikirjan viljatase ei täsmää. Kappalaisen merkinnät viljavakoista ja kultaruplista kätkevät kirjausvirheen.',
    'Laske poistojen ja puuttuvien vakkojen erotus tilikirjan vesileiman alta.'
  ),
  (
    'NODE-03',
    'Höyrykoneen luistiventtiili',
    'Vanhempi asentaja / AY',
    'LAKKO-1905',
    'https://pub-xxx.r2.dev/node03.mp4',
    FALSE,
    'Konepajan vanhat höyrykoneet pysähtyivät luistiventtiilin sinetöintiin. Asentajien vaikenemisen vala kätki koneen asetukset.',
    'Tunnista venttiilivarren iskunpituus ja suurlakon salainen tunnuslause.'
  ),
  (
    'NODE-04',
    'Pioneerikoordinaatit',
    'Nuorempi asentaja (intti)',
    'PIONEERI-460',
    'https://pub-xxx.r2.dev/node04.mp4',
    FALSE,
    'Kenttälinnoitusten ja tuliasemien peitetyt mittauspisteet Sysmän ja Nuoramoisten välillä.',
    'Laske pioneerikartaston suuntakulmat ja tien 410 maastokoordinaatit.'
  ),
  (
    'NODE-05',
    'Kappalaisen aikajana & harhat',
    'Sairaanhoitaja (MT)',
    'HARHA-1888',
    'https://pub-xxx.r2.dev/node05.mp4',
    FALSE,
    'Kappalaisen sekavat päiväkirjamerkinnät syksyltä 1888. Harhojen ja todellisten tapahtumien aikajana eriytyy lokakuussa.',
    'Erota unettomuuden aiheuttamat harhakirjaukset todellisista päivämääristä.'
  ),
  (
    'NODE-06',
    'Orpopojan traumakartta',
    'Lähihoitaja (Nuorisopsyk)',
    'LEIVINUUNI-18',
    'https://pub-xxx.r2.dev/node06.mp4',
    FALSE,
    'Virkatalon renkituvan orpopojan piirustukset kätköpaikoista ja salatuista huoneista.',
    'Paikanna traumakartan piilotettu leivinuunin suojakoodi ja huonenumero.'
  ),
  (
    'NODE-07',
    'Tinktuuran letaaliannos',
    'Päihdesairaanhoitaja',
    'ROHDOS-70',
    'https://pub-xxx.r2.dev/node07.mp4',
    FALSE,
    'Heinolan apteekin kellariarkiston rohdosresepti. Unijuoman ja belladonnan tarkka sekoitussuhde.',
    'Laske tinktuuran myrkyllisyysraja ja oikea neutraloiva vasta-aine.'
  ),
  (
    'NODE-08',
    'Vesijärven tullikate & rahti',
    'Merkonomi & Mopoilija',
    'KATE-24',
    'https://pub-xxx.r2.dev/node08.mp4',
    FALSE,
    'Höyrylaivaliikenteen salakuljetusreitit ja tullikirjaukset Vesijärven ja Päijänteen kanavasuluilla.',
    'Laske rahtikirjan tullikateprosentti ja laivurin salainen purkukoodi.'
  ),
  (
    'NODE-09',
    'Stunt-pyramidin tasapaino',
    'Kasiluokkalainen (Cheer)',
    'STUNT-VAKAUS',
    'https://pub-xxx.r2.dev/node09.mp4',
    FALSE,
    'Akrobaattinen tasapaino ja pyramidin painopiste. Vakausvyöhykkeen säilyttäminen 4 sekunnin ajan.',
    'Pidä voimat ja kulmat tasapainossa ja laukaise vihreä vakautussignaali.'
  ),
  (
    'NODE-10',
    'Pikselikirves ja Tappara',
    'Ekaluokkalainen',
    'KIRVES-CHAMP',
    'https://pub-xxx.r2.dev/node10.mp4',
    FALSE,
    'Kirveslogon ja sinioranssien pikselien salaisuus. Etsi oikea reitti jäällä kohti mestaruuspokaalia.',
    'Ratkaise kirvespolun pikselilabyrintti ja poimi mestaruuskoodi.'
  ),
  (
    'NODE-11',
    'Kuraiset jäljet ja lätäköt',
    'Eskarilainen (Pipsa)',
    '7',
    'https://pub-xxx.r2.dev/node11.mp4',
    FALSE,
    'Kuraisten saappaiden askelmerkit ja vesilätäköt virkatalon kuistilla. Laske montako lätäkköä hypättiin yli.',
    'Laske kurasaappaiden hypyt ja syötä lätäköiden kokonaismäärä.'
  )
ON CONFLICT (node_key) DO UPDATE SET
  title = EXCLUDED.title,
  target_person = EXCLUDED.target_person,
  secret_code = EXCLUDED.secret_code,
  video_url = EXCLUDED.video_url,
  story_text = EXCLUDED.story_text,
  role_hint = EXCLUDED.role_hint;
