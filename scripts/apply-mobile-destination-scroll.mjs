import fs from "node:fs";

function replaceOnce(text, oldValue, newValue, label) {
  if (text.includes(newValue)) return text;
  if (!text.includes(oldValue)) {
    throw new Error(`Mobile destination patch marker not found: ${label}`);
  }
  return text.replace(oldValue, newValue);
}

const path = "components/FidsBoard.tsx";
let text = fs.readFileSync(path, "utf8");

text = replaceOnce(
  text,
  'import { destinationName } from "@/lib/airportNames";',
  'import { destinationName } from "@/lib/airportNames";\nimport SlidingDestination from "@/components/SlidingDestination";',
  "SlidingDestination import"
);

text = replaceOnce(
  text,
  "                    <strong>{destination}</strong>",
  "                    <SlidingDestination text={destination} direction={contentDirection} />",
  "destination component"
);

fs.writeFileSync(path, text);
console.log("ICN FIDS mobile destination slider applied");
