document.addEventListener('DOMContentLoaded', () => {
  const promptEl = document.getElementById('builder-prompt');
  const ecsEl = document.getElementById('builder-ecs');
  const wcEl = document.getElementById('builder-wc');
  const essayEl = document.getElementById('builder-essay');
  const notesEl = document.getElementById('builder-notes');
  const generateBtn = document.getElementById('builder-generate');
  const clearBtn = document.getElementById('builder-clear');

  if (!promptEl || !ecsEl || !essayEl || !generateBtn) return;

  function splitLines(text) {
    return text
      .split(/\r?\n/)
      .map(l => l.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
  }

  function clampWordCount(raw) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return 650;
    if (n < 250) return 250;
    if (n > 650) return 650;
    return n;
  }

  function approxWords(text) {
    return text.split(/\s+/).filter(Boolean).length;
  }

  function buildEssay(prompt, ecs, targetWords) {
    const safePrompt = prompt.replace(/\s+/g, ' ').trim();
    const used = ecs.slice(0, 4);
    const [first, second, third, fourth] = used;

    const intro = [
      safePrompt
        ? `When I first read the prompt, I started listing accomplishments in my head, but the moments that kept coming back to me were much smaller and stranger than a bulleted résumé.`
        : `When I try to explain who I am, I don’t start with titles or awards. I think instead about a handful of ordinary moments that quietly changed how I see the world.`,
      first
        ? `One of those moments lives inside my work with ${first.replace(/\.$/, '')}.`
        : `This essay is my attempt to zoom in on a few of those moments and what they actually did to me.`
    ].join(' ');

    const bodyPieces = [];

    if (first) {
      bodyPieces.push(
        `With ${first}, I didn’t show up already knowing what I was doing. At first it felt more like controlled chaos than leadership; I was mostly paying attention to the small things – who stayed late without being asked, who went quiet when they hit a wall, who pretended to understand when they were lost. Over time, the work taught me to read the room and to listen before deciding where to push next.`
      );
    }

    if (second) {
      bodyPieces.push(
        `Outside of that, ${second.replace(/\.$/, '')} pulled on a different part of me. It forced me to argue with myself before I argued with anyone else. I had to ask, “What am I missing? What would this look like from the other side of the desk?” That habit – pausing to imagine the other angle – started spilling into everything from family conversations to late-night group chats.`
      );
    }

    if (third) {
      bodyPieces.push(
        `The most uncomfortable growth usually came from ${third.replace(/\.$/, '')}. There, there was no audience to impress, just the people in front of me and whether I would actually show up for them. It’s where I learned that impact doesn’t always feel heroic; sometimes it looks like washing dishes after an event or answering the same basic question for the fifth time with real patience.`
      );
    }

    if (fourth) {
      bodyPieces.push(
        `Even ${fourth.replace(/\.$/, '')}, which started as something I did “on the side,” ended up shaping how I think about what matters. It reminded me that joy and curiosity are not extra credit; they’re the fuel that keeps me willing to do the unglamorous parts of the work.`
      );
    }

    const conclusion = [
      `Looking back across these pieces of my life, the through-line isn’t a single position or statistic. It’s the way each experience has nudged me to pay sharper attention – to quiet teammates, to students pretending not to be nervous, to neighbors who show up even when no one is taking attendance.`,
      `That attention is what I want to carry with me into college: into late-night problem sets, new communities, and the projects I haven’t imagined yet. I don’t know exactly what my title will be in a few years, but I know I want my work to leave people feeling more seen and more capable than when they first met me.`
    ].join(' ');

    const paragraphs = [intro].concat(bodyPieces).concat([conclusion]);

    // Compress or extend slightly to sit near the target word count.
    let essay = paragraphs.join('\n\n');
    const words = approxWords(essay);
    if (words > targetWords * 1.25) {
      // remove one body paragraph if we overshot badly
      if (bodyPieces.length > 2) {
        paragraphs.splice(2, 1);
        essay = paragraphs.join('\n\n');
      }
    }

    return { essay, used };
  }

  generateBtn.addEventListener('click', () => {
    const prompt = promptEl.value.trim();
    const ecsRaw = ecsEl.value.trim();

    if (!prompt) {
      alert('Paste the prompt first.');
      return;
    }
    if (!ecsRaw) {
      alert('Add at least a few activities or experiences.');
      return;
    }

    const ecs = splitLines(ecsRaw);
    const target = clampWordCount(wcEl.value);
    const { essay, used } = buildEssay(prompt, ecs, target);

    essayEl.value = essay;
    if (notesEl) {
      if (!used.length) {
        notesEl.textContent = 'No activities were detected. Try adding a few lines to the activities box.';
      } else {
        notesEl.textContent =
          'Intro leans on: ' +
          (used[0] || 'n/a') +
          '\n\nBody paragraphs pull from:\n- ' +
          used
            .slice(1)
            .map(u => u)
            .join('\n- ') +
          '\n\nUse this as a starting point and edit until it sounds exactly like you.';
      }
    }
  });

  clearBtn?.addEventListener('click', () => {
    promptEl.value = '';
    ecsEl.value = '';
    essayEl.value = '';
    if (notesEl) {
      notesEl.textContent =
        'After you generate, this will explain which activities fed the intro, body, and conclusion so you can tweak the angle.';
    }
  });
});

