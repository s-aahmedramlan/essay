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

  function buildRockEssay(prompt, ecs, targetWords) {
    const safePrompt = prompt.replace(/\s+/g, ' ').trim();
    const used = ecs.slice(0, 4);
    const [first, second, third, fourth] = used;

    function label(line) {
      if (!line) return '';
      return line.split(/[,–-]/)[0].trim();
    }

    const l1 = label(first);
    const l2 = label(second);
    const l3 = label(third);
    const l4 = label(fourth);

    const intro = [
      `Painting The Rock is one of the few prompts that asks me to pick a single image instead of a thesis. I would paint a layered mural rather than one logo: a scene that looks chaotic from far away, but up close is stitched together from the quiet work I’ve been doing for the last few years.`,
      l1 ? `On the front, closest to Sheridan, I’d start with a panel for ${l1}.` : ''
    ]
      .filter(Boolean)
      .join(' ');

    const body = [];

    if (first) {
      body.push(
        `In that front panel for ${first.replace(/\.$/, '')}, I’d show the in‑between moments: half‑finished drafts, late‑night edits, a small cluster of people bent over a screen. That’s what that role actually feels like to me. It’s less about shouting the loudest and more about deciding which stories deserve the spotlight and making sure the quiet, unglamorous work behind them is visible.`
      );
    }

    if (second) {
      body.push(
        `Wrapping around one side, I’d paint a narrow band for ${second.replace(/\.$/, '')}. I imagine tiny speech bubbles overlapping and then dissolving into a single line of text. That’s the mental work MUN forced me to do: take in a mess of competing viewpoints, sit with the ones that made me uncomfortable, and then write something that feels honest instead of convenient.`
      );
    }

    if (third) {
      body.push(
        `Near the bottom, almost easy to miss, I’d tuck in a sketch for ${third.replace(/\.$/, '')}. It would be a row of empty chairs slowly filling up, because that work taught me that showing up consistently – recruiting, assigning, editing, staying until the last file is uploaded – matters more than one impressive sprint. It’s the least flashy part of my life, but it’s the foundation under everything else.`
      );
    }

    if (fourth) {
      body.push(
        `On the back of The Rock, where you only see it if you bother to walk all the way around, I’d paint a small frame for ${fourth.replace(/\.$/, '')}. That spot is for the things I do when no one is grading or counting: the drawings, covers, and little design choices that make work feel like play again. It’s my reminder that creativity isn’t a separate hobby; it’s the way I solve problems anywhere on campus.`
      );
    }

    const conclusion = [
      `Taken together, the mural wouldn’t spell out my résumé. Instead, it would be a map of the habits those roles taught me: listening before I speak, noticing who is missing from the frame, and doing the unglamorous work that lets other people be seen clearly.`,
      `I would paint it knowing it will eventually be covered by someone else’s story. That feels right for college: The Rock is less a monument than a rotating conversation. Adding my layer – and then making space for the next one – is exactly the kind of community I want to be part of at Northwestern.`
    ].join(' ');

    let essay = [intro].concat(body).concat([conclusion]).join('\n\n');
    let words = approxWords(essay);
    if (words > targetWords * 1.15) {
      const tokens = essay.split(/\s+/).filter(Boolean);
      essay = tokens.slice(0, targetWords + 20).join(' ') + '…';
      words = approxWords(essay);
    }

    return { essay, used, words };
  }

  function buildEssay(prompt, ecs, targetWords) {
    const safePrompt = prompt.replace(/\s+/g, ' ').trim();
    const lowerPrompt = safePrompt.toLowerCase();

    // Special handling for Northwestern "paint The Rock" style prompts.
    if (lowerPrompt.includes('the rock') && lowerPrompt.includes('paint')) {
      return buildRockEssay(safePrompt, ecs, targetWords);
    }

    const used = ecs.slice(0, 4);
    const [first, second, third, fourth] = used;

    const introParts = [];
    if (safePrompt) {
      introParts.push(
        `The prompt I’m answering asks: “${safePrompt}” — but instead of listing everything I’ve done, I want to stay with a few small moments that actually changed me.`
      );
    } else {
      introParts.push(
        `When I try to explain who I am, I don’t start with titles or awards. I think instead about a handful of ordinary moments that quietly changed how I see the world.`
      );
    }
    introParts.push(
      first
        ? `A lot of those moments live inside my work with ${first.replace(/\.$/, '')}.`
        : `This essay is my attempt to zoom in on a few of those moments and what they actually did to me.`
    );
    const intro = introParts.join(' ');

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

    // Join paragraphs, then trim to sit near the target word count.
    let essay = paragraphs.join('\n\n');
    let words = approxWords(essay);
    if (words > targetWords * 1.15) {
      // If we overshot, trim to ~target+20 words.
      const tokens = essay.split(/\s+/).filter(Boolean);
      essay = tokens.slice(0, targetWords + 20).join(' ') + '…';
      words = approxWords(essay);
    }

    return { essay, used, words };
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
    const { essay, used, words } = buildEssay(prompt, ecs, target);

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
          `\n\nApproximate length: ${words} words (target ${target}).\nUse this as a starting point and edit until it sounds exactly like you and fully answers the prompt above.`;
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

