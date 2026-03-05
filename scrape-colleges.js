/**
 * Rough data scraper for college explorer (stage 1).
 *
 * This is a standalone Node script you can run manually:
 *   node scrape-colleges.js
 *
 * It fetches public data from Wikipedia's list of state universities and
 * writes a JSON file `colleges-scraped.json` in the project root.
 *
 * You can extend SOURCES to include more pages or swap to an official API.
 * Ratings (fun, salary, tuition, ranking) should still be curated by you.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SOURCES = [
  {
    url: 'https://en.wikipedia.org/wiki/List_of_state_universities_in_the_United_States',
    regionHint: null
  }
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        headers: {
          // Wikipedia (and many sites) block generic Node requests without a UA.
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      },
      res => {
        // Follow simple redirects if present.
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchPage(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Request failed ${res.statusCode} for ${url}`));
          return;
        }
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function parseStateUniversities(html) {
  // Very lightweight parser: look for list items that contain "University of" or "State University".
  const results = [];
  const liRegex = /<li>(.*?)<\/li>/gims;
  let match;
  while ((match = liRegex.exec(html)) !== null) {
    const raw = match[1];
    if (!/University|College/i.test(raw)) continue;
    const text = raw.replace(/<[^>]+>/g, '').replace(/\[[^\]]*]/g, '').trim();
    if (!text) continue;
    // e.g. "University of Texas at Austin – Austin, Texas"
    const parts = text.split(/–|-/, 2);
    const name = parts[0].trim();
    if (!name || name.length < 5) continue;
    if (results.some(r => r.name === name)) continue;

    let city = '';
    let state = '';
    if (parts[1]) {
      const loc = parts[1].split(',').map(s => s.trim());
      if (loc.length >= 2) {
        city = loc[0];
        state = loc[1].split(/\s+/).pop() || '';
      }
    }

    results.push({
      name,
      city,
      state,
      type: 'public',
      source: 'wikipedia_state_universities'
    });
  }
  return results;
}

async function main() {
  const all = [];
  for (const src of SOURCES) {
    console.log(`Fetching ${src.url}...`);
    try {
      const html = await fetchPage(src.url);
      const list = parseStateUniversities(html);
      console.log(`  Parsed ${list.length} entries`);
      all.push(...list);
    } catch (err) {
      console.error(`  Error for ${src.url}:`, err.message);
    }
  }

  // De‑duplicate by name.
  const deduped = [];
  const seen = new Set();
  for (const c of all) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    deduped.push(c);
  }

  const outPath = path.join(__dirname, 'colleges-scraped.json');
  fs.writeFileSync(outPath, JSON.stringify(deduped, null, 2), 'utf8');
  console.log(`Wrote ${deduped.length} colleges to ${outPath}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

