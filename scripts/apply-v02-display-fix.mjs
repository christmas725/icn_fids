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

  text = replaceOnce(
    text,
    `const PAGE_SIZE = 15;\nconst MAX_PAGES = 2;\nconst MAX_OPERATIONS = PAGE_SIZE * MAX_PAGES;`,
    `const DEFAULT_PAGE_SIZE = 14;\nconst LARGE_TABLET_PAGE_SIZE = 16;\nconst MAX_PAGES = 4;`,
    "board adaptive pagination constants"
  );

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

  text = replaceOnce(
    text,
    `  const [departedCache, setDepartedCache] = useState<Record<string, DepartedCacheEntry>>({});`,
    `  const [departedCache, setDepartedCache] = useState<Record<string, DepartedCacheEntry>>({});\n  const [isLargeTablet, setIsLargeTablet] = useState(false);`,
    "large tablet state"
  );

  const clockEffect = `  useEffect(() => {\n    setNow(new Date());\n    const timer = window.setInterval(() => setNow(new Date()), 1000);\n    return () => window.clearInterval(timer);\n  }, []);`;
  const clockAndTabletEffects = `${clockEffect}\n\n  useEffect(() => {\n    const query = window.matchMedia(\n      "(min-width: 1101px) and (max-width: 1700px) and (hover: none), (min-width: 1101px) and (max-width: 1700px) and (pointer: coarse), (min-width: 800px) and (max-width: 1100px) and (orientation: portrait) and (max-aspect-ratio: 3/4) and (hover: none), (min-width: 800px) and (max-width: 1100px) and (orientation: portrait) and (max-aspect-ratio: 3/4) and (pointer: coarse)"\n    );\n\n    const updateTabletMode = () => setIsLargeTablet(query.matches);\n    updateTabletMode();\n    query.addEventListener("change", updateTabletMode);\n    return () => query.removeEventListener("change", updateTabletMode);\n  }, []);`;
  text = replaceOnce(text, clockEffect, clockAndTabletEffects, "large tablet media detection");

  const oldGrouping = `  const groupedFlights = useMemo(\n    () => groupCodeshareFlights(filteredFlights).slice(0, MAX_OPERATIONS),\n    [filteredFlights]\n  );\n\n  // FIDS 한 화면 운용은 최대 2페이지(15편 × 2 = 30개 실제 운항)로 제한한다.\n  // 코드쉐어 행은 groupCodeshareFlights에서 하나의 실제 운항으로 계산된다.\n  const totalPages = Math.max(\n    1,\n    Math.min(MAX_PAGES, Math.ceil(groupedFlights.length / PAGE_SIZE))\n  );`;
  const newGrouping = `  const pageSize = isLargeTablet ? LARGE_TABLET_PAGE_SIZE : DEFAULT_PAGE_SIZE;\n  const maxOperations = pageSize * MAX_PAGES;\n\n  const groupedFlights = useMemo(\n    () => groupCodeshareFlights(filteredFlights).slice(0, maxOperations),\n    [filteredFlights, maxOperations]\n  );\n\n  // PC/모바일/폴드는 14행 × 4페이지, 대형 터치 태블릿은 가로/세로 모두 16행 × 4페이지로 표시한다.\n  // 코드쉐어 행은 groupCodeshareFlights에서 하나의 실제 운항으로 계산된다.\n  const totalPages = Math.max(\n    1,\n    Math.min(MAX_PAGES, Math.ceil(groupedFlights.length / pageSize))\n  );`;
  text = replaceOnce(text, oldGrouping, newGrouping, "adaptive grouped pagination");

  text = replaceOnce(
    text,
    `  }, [terminal]);`,
    `  }, [terminal, pageSize]);`,
    "pagination reset on page size change"
  );

  const oldPageSlice = `  const groupsOnPage = useMemo(() => {\n    const start = page * PAGE_SIZE;\n    return groupedFlights.slice(start, start + PAGE_SIZE);\n  }, [groupedFlights, page]);\n\n  // 마지막 페이지도 실제 FIDS처럼 항상 15행 높이를 유지한다.\n  // 실제 운항편이 부족한 만큼 빈 행을 채워 각 페이지의 행 크기가 동일하도록 한다.\n  const emptyRowCount = Math.max(0, PAGE_SIZE - groupsOnPage.length);`;
  const newPageSlice = `  const groupsOnPage = useMemo(() => {\n    const start = page * pageSize;\n    return groupedFlights.slice(start, start + pageSize);\n  }, [groupedFlights, page, pageSize]);\n\n  // 마지막 페이지도 현재 기기 행 수(기본 14행 / 대형 태블릿 16행)를 항상 유지한다.\n  // 실제 운항편이 부족한 만큼 빈 행을 채워 페이지별 행 높이를 동일하게 유지한다.\n  const emptyRowCount = Math.max(0, pageSize - groupsOnPage.length);`;
  text = replaceOnce(text, oldPageSlice, newPageSlice, "adaptive page slicing");

  fs.writeFileSync(path, text);
}

function patchRoute() {
  const path = "app/api/departures/route.ts";
  let text = fs.readFileSync(path, "utf8");

  const oldConstants = `// 최대 2페이지(페이지당 15편) 운용을 목표로 향후 운항편을 보강한다.\n// 화면에는 터미널별 최대 30개 실제 운항까지만 유지한다.\nconst DISPLAY_HORIZON_MINUTES = 8 * 60;\nconst TARGET_OPERATIONS_PER_TERMINAL = 30;`;
  const newConstants = `// 기본 화면은 14행 × 4페이지, 대형 태블릿은 16행 × 4페이지로 운용한다.\n// 서버는 가장 큰 화면 기준으로 T1/T2 각각 최대 64개 실제 운항을 확보한다.\n// 다른 기기는 클라이언트에서 56개까지만 사용한다.\nconst DISPLAY_HORIZON_MINUTES = 24 * 60;\nconst TARGET_OPERATIONS_PER_TERMINAL = 64;\nconst DEPARTED_GRACE_MS = 5 * 60 * 1000;`;
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
    .replace("각 터미널별 첫 30개 실제 운항 묶음", "각 터미널별 첫 64개 실제 운항 묶음")
    .replace("각 터미널별 첫 60개 실제 운항 묶음", "각 터미널별 첫 64개 실제 운항 묶음")
    .replace("각 터미널별 첫 56개 실제 운항 묶음", "각 터미널별 첫 64개 실제 운항 묶음")
    .replace("T1/T2 각각 최대 2페이지 분량", "T1/T2 각각 최대 4페이지 분량")
    .replace("미래 운항편을 상세 API에서 보강하되 최대 2페이지 분량으로 제한한다.", "미래 운항편을 상세 API에서 보강해 카테고리별 최대 4페이지 분량을 확보한다.")
    .replace("T1/T2 각각 최대 30운항(15편 × 2페이지)", "T1/T2 각각 최대 64운항(16편 × 4페이지)")
    .replace("T1/T2 각각 최대 60운항(15편 × 4페이지)", "T1/T2 각각 최대 64운항(16편 × 4페이지)")
    .replace("T1/T2 각각 최대 56운항(14편 × 4페이지)", "T1/T2 각각 최대 64운항(16편 × 4페이지)");

  fs.writeFileSync(path, text);
}

patchBoard();
patchRoute();
console.log("ICN FIDS v0.2 adaptive 14/16-row display fix applied");
