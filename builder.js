document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('builder-input');
  const introEl = document.getElementById('builder-intro');
  const bodyEl = document.getElementById('builder-body');
  const conclusionEl = document.getElementById('builder-conclusion');
  const missionEl = document.getElementById('builder-mission');
  const outlineEl = document.getElementById('builder-outline');
  const analyzeBtn = document.getElementById('builder-analyze');
  const clearBtn = document.getElementById('builder-clear');

  if (!input || !analyzeBtn) return;

  function splitIntoParagraphs(text) {
    return text
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);
  }

  function splitIntoSentences(text) {
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  function guessMission(sentences) {
    if (!sentences.length) return '';
    const keywords = ['future', 'college', 'major', 'study', 'want to', 'hope to', 'plan to', 'goal', 'impact'];
    const scored = sentences
      .map((s, idx) => {
        const lower = s.toLowerCase();
        let score = 0;
        keywords.forEach(k => {
          if (lower.includes(k)) score += 1;
        });
        // weight later sentences slightly higher
        score += idx / Math.max(1, sentences.length - 1);
        return { sentence: s, score };
      })
      .sort((a, b) => b.score - a.score);
    return scored[0].score > 0 ? scored[0].sentence : sentences[sentences.length - 1];
  }

  function buildOutline(intro, body, conclusion, mission) {
    const parts = [];
    if (intro) parts.push('Intro: ' + intro.replace(/\s+/g, ' ').slice(0, 140) + (intro.length > 140 ? '…' : ''));
    if (body) parts.push('Body: ' + body.replace(/\s+/g, ' ').slice(0, 160) + (body.length > 160 ? '…' : ''));
    if (conclusion) parts.push('Conclusion: ' + conclusion.replace(/\s+/g, ' ').slice(0, 140) + (conclusion.length > 140 ? '…' : ''));
    if (mission) parts.push('Mission: ' + mission.replace(/\s+/g, ' ').slice(0, 140) + (mission.length > 140 ? '…' : ''));
    return parts.join('\n\n');
  }

  analyzeBtn.addEventListener('click', () => {
    const raw = input.value.trim();
    if (!raw) {
      alert('Paste a story or some notes first.');
      return;
    }

    const paragraphs = splitIntoParagraphs(raw);
    const sentences = splitIntoSentences(raw);

    let intro = '';
    let body = '';
    let conclusion = '';

    if (paragraphs.length === 1) {
      // Single big block: first ~20% as intro, last ~20% as conclusion
      const text = paragraphs[0];
      const len = text.length;
      const introEnd = Math.floor(len * 0.22);
      const conclStart = Math.floor(len * 0.7);
      intro = text.slice(0, introEnd).trim();
      conclusion = text.slice(conclStart).trim();
      body = text.slice(introEnd, conclStart).trim();
    } else {
      intro = paragraphs[0];
      conclusion = paragraphs[paragraphs.length - 1];
      body = paragraphs.slice(1, -1).join('\n\n');
    }

    const mission = guessMission(sentences);

    introEl.value = intro;
    bodyEl.value = body;
    conclusionEl.value = conclusion;
    missionEl.value = mission;
    outlineEl.textContent = buildOutline(intro, body, conclusion, mission);
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    introEl.value = '';
    bodyEl.value = '';
    conclusionEl.value = '';
    missionEl.value = '';
    outlineEl.textContent = 'Paste a story and click “Segment my story” to see a rough outline here.';
  });
});

