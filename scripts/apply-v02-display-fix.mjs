import fs from "node:fs";

function replaceOnce(text, oldValue, newValue, label) {
  if (text.includes(newValue)) return text;
  if (!text.includes(oldValue)) {
    throw new Error(`Patch marker not found: ${label}`);
  }
  return text.replace(oldValue, newValue);
}

function patchBoard() {
  const path = "components/FidsBoard.tsx";
  let text = fs.readFileSync(path, "utf8");

  text = replaceOnce(text, "const MAX_PAGES = 2;", "const MAX_PAGES = 4;", "board max pages");
  text = replaceOnce(
    text,
    'const DEPARTED_CACHE_KEY = "icn-fids-departed-grace-v1";',
    'const DEPARTED_CACHE_KEY = "icn-fids-departed-grace-v2";',
    "board cache version"
  );

  text = replaceOnce(
    text,
    "firstSeenAt: next[key]?.firstSeenAt ?? observedAt,",
    `firstSeenAt:\n                parseApiDateTime(flight.estimatedDateTime || flight.scheduleDateTime)?.getTime() ??\n                next[key]?.firstSeenAt ??\n                observedAt,`,
    "board departure timestamp"
  );

  const oldFilter = `      if (isDepartedStatus(flight.remark)) {\n        const entry = departedCache[flightRetentionKey(flight)];\n        // 방금 응답에서 처음 관측된 출발편은 캐시 state가 반영되기 전에도 표시한다.\n        if (entry && current - entry.firstSeenAt >= DEPARTED_GRACE_MS) return false;\n      }`;
  const newFilter = `      if (isDepartedStatus(flight.remark)) {\n        // 브라우저가 처음 본 시각이 아니라 공항이 제공한 변경 출발시각을 기준으로\n        // 5분까지만 표시한다. 새로 접속해도 오래된 출발편이 다시 살아나지 않는다.\n        const actualDeparture = parseApiDateTime(\n          flight.estimatedDateTime || flight.scheduleDateTime\n        )?.getTime();\n        if (\n          actualDeparture !== undefined &&\n          Number.isFinite(actualDeparture) &&\n          current >= actualDeparture + DEPARTED_GRACE_MS\n        ) {\n          return false;\n        }\n\n        const entry = departedCache[flightRetentionKey(flight)];\n        if (entry && current - entry.firstSeenAt >= DEPARTED_GRACE_MS) return false;\n      }`;
  text = replaceOnce(text, oldFilter, newFilter, "board departed filter");

  text = text
    .replace(
      "// FIDS 한 화면 운용은 최대 2페이지(15편 × 2 = 30개 실제 운항)로 제한한다.",
      "// 각 카테고리는 최대 4페이지(15편 × 4 = 60개 실제 운항)까지 표시한다."
    )
    .replace(
      "// FIDS 한 화면 운용은 최대 4페이지(15편 × 4 = 60개 실제 운항)로 제한한다.",
      "// 각 카테고리는 최대 4페이지(15편 × 4 = 60개 실제 운항)까지 표시한다."
    );

  fs.writeFileSync(path, text);
}

function patchRoute() {
  const path = "app/api/departures/route.ts";
  let text = fs.readFileSync(path, "utf8");

  const oldConstants = `// 최대 2페이지(페이지당 15편) 운용을 목표로 향후 운항편을 보강한다.\n// 화면에는 터미널별 최대 30개 실제 운항까지만 유지한다.\nconst DISPLAY_HORIZON_MINUTES = 8 * 60;\nconst TARGET_OPERATIONS_PER_TERMINAL = 30;`;
  const newConstants = `// 최대 4페이지(페이지당 15편) 운용을 목표로 향후 운항편을 보강한다.\n// T1/T2 각각 최대 60개 실제 운항을 확보해 전체/T1/T2 카테고리가\n// 독립적으로 마지막 페이지까지 순환할 수 있게 한다.\nconst DISPLAY_HORIZON_MINUTES = 24 * 60;\nconst TARGET_OPERATIONS_PER_TERMINAL = 60;\nconst DEPARTED_GRACE_MS = 5 * 60 * 1000;`;
  text = replaceOnce(text, oldConstants, newConstants, "route page constants");

  const oldRemove = `function removeDepartedFlights(flights: DepartureFlight[]) {\n  return flights.filter((flight) => !isDepartedRemark(flight.remark));\n}`;
  const newRemove = `function removeDepartedFlights(flights: DepartureFlight[], now = Date.now()) {\n  return flights.filter((flight) => {\n    if (!isDepartedRemark(flight.remark)) return true;\n\n    // 변경 출발시각(없으면 예정시각)을 실제 제거 기준으로 사용한다.\n    // 출발 상태는 그 시각부터 정확히 5분까지만 표출한다.\n    const departureAt = flightEpoch(\n      flight.estimatedDateTime || flight.scheduleDateTime\n    );\n    if (!Number.isFinite(departureAt)) return false;\n    return now < departureAt + DEPARTED_GRACE_MS;\n  });\n}`;
  text = replaceOnce(text, oldRemove, newRemove, "route departed filter function");

  const oldMain = `    // "출발" 상태도 브라우저에 전달한다. 클라이언트가 최초 관측 후 5분 동안 표시한 뒤 제거한다.\n\n    flights.sort(`;
  const newMain = `    // 서버에서도 변경/예정 출발시각 + 5분이 지난 출발편을 제거한다.\n    flights = removeDepartedFlights(flights);\n\n    flights.sort(`;
  text = replaceOnce(text, oldMain, newMain, "route main departed application");

  const oldFallback = `      // fallback에서도 "출발" 상태를 전달해 동일한 5분 유예 표시를 적용한다.\n      flights.sort(`;
  const newFallback = `      // fallback에서도 같은 출발 + 5분 기준을 적용한다.\n      flights = removeDepartedFlights(flights);\n      flights.sort(`;
  text = replaceOnce(text, oldFallback, newFallback, "route fallback departed application");

  text = text
    .replace("최대 2페이지 분량을 안정적으로 확보", "최대 4페이지 분량을 안정적으로 확보")
    .replace("8시간 범위가 자정을 넘으면", "24시간 범위가 자정을 넘으면")
    .replace("각 터미널별 첫 30개 실제 운항 묶음", "각 터미널별 첫 60개 실제 운항 묶음")
    .replace("T1/T2 각각 최대 2페이지 분량", "T1/T2 각각 최대 4페이지 분량")
    .replace("미래 운항편을 상세 API에서 보강하되 최대 2페이지 분량으로 제한한다.", "미래 운항편을 상세 API에서 보강해 카테고리별 최대 4페이지 분량을 확보한다.")
    .replace("T1/T2 각각 최대 30운항(15편 × 2페이지)", "T1/T2 각각 최대 60운항(15편 × 4페이지)");

  fs.writeFileSync(path, text);
}

patchBoard();
patchRoute();
console.log("ICN FIDS v0.2 display fix applied");
