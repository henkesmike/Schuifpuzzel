# De Staafpuzzel

Een platformonafhankelijke, Nederlandstalige schuifpuzzel. Geschreven in TypeScript, zonder UI-framework of runtimebibliotheken. Begrijpelijkheid gaat voor snelheid.

## Lokaal gebruiken

Installeer Node.js (22 of nieuwer), voer `npm ci` uit en daarna `npm test`. Met `npm run build` compileer je TypeScript naar `dist/js`. Serveer de map `dist` met een gewone webserver; bijvoorbeeld `python3 -m http.server 8080 --directory dist`. Open http://localhost:8080. Open index.html niet rechtstreeks als bestand, omdat modules en serviceworkers een webserver nodig hebben.

## Waar vind je wat?

- `src/model.ts`: gegevensmodellen, beginstand, afmetingen en validatie van het bord.
- `src/rules.ts`: legale zetten, gekoppelde blokken, overdrachten en einddoel. Geen browserafhankelijkheden.
- `src/board-view.ts`: tekent uitsluitend de toestand als schaalbare SVG.
- `src/geometry.ts`: gedeelde schermmaten van de staaf; de breedte blijft in iedere houder gelijk.
- `src/interaction.ts`: bepaalt op basis van richting of de staaf of het gekoppelde paar beweegt, onafhankelijk van het aangeraakte onderdeel.
- `src/drag-plan.ts`: alle bereikbare rustpunten, begrenzing en keuze van het dichtstbijzijnde vak.
- `src/board-motion.ts`: vloeiend slepen met muis/vinger en rustig landen, zonder tussentijds de bordtoestand te wijzigen.
- `src/sound.ts`: een zacht belletje via Web Audio en een bewaarde aan/uitvoorkeur.
- `src/storage.ts`: leest en bewaart een gecontroleerde toestand in lokale browseropslag.
- `src/app.ts`: verbindt bediening, regels en weergave; beheert de geschiedenis voor Terug.
- `dist/style.css`: kleuren, typografie en indeling voor verschillende schermen.
- `dist/sw.js` en `dist/manifest.webmanifest`: offlinecache en installatie als webapp.
- `test/rules.test.mjs`: betekenisvolle spelregeltests met Node's ingebouwde testfunctie.

## Het bord en de staaf

Coördinaten beginnen linksboven bij (0,0). Een blok bestaat uit één object, ook als het twee vakken beslaat. De vaste houders tellen als obstakels. De twee lege vakken worden afgeleid uit de bezetting en hoeven dus niet apart te worden bijgehouden.

De staaf heeft een eigen `support`: de beginhouder (`start`), eindhouder (`finish`) of de ID's van twee dragende blokken. Die blokken bewegen als groep. Een overdracht verandert alleen de drager van de staaf, nooit de posities van blokken. De enige passende mobiele paren zijn rechtsuitsparing + doorlopende uitsparing en doorlopende uitsparing + linksuitsparing. Overdracht naar de vaste houders heeft eigen expliciete voorwaarden.

Elke bediening vraagt eerst `legalMoves` op en geeft een gekozen zet aan `applyMove`. Deze controleert opnieuw of de zet mag en retourneert een nieuwe toestand. De bestaande toestand blijft intact voor Terug en voor tests. Tijdens een veeg volgt het geselecteerde onderdeel de vinger of muis, begrensd tot de vrije ruimte. Na een kleine aanloop wordt de bewegingsas vastgezet. Bij loslaten landt het op het dichtstbijzijnde geldige rustpunt, of keert het terug. Twee vakken verschuiven kan in één veeg; de geschiedenis bewaart de hele veeg als één actie. De zettenteller telt de afzonderlijke vakverplaatsingen. Bij pointercancel keert het onderdeel terug zonder een zet te doen. Muis, vinger en toetsen gebruiken dezelfde landingsanimatie. De voorkeur voor verminderde beweging wordt gerespecteerd.

## Opslag en offlinegebruik

Voortgang wordt per apparaat en browser opgeslagen; er is geen account of synchronisatie. De geschiedenis voor Terug geldt alleen tijdens de huidige sessie. Ongeldige opgeslagen gegevens leiden tot een nieuwe beginstand. Als opslag niet beschikbaar is blijft de puzzel speelbaar.

Voor installatie en offlinegebruik op een openbaar adres is HTTPS nodig. Op iPhone voeg je de pagina via Safari en het deelmenu toe aan het beginscherm. Offlinegebruik werkt na het eerste volledig geladen bezoek en is afhankelijk van browserondersteuning. De externe webfonts zijn optioneel: zonder netwerk gebruikt de app systeemlettertypen. Verhoog de cacheversie in `sw.js` bij toekomstige wijzigingen van de bestandenlijst.

## Ontwikkelafspraken

Houd functies klein en geef ze een concrete naam. Leg in commentaar vooral de spelregel of reden achter een keuze uit. Voeg nieuwe regels toe aan `rules.ts`, niet aan de bediening of het tekenen. Werk de bijbehorende tests bij. Controleer invoer uit opslag voordat deze als speltoestand wordt gebruikt. Gegenereerde bestanden in `dist/js` worden door de compiler overschreven.

## Uiterlijk en geluid

De stukken gebruiken transparante PNG-afbeeldingen met een smalle gepolijste rand en subtiele glans voor variant 3 (licht 3D). De bordachtergrond is egaal, zonder getekende vakjes. Er staan geen letters op het bord; een gouden ster markeert de onderste houder. Toegankelijke namen blijven beschikbaar voor hulptechnologie. De geluiden zijn korte sinustonen die pas na een gebruikersactie mogen starten. De knop Geluid bewaart de voorkeur. Er is geen achtergrondmuziek.

### Richting bepaalt de sleepintentie

Als de staaf op twee blokken ligt, leveren beide blokken en de staaf dezelfde bedieningsmogelijkheden op. Richting een passend derde blok of een vaste houder wordt alleen de staaf verplaatst. In een vrije richting schuift het hele paar met staaf. `interactionMoves` verzamelt deze mogelijkheden; `dragStops` rekent de bijbehorende rustpunten uit. `BoardMotion` verplaatst alleen de staaf bij een overdracht en herstelt alle tijdelijke posities wanneer de speler tijdens het slepen omkeert. De uiteindelijke zetten worden nog steeds door `applyMove` gecontroleerd.

## Ontdekken zonder uitleg

De spelersinterface toont alleen het bord, de zettenteller en Terug, Opnieuw en Geluid. Er zijn geen spelregels, hints, oefenstanden of richtingknoppen. De ster markeert de bestemming. Toetsenbordbediening blijft beschikbaar zonder mogelijke zetten op het scherm aan te wijzen.

Blokken die de staaf dragen zijn paars; andere mobiele blokken blijven turquoise. Een vaste houder is crème als hij leeg is en paars als de staaf erin ligt. De zichtbare rand ondersteunt dit kleurverschil. Bij selectie reageert het hele gekoppelde paar met de staaf, ook wanneer de staaf zelf wordt aangeraakt. Deze presentatie wordt rechtstreeks afgeleid van `State.support`, zodat terugzetten en opgeslagen spellen dezelfde kleurtoestand opleveren. De spelregels zijn niet veranderd.

## Afwerking van de blokjes

`dist/assets` bevat transparante afbeeldingen met een smalle gepolijste rand, een vlak midden en herkenbare reflecties. De aanraakvormen blijven schaalbare SVG-paden in `board-view.ts`; de afbeeldingen veranderen de spelregels of het slepen niet. Er zijn losse versies voor turquoise en paarse blokken, lege en bezette houders, en de staaf.

`scripts/render-assets.py` maakt deze afbeeldingen vooraf. Dit is een optionele ontwerpstap met Python, Pillow, NumPy en SciPy; de app zelf heeft deze pakketten niet nodig. Met `scripts/render-previews.py` kunnen de eerdere GIF-ontwerpstudies opnieuw worden gemaakt; deze zijn geen onderdeel van de spelbediening.

## Overwinningsanimatie

`src/victory.ts` verzorgt een circa vier seconden durende sterrenfontein op een transparant canvas boven de pagina. Drie korte uitbarstingen komen uit de eindhouder. De deeltjes blokkeren geen bediening. Animatieframes en timers worden opgeruimd bij herstarten, stoppen, schermformaatwissels en het verlaten van de tab. Bij verminderde beweging verschijnt alleen het bericht.

`sound.ts` speelt bij winst een kort majeurmotief, gevolgd door een zacht akkoord en twee hoge glinstertonen. De knop Geluid geldt ook voor deze beloning. Uitschakelen onderbreekt het geluid direct. Er is geen achtergrondmuziek.

## Afbeeldingen en snelle kleurwisselingen

`src/artwork.ts` laadt en decodeert de turquoise en paarse afbeeldingen voordat het bord bedienbaar wordt. Ook de nog onzichtbare kleuren staan daarna gereed. De serviceworker gebruikt voor `assets/` cache-eerst: een bewaarde afbeelding wordt direct getoond, zonder eerst op het netwerk te wachten. Nieuwe afbeeldingen vragen een nieuwe cacheversie. HTML en JavaScript blijven netwerk-eerst. De landingsanimatie blijft 190 milliseconden duren; daarna wordt de nieuwe koppeling getekend.

## Openbaar publiceren

De app werkt zonder aanmelding, serverdatabase of gekoppelde accounts. De gepubliceerde versie staat op https://staafpuzzel.blushcinch.chatgpt.site en is openbaar toegankelijk. Toegang en hosting staan los van deze repository. De broncodedownload is onderdeel van de site. De bestanden van het project mogen volgens de eigenaar openbaar gedeeld worden.

## Deze GitHub-export

Dit project staat in de submap `schuifpuzzel`. Voer de ontwikkelcommando’s vanuit die map uit. De broncode, tests, grafische bronbestanden en direct te serveren map `dist` zijn opgenomen. `node_modules`, de Sites-hostingconfiguratie, de dubbele broncode-zip en de eerdere GIF-voorbeelden zijn weggelaten. De broncodedownload op de bestaande website blijft beschikbaar.

## Aanklikgebied en richting

Een blok wordt over zijn volledige rechthoekige rastergebied geselecteerd, ook in een uitsparing of randmarge. De staaf is over zijn hele afbeeldingsgebied aanklikbaar; een bezette vaste houder is eveneens een aangrijppunt voor de staaf. Klikken in een lege uitsparing kan daardoor hetzelfde als klikken op het zichtbare materiaal.

Bij een gekoppeld paar bepalen bord en richting de actie, onafhankelijk van het aangeraakte onderdeel: als alleen de staaf kan worden doorgegeven gebeurt dat; anders schuift het paar met staaf als daar ruimte voor is; anders blijft alles staan. De vaste houders kunnen niet verschuiven. De SVG gebruikt aparte aanklikrechthoeken en visuele contouren, zodat een fraaiere afbeelding het aangrijpgebied niet kleiner maakt.
