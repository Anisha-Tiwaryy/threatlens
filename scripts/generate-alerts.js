// Generates a deterministic synthetic threat-alert feed (no real companies, no real data).
// Seeded PRNG so every run and every test sees the same 600 alerts.
const fs = require("fs");
const path = require("path");

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const CATEGORIES = {
  "Leaked Credentials": { sources: ["Dark Web Forum", "Paste Site", "Stealer Log"], weight: [0.35, 0.4, 0.2, 0.05] },
  "Phishing Domain": { sources: ["Certificate Transparency Log", "Domain Registration Feed"], weight: [0.2, 0.45, 0.25, 0.1] },
  "Exposed Cloud Bucket": { sources: ["Internet Scan"], weight: [0.3, 0.35, 0.25, 0.1] },
  "Exposed AI Endpoint": { sources: ["Internet Scan", "Code Repository"], weight: [0.25, 0.4, 0.25, 0.1] },
  "Vulnerable Dependency": { sources: ["Code Repository", "Mobile App Store"], weight: [0.1, 0.3, 0.4, 0.2] },
  "Brand Impersonation": { sources: ["Social Media", "Mobile App Store"], weight: [0.05, 0.25, 0.45, 0.25] },
  "Hardcoded Secret": { sources: ["Code Repository", "Mobile App Store"], weight: [0.3, 0.4, 0.2, 0.1] },
};
const SEVERITIES = ["critical", "high", "medium", "low"];
const ASSETS = ["acme-bank.example", "portal.acme-bank.example", "api.acme-bank.example", "shop.northwind.example",
  "northwind.example", "cdn.northwind.example", "app.globex.example", "globex.example", "mail.globex.example"];

const TITLES = {
  "Leaked Credentials": (a) => `Employee credentials for ${a} found in combolist`,
  "Phishing Domain": (a) => `Look-alike domain registered targeting ${a}`,
  "Exposed Cloud Bucket": (a) => `Publicly readable storage bucket linked to ${a}`,
  "Exposed AI Endpoint": (a) => `Unauthenticated model inference endpoint on ${a}`,
  "Vulnerable Dependency": (a) => `Outdated library with known CVE served by ${a}`,
  "Brand Impersonation": (a) => `Fake support account impersonating ${a}`,
  "Hardcoded Secret": (a) => `API key hardcoded in public code referencing ${a}`,
};

function weighted(weights) {
  const r = rand();
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return SEVERITIES[i];
  }
  return SEVERITIES[SEVERITIES.length - 1];
}

const start = Date.UTC(2026, 7, 1); // 1 Aug 2026
const alerts = [];
for (let i = 0; i < 600; i++) {
  const category = pick(Object.keys(CATEGORIES));
  const cfg = CATEGORIES[category];
  const asset = pick(ASSETS);
  alerts.push({
    id: `ALR-${String(10001 + i)}`,
    title: TITLES[category](asset),
    category,
    severity: weighted(cfg.weight),
    source: pick(cfg.sources),
    asset,
    confidence: Math.round((0.45 + rand() * 0.55) * 100) / 100,
    detectedAt: new Date(start + Math.floor(rand() * 54 * 24 * 3600 * 1000)).toISOString(),
    status: "open",
    assignee: null,
  });
}
alerts.sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1));
fs.writeFileSync(path.join(__dirname, "..", "src", "data", "alerts.json"), JSON.stringify(alerts, null, 0));
console.log(`wrote ${alerts.length} alerts`);
