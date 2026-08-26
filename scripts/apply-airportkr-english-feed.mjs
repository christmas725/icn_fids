import fs from "node:fs";

function replaceOnce(text, oldValue, newValue, label) {
  if (text.includes(newValue)) return text;
  if (!text.includes(oldValue)) {
    throw new Error(`airport.kr English patch marker not found: ${label}`);
  }
  return text.replace(oldValue, newValue);
}

const path = "app/api/departures/route.ts";
let text = fs.readFileSync(path, "utf8");

const mergeFunctionEnd = `function mergeHomepageLanguages(\n  korean: DepartureFlight[],\n  english: DepartureFlight[]\n) {\n  const enBuckets = new Map<string, DepartureFlight[]>();\n  for (const flight of english) {\n    const key = homepageMatchKey(flight);\n    const list = enBuckets.get(key) ?? [];\n    list.push(flight);\n    enBuckets.set(key, list);\n  }\n\n  return korean.map((ko) => {\n    const key = homepageMatchKey(ko);\n    const candidates = enBuckets.get(key) ?? [];\n    const en = candidates.shift();\n    if (candidates.length === 0) enBuckets.delete(key);\n    else enBuckets.set(key, candidates);\n\n    return {\n      ...ko,\n      airportEnglish: en?.airport || undefined,\n      airlineEnglish: en?.airline || undefined,\n      remarkEnglish: en?.remark || undefined,\n    };\n  });\n}`;

const mergeFunctionWithHelpers = `${mergeFunctionEnd}\n\nfunction buildAirportKrEnglishDestinationMap(english: DepartureFlight[]) {\n  const map = new Map<string, string>();\n\n  for (const flight of english) {\n    const code = flight.airportCode.trim().toUpperCase();\n    const name = clean(flight.airport);\n    if (!code || !name || name === "-") continue;\n\n    // 같은 공항코드는 airport.kr 영문 피드 표기를 단일 기준으로 사용한다.\n    if (!map.has(code)) map.set(code, name);\n  }\n\n  return map;\n}\n\nfunction applyAirportKrEnglishDestinationMap(\n  flights: DepartureFlight[],\n  map: Map<string, string>\n) {\n  if (map.size === 0) return flights;\n\n  return flights.map((flight) => {\n    const code = flight.airportCode.trim().toUpperCase();\n    const official = map.get(code);\n    if (!official) return flight;\n\n    return {\n      ...flight,\n      airportEnglish: official,\n    };\n  });\n}`;

text = replaceOnce(
  text,
  mergeFunctionEnd,
  mergeFunctionWithHelpers,
  "airport.kr English helpers"
);

text = replaceOnce(
  text,
  `  const today = query.searchDate;\n\n  async function loadDetailSupport() {`,
  `  const today = query.searchDate;\n  let airportKrEnglishDestinations = new Map<string, string>();\n\n  async function loadDetailSupport() {`,
  "English destination map state"
);

text = replaceOnce(
  text,
  `    if (enResult.status === "fulfilled") {\n      flights = mergeHomepageLanguages(flights, enResult.value);\n      dataSources.push("airport.kr/ap_en");`,
  `    if (enResult.status === "fulfilled") {\n      airportKrEnglishDestinations = buildAirportKrEnglishDestinationMap(enResult.value);\n      flights = mergeHomepageLanguages(flights, enResult.value);\n      flights = applyAirportKrEnglishDestinationMap(\n        flights,\n        airportKrEnglishDestinations\n      );\n      dataSources.push("airport.kr/ap_en");`,
  "build destination map from airport.kr English"
);

const beforeServerDepartureFilter = `    // 서버에서도 변경/예정 출발시각 + 5분이 지난 출발편을 제거한다.\n    flights = removeDepartedFlights(flights);`;
const withEnglishNormalization = `    // 상세 OpenAPI로 보강된 미래편에도 현재 airport.kr 영문 피드의\n    // 공항코드별 공식 표기를 동일하게 적용한다.\n    flights = applyAirportKrEnglishDestinationMap(\n      flights,\n      airportKrEnglishDestinations\n    );\n\n${beforeServerDepartureFilter}`;

text = replaceOnce(
  text,
  beforeServerDepartureFilter,
  withEnglishNormalization,
  "apply English map after detail merge"
);

fs.writeFileSync(path, text);
console.log("ICN FIDS airport.kr English destination normalization applied");
