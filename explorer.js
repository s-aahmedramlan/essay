// College explorer powered by scraped data (colleges-scraped.json).
// Ratings are illustrative. Students should always confirm details with official sources.

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('college-search');
  const typeFilter = document.getElementById('explorer-type');
  const regionFilter = document.getElementById('explorer-region');
  const sortSelect = document.getElementById('explorer-sort');
  const resultsEl = document.getElementById('explorer-results');

  let colleges = [];

  const fallbackColleges = [
    {
      name: 'University of Texas at Austin',
      city: 'Austin',
      state: 'TX',
      region: 'south',
      type: 'public',
      fun: 92,
      salary: 88,
      tuition: 65,
      ranking: 15,
      img: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of Michigan',
      city: 'Ann Arbor',
      state: 'MI',
      region: 'midwest',
      type: 'public',
      fun: 90,
      salary: 90,
      tuition: 72,
      ranking: 7,
      img: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of California, Berkeley',
      city: 'Berkeley',
      state: 'CA',
      region: 'west',
      type: 'public',
      fun: 86,
      salary: 92,
      tuition: 70,
      ranking: 4,
      img: 'https://images.unsplash.com/photo-1541302216132-52942cd6ecb2?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of North Carolina at Chapel Hill',
      city: 'Chapel Hill',
      state: 'NC',
      region: 'south',
      type: 'public',
      fun: 85,
      salary: 86,
      tuition: 60,
      ranking: 20,
      img: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?auto=format&fit=crop&w=900&q=80'
    }
  ];

  const stateRegions = {
    ME: 'northeast',
    NH: 'northeast',
    VT: 'northeast',
    MA: 'northeast',
    RI: 'northeast',
    CT: 'northeast',
    NY: 'northeast',
    NJ: 'northeast',
    PA: 'northeast',
    DE: 'northeast',
    MD: 'south',
    DC: 'south',
    VA: 'south',
    WV: 'south',
    NC: 'south',
    SC: 'south',
    GA: 'south',
    FL: 'south',
    AL: 'south',
    MS: 'south',
    TN: 'south',
    KY: 'south',
    OH: 'midwest',
    MI: 'midwest',
    IN: 'midwest',
    IL: 'midwest',
    WI: 'midwest',
    MN: 'midwest',
    IA: 'midwest',
    MO: 'midwest',
    ND: 'midwest',
    SD: 'midwest',
    NE: 'midwest',
    KS: 'midwest',
    TX: 'south',
    OK: 'south',
    AR: 'south',
    LA: 'south',
    MT: 'west',
    WY: 'west',
    CO: 'west',
    NM: 'west',
    AZ: 'west',
    UT: 'west',
    NV: 'west',
    ID: 'west',
    WA: 'west',
    OR: 'west',
    CA: 'west',
    HI: 'west',
    AK: 'west'
  };

  function regionForState(state) {
    return stateRegions[state] || '';
  }

  function hashTo01(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return (h % 1000) / 1000;
  }

  function decorateCollege(raw) {
    const name = raw.name.trim();
    // Filter out description noise from Wikipedia scrape.
    if (!name || name.length < 4) return null;
    if (/community colleges|To see a list/i.test(name)) return null;

    const state = (raw.state || '').toUpperCase();
    const city = raw.city || '';
    const type = raw.type === 'private' ? 'private' : 'public';
    const region = regionForState(state);

    const base = hashTo01(name);
    const fun = Math.round(65 + 25 * base);
    const salary = Math.round(70 + 25 * (1 - base));
    const tuition = type === 'public' ? Math.round(50 + 25 * base) : Math.round(80 + 15 * base);
    const ranking = Math.max(5, Math.round(15 + 80 * (1 - base)));

    // Simple region-based stock photos; you can swap these to real campus photos later.
    const regionImages = {
      northeast:
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
      midwest:
        'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=900&q=80',
      south:
        'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?auto=format&fit=crop&w=900&q=80',
      west:
        'https://images.unsplash.com/photo-1541302216132-52942cd6ecb2?auto=format&fit=crop&w=900&q=80'
    };

    const img = regionImages[region] || regionImages.west;

    return {
      name,
      city,
      state,
      region,
      type,
      fun,
      salary,
      tuition,
      ranking,
      img
    };
  }

  function scoreToBar(value) {
    return Math.max(0, Math.min(100, value));
  }

  function tuitionLabel(v) {
    if (v >= 90) return '$$$$ (very high)';
    if (v >= 75) return '$$$ (high)';
    if (v >= 60) return '$$ (moderate)';
    return '$ (in-state friendly)';
  }

  function render() {
    let q = (searchInput?.value || '').toLowerCase().trim();
    const type = typeFilter?.value || '';
    const region = regionFilter?.value || '';
    const sortBy = sortSelect?.value || 'name';

    let filtered = colleges.filter(c => {
      if (type && c.type !== type) return false;
      if (region && c.region !== region) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'ranking') {
      filtered.sort((a, b) => a.ranking - b.ranking);
    } else if (sortBy === 'salary') {
      filtered.sort((a, b) => b.salary - a.salary);
    } else if (sortBy === 'fun') {
      filtered.sort((a, b) => b.fun - a.fun);
    }

    if (!resultsEl) return;
    resultsEl.innerHTML = '';

    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'builder-tagline';
      empty.textContent = 'No matches. Try fewer filters, or search by state or city.';
      resultsEl.appendChild(empty);
      return;
    }

    filtered.forEach(c => {
      const card = document.createElement('article');
      card.className = 'explorer-card';
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
        c.name + ' campus'
      )}`;
      card.innerHTML = `
        <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="explorer-card-link">
          <div class="explorer-image" style="background-image:url('${c.img}')">
            <div class="explorer-badge">${c.type === 'public' ? 'Public' : 'Private'} · ${c.state}</div>
          </div>
          <div class="explorer-body">
            <h3>${c.name}</h3>
            <p class="explorer-location">${c.city ? `${c.city}, ${c.state}` : c.state}</p>
            <div class="explorer-metrics">
              <div class="explorer-metric">
                <span>Fun</span>
                <div class="explorer-bar"><div style="width:${scoreToBar(c.fun)}%;"></div></div>
                <span class="explorer-label">${c.fun}/100</span>
              </div>
              <div class="explorer-metric">
                <span>Avg salary after grad</span>
                <div class="explorer-bar"><div style="width:${scoreToBar(c.salary)}%;"></div></div>
                <span class="explorer-label">${c.salary}/100</span>
              </div>
              <div class="explorer-metric">
                <span>Tuition price</span>
                <div class="explorer-bar tuition"><div style="width:${scoreToBar(
                  c.tuition
                )}%;"></div></div>
                <span class="explorer-label">${tuitionLabel(c.tuition)}</span>
              </div>
              <div class="explorer-metric">
                <span>Ranking (lower is better)</span>
                <div class="explorer-bar ranking"><div style="width:${Math.max(
                  15,
                  100 - c.ranking / 2
                )}%;"></div></div>
                <span class="explorer-label">~${c.ranking}</span>
              </div>
            </div>
          </div>
        </a>
      `;
      resultsEl.appendChild(card);
    });
  }

  function setColleges(data) {
    const mapped = (data || [])
      .map(decorateCollege)
      .filter(Boolean);

    if (mapped.length) {
      colleges = mapped;
    } else {
      // Fallback to a small curated list if scraped data is empty.
      colleges = fallbackColleges;
    }
    render();
  }

  // Load scraped JSON, fall back gracefully if it fails.
  fetch('/colleges-scraped.json')
    .then(res => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
    .then(json => setColleges(json))
    .catch(() => {
      setColleges([]);
    });

  searchInput?.addEventListener('input', render);
  typeFilter?.addEventListener('change', render);
  regionFilter?.addEventListener('change', render);
  sortSelect?.addEventListener('change', render);
});

// Simple college explorer with client-side search and ratings.
// Ratings are illustrative; students should always verify details with official sources.

document.addEventListener('DOMContentLoaded', () => {
  const colleges = [
    // name, city, state, region, type, fun (0-100), salary (0-100), tuition (0-100; higher is more expensive), ranking (1-200), image
    {
      name: 'Harvard University',
      city: 'Cambridge',
      state: 'MA',
      region: 'northeast',
      type: 'private',
      fun: 78,
      salary: 98,
      tuition: 95,
      ranking: 1,
      img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Stanford University',
      city: 'Stanford',
      state: 'CA',
      region: 'west',
      type: 'private',
      fun: 88,
      salary: 99,
      tuition: 95,
      ranking: 2,
      img: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Massachusetts Institute of Technology',
      city: 'Cambridge',
      state: 'MA',
      region: 'northeast',
      type: 'private',
      fun: 70,
      salary: 99,
      tuition: 95,
      ranking: 3,
      img: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f4b?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of California, Berkeley',
      city: 'Berkeley',
      state: 'CA',
      region: 'west',
      type: 'public',
      fun: 86,
      salary: 92,
      tuition: 70,
      ranking: 4,
      img: 'https://images.unsplash.com/photo-1541302216132-52942cd6ecb2?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Northwestern University',
      city: 'Evanston',
      state: 'IL',
      region: 'midwest',
      type: 'private',
      fun: 82,
      salary: 94,
      tuition: 90,
      ranking: 10,
      img: 'https://images.unsplash.com/photo-1595814433214-1ffba583f394?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of Michigan',
      city: 'Ann Arbor',
      state: 'MI',
      region: 'midwest',
      type: 'public',
      fun: 90,
      salary: 90,
      tuition: 72,
      ranking: 7,
      img: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of Texas at Austin',
      city: 'Austin',
      state: 'TX',
      region: 'south',
      type: 'public',
      fun: 92,
      salary: 88,
      tuition: 65,
      ranking: 15,
      img: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of North Carolina at Chapel Hill',
      city: 'Chapel Hill',
      state: 'NC',
      region: 'south',
      type: 'public',
      fun: 85,
      salary: 86,
      tuition: 60,
      ranking: 20,
      img: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of Florida',
      city: 'Gainesville',
      state: 'FL',
      region: 'south',
      type: 'public',
      fun: 91,
      salary: 82,
      tuition: 55,
      ranking: 25,
      img: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'New York University',
      city: 'New York',
      state: 'NY',
      region: 'northeast',
      type: 'private',
      fun: 88,
      salary: 89,
      tuition: 96,
      ranking: 30,
      img: 'https://images.unsplash.com/photo-1534448311378-1e193fb2570e?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of California, Los Angeles',
      city: 'Los Angeles',
      state: 'CA',
      region: 'west',
      type: 'public',
      fun: 93,
      salary: 90,
      tuition: 72,
      ranking: 8,
      img: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of Washington',
      city: 'Seattle',
      state: 'WA',
      region: 'west',
      type: 'public',
      fun: 84,
      salary: 87,
      tuition: 70,
      ranking: 30,
      img: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Ohio State University',
      city: 'Columbus',
      state: 'OH',
      region: 'midwest',
      type: 'public',
      fun: 89,
      salary: 80,
      tuition: 58,
      ranking: 50,
      img: 'https://images.unsplash.com/photo-1519455953755-af066f52f1a6?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Pennsylvania State University',
      city: 'University Park',
      state: 'PA',
      region: 'northeast',
      type: 'public',
      fun: 88,
      salary: 82,
      tuition: 60,
      ranking: 60,
      img: 'https://images.unsplash.com/photo-1597250672776-0b66326e4c97?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of Wisconsin–Madison',
      city: 'Madison',
      state: 'WI',
      region: 'midwest',
      type: 'public',
      fun: 92,
      salary: 85,
      tuition: 62,
      ranking: 22,
      img: 'https://images.unsplash.com/photo-1519883224863-94f53b5faded?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of Virginia',
      city: 'Charlottesville',
      state: 'VA',
      region: 'south',
      type: 'public',
      fun: 82,
      salary: 90,
      tuition: 70,
      ranking: 25,
      img: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Georgia Institute of Technology',
      city: 'Atlanta',
      state: 'GA',
      region: 'south',
      type: 'public',
      fun: 78,
      salary: 96,
      tuition: 72,
      ranking: 19,
      img: 'https://images.unsplash.com/photo-1471043726524-6133e3e6c0eb?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of Illinois Urbana-Champaign',
      city: 'Champaign',
      state: 'IL',
      region: 'midwest',
      type: 'public',
      fun: 86,
      salary: 88,
      tuition: 66,
      ranking: 35,
      img: 'https://images.unsplash.com/photo-1519455953755-af066f52f1a6?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'University of Southern California',
      city: 'Los Angeles',
      state: 'CA',
      region: 'west',
      type: 'private',
      fun: 94,
      salary: 93,
      tuition: 98,
      ranking: 27,
      img: 'https://images.unsplash.com/photo-1601197987944-2a1814f6da9c?auto=format&fit=crop&w=900&q=80'
    },
    {
      name: 'Boston University',
      city: 'Boston',
      state: 'MA',
      region: 'northeast',
      type: 'private',
      fun: 82,
      salary: 86,
      tuition: 92,
      ranking: 40,
      img: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=900&q=80'
    }
    // More schools can be added here following the same shape.
  ];

  const searchInput = document.getElementById('college-search');
  const typeFilter = document.getElementById('explorer-type');
  const regionFilter = document.getElementById('explorer-region');
  const sortSelect = document.getElementById('explorer-sort');
  const resultsEl = document.getElementById('explorer-results');

  function scoreToBar(value) {
    return Math.max(0, Math.min(100, value));
  }

  function tuitionLabel(v) {
    if (v >= 90) return '$$$$ (very high)';
    if (v >= 75) return '$$$ (high)';
    if (v >= 60) return '$$ (moderate)';
    return '$ (in-state friendly)';
  }

  function render() {
    let q = (searchInput?.value || '').toLowerCase().trim();
    const type = typeFilter?.value || '';
    const region = regionFilter?.value || '';
    const sortBy = sortSelect?.value || 'name';

    let filtered = colleges.filter(c => {
      if (type && c.type !== type) return false;
      if (region && c.region !== region) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'ranking') {
      filtered.sort((a, b) => a.ranking - b.ranking);
    } else if (sortBy === 'salary') {
      filtered.sort((a, b) => b.salary - a.salary);
    } else if (sortBy === 'fun') {
      filtered.sort((a, b) => b.fun - a.fun);
    }

    if (!resultsEl) return;
    resultsEl.innerHTML = '';

    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'builder-tagline';
      empty.textContent = 'No matches. Try fewer filters, or search by state or city.';
      resultsEl.appendChild(empty);
      return;
    }

    filtered.forEach(c => {
      const card = document.createElement('article');
      card.className = 'explorer-card';
      card.innerHTML = `
        <div class="explorer-image" style="background-image:url('${c.img}')">
          <div class="explorer-badge">${c.type === 'public' ? 'Public' : 'Private'} · ${c.state}</div>
        </div>
        <div class="explorer-body">
          <h3>${c.name}</h3>
          <p class="explorer-location">${c.city}, ${c.state}</p>
          <div class="explorer-metrics">
            <div class="explorer-metric">
              <span>Fun</span>
              <div class="explorer-bar"><div style="width:${scoreToBar(c.fun)}%;"></div></div>
              <span class="explorer-label">${c.fun}/100</span>
            </div>
            <div class="explorer-metric">
              <span>Avg salary after grad</span>
              <div class="explorer-bar"><div style="width:${scoreToBar(c.salary)}%;"></div></div>
              <span class="explorer-label">${c.salary}/100</span>
            </div>
            <div class="explorer-metric">
              <span>Tuition price</span>
              <div class="explorer-bar tuition"><div style="width:${scoreToBar(c.tuition)}%;"></div></div>
              <span class="explorer-label">${tuitionLabel(c.tuition)}</span>
            </div>
            <div class="explorer-metric">
              <span>Ranking (lower is better)</span>
              <div class="explorer-bar ranking"><div style="width:${Math.max(
                10,
                100 - c.ranking / 2
              )}%;"></div></div>
              <span class="explorer-label">~${c.ranking}</span>
            </div>
          </div>
        </div>
      `;
      resultsEl.appendChild(card);
    });
  }

  searchInput?.addEventListener('input', () => {
    render();
  });
  typeFilter?.addEventListener('change', render);
  regionFilter?.addEventListener('change', render);
  sortSelect?.addEventListener('change', render);

  render();
});

