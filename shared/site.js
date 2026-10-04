"use strict";

/*
 * Airwitech shared front end (homepage, Study, SNN Robots).
 *
 *  1. Theme: follows the system, with a manual light/dark toggle.
 *  2. Meteor field: square pixels fall like meteors and burn out. The field
 *     grows denser while scrolling, shifts tint across chapters, dims behind
 *     text so copy stays readable, bends away from the mouse, and bursts into
 *     pixels on click or tap.
 *  3. Hero glyph: pixel art that rains in, holds, and falls away, cycling
 *     through the three ideas of the page.
 *  4. Scroll progress rail and fade-in reveal.
 *
 * No external requests and no tracking. The only stored value is the chosen
 * theme. Everything is static when the visitor prefers reduced motion.
 */
(() => {
  const root = document.documentElement;
  const canvas = document.getElementById("meteors");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const lightQuery = window.matchMedia("(prefers-color-scheme: light)");

  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smooth = (t) => t * t * (3 - 2 * t);

  let progress = 0;

  /* ---------------- Theme ---------------- */

  const STORAGE_KEY = "airwitech-theme";

  const readStored = () => {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch (error) {
      return null;
    }
  };

  const writeStored = (value) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      /* storage unavailable: the theme simply is not remembered */
    }
  };

  const currentTheme = () => root.dataset.theme || (lightQuery.matches ? "light" : "dark");

  const announceTheme = () => window.dispatchEvent(new Event("airwitech:theme"));

  const initTheme = () => {
    const stored = readStored();
    if (stored) {
      root.dataset.theme = stored;
    }

    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const next = currentTheme() === "light" ? "dark" : "light";
        root.dataset.theme = next;
        writeStored(next);
        announceTheme();
      });
    }

    lightQuery.addEventListener("change", announceTheme);
  };

  /* ---------------- Palette ---------------- */

  const parseColour = (value) => {
    const hex = value.trim().replace("#", "");
    if (hex.length === 6) {
      return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }
    return [255, 255, 255];
  };

  const palette = { tones: [], head: [255, 255, 255], star: [255, 255, 255], glow: true };

  const readPalette = () => {
    const styles = window.getComputedStyle(root);
    palette.tones = ["--violet", "--amber", "--cyan"].map((name) => parseColour(styles.getPropertyValue(name)));
    palette.head = parseColour(styles.getPropertyValue("--head"));
    palette.star = parseColour(styles.getPropertyValue("--star"));
    palette.glow = parseFloat(styles.getPropertyValue("--glow")) > 50;
  };

  /* ---------------- Meteor field ---------------- */

  // Fall direction: down and to the left, normalised.
  const DIR_X = -0.42;
  const DIR_Y = 0.91;
  const QUIET_SELECTOR = ".hero-copy, .panel, .tabs, .report-head, .metrics, .downloads, .notes, .job-card, .lede, .chapter-body, .principle h2, .closing-inner, .notfound, table";

  const startMeteors = () => {
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const bias = Number(document.body.dataset.tone || 1);
    const pointer = { x: -9999, y: -9999 };

    let dpr = 1;
    let width = 0;
    let height = 0;
    let meteors = [];
    let stars = [];
    let bursts = [];
    let quiet = [];
    let frameId = null;
    let lastTime = 0;

    const pickTone = () => {
      const focus = progress * 2;
      const weights = palette.tones.map((_, i) => Math.max(0, 1 - Math.abs(i - focus)) + 0.18 + (i === bias ? 0.55 : 0));
      let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < weights.length; i += 1) {
        roll -= weights[i];
        if (roll <= 0) {
          return i;
        }
      }
      return 2;
    };

    const measureQuiet = () => {
      quiet = Array.from(document.querySelectorAll(QUIET_SELECTOR)).map((element) => {
        const rect = element.getBoundingClientRect();
        return { l: rect.left * dpr, t: rect.top * dpr, r: rect.right * dpr, b: rect.bottom * dpr };
      }).filter((rect) => rect.b > 0 && rect.t < height);
    };

    // 1 in open sky, down to 0.25 directly behind text, easing back out.
    const openness = (x, y) => {
      const reach = 90 * dpr;
      let factor = 1;
      for (const rect of quiet) {
        const dx = Math.max(rect.l - x, 0, x - rect.r);
        const dy = Math.max(rect.t - y, 0, y - rect.b);
        const distance = Math.hypot(dx, dy);
        if (distance < reach) {
          factor = Math.min(factor, 0.25 + 0.75 * smooth(distance / reach));
        }
      }
      return factor;
    };

    const spawn = (meteor, scatter) => {
      const big = Math.random() < 0.09;
      const cell = big ? 6 : Math.random() < 0.45 ? 4 : Math.random() < 0.6 ? 3 : 2;
      meteor.cell = Math.max(1, Math.round(cell * dpr));
      meteor.speed = (big ? random(230, 340) : random(90, 300)) * dpr * (cell / 3 + 0.55);
      meteor.length = Math.round(big ? random(16, 26) : random(7, 18));
      meteor.alpha = big ? 1 : random(0.65, 1);
      meteor.tone = pickTone();
      meteor.idle = false;

      // Most meteors burn out before they reach the bottom of the screen.
      const travel = height / DIR_Y;
      const spread = width + Math.abs(DIR_X) * travel;
      const startX = random(0, spread);
      const startY = -meteor.cell * (meteor.length + 2);
      meteor.span = travel * random(0.3, 1.05);
      meteor.travelled = scatter ? random(0, meteor.span) : 0;
      meteor.x = startX + DIR_X * meteor.travelled;
      meteor.y = startY + DIR_Y * meteor.travelled;
    };

    const buildField = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.round(window.innerWidth * dpr);
      height = Math.round(window.innerHeight * dpr);
      canvas.width = width;
      canvas.height = height;

      const cssArea = window.innerWidth * window.innerHeight;
      const total = Math.round(clamp(cssArea / 6200, 46, 200));
      meteors = Array.from({ length: total }, (_, index) => {
        const meteor = { index, idle: false };
        spawn(meteor, true);
        return meteor;
      });

      const starCount = Math.round(clamp(cssArea / 16000, 30, 110));
      stars = Array.from({ length: starCount }, () => ({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        cell: Math.max(1, Math.round(dpr * (Math.random() < 0.2 ? 2 : 1))),
        base: random(0.06, 0.24),
        phase: random(0, Math.PI * 2),
        rate: random(0.4, 1.4),
      }));
      measureQuiet();
    };

    const activeCount = () => Math.round(meteors.length * (0.55 + 0.45 * progress));

    const rgba = (colour, alpha) => `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, ${alpha.toFixed(3)})`;

    const render = (seconds, step) => {
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        const twinkle = reducedMotion.matches ? 1 : 0.55 + 0.45 * Math.sin(seconds * star.rate + star.phase);
        ctx.fillStyle = rgba(palette.star, star.base * twinkle);
        ctx.fillRect(star.x, star.y, star.cell, star.cell);
      }

      const active = activeCount();
      const energy = 1 + progress * 0.7;
      const reach = 150 * dpr;

      for (const meteor of meteors) {
        if (meteor.idle) {
          if (meteor.index < active && step > 0) {
            spawn(meteor, false);
          }
          continue;
        }

        if (step > 0) {
          const distance = meteor.speed * energy * step;
          meteor.x += DIR_X * distance;
          meteor.y += DIR_Y * distance;
          meteor.travelled += distance;

          // Bend away from the mouse.
          const dx = meteor.x - pointer.x;
          const dy = meteor.y - pointer.y;
          const gap = Math.hypot(dx, dy);
          if (gap < reach && gap > 0) {
            const push = Math.pow(1 - gap / reach, 2) * 320 * dpr * step;
            meteor.x += (dx / gap) * push;
            meteor.y += (dy / gap) * push * 0.4;
          }
        }

        // Life envelope: brief fade-in, then a long, smooth burn-out. The
        // trail also shortens while the meteor dies, so it dissolves pixel by
        // pixel instead of vanishing.
        const life = meteor.travelled / meteor.span;
        if (life >= 1) {
          if (meteor.index >= active) {
            meteor.idle = true;
          } else {
            spawn(meteor, false);
          }
          continue;
        }
        const fadeIn = clamp(life / 0.08, 0, 1);
        const burn = clamp((life - 0.35) / 0.65, 0, 1);
        const envelope = fadeIn * (1 - smooth(burn));

        const { cell } = meteor;
        const tone = palette.tones[meteor.tone];
        const length = Math.max(2, Math.round(meteor.length * (1 - 0.65 * burn)));
        const spacing = cell * 1.6;
        let visible = false;

        for (let k = length; k >= 0; k -= 1) {
          const px = Math.round((meteor.x - DIR_X * spacing * k) / cell) * cell;
          const py = Math.round((meteor.y - DIR_Y * spacing * k) / cell) * cell;
          if (px < -cell || px > width || py < -cell || py > height) {
            continue;
          }
          visible = true;
          const fade = Math.pow(1 - k / (length + 1), 1.5);
          const colour = k === 0 ? palette.head : tone;
          ctx.fillStyle = rgba(colour, fade * meteor.alpha * envelope * openness(px, py));
          ctx.fillRect(px, py, cell, cell);
        }

        if (!visible && meteor.y > height / 2) {
          if (meteor.index >= active) {
            meteor.idle = true;
          } else {
            spawn(meteor, false);
          }
        }
      }

      // Click and tap bursts.
      if (bursts.length) {
        for (const spark of bursts) {
          spark.x += spark.vx * step;
          spark.y += spark.vy * step;
          spark.vy += 160 * dpr * step;
          spark.life -= step / 0.9;
          if (spark.life > 0) {
            ctx.fillStyle = rgba(palette.tones[spark.tone], clamp(spark.life, 0, 1));
            ctx.fillRect(Math.round(spark.x / spark.cell) * spark.cell, Math.round(spark.y / spark.cell) * spark.cell, spark.cell, spark.cell);
          }
        }
        bursts = bursts.filter((spark) => spark.life > 0);
      }
    };

    const tick = (time) => {
      const seconds = time / 1000;
      const step = lastTime ? Math.min(seconds - lastTime, 0.05) : 0;
      lastTime = seconds;
      render(seconds, step);
      frameId = window.requestAnimationFrame(tick);
    };

    const update = () => {
      if (reducedMotion.matches || document.hidden) {
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
          frameId = null;
        }
        lastTime = 0;
        if (reducedMotion.matches) {
          render(0, 0);
        }
        return;
      }
      if (frameId === null) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    const isInteractive = (target) => target instanceof Element && target.closest("a, button, input, label, canvas.demo-scene, .theme-toggle");

    window.addEventListener("pointermove", (event) => {
      if (event.pointerType === "mouse") {
        pointer.x = event.clientX * dpr;
        pointer.y = event.clientY * dpr;
      }
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => {
      pointer.x = -9999;
      pointer.y = -9999;
    });

    window.addEventListener("pointerdown", (event) => {
      if (reducedMotion.matches || isInteractive(event.target)) {
        return;
      }
      const count = 16;
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2 + random(-0.2, 0.2);
        const speed = random(90, 260) * dpr;
        bursts.push({
          x: event.clientX * dpr,
          y: event.clientY * dpr,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60 * dpr,
          cell: Math.max(2, Math.round(random(2, 4) * dpr)),
          tone: Math.floor(random(0, 3)),
          life: 1,
        });
      }
    }, { passive: true });

    window.addEventListener("scroll", () => {
      window.requestAnimationFrame(measureQuiet);
    }, { passive: true });

    let resizeTimer = 0;
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      // Mobile browsers fire resize while the address bar collapses; only
      // rebuild the field when the width actually changes.
      if (window.innerWidth === lastWidth && !reducedMotion.matches) {
        measureQuiet();
        return;
      }
      lastWidth = window.innerWidth;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        buildField();
        update();
        if (reducedMotion.matches) {
          render(0, 0);
        }
      }, 150);
    });

    window.addEventListener("airwitech:theme", () => {
      readPalette();
      if (reducedMotion.matches) {
        render(0, 0);
      }
    });
    window.setInterval(measureQuiet, 1500);

    reducedMotion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);

    buildField();
    update();
  };

  /* ---------------- Hero glyph ---------------- */

  const bars = (heights) => {
    const rows = [];
    const top = Math.max(...heights);
    for (let r = 0; r < top; r += 1) {
      rows.push(heights.map((h) => (r >= top - h ? (r === top - h ? "oo" : "##") : "..")).join("."));
    }
    return rows;
  };

  // '#' tone pixel, 'o' bright pixel, '.' empty.
  const GLYPHS = {
    question: [".#####.", "##...##", ".....##", "....##.", "...##..", "...#...", ".......", "...o..."],
    eye: ["...#######...", ".##.......##.", "#....ooo....#", "#...ooooo...#", "#....ooo....#", ".##.......##.", "...#######..."],
    bars: bars([2, 4, 6, 9]),
    lock: [".#####.", "#.....#", "#.....#", "#######", "#######", "###o###", "###o###", "#######"],
    prompt: ["##.......", ".##......", "..##.....", "...##....", "..##.....", ".##......", "##..oooo."],
    window: ["###########", "#.#.#.....#", "###########", "#.........#", "#.o.......#", "#..o......#", "#.o..ooo..#", "###########"],
    spike: ["......o......", ".....o.o.....", ".....#.#.....", "....#...#....", "....#...#....", "...#.....#...", "###.......###"],
    bot: ["....#....", ".#######.", "#########", "##o###o##", "#########", ".#######.", ".#.....#.", ".##...##."],
    antenna: ["..#####..", ".#.....#.", "#..###..#", "...#o#...", "....#....", "....#....", "....#....", "..#####.."],
    tripod: ["...###...", "..#####..", "...#o#...", "....#....", "...#.#...", "..#...#..", ".#.....#.", "#.......#"],
    network: ["#.......#", ".#.....#.", "..#...#..", "...#o#...", "....#....", "....#....", "..#####.."],
  };

  const startGlyph = (glyphCanvas) => {
    const names = (glyphCanvas.dataset.glyphs || "").split(",").filter((name) => GLYPHS[name]);
    const toneIndexes = (glyphCanvas.dataset.tones || "0,1,2").split(",").map(Number);
    if (!names.length) {
      return;
    }
    const ctx = glyphCanvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const IN_MS = 1200;
    const HOLD_MS = 3800;
    const OUT_MS = 1100;

    let dpr = 1;
    let size = 0;
    let cell = 1;
    let index = 0;
    let phase = "in";
    let phaseStart = 0;
    let pixels = [];
    let frameId = null;
    let visible = true;

    const maxDim = Math.max(...names.map((name) => Math.max(GLYPHS[name].length, GLYPHS[name][0].length)));

    const buildPixels = () => {
      const rows = GLYPHS[names[index]];
      const cols = rows[0].length;
      pixels = [];
      rows.forEach((row, y) => {
        for (let x = 0; x < cols; x += 1) {
          if (row[x] === "#" || row[x] === "o") {
            pixels.push({
              x,
              y,
              lit: row[x] === "o",
              inDelay: random(0, 520) + x * 12,
              outDelay: random(0, 480),
              fall: random(5, 13),
              phase: random(0, Math.PI * 2),
            });
          }
        }
      });
    };

    const fit = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.max(1, Math.round(glyphCanvas.clientWidth * dpr));
      if (glyphCanvas.width !== size || glyphCanvas.height !== size) {
        glyphCanvas.width = size;
        glyphCanvas.height = size;
      }
      cell = Math.max(2, Math.floor(size / (maxDim + 4)));
    };

    const draw = (now) => {
      ctx.clearRect(0, 0, size, size);
      const rows = GLYPHS[names[index]];
      const cols = rows[0].length;
      const originX = Math.round((size - cols * cell) / 2);
      const originY = Math.round((size - rows.length * cell) / 2);
      const tone = palette.tones[toneIndexes[index % toneIndexes.length] % 3];
      const elapsed = now - phaseStart;
      const settled = reducedMotion.matches;

      for (const pixel of pixels) {
        let offset = 0;
        let alpha = 1;
        if (!settled) {
          if (phase === "in") {
            const e = clamp((elapsed - pixel.inDelay) / 680, 0, 1);
            const eased = 1 - Math.pow(1 - e, 3);
            offset = -(1 - eased) * pixel.fall;
            alpha = eased;
          } else if (phase === "out") {
            const e = clamp((elapsed - pixel.outDelay) / 620, 0, 1);
            offset = e * e * 9;
            alpha = 1 - e;
          } else if (pixel.lit) {
            alpha = 0.72 + 0.28 * Math.sin(now / 420 + pixel.phase);
          }
        }
        if (alpha <= 0.01) {
          continue;
        }
        const colour = pixel.lit ? palette.head : tone;
        if (palette.glow) {
          ctx.shadowColor = `rgba(${tone[0]}, ${tone[1]}, ${tone[2]}, ${(0.75 * alpha).toFixed(2)})`;
          ctx.shadowBlur = cell * 0.9;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, ${alpha.toFixed(3)})`;
        const px = originX + pixel.x * cell;
        const py = Math.round(originY + (pixel.y + offset) * cell);
        ctx.fillRect(px, py, Math.round(cell * 0.86), Math.round(cell * 0.86));
      }
      ctx.shadowBlur = 0;
    };

    const advance = (now) => {
      const elapsed = now - phaseStart;
      if (phase === "in" && elapsed > IN_MS) {
        phase = "hold";
        phaseStart = now;
      } else if (phase === "hold" && elapsed > HOLD_MS) {
        phase = "out";
        phaseStart = now;
      } else if (phase === "out" && elapsed > OUT_MS) {
        index = (index + 1) % names.length;
        buildPixels();
        phase = "in";
        phaseStart = now;
      }
    };

    const tick = (now) => {
      if (!phaseStart) {
        phaseStart = now;
      }
      advance(now);
      draw(now);
      frameId = window.requestAnimationFrame(tick);
    };

    const sync = () => {
      const run = !reducedMotion.matches && visible && !document.hidden;
      if (run && frameId === null) {
        frameId = window.requestAnimationFrame(tick);
      } else if (!run && frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      if (!run) {
        fit();
        draw(performance.now());
      }
    };

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      }, { threshold: 0.05 }).observe(glyphCanvas);
    }

    window.addEventListener("resize", () => {
      fit();
      draw(performance.now());
    });
    window.addEventListener("airwitech:theme", () => draw(performance.now()));
    reducedMotion.addEventListener("change", () => {
      phase = "hold";
      phaseStart = performance.now();
      sync();
    });
    document.addEventListener("visibilitychange", sync);

    fit();
    buildPixels();
    if (reducedMotion.matches) {
      phase = "hold";
    }
    sync();
  };

  /* ---------------- Scroll progress ---------------- */

  const trackScroll = () => {
    let queued = false;

    const measure = () => {
      queued = false;
      const scrollable = root.scrollHeight - window.innerHeight;
      progress = scrollable > 0 ? clamp(window.scrollY / scrollable, 0, 1) : 0;
      root.style.setProperty("--progress", progress.toFixed(4));
    };

    window.addEventListener("scroll", () => {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(measure);
      }
    }, { passive: true });

    measure();
  };

  /* ---------------- Reveal ---------------- */

  const revealOnScroll = () => {
    const items = Array.from(document.querySelectorAll(".reveal"));
    if (!("IntersectionObserver" in window) || reducedMotion.matches) {
      return;
    }

    // Only hide items that start below the fold, so nothing flashes at load.
    const pending = items.filter((item) => item.getBoundingClientRect().top > window.innerHeight * 0.92);
    pending.forEach((item) => item.setAttribute("data-reveal", "pending"));

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          entry.target.removeAttribute("data-reveal");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });

    pending.forEach((item) => observer.observe(item));
  };

  initTheme();
  readPalette();
  window.addEventListener("airwitech:theme", readPalette);
  trackScroll();
  startMeteors();
  document.querySelectorAll("canvas.hero-glyph").forEach(startGlyph);
  revealOnScroll();
})();
