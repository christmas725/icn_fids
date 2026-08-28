import fs from "node:fs";

function replaceOnce(text, oldValue, newValue, label) {
  if (text.includes(newValue)) return text;
  if (!text.includes(oldValue)) {
    throw new Error(`Destination patch marker not found: ${label}`);
  }
  return text.replace(oldValue, newValue);
}

function patchAirportNames() {
  const path = "lib/airportNames.ts";
  let text = fs.readFileSync(path, "utf8");

  text = replaceOnce(
    text,
    '  UBJ: "YAMAGUCHI/UBE",',
    '  UBJ: "YAMAGUCHI/UBE",\n  ISG: "ISHIGAKIJIMA",\n  KMI: "MIYAZAKI",\n  OKJ: "OKAYAMA",\n  SHI: "MIYAKOJIMA/SHIMOJISHIMA",',
    "Japan english names"
  );

  text = replaceOnce(
    text,
    '  DYG: "ZHANGJIAJIE",',
    '  DYG: "ZHANGJIAJIE",\n  HET: "HOHHOT",\n  YTY: "YANGZHOU/TAIZHOU",',
    "China english names"
  );

  text = replaceOnce(
    text,
    '  PNH: "PHNOM PENH",',
    '  PNH: "PHNOM PENH",\n  KTI: "PHNOM PENH/TECHO",',
    "KTI english name"
  );

  text = replaceOnce(
    text,
    '  PQC: "PHU QUOC",',
    '  PQC: "PHU QUOC",\n  HPH: "HAI PHONG",',
    "HPH english name"
  );

  text = replaceOnce(
    text,
    '  CRK: "CLARK",',
    '  CRK: "CLARK",\n  TAG: "BOHOL/PANGLAO",\n  KLO: "KALIBO",',
    "Philippines english names"
  );

  text = replaceOnce(
    text,
    '  DPS: "BALI/DENPASAR",',
    '  DPS: "BALI/DENPASAR",\n  MDC: "MANADO",',
    "MDC english name"
  );

  // airport.kr 영문 출발 피드에서 실제 사용하는 표기를 fallback 사전에도 맞춘다.
  text = replaceOnce(
    text,
    '  UBN: "ULAANBAATAR",',
    '  UBN: "NEW ULAANBAATAR",',
    "UBN airport.kr name"
  );
  text = replaceOnce(
    text,
    '  SGN: "HO CHI MINH CITY",',
    '  SGN: "HO CHI MINH",',
    "SGN airport.kr name"
  );
  text = replaceOnce(
    text,
    '  DAD: "DA NANG",',
    '  DAD: "DANANG",',
    "DAD airport.kr name"
  );
  text = replaceOnce(
    text,
    '  CXR: "NHA TRANG/CAM RANH",',
    '  CXR: "NHA TRANG",',
    "CXR airport.kr name"
  );
  text = replaceOnce(
    text,
    '  NGO: "NAGOYA/CHUBU",',
    '  NGO: "NAGOYA",',
    "NGO airport.kr name"
  );
  text = replaceOnce(
    text,
    '  CTS: "SAPPORO/NEW CHITOSE",',
    '  CTS: "SAPPORO",',
    "CTS airport.kr name"
  );
  text = replaceOnce(
    text,
    '  OKA: "OKINAWA/NAHA",',
    '  OKA: "OKINAWA",',
    "OKA airport.kr name"
  );
  text = replaceOnce(
    text,
    '  KIX: "OSAKA/KANSAI",',
    '  KIX: "OSAKA/ KANSAI",',
    "KIX airport.kr name"
  );
  text = replaceOnce(
    text,
    '  XIY: "XI\'AN",',
    '  XIY: "XIAN",',
    "XIY airport.kr name"
  );
  text = replaceOnce(
    text,
    '  TPE: "TAIPEI/TAOYUAN",',
    '  TPE: "TAIPEI",',
    "TPE airport.kr name"
  );
  text = replaceOnce(
    text,
    '  BKK: "BANGKOK/SUVARNABHUMI",',
    '  BKK: "BANGKOK",',
    "BKK airport.kr name"
  );
  text = replaceOnce(
    text,
    '  SEA: "SEATTLE",',
    '  SEA: "SEATTLE/TACOMA",',
    "SEA airport.kr name"
  );
  text = replaceOnce(
    text,
    '  JFK: "NEW YORK/JFK",',
    '  JFK: "NEW YORK",',
    "JFK airport.kr name"
  );
  text = replaceOnce(
    text,
    '  PUS: "BUSAN/GIMHAE",',
    '  PUS: "GIMHAE",\n  TAE: "DAEGU",',
    "Korea airport.kr names"
  );
  text = replaceOnce(
    text,
    '  LAS: "LAS VEGAS",',
    '  LAS: "LAS VEGAS",\n  SLC: "SALT LAKE CITY",\n  DTW: "DETROIT",',
    "US airport.kr names"
  );

  text = replaceOnce(
    text,
    '  // 아직 사전에 없는 신규 취항지는 코드라도 틀리지 않게 표시한다.\n  return code || koreanName || "-";',
    '  // 신규 취항지가 사전에 없더라도 3자리 IATA 코드만 목적지명으로 표시하지 않는다.\n  // 번역 데이터가 아직 없으면 원본 공항명을 유지하고, IATA 코드는 별도 보조 줄에만 표시한다.\n  return koreanName || "-";',
    "english destination fallback"
  );

  fs.writeFileSync(path, text);
}

function patchDestinationLocales() {
  const path = "lib/destinationLocales.ts";
  let text = fs.readFileSync(path, "utf8");

  text = replaceOnce(
    text,
    'assign("ko", ["CJU", "PUS"]);',
    'assign("ko", ["CJU", "PUS", "TAE"]);',
    "Korea locales"
  );

  text = replaceOnce(
    text,
    '"YGJ","TKS","UBJ"]);',
    '"YGJ","TKS","UBJ","ISG","KMI","OKJ","SHI"]);',
    "Japan locales"
  );

  text = replaceOnce(
    text,
    'assign("en", ["SIN","LHR","LGW","LAX","SFO","SEA","JFK","EWR","IAD","BOS","ORD","DFW","ATL","LAS","HNL","YVR","YYZ","SYD","MEL","BNE","AKL","GUM","SPN","ROR"]);',
    'assign("en", ["SIN","LHR","LGW","LAX","SFO","SEA","JFK","EWR","IAD","BOS","ORD","DFW","ATL","LAS","SLC","DTW","HNL","YVR","YYZ","SYD","MEL","BNE","AKL","GUM","SPN","ROR"]);',
    "US locales"
  );

  text = replaceOnce(
    text,
    '"JJN","LJG","DYG"]);',
    '"JJN","LJG","DYG","YTY"]);',
    "YTY locale"
  );

  text = replaceOnce(
    text,
    'assign("vi", ["SGN","HAN","DAD","CXR","PQC"]);',
    'assign("vi", ["SGN","HAN","DAD","CXR","PQC","HPH"]);',
    "HPH locale"
  );

  text = replaceOnce(
    text,
    'assign("fil", ["MNL","CEB","CRK","TAG"]);',
    'assign("fil", ["MNL","CEB","CRK","TAG","KLO"]);',
    "KLO locale"
  );

  text = replaceOnce(
    text,
    'assign("id", ["CGK","DPS"]);',
    'assign("id", ["CGK","DPS","MDC"]);',
    "MDC locale"
  );

  text = replaceOnce(
    text,
    'assign("km", ["PNH","SAI"]);',
    'assign("km", ["PNH","KTI","SAI"]);',
    "KTI locale"
  );

  // 현지어 표기도 airport.kr 영문 표기와 같은 장소 범위로 맞춘다.
  text = replaceOnce(
    text,
    'CJU:"제주", PUS:"부산/김해",',
    'CJU:"제주", PUS:"김해", TAE:"대구",',
    "Korea local names"
  );

  text = replaceOnce(
    text,
    'NRT:"東京/成田", HND:"東京/羽田", KIX:"大阪/関西", ITM:"大阪/伊丹", FUK:"福岡", CTS:"札幌/新千歳", NGO:"名古屋/中部", OKA:"沖縄/那覇",',
    'NRT:"東京/成田", HND:"東京/羽田", KIX:"大阪/関西", ITM:"大阪/伊丹", FUK:"福岡", CTS:"札幌", NGO:"名古屋", OKA:"沖縄",',
    "Japan scope alignment"
  );

  text = replaceOnce(
    text,
    'TKS:"徳島", UBJ:"山口宇部",',
    'TKS:"徳島", UBJ:"山口宇部", ISG:"石垣島", KMI:"宮崎", OKJ:"岡山", SHI:"宮古島/下地島",',
    "Japan local names"
  );

  text = replaceOnce(
    text,
    'HKG:"香港", MFM:"澳門", TPE:"臺北/桃園", TSA:',
    'HKG:"香港", MFM:"澳門", TPE:"臺北", TSA:',
    "TPE local scope"
  );

  text = replaceOnce(
    text,
    'BKK:"กรุงเทพฯ/สุวรรณภูมิ", DMK:',
    'BKK:"กรุงเทพฯ", DMK:',
    "BKK local scope"
  );

  text = replaceOnce(
    text,
    'JJN:"泉州/晋江", LJG:"丽江", DYG:"张家界",',
    'JJN:"泉州/晋江", LJG:"丽江", DYG:"张家界", YTY:"扬州/泰州",',
    "YTY local name"
  );

  text = replaceOnce(
    text,
    'SGN:"THÀNH PHỐ HỒ CHÍ MINH", HAN:"HÀ NỘI", DAD:"ĐÀ NẴNG", CXR:"NHA TRANG/CAM RANH", PQC:"PHÚ QUỐC",',
    'SGN:"THÀNH PHỐ HỒ CHÍ MINH", HAN:"HÀ NỘI", DAD:"ĐÀ NẴNG", CXR:"NHA TRANG", PQC:"PHÚ QUỐC", HPH:"HẢI PHÒNG",',
    "Vietnam local names"
  );

  text = replaceOnce(
    text,
    'MNL:"MAYNILA", CEB:"CEBU", CRK:"CLARK", TAG:"BOHOL/PANGLAO", CGK:',
    'MNL:"MAYNILA", CEB:"CEBU", CRK:"CLARK", TAG:"BOHOL/PANGLAO", KLO:"KALIBO", CGK:',
    "KLO local name"
  );

  text = replaceOnce(
    text,
    'CGK:"JAKARTA", DPS:"BALI/DENPASAR", BWN:',
    'CGK:"JAKARTA", DPS:"BALI/DENPASAR", MDC:"MANADO", BWN:',
    "MDC local name"
  );

  text = replaceOnce(
    text,
    'VTE:"ວຽງຈັນ", LPQ:"ຫຼວງພະບາງ", PNH:"ភ្នំពេញ", SAI:',
    'VTE:"ວຽງຈັນ", LPQ:"ຫຼວງພະບາງ", PNH:"ភ្នំពេញ", KTI:"ភ្នំពេញ/តេជោ", SAI:',
    "KTI local name"
  );

  text = replaceOnce(
    text,
    'LAX:"LOS ANGELES", SFO:"SAN FRANCISCO", SEA:"SEATTLE", JFK:"NEW YORK/JFK",',
    'LAX:"LOS ANGELES", SFO:"SAN FRANCISCO", SEA:"SEATTLE/TACOMA", DTW:"DETROIT", JFK:"NEW YORK",',
    "North America local scope"
  );

  text = replaceOnce(
    text,
    '  return LOCAL_DESTINATION[code] ?? (englishFallback || code || "-");',
    '  const fallback = englishFallback.trim();\n  // 목적지명 자리에 IATA 코드 자체가 단독으로 들어오는 것은 허용하지 않는다.\n  return LOCAL_DESTINATION[code] ?? (fallback && fallback.toUpperCase() !== code ? fallback : "-");',
    "local destination fallback"
  );

  fs.writeFileSync(path, text);
}

patchAirportNames();
patchDestinationLocales();
console.log("ICN FIDS destination language fix applied");
