# Pollenprognos för Chrome och Edge

Ett enkelt och användarvänligt webbläsartillägg som visar aktuella pollenprognoser direkt i din webbläsare. Få snabb tillgång till pollendata för olika regioner i Sverige och håll koll på pollennivåerna som påverkar dig.

Detta tillägg använder data från Naturhistoriska riksmuseets pollendatabas via deras officiella API. Naturhistoriska riksmuseet ansvarar för den svenska pollenmätningen och tillhandahåller dagliga pollenprognoser för olika regioner i Sverige.

![Pollenprognos Screenshot](image.png)

## Funktioner

- 🌍 Visa pollendata för alla regioner i Sverige
- 🎯 Välj och spara din favoritregion
- 🎨 Tydlig färgkodning av pollennivåer
- 💾 Sparar automatiskt dina inställningar
- 🔄 Uppdatera prognoser med ett klick

## Installation för användare

### Installation i Chrome

1. **Ladda ner filerna**
   - Klicka på den gröna "Code" knappen ovanför
   - Välj "Download ZIP"
   - Packa upp ZIP-filen till en mapp på din dator

2. **Installera i Chrome**
   - Öppna Chrome
   - Skriv in `chrome://extensions` i adressfältet och tryck Enter
   - Hitta omkopplaren "Utvecklarläge" i övre högra hörnet och slå på den
   - Klicka på knappen "Läs in okomprimerad" som dyker upp
   - Leta upp och välj mappen där du packade upp filerna
   - Klart! Du ska nu se ett blomikon i Chrome's tilläggsfält

### Installation i Edge

1. **Ladda ner filerna**
   - Klicka på den gröna "Code" knappen ovanför
   - Välj "Download ZIP"
   - Packa upp ZIP-filen till en mapp på din dator

2. **Installera i Edge**
   - Öppna Edge
   - Skriv in `edge://extensions` i adressfältet och tryck Enter
   - Hitta omkopplaren "Utvecklarläge" i vänstra sidofältet och slå på den
   - Klicka på knappen "Läs in uppackad" som dyker upp
   - Leta upp och välj mappen där du packade upp filerna
   - Klart! Du ska nu se ett blomikon i Edge's tilläggsfält

### Börja använda

Efter installation:
- Klicka på blomikonen i webbläsarens tilläggsfält för att öppna tillägget
- Välj din region i rullgardinsmenyn
- Klicka på "Hämta Prognos" för att se aktuella pollenhalter

## Felsökning

Om du inte ser tillägget efter installation:
1. Kontrollera att utvecklarläge är påslaget
2. Prova att stänga och öppna webbläsaren igen
3. Se till att alla filer packades upp korrekt

Om data inte laddas:
1. Kontrollera din internetanslutning
2. Klicka på uppdateringsknappen igen
3. Om problemet kvarstår, prova att avinstallera och installera om tillägget

### Vanliga problem i Chrome
- Om ikonen är gråmarkerad, prova att högerklicka och välja "Aktivera"
- Om tillägget inte syns i listan, säkerställ att du är i utvecklarläge

### Vanliga problem i Edge
- Om tillägget inte dyker upp efter installation, kontrollera att du valt rätt mapp
- Om du får felmeddelande vid installation, säkerställ att alla filer är på plats

## För utvecklare

För att bidra till projektet:
1. Forka detta repository
2. Skapa en feature branch (`git checkout -b ny-funktion`)
3. Commita dina ändringar (`git commit -am 'Lade till ny funktion'`)
4. Pusha till branchen (`git push origin ny-funktion`)
5. Skapa en Pull Request

### Utvecklingsnoteringar
- Tillägget är byggt med Manifest V3
- Använder modern JavaScript och Chrome/Edge Extension API:er
- Stödjer både Chrome och Edge genom Chromium-kompatibilitet

## Credits
- **API**: Data tillhandahålls av [Naturhistoriska riksmuseets Pollen API](https://api.pollenrapporten.se/docs)
- **Ikoner**: Väderikoner från [Meteocons Weather Icons](https://iconduck.com/sets/meteocons-weather-icons), licensierade under [MIT License](https://opensource.org/licenses/MIT)

## License
Detta projekt är licensierat under [MIT License](https://opensource.org/licenses/MIT).

## Support

Om du stöter på problem eller har förslag på förbättringar:
- Skapa ett ärende under "Issues" på GitHub
- Inkludera följande i din rapport:
  - Vilken webbläsare du använder (Chrome/Edge)
  - Webbläsarversion
  - Exakt beskrivning av problemet
  - Stegen för att återskapa problemet

## Version och uppdateringar

Nuvarande version: 1.1.0
- Stöd för både Chrome och Edge
- Förbättrad felhantering
- Automatisk regionssparning
- Bättre prestanda vid datahämtning

Kommande funktioner:
- Automatisk uppdatering av data
- Stöd för notifieringar
- Möjlighet att jämföra regioner
- Historikvy över pollenhalter