import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GameNode, Player } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

// Client-side / public Supabase client
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side privileged client (uses SERVICE_ROLE_KEY if provided, falls back to ANON)
export const getSupabaseServerClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) return null;
  const key = supabaseServiceKey && !supabaseServiceKey.includes('placeholder')
    ? supabaseServiceKey
    : supabaseAnonKey;
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false },
  });
};

// 11 Family Mystery Nodes (NODE-01 - NODE-11) according to specification
export const INITIAL_NODES: GameNode[] = [
  {
    node_key: 'NODE-01',
    title: 'Panssarilukon leikkauskuva',
    target_person: 'Insinööri / Myyntipäällikkö',
    secret_code: '382NM',
    video_url: '/videos/node01.mp4',
    is_active: true, // Node 1 open by default so first puzzle is immediately playable
    unlocked_at: new Date().toISOString(),
    story_text: 'Lokakuun yönä 1888 Nuoramoisten kappalainen tilasi konepajalta kolmipulttisen terässalvan, jota yksikään tiirikka ei pystyisi avaamaan. Arkistosta löytynyt sinikopio paljastaa rattaiston hammasluvut ja karkaistun pääakselin leikkauslujuuden – vain täsmälleen oikea vääntömomentti murtaa lukituksen rikkomatta kirstun sisuksia.',
    role_hint: 'Laske hammasrattaiden välityssuhteesta ja ensiömomentista pääakselin murtomomentti (Nm).',
  },
  {
    node_key: 'NODE-02',
    title: 'Kappalaisen viljatase',
    target_person: 'Kirjanpitäjä',
    secret_code: '142.85',
    video_url: '/videos/node02.mp4',
    is_active: false,
    unlocked_at: null,
    story_text: 'Syksyllä 1888 kappalainen huomasi, että virkatalon viljamakasiinista katosi öisin jyväsäkkejä, vaikka ovet olivat teljettyinä. Ennen katoamistaan hän kaatoi mustetta tilikirjan kolmen kriittisen merkinnän päälle, jotta ulkopuoliset eivät näkisi puuttuvaa tase-erotusta ilman arkistoluuppia.',
    role_hint: 'Paljasta luupilla mustetahrojen alaiset erät, laske Debet ja Kredit yhteen ja ratkaise tase-ero.',
  },
  {
    node_key: 'NODE-03',
    title: 'Höyrykoneen luistiventtiili',
    target_person: 'Vanhempi asentaja / AY',
    secret_code: 'LAKKO-1905',
    video_url: '/videos/node03.mp4',
    is_active: false,
    unlocked_at: null,
    story_text: 'Lahden konepajan höyryveturi kuljetti salaisen rautakirstun kohti Nuoramoisten jyrkkiä syysnousuja. Veturin pääakselin laippa ja höyrykattilan paine oli mitoitettava äärimmilleen, ja konepajan asentajat vannoivat vaitiolovalan lukiten piirustuksen mitoituskoodin.',
    role_hint: 'Mitoita akselin harvinainen kierrekoko ja Nuoramoisten nousun maksimipaine.',
  },
  {
    node_key: 'NODE-04',
    title: 'Pioneerikoordinaatit',
    target_person: 'Nuorempi asentaja (intti)',
    secret_code: 'PIONEERI-460',
    video_url: '/videos/node04.mp4',
    is_active: false,
    unlocked_at: null,
    story_text: 'Sysmän ja Nuoramoisten välisen maantien 410 varrella suoritettiin syysmyrskyssä salainen kenttämittaus. Magneettinen häiriö vääristi kompassia Tainionvirran ylityksessä, joten kalliokätkön todellinen sijainti tallennettiin kolmen etappimatkan ja erantokorjatun suuntapiirun taakse.',
    role_hint: 'Laske korjattu suuntapiiru sekä kolmen mittausetapin kokonaismatka.',
  },
  {
    node_key: 'NODE-05',
    title: 'Kappalaisen aikajana & harhat',
    target_person: 'Sairaanhoitaja (MT)',
    secret_code: 'HARHA-1888',
    video_url: '/videos/node05.mp4',
    is_active: false,
    unlocked_at: null,
    story_text: 'Valvottuaan yhdeksän yötä kynttilänvalossa kappalaisen mieli alkoi horjua. Hänen päiväkirjaansa sekoittui mahdottomia näkyjä kävelevistä kirkontorneista ja elohopeaksi muuttuvasta Päijänteestä. Vain erottamalla harhat todellisista lokakuun tapahtumista aikajana palautuu ennalleen.',
    role_hint: 'Merkitse päiväkirjan kaksi aistiharhaa ja laske todellisten päivänumeroiden summa.',
  },
  {
    node_key: 'NODE-06',
    title: 'Orpopojan traumakartta',
    target_person: 'Lähihoitaja (Nuorisopsyk)',
    secret_code: 'LEIVINUUNI-18',
    video_url: '/videos/node06.mp4',
    is_active: false,
    unlocked_at: null,
    story_text: 'Virkatalon renkituvassa asunut orpopoika kuuli öisin raskaiden saappaiden askeleet ja piirsi hiilellä kartan talon huoneista. Kylmän kellarin, voudin konttorin ja vetoisan vintin keskellä oli vain yksi lämmin piilopaikka, jonka muurin koloon hän kätki oman sinettinsä.',
    role_hint: 'Tutki pohjapiirroksen huoneet, tunnista lämmin turvapaikka ja laske huonenumero.',
  },
  {
    node_key: 'NODE-07',
    title: 'Tinktuuran letaaliannos',
    target_person: 'Päihdesairaanhoitaja',
    secret_code: 'ROHDOS-70',
    video_url: '/videos/node07.mp4',
    is_active: false,
    unlocked_at: null,
    story_text: 'Heinolan vanhan apteekin kellarista löytyi latinankielinen rohdosresepti, jolla kappalainen yritti taltuttaa unettomuuttaan. Liian vahva seos oli kuitenkin hengenvaarallinen – reseptin roomalaisiin numeroihin on kätketty tarkka suhde, jolla tinktuura neutraloidaan turvalliseksi.',
    role_hint: 'Tulkitse reseptin roomalaiset numerot (XVIII, VIII, LXXXVIII) ja laske vasta-aineluku.',
  },
  {
    node_key: 'NODE-08',
    title: 'Kutojan silmukkalasku & kirjoneule',
    target_person: 'Eläkeläinen (Kutoja)',
    secret_code: 'SILMUKKA-24',
    video_url: '/videos/node08.mp4',
    is_active: false,
    unlocked_at: null,
    story_text: 'Virkatalon keinutuolissa kudottiin syysiltoina krappipunaista ja pellavanvalkoista kirjoneulesukkaa. Sukkapuikkojen kilinän lomassa neuleen symmetriseen tähtikuvioon ja kantalapun kavennuksiin kätkettiin luku, joka piti salaisuuden tallessa sukupolvelta toiselle.',
    role_hint: 'Täydennä symmetrinen kirjoneule ja laske aloitussilmukat sekä kantalapun silmukkaluku.',
  },
  {
    node_key: 'NODE-09',
    title: 'Stunt-pyramidin tasapaino',
    target_person: 'Kasiluokkalainen (Cheer)',
    secret_code: 'STUNT-VAKAUS',
    video_url: '/videos/node09.mp4',
    is_active: false,
    unlocked_at: null,
    story_text: 'Kirstun sisempi heilurilukko on rakennettu painovoiman ja horjumattoman tasapainon varaan – aivan kuten ihmispyramidi, jossa huipulla seisovan on pysyttävä täydellisessä keskipisteessä. Jos painopiste karkaa sivuun ennen kuin neljä sekuntia on täynnä, salpa lukittuu uudelleen.',
    role_hint: 'Pidä tasapaino vihreällä vakausvyöhykkeellä yhtäjaksoisesti 4 sekunnin ajan.',
  },
  {
    node_key: 'NODE-10',
    title: 'Pikselikirves ja Tappara',
    target_person: 'Ekaluokkalainen',
    secret_code: 'KIRVES-CHAMP',
    video_url: '/videos/node10.mp4',
    is_active: false,
    unlocked_at: null,
    story_text: 'Jäätyneen järven selälle on piirtynyt sinioranssi reitti, jota vartioivat rautaiset puolustajat. Vain se, joka pujottelee jääkentän halki poimien matkalla kaikki kolme muinaista kirvestunnusta, pääsee nostamaan voittopokaalin ja lunastamaan kymmenennen sinetin.',
    role_hint: 'Luistele vierekkäisiä ruutuja pitkin, kerää kaikki 3 kirvesmerkkiä ja saavuta pokaali.',
  },
  {
    node_key: 'NODE-11',
    title: 'Kuraiset jäljet ja lätäköt',
    target_person: 'Eskarilainen (Pipsa)',
    secret_code: '7',
    video_url: '/videos/node11.mp4',
    is_active: false,
    unlocked_at: null,
    story_text: 'Lokakuun sade on jättänyt Värilän virkatalon pihamaalle ja kuistin eteen syviä kuralätäköitä. Pienet saappaat ovat loikkineet riemukkaasti lätäköstä toiseen jättäen kuivat porraskivet kokonaan väliin – viimeinen sinetti aukeaa, kun hyppäät jokaiseen lätäkköön ja lasket niiden määrän!',
    role_hint: 'Klikkaa kaikki pihan vesilätäköt kuivia kiviä välttäen ja syötä lätäköiden kokonaismäärä.',
  },
];

export const INITIAL_PLAYERS: Player[] = [];
