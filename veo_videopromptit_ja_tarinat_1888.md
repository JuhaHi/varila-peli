# TAPAUS VÄRILÄ 1888 – Tehtävien Tarinat, Veo 3.1 -Videopromptit ja Ratkaisulogiikka

Tämä dokumentti sisältää kaikkien 11 tehtäväsolmun (`NODE-01` – `NODE-11`):
1. **Tarina (Arkistotallenteen johdanto):** Näkyy pelaajalle pelissä (`TaskGate`) ennen videon käynnistämistä.
2. **Veo 3.1 -Videoprompt (8 sekuntia, 16:9, äänet mukana):** Suoraan Google Veo 3.1:een kopioitava englanninkielinen prompt, joka luo yhtenäisen vuoden 1888 tummanpuhuvan suomalaisen virkatalo-/steampunk-mysteeritunnelman ja antaa visuaalisen johdannon itse tehtävään.
3. **Kytkentä tehtävään & ratkaisu:** Miten videon vihje johtaa minipelin suorittamiseen ja oikeaan koodiin.

---

## NODE-01: Panssarilukon leikkauskuva (`node01.mp4`)

### 1. Tarina
> Lokakuun yönä 1888 Nuoramoisten kappalainen tilasi konepajalta kolmipulttisen terässalvan, jota yksikään tiirikka ei pystyisi avaamaan. Arkistosta löytynyt sinikopio paljastaa rattaiston hammasluvut ja karkaistun pääakselin leikkauslujuuden – vain täsmälleen oikea vääntömomentti murtaa lukituksen rikkomatta kirstun sisuksia.

### 2. Veo 3.1 Prompt
```text
Cinematic 1888 historical mystery film, 16:9, 24fps, dark sepia and cyan-tinted candlelit workshop in Finland. Close-up macro tracking shot over an antique iron-bound oak chest with a massive three-bolt armored brass and steel lock mechanism. A master engineer's gloved hand unfolds a glowing Prussian-blue technical blueprint beside the lock, pointing a brass caliper at two interlocking gears labeled "Z1 = 18" and "Z2 = 54". He attaches a heavy vintage brass torque wrench to the primary shaft and begins to turn it under extreme tension. Audio: heavy metallic clicking of precision gears, creaking steel under high torque, crackling oil lamp, and a low suspenseful cello drone.
```

### 3. Tehtävä ja ratkaisu
- **Tehtävä pelissä:** Pelaaja tutkii CAD-leikkauskuvaa, jossa ensiöratas on $Z_1 = 18$ ($M_1 = 127{,}33\text{ Nm}$) ja väliratas $Z_2 = 54$.
- **Ratkaisulogiikka:**
  1. Laske välityssuhde: $i = 54 / 18 = 3{,}0$.
  2. Laske pääakselin murtomomentti: $M_2 = 3{,}0 \times 127{,}33\text{ Nm} = 382\text{ Nm}$ ja säädä momenttiavain arvoon `382 Nm`.
- **Purkukoodi:** `382NM`

---

## NODE-02: Kappalaisen viljatase (`node02.mp4`)

### 1. Tarina
> Syksyllä 1888 kappalainen huomasi, että virkatalon viljamakasiinista katosi öisin jyväsäkkejä, vaikka ovet olivat teljettyinä. Ennen katoamistaan hän kaatoi mustetta tilikirjan kolmen kriittisen merkinnän päälle, jotta ulkopuoliset eivät näkisi puuttuvaa tase-erotusta ilman arkistoluuppia.

### 2. Veo 3.1 Prompt
```text
Atmospheric 1888 Nordic gothic mystery, 16:9, warm flickering candlelight in an old wooden parsonage study in Sysmä, Finland. Overhead cinematic dolly shot of a leather-bound grain ledger open on an oak desk. A trembling hand holding a quill Deliberately tips a small glass inkwell, spilling three dark black ink blots over the handwritten columns of rye, barley, and oats. Another hand picks up a brass magnifying glass with an amber lens; as the lens passes over the wet ink blot, hidden glowing golden numbers shimmer beneath the ink. Audio: scratching quill pen, splash of liquid ink on thick parchment, ticking grandfather clock, distant autumn wind.
```

### 3. Tehtävä ja ratkaisu
- **Tehtävä pelissä:** Pelaaja liikuttaa suurennuslasia (luuppia) tilikirjan kolmen mustetahran päällä.
- **Ratkaisulogiikka:**
  1. Mustetahra I paljastaa Kauran: `154.20 v.` $\rightarrow$ Debet yhteensä: $420{,}00 + 280{,}50 + 154{,}20 = 854{,}70$.
  2. Mustetahra II paljastaa Siemenviljan: `203.35 v.` $\rightarrow$ Kredit yhteensä: $310{,}00 + 198{,}50 + 203{,}35 = 711{,}85$.
  3. Mustetahra III paljastaa kaavan: $\text{Debet} - \text{Kredit} = 854{,}70 - 711{,}85 = 142{,}85$.
- **Purkukoodi:** `142.85`

---

## NODE-03: Höyrykoneen luistiventtiili (`node03.mp4`)

### 1. Tarina
> Lahden konepajan höyryveturi kuljetti salaisen rautakirstun kohti Nuoramoisten jyrkkiä syysnousuja. Veturin pääakselin laippa ja höyrykattilan paine oli mitoitettava äärimmilleen, ja konepajan asentajat vannoivat vaitiolovalan lukiten piirustuksen mitoituskoodin.

### 2. Veo 3.1 Prompt
```text
Cinematic 19th-century industrial steampunk mystery, 16:9, smoky locomotive machine shop in Lahti, Finland, 1888. Dramatic low-angle shot of a massive black steam locomotive drive shaft and slide valve hissing with white steam. A veteran machinist with soot-stained face measures the heavy threaded flange with a steel caliper, revealing an engraving "M48" on the shaft, while the brass pressure gauge needle trembles and climbs up to "12 BAR". Sparks fly from a forge in the background. Audio: rhythmic chugging of a steam valve, sharp hiss of high-pressure steam, metallic clang of a wrench, deep industrial rumble.
```

### 3. Tehtävä ja ratkaisu
- **Tehtävä pelissä:** Säädä höyrykoneen akselin kierrekoko ja höyrypaine vastaamaan Nuoramoisten vuoden 1888 nousun mitoitusta.
- **Ratkaisulogiikka:**
  1. Aseta akselin kierrekooksi `M48` (48 mm).
  2. Valitse höyrypaineeksi `12 bar (Nuoramoisten nousu 1888)`.
- **Purkukoodi:** `AKSELI-48-1888` (hyväksyy myös `LAKKO-1905`)

---

## NODE-04: Pioneerikoordinaatit (`node04.mp4`)

### 1. Tarina
> Sysmän ja Nuoramoisten välisen maantien 410 varrella suoritettiin syysmyrskyssä salainen kenttämittaus. Magneettinen häiriö vääristi kompassia Tainionvirran ylityksessä, joten kalliokätkön todellinen sijainti tallennettiin kolmen etappimatkan ja erantokorjatun suuntapiirun taakse.

### 2. Veo 3.1 Prompt
```text
Cinematic historical field reconnaissance scene, 16:9, misty October twilight in a rugged Finnish pine forest and river rapids along Road 410. Close-up of a weathered military engineer's table laid over a mossy rock next to rushing dark water. A brass artillery compass spins slightly due to magnetic anomaly before settling, beside a topographical map marked with red dashed lines across three checkpoints and a field notebook showing "-45" magnetic correction. Raindrops hit the map paper under a storm lantern's glow. Audio: rushing river rapids, clicking brass compass bezel, rain pattering on canvas, distant thunder.
```

### 3. Tehtävä ja ratkaisu
- **Tehtävä pelissä:** Laske pioneerikartaston erantokorjattu suuntapiiru sekä kolmen etappimatkan kokonaispituus.
- **Ratkaisulogiikka:**
  1. Korjattu suuntapiiru: $180 - 45 = 135\text{ piirua}$.
  2. Kokonaismatka (A $\rightarrow$ D): $280\text{ m} + 125\text{ m} + 55\text{ m} = 460\text{ m}$.
- **Purkukoodi:** `PIONEERI-460`

---

## NODE-05: Kappalaisen aikajana & harhat (`node05.mp4`)

### 1. Tarina
> Valvottuaan yhdeksän yötä kynttilänvalossa kappalaisen mieli alkoi horjua. Hänen päiväkirjaansa sekoittui mahdottomia näkyjä kävelevistä kirkontorneista ja elohopeaksi muuttuvasta Päijänteestä. Vain erottamalla harhat todellisista lokakuun tapahtumista aikajana palautuu ennalleen.

### 2. Veo 3.1 Prompt
```text
Psychological gothic mystery film, 16:9, late October 1888 in an eerie candlelit parsonage bedroom. A sleep-deprived chaplain in a dark cassock writes frantically in a diary as the candle burns down to a pool of wax. Through the rain-streaked window behind him, a surreal hallucination briefly flickers: the silhouette of a wooden church tower parece to sway and the lake surface gleams like liquid mercury, before snapping back to normal dark autumn reality. Close-up of diary pages with dates in October crossed out in red ink. Audio: frantic whispering, fast scratching of pen, eerie clock chime striking thirteen times, howling wind.
```

### 3. Tehtävä ja ratkaisu
- **Tehtävä pelissä:** Erota 5 päiväkirjamerkinnän joukosta 2 unettomuuden aiheuttamaa aistiharhaa ja laske todellisten päivien summa.
- **Ratkaisulogiikka:**
  1. Valitse harhoiksi *19. lokakuuta (kello löi kolmetoista kertaa / kirkontorni käveli)* ja *32. lokakuuta (elohopeajärvi ja mahdoton päivämäärä)*.
  2. Laske kolmen todellisen merkinnän lokakuun päivänumerot yhteen: $12 + 24 + 29 = 65$.
- **Purkukoodi:** `HARHA-1888`

---

## NODE-06: Orpopojan traumakartta (`node06.mp4`)

### 1. Tarina
> Virkatalon renkituvassa asunut orpopoika kuuli öisin raskaiden saappaiden askeleet ja piirsi hiilellä kartan talon huoneista. Kylmän kellarin, voudin konttorin ja vetoisan vintin keskellä oli vain yksi lämmin piilopaikka, jonka muurin koloon hän kätki oman sinettinsä.

### 2. Veo 3.1 Prompt
```text
Atmospheric 1888 Nordic period drama, 16:9, dim warm glow of embers inside a rustic Finnish servants' cabin (renkitupa). A young orphan boy's charcoal-stained fingers draw a rough floorplan of four rooms on a piece of birchbark and aged paper by the light of a massive brick baking oven (leivinuuni). Heavy footsteps echo from the hallway outside; the boy slides a small brass seal into a hidden loose brick niche in the warm oven wall between rooms #14 and #22. Audio: crackling warm fireplace embers, muffled heavy boot footsteps on wooden floorboards above, soft charcoal sketching sound.
```

### 3. Tehtävä ja ratkaisu
- **Tehtävä pelissä:** Tutki virkatalon 4 huonetta klikkaamalla pohjapiirrosta, etsi turvapaikka ja laske huonenumero.
- **Ratkaisulogiikka:**
  1. Ainoa lämmin ja turvallinen paikka (pelkotaso 0 %) on `LEIVINUUNI`.
  2. Huonenumero on Voudin konttorin (`#14`) ja Pohjoisen vintin (`#22`) keskiarvo: $(14 + 22) / 2 = 18$.
- **Purkukoodi:** `LEIVINUUNI-18`

---

## NODE-07: Tinktuuran letaaliannos (`node07.mp4`)

### 1. Tarina
> Heinolan vanhan apteekin kellarista löytyi latinankielinen rohdosresepti, jolla kappalainen yritti taltuttaa unettomuuttaan. Liian vahva seos oli kuitenkin hengenvaarallinen – reseptin roomalaisiin numeroihin on kätketty tarkka suhde, jolla tinktuura neutraloidaan turvalliseksi.

### 2. Veo 3.1 Prompt
```text
Cinematic 1888 apothecary mystery, 16:9, vaulted stone cellar of Apotheca Heinolaensis lit by green and amber glass lanterns. Close-up of antique apothecary scales, glass dropper bottles labeled in gold Latin script: "Tinctura Valerianae XVIII", "Extractum Menthae VIII", and "Spiritus Vini LXXXVIII%". An apothecary uses a glass pipette to drip dark herbal tincture into a glowing flask; the liquid turns from dark crimson to bright emerald green as the exact neutralizing ratio is reached. Audio: clinking glass vials, precise liquid drops falling into glass, gentle bubbling of a chemical reaction.
```

### 3. Tehtävä ja ratkaisu
- **Tehtävä pelissä:** Tulkitse latinankielisen reseptin roomalaiset numerot säätimiin ja laske vasta-aineluku.
- **Ratkaisulogiikka:**
  1. Säädä Valeriana = `XVIII` (`18 tippaa`), Mentha = `VIII` (`8 tippaa`) ja Spiritus Vini = `LXXXVIII` (`88 %`).
  2. Laske neutraloiva vasta-aineluku: $\text{LXXXVIII} - \text{XVIII} = 88 - 18 = 70$.
- **Purkukoodi:** `ROHDOS-70`

---

## NODE-08: Kutojan silmukkalasku & kirjoneule (`node08.mp4`)

### 1. Tarina
> Virkatalon keinutuolissa kudottiin syysiltoina krappipunaista ja pellavanvalkoista kirjoneulesukkaa. Sukkapuikkojen kilinän lomassa neuleen symmetriseen tähtikuvioon ja kantalapun kavennuksiin kätkettiin luku, joka piti salaisuuden tallessa sukupolvelta toiselle.

### 2. Veo 3.1 Prompt
```text
Cozy yet mysterious 1888 Finnish manor interior, 16:9, warm kerosene lamp light by a rain-splattered window. Close-up of skilled elderly hands knitting a traditional Nordic patterned wool sock on four wooden double-pointed needles using madder-red, natural linen-white, and golden yarn. Beside the yarn basket lies a handwritten 1888 knitting chart showing "4 x 16 stitches", a symmetrical star pattern, and heel decreases. The rocking chair moves gently in the shadows. Audio: soft rhythmic clicking of wooden knitting needles, gentle creak of a wooden rocking chair, purring fireplace.
```

### 3. Tehtävä ja ratkaisu
- **Tehtävä pelissä:** Täydennä symmetrinen kirjoneulerivi ja laske sukan aloitussilmukat sekä kantalapun silmukkamäärä.
- **Ratkaisulogiikka:**
  1. Valitse 7 silmukan symmetrisen mallikerran puuttuvaksi 5. silmukaksi `Krappipunainen`.
  2. Laske 4 puikon aloitussilmukat yhteensä: $4 \times 16 = 64\text{ silmukkaa}$.
  3. Nilkan kavennusten ($16 - 4 = 12\text{ s/puikko}$) jälkeen puikkojen I ja IV silmukat yhdistetään kantalappuun: $12 + 12 = 24\text{ silmukkaa}$.
- **Purkukoodi:** `SILMUKKA-24`

---

## NODE-09: Stunt-pyramidin tasapaino (`node09.mp4`)

### 1. Tarina
> Kirstun sisempi heilurilukko on rakennettu painovoiman ja horjumattoman tasapainon varaan – aivan kuten ihmispyramidi, jossa huipulla seisovan on pysyttävä täydellisessä keskipisteessä. Jos painopiste karkaa sivuun ennen kuin neljä sekuntia on täynnä, salpa lukittuu uudelleen.

### 2. Veo 3.1 Prompt
```text
Cinematic high-tension mechanical and acrobatic mystery, 16:9, dramatic golden spotlight in a dark timber hall. Extreme close-up of an ornate 1888 brass pendulum balance lock shaped like a human pyramid of acrobat figurines standing on a tilting equilibrium beam. As the beam sways left and right, a glowing emerald green center zone illuminates when the top figure holds steady at dead center for four full ticks of a pocket watch. Audio: tense rhythmic ticking of a stopwatch (four distinct beats), creaking balance beam, resonant chime as the green lock engages.
```

### 3. Tehtävä ja ratkaisu
- **Tehtävä pelissä:** Pidä huojuntapalkin tasapaino vihreällä vakausvyöhykkeellä vasen/oikea-painikkeilla yhtäjaksoisesti 4,0 sekunnin ajan.
- **Purkukoodi:** `STUNT-VAKAUS`

---

## NODE-10: Pikselikirves ja Tappara (`node10.mp4`)

### 1. Tarina
> Jäätyneen järven selälle on piirtynyt sinioranssi reitti, jota vartioivat rautaiset puolustajat. Vain se, joka pujottelee jääkentän halki poimien matkalla kaikki kolme muinaista kirvestunnusta, pääsee nostamaan voittopokaalin ja lunastamaan kymmenennen sinetin.

### 2. Veo 3.1 Prompt
```text
Stylized cinematic fantasy-historical hybrid, 16:9, frozen twilight lake rink in Finland lit by glowing blue and fiery orange torches. Low-angle tracking shot gliding across crystal-clear black ice etched with a glowing grid. Three ancient double-bladed battle-axe emblems glow in blue and orange on the ice between dark iron defender obstacles, leading toward a gleaming silver championship chalice at the far end of the rink. Audio: crisp sound of skate blades carving ice, crackling torch fire, triumphant metallic ring.
```

### 3. Tehtävä ja ratkaisu
- **Tehtävä pelissä:** Luistele $4 \times 4$-jääruudukossa aloitusympyrästä (`0,0`) pokaalille (`3,3`) vierekkäisiä ruutuja pitkin väistäen puolustajat (`🛑`) ja keräten kaikki 3 kirvesmerkkiä (`🪓`).
- **Purkukoodi:** `KIRVES-CHAMP`

---

## NODE-11: Kuraiset jäljet ja lätäköt (`node11.mp4`)

### 1. Tarina
> Lokakuun sade on jättänyt Värilän virkatalon pihamaalle ja kuistin eteen syviä kuralätäköitä. Pienet saappaat ovat loikkineet riemukkaasti lätäköstä toiseen jättäen kuivat porraskivet kokonaan väliin – viimeinen sinetti aukeaa, kun hyppäät jokaiseen lätäkköön ja lasket niiden määrän!

### 2. Veo 3.1 Prompt
```text
Charming yet mysterious autumn twilight scene at an 1888 Finnish wooden manor courtyard, 16:9, golden lantern light reflecting in rainwater. Low camera angle following a trail of small muddy rainboots cheerfully splashing from one muddy puddle to the next across the gravel yard, carefully skipping over dry stepping stones toward the porch where an ancient iron-bound chest awaits. Seven distinct concentric ripples shimmer in the puddles under the lantern glow. Audio: playful splashing of boots jumping into muddy puddles, gentle autumn rain, joyful chime as the final puddle ripples.
```

### 3. Tehtävä ja ratkaisu
- **Tehtävä pelissä:** Klikkaa ja hyppää kaikkiin pihan vesilätäköihin (`💦`) kuivia kiviä välttäen ja syötä lätäköiden kokonaismäärä.
- **Ratkaisulogiikka:** Pihalla on 9 ruutua, joista 2 on kuivia kohtia ja **7** on kuralätäköitä.
- **Purkukoodi:** `7`

