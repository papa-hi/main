import { db } from "./server/db";
import { places } from "./shared/schema";

const placesData = [
  { name: "Speeltuin", address: "Zittardsestraat 31, 5507 KR Veldhoven", type: "playground" },
  { name: "Oerrr natuurspeeltuin", address: "Van Tienhovenlaan 4, 5062 SK Oisterwijk", type: "playground" },
  { name: "Speeltuin", address: "Sint Bonifaciuslaan 83, 5643 RS Eindhoven", type: "playground" },
  { name: "Speeltuin de Klimbim", address: "Eikenlaan 11, 5581 VC Waalre", type: "playground" },
  { name: "Natuurspeeltuin", address: "Kanterseveldenweg, 5681 PG Best", type: "playground" },
  { name: "Speelpark de Splinter", address: "2, Rode Kruislaan, 5628 GM Eindhoven", type: "playground" },
  { name: "Speeltuinvereniging Philipsdorp", address: "Anthony van Leeuwenhoeklaan 30, 5612 PB Eindhoven", type: "playground" },
  { name: "Speeltuin st. Trudo", address: "Schoenerstraat 10A, 5616 KE Eindhoven", type: "playground" },
  { name: "Speeltuinvereniging St. Joseph", address: "Sint Josephlaan 1, 5642 HA Eindhoven", type: "playground" },
  { name: "Speeltuin 't Genieten' (In- en Outdoor)", address: "Roestelbergseweg 3, 5171 RL Kaatsheuvel", type: "playground" },
  { name: "Splesj", address: "Oude Antwerpsepostbaan 81B, 4741 SG Hoeven", type: "playground" },
  { name: "Vrouwenhof speeltuin en pannenkoekenrestaurant", address: "Vrouwenhoflaan 3, 4701 EJ Roosendaal", type: "playground" },
  { name: "Playground De Kievit", address: "Kerkstraat 10, 5671 GP Nuenen", type: "playground" },
  { name: "Restaurant Charlie Schaijk", address: "Hermanusweg 4, 5374 RW Schaijk", type: "restaurant" },
  { name: "Het Gouden Woud B.V.", address: "Hamsestraat 18, 5298 NA Liempde", type: "playground" },
  { name: "Geenhoven playground", address: "Hoppenbrouwers 15, 5552 SB Valkenswaard", type: "playground" },
  { name: "Playground Elckerlyc", address: "Anna van Schuurmanstraat 604, 5344 TX Oss", type: "playground" },
  { name: "Docus de Das Avonturenpad", address: "RK, Udensedreef, 5374 RD Schaijk", type: "playground" },
  { name: "Hullie in Uden", address: "Canadasweg 3A, 5406 TS Uden", type: "playground" },
  { name: "Speeltuin De Woeste Weide", address: "Burg. Feitsmapark 1, 3362 BZ Sliedrecht", type: "playground" },
  { name: "Kienehoef park", address: "Klothal 1, 5491 LR Sint-Oedenrode", type: "playground" },
  { name: "Natuurspeelpark Deken van Miert", address: "Unnamed Road, 5462 CR Veghel", type: "playground" },
  { name: "Natuurspeeltuin De Zwarte Molen Nistelrode", address: "Baansteen 10, 5388 DB Nistelrode", type: "playground" },
  { name: "Speelbos Herperduin", address: "Schaijkseweg 10, 5373 KL Herpen", type: "playground" },
  { name: "Natuurspeeltuin", address: "Het Oliemeulen 1, 5374 HX Schaijk", type: "playground" },
  { name: "Speelbos Uden", address: "Bosdreef, 5406 VW Uden", type: "playground" },
  { name: "Nature Playground Sint-Michielsgestel", address: "Meanderplein 1, 5271 GC Sint-Michielsgestel", type: "playground" },
  { name: "Stichting Speelbos Bladel", address: "Egyptischedijk 15, 5531 NE Bladel", type: "playground" },
  { name: "Houten Speeltuin Eendenmeer", address: "Ceresweg 13, 5854 PK Bergen", type: "playground" },
  { name: "De Bosspeeltuin", address: "Uilenboslaan 2, 3451 GB Utrecht", type: "playground" },
  { name: "Avonturenhof", address: "Miggelenbergweg 65, 7351 BP Hoenderloo", type: "playground" },
  { name: "Boscafé de Beken", address: "Nieuwe Keijenbergseweg 174, 6871 VZ Renkum", type: "restaurant" },
  { name: "WOODZ", address: "Bovenallee 1, 6881 AJ Velp", type: "restaurant" },
  { name: "Spelderveld", address: "Elderhofseweg 28, 6843 NH Arnhem", type: "playground" },
  { name: "Speelbos De Schuytgraaf", address: "Marasingel 19, 6846 DX Arnhem", type: "playground" },
  { name: "Waterrad", address: "Notenlaantje Park Lingezegen, De Park 10, 6661 NW Elst", type: "playground" },
  { name: "Waterspeeltuin", address: "Hegdambroek 1325, 6546 ED Nijmegen", type: "playground" },
  { name: "Speeltuin met waterpomp", address: "Burgemeester Raijmakerslaan 36, 5361 KE Grave", type: "playground" },
  { name: "Waterspeeltuin aan het badstrand", address: "Kerkeveld 6, 5437 BH Beers", type: "playground" },
  { name: "Speeltuin De Bucht", address: "Buchtdwarsstraat 17d, 5571 CS Bergeijk", type: "playground" },
  { name: "Waterspeeltuin", address: "Akkerwinde 67, 5374 DH Schaijk", type: "playground" },
  { name: "Waterspeeltuin Stadspark Huizen", address: "Want 3, 1276 HC Huizen", type: "playground" },
  { name: "Waterspeeltuin Cronestein", address: "Kanaalweg 130, 2321 JZ Leiden", type: "playground" },
  { name: "Water playground Delftsehout", address: "Korftlaan 3A, 2616 LJ Delft", type: "playground" },
  { name: "Waterspeelzone speeltuin", address: "Leistertweg 2, 6088 NW Roggel", type: "playground" },
  { name: "Speeltuin Kitskensberg", address: "Oude Keulsebaan 150, 6045 GB Roermond", type: "playground" },
  { name: "Stichting Speeltuin de Paddestoel", address: "Florianstraat 3a, 6121 MA Born", type: "playground" },
  { name: "Speeltuin Hunsel", address: "Jacobusstraat 18, 6013 RK Hunsel", type: "playground" },
  { name: "Natuur en Milieucentrum De IJzeren Man", address: "Geurtsvenweg 4, 6006 SN Weert", type: "museum" },
  { name: "de Bosuil", address: "Bosuilstraat 4, 3910 Neerpelt, Belgium", type: "playground" },
  { name: "Natuurspeelpark", address: "IJsselsingel 103, 6991 ZR Rheden", type: "playground" },
  { name: "Speeltuin De Viking", address: "Speeltuinpad 2, 5666 TD Geldrop", type: "playground" },
  { name: "Brasserie Cis", address: "Eindhovenseweg 39, 5283 RA Boxtel", type: "restaurant" },
  { name: "Pukkemuk Dongen", address: "Vaartweg 192A, 5106 NG Dongen", type: "playground" },
  { name: "Uitspanning De Zeven Geitjes", address: "Reeshofdijk 18, 5044 VB Tilburg", type: "restaurant" },
  { name: "Zandziebar", address: "Valburgsestraat 45, 6677 PC Slijk-Ewijk", type: "playground" },
  { name: "Steinerbos", address: "Stadhouderslaan 220, 6171 KP Stein", type: "playground" },
  { name: "'t Kwekkeltje", address: "Sportlaan 14a, 5242 CR Rosmalen", type: "playground" },
  { name: "Foundation Playground \"Helmond-West\"", address: "Arbergstraat 85, 5707 TK Helmond", type: "playground" },
  { name: "Speeltuin Leonardus", address: "Monseigneur Swinkelsstraat 24, 5701 XM Helmond", type: "playground" },
  { name: "the Speuldries", address: "Rembrandt van Rijnstraat 5, 5753 BE Deurne", type: "playground" },
  { name: "The playground Rijpelroets", address: "Theo Driessenhof 75, 5709 BB Helmond", type: "playground" },
  { name: "Speeltuinvereniging Het Zonnehoekje", address: "Doctor Douvenstraat 13, 5421 JR Gemert", type: "playground" },
  { name: "Speeltuinvereniging \"Bijdorp\"", address: "Krelagehove 2, 2172 VE Sassenheim", type: "playground" },
  { name: "De Kievit Playground", address: "Wilgenlaan 5, 2651 TA Berkel en Rodenrijs", type: "playground" },
  { name: "Boscafé Molenvelden", address: "Banstraat 25, 5506 LA Veldhoven", type: "restaurant" },
  { name: "Eetcafe Zout", address: "Het Louwtje 10, 2691 KR 's-Gravenzande", type: "restaurant" },
  { name: "Plaswijckpark", address: "Ringdijk 20, 3054 KW Rotterdam", type: "playground" },
  { name: "Impuls Bouwspeelplaats Het Landje", address: "Staalmeesterslaan 197 A, 1057 NT Amsterdam", type: "playground" },
  { name: "Landschapspark met speeleiland", address: "Nieuwe Zeeweg, 2202 EG Noordwijk", type: "playground" },
  { name: "Speeltuinvereniging \"Vogelenwijk\"", address: "Nachtegaallaan 25, 2333 XT Leiden", type: "playground" },
  { name: "Jip En Janneke Speeltuin", address: "Baambruggestraat, 2546 SK Den Haag", type: "playground" },
  { name: "Water playground Trekvliet", address: "Trekweg 121, 2516 SB Den Haag", type: "playground" },
  { name: "BatensteinBuiten", address: "Van Helvoortlaan 40, 3443 AP Woerden", type: "playground" },
  { name: "Restaurant Café Soesterdal", address: "Verlengde Tempellaan 2, 3768 SB Soesterberg", type: "restaurant" },
  { name: "Restaurant Nationaal Militair Museum", address: "Verlengde Paltzerweg 1, 3768 MX Soest", type: "playground" },
  { name: "playground Westerkwartier", address: "Ten Katestraat 10-A, 2321 AW Leiden", type: "playground" }
];

// Function to geocode address using Nominatim
async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address + ", Netherlands");
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      const latitude = parseFloat(data[0].lat);
      const longitude = parseFloat(data[0].lon);
      return { latitude, longitude };
    }
    return null;
  } catch (error) {
    console.error(`Failed to geocode address: ${address}`, error);
    return null;
  }
}

// Function to get random image based on type
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
  let failCount = 0;
  
  for (const place of placesData) {
    try {
      console.log(`Processing: ${place.name} - ${place.address}`);
      
      // Geocode the address
      const coordinates = await geocodeAddress(place.address);
      
      if (!coordinates) {
        console.warn(`Failed to geocode: ${place.address}`);
        failCount++;
        continue;
      }
      
      // Determine if this place has water features based on name
      const hasWaterFeatures = place.name.toLowerCase().includes('water') || 
                              place.name.toLowerCase().includes('splash') ||
                              place.name.toLowerCase().includes('splesj') ||
                              place.address.toLowerCase().includes('water');
      
      // Insert into database
      await db.insert(places).values({
        name: place.name,
        type: place.type,
        description: hasWaterFeatures ? `${place.name} features exciting water play areas for children.` : `Family-friendly ${place.type} in a great location.`,
        address: place.address,
        latitude: coordinates.latitude.toString(),
        longitude: coordinates.longitude.toString(),
        imageUrl: getRandomImage(place.type),
        features: hasWaterFeatures ? ['water_features', 'playground_equipment', 'family_friendly'] : ['playground_equipment', 'family_friendly']
      });
      
      console.log(`✓ Added: ${place.name} ${hasWaterFeatures ? '(with water features)' : ''}`);
      successCount++;
      
      // Add delay to respect geocoding rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Failed to add ${place.name}:`, error);
      failCount++;
    }
  }
  
  console.log(`\nImport completed!`);
  console.log(`✓ Successfully imported: ${successCount} places`);
  console.log(`✗ Failed to import: ${failCount} places`);
  console.log(`🌊 Water features enabled for applicable locations`);
}

importPlaces().then(() => {
  console.log("Import process finished");
  process.exit(0);
}).catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});