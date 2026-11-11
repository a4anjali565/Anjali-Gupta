import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'operational',
    service: 'Nepal Terai Rapid Flood Extent Mapping & Assessment',
    timestamp: new Date().toISOString(),
  });
});

// Gemini-powered SitRep and Assessment endpoint
app.post('/api/generate-sitrep', async (req, res) => {
  try {
    const {
      regionName,
      riverBasin,
      floodAreaKm2,
      affectedPopulation,
      displacedPopulation,
      submergedCropHa,
      damagedBuildings,
      waterGauges,
      embankmentBreached,
      rainfallSurgeMm,
      criticalSettlements,
      language = 'en',
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        fallback: true,
        report: generateHeuristicSitRep(req.body, language),
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are the Lead Disaster Management Officer & Satellite Hydrologist for the Nepal National Disaster Risk Reduction and Management Authority (NDRRMA / BIPAD) and ICIMOD.
Generate an official Humanitarian Situation Report (SitRep) and Rapid Impact Assessment for the Nepal Terai based on the following real-time Sentinel-1 SAR change detection and river telemetry:

- Target Terai Region/Districts: ${regionName || 'Nepal Terai (Koshi, Narayani, Karnali Basins)'}
- River Basin System: ${riverBasin || 'Saptakoshi & Kamala River Systems'}
- Total Detected Flood Inundation Extent: ${floodAreaKm2} sq km (derived from Sentinel-1 SAR backscatter threshold < -16.5 dB)
- Total Estimated Population Exposed: ${affectedPopulation?.toLocaleString()} people
- Displaced / marooned population in critical need: ${displacedPopulation?.toLocaleString()} people
- Inundated / damaged housing units: ${damagedBuildings?.toLocaleString()} structures (high concentration of mud/thatch kacchi dwellings)
- Submerged Agricultural Land (Paddy/Crops): ${submergedCropHa?.toLocaleString()} hectares
- Upstream 24-hr Monsoon Precipitation Surge: +${rainfallSurgeMm} mm
- Embankment Integrity: ${embankmentBreached ? 'CRITICAL BREACH DETECTED along river revetment' : 'Intact under heavy hydrostatic pressure'}
- Key River Gauges: ${JSON.stringify(waterGauges || [])}
- Most Critically Impacted Settlements: ${JSON.stringify(criticalSettlements || [])}
- Report Language: ${language === 'ne' ? 'Nepali (नेपाली - Devnagari script)' : 'English (formal humanitarian standard)'}

Structure the SitRep clearly with:
1. SITUATION OVERVIEW (Satellite sensor parameters, hydrological peak estimation, weather forecast)
2. SETTLEMENT & HUMANITARIAN IMPACT (Casualty prevention, vulnerable populations, drinking water tube-well contamination, shelter disruption)
3. INFRASTRUCTURE & LIFELINE DAMAGE (East-West Highway status, bridges, power grid, primary health posts)
4. IMMEDIATE OPERATIONAL RESPONSE PRIORITIES (Priority 1 immediate boat rescues, airdrop zones, WASH/water purification, emergency shelter)
5. RECOMMENDED EVACUATION CORRIDORS (Safe routes to Siwalik high ground / concrete designated schools)

Keep the report concise, authoritative, operationally precise, and structured with clean section headings. Avoid markdown fluff.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const reportText = response.text || '';

    return res.json({
      fallback: false,
      report: reportText,
    });
  } catch (error: any) {
    console.error('Error generating AI SitRep:', error);
    // Provide clean fallback so UI never fails
    return res.status(200).json({
      fallback: true,
      report: generateHeuristicSitRep(req.body, req.body.language || 'en'),
      error: error.message,
    });
  }
});

function generateHeuristicSitRep(data: any, lang: string = 'en') {
  const isNe = lang === 'ne';
  const region = data.regionName || 'Nepal Terai';
  const area = data.floodAreaKm2 || 420;
  const pop = (data.affectedPopulation || 185000).toLocaleString();
  const displaced = (data.displacedPopulation || 42000).toLocaleString();
  const crop = (data.submergedCropHa || 64000).toLocaleString();
  const houses = (data.damagedBuildings || 14800).toLocaleString();

  if (isNe) {
    return `नेपाल विपद् जोखिम न्यूनीकरण तथा व्यवस्थापन प्राधिकरण (NDRRMA)
आपतकालीन बाढी स्थिति प्रतिवेदन (SITREP-04) : तराई क्षेत्र

१. परिस्थिति अवलोकन (SITUATION OVERVIEW)
सेन्टिनेल-१ SAR भू-उपग्रह तथा जल तथा मौसम विज्ञान विभाग (DHM) को प्रत्यक्ष तथ्याङ्क अनुसार ${region} मा जलस्तर खतराको तहभन्दा माथि पुगेको छ। हालसम्म करिब ${area} वर्ग किलोमिटर जमिन जलमग्न भएको पाइएको छ। कोशी, नारायणी र कर्णाली बेसिनमा निरन्तर मनसुनी वर्षा भइरहेको छ।

२. बस्ती तथा जनजीवनमा प्रभाव (SETTLEMENT & HUMAN IMPACT)
- प्रभावित कुल जनसंख्या: करिब ${pop} नागरिक
- तत्काल उद्धार तथा सुरक्षित आश्रय आवश्यक विस्थापित: ${displaced}
- जलमग्न तथा क्षतिग्रस्त घरधुरी: ${houses} (विशेषगरी कच्ची माटो र खरका छाना भएका बस्तीहरू)
- डुबानमा परेको धानबाली तथा कृषि जमिन: ${crop} हेक्टर
- खानेपानीको मुख्य स्रोत (हाते चापाकल/ट्युबवेल) दूषित भएकाले हैजा तथा झाडापखालाको उच्च जोखिम।

३. यातायात तथा पूर्वाधार क्षति (INFRASTRUCTURE & LIFELINE DAMAGE)
- पूर्व-पश्चिम राजमार्ग तथा हुलाकी सडकका होचा खण्डहरू डुबानका कारण आंशिक अवरुद्ध।
- तल्लो भेगका स्वास्थ्य चौकी तथा प्राथमिक विद्यालयहरू जलमग्न।
- ग्रामीण विद्युतीकरण ट्रान्सफर्मरहरू सुरक्षाका लागि बन्द गरिएको।

४. तत्काल प्राथमिक उद्धार कार्यहरू (IMMEDIATE ACTION PRIORITIES)
- प्राथमिकता १: डुबानमा परेका वडा र गाउँहरूबाट रबर बोट र नेपाली सेना/सशस्त्र प्रहरी बल परिचालन गरी तत्काल उद्धार।
- प्राथमिकता २: शुद्ध पिउने पानीका लागि क्लोरिन ट्याब्लेट (Aquatabs) तथा जीवनजल वितरण।
- प्राथमिकता ३: उच्च बाँध र विद्यालय आश्रयस्थलहरूमा त्रिपाल र सुक्खा खाद्यान्न ढुवानी।

५. सुरक्षित निकास तथा आश्रयस्थल (SAFE EVACUATION ADVISORY)
- सर्वसाधारणलाई चुरे फेदीका अग्ला डाँडा तथा पक्की सामुदायिक भवनतर्फ स्थानान्तरण हुन अनुरोध छ।`;
  }

  return `NATIONAL DISASTER RISK REDUCTION AND MANAGEMENT AUTHORITY (NDRRMA)
RAPID FLOOD EXTENT & HUMANITARIAN SITUATION REPORT (SITREP-04)

1. SITUATION OVERVIEW & SATELLITE SENSING
Sentinel-1 SAR synthetic aperture radar change detection and DHM river gauge telemetry confirm severe riverine inundation across ${region}. Total flood extent has surpassed ${area} km² with persistent backscatter decrease (< -16.8 dB) indicating deep standing water. Upstream catchment areas in the Churia/Mahabharat ranges continue to discharge peak runoff.

2. SETTLEMENT & HUMANITARIAN IMPACT
- Total Population Exposed: ~${pop} individuals
- Displaced / Marooned Requiring Evacuation: ~${displaced} individuals
- Damaged / Inundated Residential Structures: ~${houses} units (predominantly traditional mud-brick and bamboo dwellings)
- Submerged Paddy & Farmland: ~${crop} hectares, severely jeopardizing monsoon harvest
- Public Health Risk: High contamination rate of shallow handpumps/tube-wells; acute need for WASH interventions to avoid waterborne disease outbreaks.

3. LIFELINE INFRASTRUCTURE DISRUPTION
- Hulaki Highway (Postal Road) and local access culverts breached at multiple low-lying sections.
- Primary Health Care Centers in downstream wards partially inundated; mobile medical teams deployed.
- Electrical substations isolated to prevent accidental electrocution in flooded wards.

4. IMMEDIATE OPERATIONAL RESPONSE PRIORITIES
- PRIORITY 1: Rapid search and rescue deployment of Armed Police Force (APF) and Nepal Army motorized boats to marooned settlements.
- PRIORITY 2: Emergency distribution of clean potable water, halogen/purification tablets (Aquatabs), and dry food rations (beaten rice/biscuits).
- PRIORITY 3: Allocation of heavy-duty tarpaulins, elevated family tents, and sanitary kits at designated municipal elevated schools.

5. EVACUATION & LOGISTICS CORRIDORS
- Evacuees are being redirected along East-West Highway elevated embankments towards higher-elevation schools and reinforced public halls in upper wards.`;
}

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Terai Flood Assessment Server running at http://localhost:${PORT}`);
  });
}

startServer();
