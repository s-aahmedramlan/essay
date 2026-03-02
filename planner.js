document.addEventListener('DOMContentLoaded', () => {
  const COLLEGE_KEY = 'essaybros_planner_colleges_v1';
  const DEADLINE_KEY = 'essaybros_planner_deadlines_v1';

  const collegeForm = document.getElementById('college-form');
  const collegeList = document.getElementById('college-list');
  const collegeOptions = document.getElementById('college-options');

  const deadlineForm = document.getElementById('deadline-form');
  const deadlineList = document.getElementById('deadline-list');

  let colleges = [];
  let deadlines = [];

  function loadState() {
    try {
      const c = JSON.parse(localStorage.getItem(COLLEGE_KEY) || '[]');
      const d = JSON.parse(localStorage.getItem(DEADLINE_KEY) || '[]');
      colleges = Array.isArray(c) ? c : [];
      deadlines = Array.isArray(d) ? d : [];
    } catch {
      colleges = [];
      deadlines = [];
    }
  }

  function saveState() {
    localStorage.setItem(COLLEGE_KEY, JSON.stringify(colleges));
    localStorage.setItem(DEADLINE_KEY, JSON.stringify(deadlines));
  }

  function tierLabel(tier) {
    if (tier === 'reach') return 'Reach';
    if (tier === 'safety') return 'Safety';
    return 'Target';
  }

  function tierEmoji(tier) {
    if (tier === 'reach') return '🔭';
    if (tier === 'safety') return '🛟';
    return '🎯';
  }

  function renderColleges() {
    if (!collegeList) return;
    collegeList.innerHTML = '';
    const sorted = [...colleges].sort((a, b) => b.priority - a.priority);

    if (!sorted.length) {
      const empty = document.createElement('p');
      empty.className = 'builder-tagline';
      empty.textContent = 'No colleges yet. Add a few above to start shaping your list.';
      collegeList.appendChild(empty);
    }

    for (const c of sorted) {
      const card = document.createElement('div');
      card.className = 'planner-card';
      card.innerHTML = `
        <div class="planner-main">
          <h4>${c.name}</h4>
          <div class="planner-tags">
            <span class="planner-pill ${c.tier}">${tierEmoji(c.tier)} ${tierLabel(c.tier)}</span>
            <span class="planner-pill">⭐ ${c.priority}/5 interest</span>
            ${c.location ? `<span class="planner-pill location">📍 ${c.location}</span>` : ''}
          </div>
          ${c.notes ? `<div class="planner-meta">${c.notes}</div>` : ''}
        </div>
        <div class="planner-actions">
          <button data-id="${c.id}" class="planner-remove">Remove</button>
        </div>
      `;
      collegeList.appendChild(card);
    }

    if (collegeOptions) {
      collegeOptions.innerHTML = '';
      for (const c of colleges) {
        const opt = document.createElement('option');
        opt.value = c.name;
        collegeOptions.appendChild(opt);
      }
    }
  }

  function renderDeadlines() {
    if (!deadlineList) return;
    if (!deadlines.length) {
      deadlineList.textContent = 'No deadlines yet. Add one above.';
      return;
    }

    const now = new Date();
    const ninetyDaysOut = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const items = deadlines
      .map(d => {
        const date = new Date(d.date);
        return { ...d, dateObj: date, time: date.getTime() };
      })
      .filter(d => !isNaN(d.time) && d.dateObj <= ninetyDaysOut)
      .sort((a, b) => a.time - b.time);

    if (!items.length) {
      deadlineList.textContent = 'No deadlines in the next 90 days. You can still add future ones for visibility.';
      return;
    }

    deadlineList.innerHTML = '';
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.paddingLeft = '0';

    for (const d of items) {
      const li = document.createElement('li');
      const daysDiff = Math.round((d.time - now.getTime()) / (24 * 60 * 60 * 1000));

      let badge = '';
      let color = '#4a5568';
      if (daysDiff < 0) {
        badge = 'OVERDUE';
        color = '#c53030';
      } else if (daysDiff <= 7) {
        badge = 'THIS WEEK';
        color = '#b7791f';
      } else if (daysDiff <= 30) {
        badge = 'SOON';
        color = '#3182ce';
      }

      const typeLabel =
        d.type === 'ea'
          ? 'EA'
          : d.type === 'ed'
          ? 'ED'
          : d.type === 'rd'
          ? 'RD'
          : d.type === 'scholarship'
          ? 'Scholarship'
          : 'Other';

      li.style.marginBottom = '0.6rem';
      li.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
          <div>
            <strong>${d.college}</strong> – ${typeLabel}
            <div style="font-size:0.85rem;color:#4a5568;">${d.notes || ''}</div>
          </div>
          <div style="text-align:right;font-size:0.85rem;">
            <div>${d.date}</div>
            ${
              badge
                ? `<div style="color:${color};font-weight:600;">${badge}${daysDiff >= 0 ? ` · ${daysDiff}d` : ''}</div>`
                : `<div style="color:#4a5568;">${daysDiff}d</div>`
            }
          </div>
        </div>
      `;
      ul.appendChild(li);
    }

    deadlineList.appendChild(ul);
  }

  if (collegeForm) {
    collegeForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('college-name').value.trim();
      const tier = document.getElementById('college-tier').value;
      const location = document.getElementById('college-location').value;
      const priority = parseInt(document.getElementById('college-priority').value, 10) || 3;
      const notes = document.getElementById('college-notes').value.trim();

      if (!name) return;

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      colleges.push({ id, name, tier, location, priority, notes });
      saveState();
      renderColleges();
      collegeForm.reset();
      document.getElementById('college-priority').value = '3';
    });
  }

  if (collegeList) {
    collegeList.addEventListener('click', e => {
      const btn = e.target.closest('.planner-remove');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      colleges = colleges.filter(c => c.id !== id);
      saveState();
      renderColleges();
    });
  }

  if (deadlineForm) {
    deadlineForm.addEventListener('submit', e => {
      e.preventDefault();
      const college = document.getElementById('deadline-college').value.trim();
      const type = document.getElementById('deadline-type').value;
      const date = document.getElementById('deadline-date').value;
      const notes = document.getElementById('deadline-notes').value.trim();

      if (!college || !date) return;

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      deadlines.push({ id, college, type, date, notes });
      saveState();
      renderDeadlines();
      deadlineForm.reset();
    });
  }

  loadState();
  renderColleges();
  renderDeadlines();
});

