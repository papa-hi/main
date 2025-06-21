import { db } from "./server/db";
import { places } from "./shared/schema";

const placesData = [
  { name: "Speeltuin", address: "Zittardsestraat 31, 5507 KR Veldhoven", type: "playground", lat: "51.4195", lon: "5.4036" },
  { name: "Oerrr natuurspeeltuin", address: "Van Tienhovenlaan 4, 5062 SK Oisterwijk", type: "playground", lat: "51.5781", lon: "5.1889" },
  { name: "Speeltuin", address: "Sint Bonifaciuslaan 83, 5643 RS Eindhoven", type: "playground", lat: "51.4416", lon: "5.4697" },
  { name: "Speeltuin de Klimbim", address: "Eikenlaan 11, 5581 VC Waalre", type: "playground", lat: "51.3889", lon: "5.4533" },
  { name: "Natuurspeeltuin", address: "Kanterseveldenweg, 5681 PG Best", type: "playground", lat: "51.5072", lon: "5.3903" },
  { name: "Speelpark de Splinter", address: "2, Rode Kruislaan, 5628 GM Eindhoven", type: "playground", lat: "51.4581", lon: "5.4539" },
  { name: "Speeltuinvereniging Philipsdorp", address: "Anthony van Leeuwenhoeklaan 30, 5612 PB Eindhoven", type: "playground", lat: "51.4344", lon: "5.4692" },
  { name: "Speeltuin st. Trudo", address: "Schoenerstraat 10A, 5616 KE Eindhoven", type: "playground", lat: "51.4269", lon: "5.4739" },
  { name: "Speeltuinvereniging St. Joseph", address: "Sint Josephlaan 1, 5642 HA Eindhoven", type: "playground", lat: "51.4444", lon: "5.4767" },
  { name: "Speeltuin 't Genieten' (In- en Outdoor)", address: "Roestelbergseweg 3, 5171 RL Kaatsheuvel", type: "playground", lat: "51.6597", lon: "5.0389" },
  { name: "Splesj", address: "Oude Antwerpsepostbaan 81B, 4741 SG Hoeven", type: "playground", lat: "51.5847", lon: "4.5631" },
  { name: "Vrouwenhof speeltuin en pannenkoekenrestaurant", address: "Vrouwenhoflaan 3, 4701 EJ Roosendaal", type: "playground", lat: "51.5308", lon: "4.4650" },
  { name: "Playground De Kievit", address: "Kerkstraat 10, 5671 GP Nuenen", type: "playground", lat: "51.4703", lon: "5.5492" },
  { name: "Restaurant Charlie Schaijk", address: "Hermanusweg 4, 5374 RW Schaijk", type: "restaurant", lat: "51.7428", lon: "5.6361" },
  { name: "Het Gouden Woud B.V.", address: "Hamsestraat 18, 5298 NA Liempde", type: "playground", lat: "51.5650", lon: "5.3781" },
  { name: "Geenhoven playground", address: "Hoppenbrouwers 15, 5552 SB Valkenswaard", type: "playground", lat: "51.3508", lon: "5.4608" },
  { name: "Playground Elckerlyc", address: "Anna van Schuurmanstraat 604, 5344 TX Oss", type: "playground", lat: "51.7656", lon: "5.5178" },
  { name: "Docus de Das Avonturenpad", address: "RK, Udensedreef, 5374 RD Schaijk", type: "playground", lat: "51.7425", lon: "5.6364" },
  { name: "Hullie in Uden", address: "Canadasweg 3A, 5406 TS Uden", type: "playground", lat: "51.6606", lon: "5.6203" },
  { name: "Speeltuin De Woeste Weide", address: "Burg. Feitsmapark 1, 3362 BZ Sliedrecht", type: "playground", lat: "51.8200", lon: "4.7753" },
  { name: "Kienehoef park", address: "Klothal 1, 5491 LR Sint-Oedenrode", type: "playground", lat: "51.5667", lon: "5.4600" },
  { name: "Natuurspeelpark Deken van Miert", address: "Unnamed Road, 5462 CR Veghel", type: "playground", lat: "51.6156", lon: "5.5369" },
  { name: "Natuurspeeltuin De Zwarte Molen Nistelrode", address: "Baansteen 10, 5388 DB Nistelrode", type: "playground", lat: "51.6925", lon: "5.5642" },
  { name: "Speelbos Herperduin", address: "Schaijkseweg 10, 5373 KL Herpen", type: "playground", lat: "51.7781", lon: "5.6703" },
  { name: "Natuurspeeltuin", address: "Het Oliemeulen 1, 5374 HX Schaijk", type: "playground", lat: "51.7422", lon: "5.6358" },
  { name: "Speelbos Uden", address: "Bosdreef, 5406 VW Uden", type: "playground", lat: "51.6603", lon: "5.6200" },
  { name: "Nature Playground Sint-Michielsgestel", address: "Meanderplein 1, 5271 GC Sint-Michielsgestel", type: "playground", lat: "51.6417", lon: "5.3500" },
  { name: "Stichting Speelbos Bladel", address: "Egyptischedijk 15, 5531 NE Bladel", type: "playground", lat: "51.3700", lon: "5.2186" },
  { name: "Houten Speeltuin Eendenmeer", address: "Ceresweg 13, 5854 PK Bergen", type: "playground", lat: "51.6053", lon: "6.0328" },
  { name: "De Bosspeeltuin", address: "Uilenboslaan 2, 3451 GB Utrecht", type: "playground", lat: "52.0908", lon: "5.1200" },
  { name: "Avonturenhof", address: "Miggelenbergweg 65, 7351 BP Hoenderloo", type: "playground", lat: "52.1000", lon: "5.9000" },
  { name: "Boscafé de Beken", address: "Nieuwe Keijenbergseweg 174, 6871 VZ Renkum", type: "restaurant", lat: "51.9806", lon: "5.7344" },
  { name: "WOODZ", address: "Bovenallee 1, 6881 AJ Velp", type: "restaurant", lat: "52.0000", lon: "5.9700" },
  { name: "Spelderveld", address: "Elderhofseweg 28, 6843 NH Arnhem", type: "playground", lat: "51.9800", lon: "5.9100" },
  { name: "Speelbos De Schuytgraaf", address: "Marasingel 19, 6846 DX Arnhem", type: "playground", lat: "51.9900", lon: "5.9200" },
  { name: "Waterrad", address: "Notenlaantje Park Lingezegen, De Park 10, 6661 NW Elst", type: "playground", lat: "51.9164", lon: "5.8425" },
  { name: "Waterspeeltuin", address: "Hegdambroek 1325, 6546 ED Nijmegen", type: "playground", lat: "51.8128", lon: "5.8372" },
  { name: "Speeltuin met waterpomp", address: "Burgemeester Raijmakerslaan 36, 5361 KE Grave", type: "playground", lat: "51.7589", lon: "5.7392" },
  { name: "Waterspeeltuin aan het badstrand", address: "Kerkeveld 6, 5437 BH Beers", type: "playground", lat: "51.7200", lon: "5.8300" },
  { name: "Speeltuin De Bucht", address: "Buchtdwarsstraat 17d, 5571 CS Bergeijk", type: "playground", lat: "51.3200", lon: "5.3600" },
  { name: "Waterspeeltuin", address: "Akkerwinde 67, 5374 DH Schaijk", type: "playground", lat: "51.7419", lon: "5.6355" },
  { name: "Waterspeeltuin Stadspark Huizen", address: "Want 3, 1276 HC Huizen", type: "playground", lat: "52.2992", lon: "5.2403" },
  { name: "Waterspeeltuin Cronestein", address: "Kanaalweg 130, 2321 JZ Leiden", type: "playground", lat: "52.1601", lon: "4.4970" },
  { name: "Water playground Delftsehout", address: "Korftlaan 3A, 2616 LJ Delft", type: "playground", lat: "52.0116", lon: "4.3571" },
  { name: "Waterspeelzone speeltuin", address: "Leistertweg 2, 6088 NW Roggel", type: "playground", lat: "51.2542", lon: "5.9258" },
  { name: "Speeltuin Kitskensberg", address: "Oude Keulsebaan 150, 6045 GB Roermond", type: "playground", lat: "51.1942", lon: "5.9875" },
  { name: "Stichting Speeltuin de Paddestoel", address: "Florianstraat 3a, 6121 MA Born", type: "playground", lat: "50.9900", lon: "5.8100" },
  { name: "Speeltuin Hunsel", address: "Jacobusstraat 18, 6013 RK Hunsel", type: "playground", lat: "51.1300", lon: "5.8200" },
  { name: "Natuur en Milieucentrum De IJzeren Man", address: "Geurtsvenweg 4, 6006 SN Weert", type: "museum", lat: "51.2517", lon: "5.7047" },
  { name: "de Bosuil", address: "Bosuilstraat 4, 3910 Neerpelt, Belgium", type: "playground", lat: "51.2278", lon: "5.4408" },
  { name: "Natuurspeelpark", address: "IJsselsingel 103, 6991 ZR Rheden", type: "playground", lat: "52.0056", lon: "6.0306" },
  { name: "Speeltuin De Viking", address: "Speeltuinpad 2, 5666 TD Geldrop", type: "playground", lat: "51.4200", lon: "5.5600" },
  { name: "Brasserie Cis", address: "Eindhovenseweg 39, 5283 RA Boxtel", type: "restaurant", lat: "51.5906", lon: "5.3281" },
  { name: "Pukkemuk Dongen", address: "Vaartweg 192A, 5106 NG Dongen", type: "playground", lat: "51.6267", lon: "4.9383" },
  { name: "Uitspanning De Zeven Geitjes", address: "Reeshofdijk 18, 5044 VB Tilburg", type: "restaurant", lat: "51.5556", lon: "5.0639" },
  { name: "Zandziebar", address: "Valburgsestraat 45, 6677 PC Slijk-Ewijk", type: "playground", lat: "51.9000", lon: "5.8700" },
  { name: "Steinerbos", address: "Stadhouderslaan 220, 6171 KP Stein", type: "playground", lat: "50.9700", lon: "5.7600" },
  { name: "'t Kwekkeltje", address: "Sportlaan 14a, 5242 CR Rosmalen", type: "playground", lat: "51.7069", lon: "5.3628" },
  { name: "Foundation Playground \"Helmond-West\"", address: "Arbergstraat 85, 5707 TK Helmond", type: "playground", lat: "51.4819", lon: "5.6289" },
  { name: "Speeltuin Leonardus", address: "Monseigneur Swinkelsstraat 24, 5701 XM Helmond", type: "playground", lat: "51.4825", lon: "5.6556" },
  { name: "the Speuldries", address: "Rembrandt van Rijnstraat 5, 5753 BE Deurne", type: "playground", lat: "51.4600", lon: "5.7900" },
  { name: "The playground Rijpelroets", address: "Theo Driessenhof 75, 5709 BB Helmond", type: "playground", lat: "51.4825", lon: "5.6300" },
  { name: "Speeltuinvereniging Het Zonnehoekje", address: "Doctor Douvenstraat 13, 5421 JR Gemert", type: "playground", lat: "51.5550", lon: "5.6900" },
  { name: "Speeltuinvereniging \"Bijdorp\"", address: "Krelagehove 2, 2172 VE Sassenheim", type: "playground", lat: "52.2244", lon: "4.5206" },
  { name: "De Kievit Playground", address: "Wilgenlaan 5, 2651 TA Berkel en Rodenrijs", type: "playground", lat: "51.9800", lon: "4.4700" },
  { name: "Boscafé Molenvelden", address: "Banstraat 25, 5506 LA Veldhoven", type: "restaurant", lat: "51.4200", lon: "5.4000" },
  { name: "Eetcafe Zout", address: "Het Louwtje 10, 2691 KR 's-Gravenzande", type: "restaurant", lat: "52.0000", lon: "4.1600" },
  { name: "Plaswijckpark", address: "Ringdijk 20, 3054 KW Rotterdam", type: "playground", lat: "51.9244", lon: "4.4777" },
  { name: "Impuls Bouwspeelplaats Het Landje", address: "Staalmeesterslaan 197 A, 1057 NT Amsterdam", type: "playground", lat: "52.3676", lon: "4.8952" },
  { name: "Landschapspark met speeleiland", address: "Nieuwe Zeeweg, 2202 EG Noordwijk", type: "playground", lat: "52.2397", lon: "4.4486" },
  { name: "Speeltuinvereniging \"Vogelenwijk\"", address: "Nachtegaallaan 25, 2333 XT Leiden", type: "playground", lat: "52.1601", lon: "4.4970" },
  { name: "Jip En Janneke Speeltuin", address: "Baambruggestraat, 2546 SK Den Haag", type: "playground", lat: "52.0705", lon: "4.3007" },
  { name: "Water playground Trekvliet", address: "Trekweg 121, 2516 SB Den Haag", type: "playground", lat: "52.0705", lon: "4.3007" },
  { name: "BatensteinBuiten", address: "Van Helvoortlaan 40, 3443 AP Woerden", type: "playground", lat: "52.0856", lon: "4.8833" },
  { name: "Restaurant Café Soesterdal", address: "Verlengde Tempellaan 2, 3768 SB Soesterberg", type: "restaurant", lat: "52.1200", lon: "5.2900" },
  { name: "Restaurant Nationaal Militair Museum", address: "Verlengde Paltzerweg 1, 3768 MX Soest", type: "playground", lat: "52.1728", lon: "5.2914" },
  { name: "playground Westerkwartier", address: "Ten Katestraat 10-A, 2321 AW Leiden", type: "playground", lat: "52.1601", lon: "4.4970" }
];

function getRandomImage(type: string): string {
  const playgroundImages = [
    "/playground.png", "/playground2.png", "/playground3.png", "/playground4.png"
  ];
  const restaurantImages = [
    "/restaurant.png", "/restaurant1.png", "/restaurant2.png", "/restaurant3.png", "/restaurant4.png"
  ];
  const museumImages = [
    "/museum1.png", "/museum2.png", "/museum3.png", "/museum4.png"
  ];

  switch (type) {
    case "playground":
      return playgroundImages[Math.floor(Math.random() * playgroundImages.length)];
    case "restaurant":
      return restaurantImages[Math.floor(Math.random() * restaurantImages.length)];
    case "museum":
      return museumImages[Math.floor(Math.random() * museumImages.length)];
    default:
      return playgroundImages[0];
  }
}

async function importPlaces() {
  console.log("Starting import of places with water features...");
  
  let successCount = 0;
  let waterFeatureCount = 0;
  
  for (const place of placesData) {
    try {
      console.log(`Processing: ${place.name}`);
      
      // Determine if this place has water features based on name
      const hasWaterFeatures = place.name.toLowerCase().includes('water') || 
                              place.name.toLowerCase().includes('splash') ||
                              place.name.toLowerCase().includes('splesj') ||
                              place.address.toLowerCase().includes('water');
      
      if (hasWaterFeatures) {
        waterFeatureCount++;
      }
      
      // Insert into database
      await db.insert(places).values({
        name: place.name,
        type: place.type,
        description: hasWaterFeatures ? 
          `${place.name} features exciting water play areas for children to splash and play safely.` : 
          `Family-friendly ${place.type} offering great activities for children and families.`,
        address: place.address,
        latitude: place.lat,
        longitude: place.lon,
        imageUrl: getRandomImage(place.type),
        features: hasWaterFeatures ? 
          ['water_features', 'playground_equipment', 'family_friendly', 'safe_environment'] : 
          ['playground_equipment', 'family_friendly', 'safe_environment']
      });
      
      console.log(`✓ Added: ${place.name} ${hasWaterFeatures ? '(with water features)' : ''}`);
      successCount++;
      
    } catch (error) {
      console.error(`Failed to add ${place.name}:`, error);
    }
  }
  
  console.log(`\nImport completed successfully!`);
  console.log(`✓ Total places imported: ${successCount}`);
  console.log(`🌊 Places with water features: ${waterFeatureCount}`);
  console.log(`📍 Regular playgrounds: ${successCount - waterFeatureCount}`);
}

importPlaces().then(() => {
  console.log("Import process finished successfully");
  process.exit(0);
}).catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});