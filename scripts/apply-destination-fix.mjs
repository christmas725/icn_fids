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
    '  UBJ: "YAMAGUCHI/UBE",\n  SHI: "MIYAKOJIMA/SHIMOJISHIMA",',
    "SHI english name"
  );

  text = replaceOnce(
    text,
    '  DYG: "ZHANGJIAJIE",',
    '  DYG: "ZHANGJIAJIE",\n  HET: "HOHHOT",\n  YTY: "YANGZHOU/TAIZHOU",',
    "China english names"
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
    '"YGJ","TKS","UBJ"]);',
    '"YGJ","TKS","UBJ","SHI"]);',
    "SHI locale"
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
    'TKS:"徳島", UBJ:"山口宇部",',
    'TKS:"徳島", UBJ:"山口宇部", SHI:"宮古島/下地島",',
    "SHI local name"
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
    'SGN:"THÀNH PHỐ HỒ CHÍ MINH", HAN:"HÀ NỘI", DAD:"ĐÀ NẴNG", CXR:"NHA TRANG/CAM RANH", PQC:"PHÚ QUỐC", HPH:"HẢI PHÒNG",',
    "HPH local name"
  );

  text = replaceOnce(
    text,
    'MNL:"MAYNILA", CEB:"CEBU", CRK:"CLARK", TAG:"BOHOL/PANGLAO", CGK:',
    'MNL:"MAYNILA", CEB:"CEBU", CRK:"CLARK", TAG:"BOHOL/PANGLAO", KLO:"KALIBO", CGK:',
    "KLO local name"
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
