// Cheerleader effect study for Prolific, jsPsych 8.
// Settings live in config.js; lab alone-ratings in face_norms.js.
// Add ?debug=1 to the URL for a short local test run that shows the data at the end.

const jsPsych = initJsPsych({
  on_finish: () => {
    if (DEBUG) { jsPsych.data.displayData("csv"); return; }
    window.location = "https://app.prolific.com/submissions/complete?cc=" + CONFIG.PROLIFIC_COMPLETION_CODE;
  }
});

const url = (k) => jsPsych.data.getURLVariable(k);
const DEBUG = url("debug") === "1";
const PID = url("PROLIFIC_PID") || "test_" + jsPsych.randomization.randomID(8);
const STUDY_ID = url("STUDY_ID") || "";
const SESSION_ID = url("SESSION_ID") || "";
const POS = ["L", "M", "R"];
const FLIP = { L: "R", M: "M", R: "L" };
const ARROW_X = { L: 1 / 6, M: 1 / 2, R: 5 / 6 };
const R = jsPsych.randomization;

// ---------- people and norms ----------
const singleImage = (k, pos) => `IMG_${pos}S${k}.png`;
const faceId = (k, posIdx) => "Face" + (3 * k - 2 + posIdx);
const NORMS = {};
(typeof FACE_NORMS !== "undefined" ? FACE_NORMS : []).forEach((n) => { NORMS[n.FACE] = n; });
const PHOTOS = CONFIG.PHOTOS || Array.from({ length: CONFIG.N_PHOTOS }, (_, i) => i + 1);
const PEOPLE = [];
for (const k of PHOTOS)
  POS.forEach((pos, i) => PEOPLE.push({ k, pos, FACE: faceId(k, i), norm: NORMS[faceId(k, i)] }));
const sortedNorms = PEOPLE.filter((p) => p.norm).map((p) => p.norm.alone_mean).sort((a, b) => a - b);
const LOW_CUT = sortedNorms[Math.floor(sortedNorms.length / 3)];
const HIGH_CUT = sortedNorms[Math.floor((2 * sortedNorms.length) / 3)];

const TARGET_SET = {};
(CONFIG.TARGET_FACES_LOW || []).forEach((f) => { TARGET_SET[f] = "low"; });
(CONFIG.TARGET_FACES_HIGH || []).forEach((f) => { TARGET_SET[f] = "high"; });
const USE_TARGET_LIST = Object.keys(TARGET_SET).length > 0;
const FLANKER_SET = CONFIG.FLANKER_POOL ? new Set(CONFIG.FLANKER_POOL) : null;

function pickFlankers(target, level) {
  let pool = PEOPLE.filter((p) => p.k !== target.k);
  if (FLANKER_SET) pool = pool.filter((p) => FLANKER_SET.has(p.FACE));
  // Explicit flanker pools for a manipulated flanker condition (CONFIG.FLANKER_POOL_LOW / _HIGH).
  const explicit = level === "low" ? CONFIG.FLANKER_POOL_LOW : level === "high" ? CONFIG.FLANKER_POOL_HIGH : null;
  if (explicit) {
    const set = new Set(explicit);
    pool = pool.filter((p) => set.has(p.FACE));
    level = null;  // already restricted; skip the norm-based thirds below
  }
  const g = target.norm && target.norm.gender;
  if (CONFIG.FLANKER_MATCH_GENDER && g) pool = pool.filter((p) => p.norm && p.norm.gender === g);
  if (level === "high") pool = pool.filter((p) => p.norm && p.norm.alone_mean >= HIGH_CUT);
  if (level === "low") pool = pool.filter((p) => p.norm && p.norm.alone_mean <= LOW_CUT);
  const a = R.sampleWithoutReplacement(pool, 1)[0];
  const b = R.sampleWithoutReplacement(pool.filter((p) => p.k !== a.k), 1)[0];
  return [a, b];
}

// ---------- trial list ----------
function makeTrial(k, posIdx, condIdx, mirrored, flankerLevel, slot) {
  const cond = CONFIG.CONDITIONS[condIdx];
  const pos = POS[posIdx];
  const target = PEOPLE.find((p) => p.k === k && p.pos === pos);
  const t = { task: "rating", photo: k, person_pos: pos, FACE: target.FACE, condition: cond.name,
              kind: cond.kind, mirrored: false, target_norm: target.norm ? target.norm.alone_mean : null,
              target_set: TARGET_SET[target.FACE] || "" };
  if (cond.kind === "boxed_single") {
    t.images = [singleImage(k, pos)]; t.screen_pos = "M";
  } else if (cond.kind === "artificial") {
    flankerLevel = cond.flankers || flankerLevel;  // a condition can fix the flanker type
    const fl = pickFlankers(target, flankerLevel);
    // The target goes in its original slot unless a balanced slot is given (CONFIG.BALANCE_SLOTS).
    const where = slot || pos;
    const slots = {}; slots[where] = target;
    POS.filter((p) => p !== where).forEach((p, i) => { slots[p] = fl[i]; });
    t.images = POS.map((p) => singleImage(slots[p].k, slots[p].pos));
    t.screen_pos = where;
    t.flanker_level = flankerLevel || "random";
    t.flank1_FACE = fl[0].FACE; t.flank2_FACE = fl[1].FACE;
    t.flank_norm_mean = fl[0].norm && fl[1].norm ? (fl[0].norm.alone_mean + fl[1].norm.alone_mean) / 2 : null;
  } else { // photo
    t.images = [cond.code === "N" ? `IMG_N${k}.png` : `IMG_${pos}${cond.code}${k}.png`];
    let sp = cond.code === "S" ? "M" : pos;
    if (mirrored) sp = FLIP[sp];
    t.screen_pos = sp; t.mirrored = mirrored; t.condition_code = cond.code;
  }
  t.image = t.images.join("|");
  return t;
}

function buildCells(list) {
  const nC = CONFIG.CONDITIONS.length;
  const cells = [];
  if (CONFIG.DESIGN === "all_conditions") {
    // Fully within-subject: every person in every condition (photos x 3 positions x conditions).
    for (const k of PHOTOS)
      for (let p = 0; p < 3; p++) {
        if (USE_TARGET_LIST && !TARGET_SET[faceId(k, p)]) continue;  // only the listed targets
        for (let c = 0; c < nC; c++) cells.push([k, p, c]);
      }
  } else if (CONFIG.DESIGN === "one_per_person") {
    // Latin square: person (k, pos) gets condition (k + pos + list) mod nC.
    for (const k of PHOTOS)
      for (let p = 0; p < 3; p++) cells.push([k, p, (k + p + list) % nC]);
  } else {
    let combos = [];
    while (combos.length < PHOTOS.length)
      for (let p = 0; p < 3; p++) for (let c = 0; c < nC; c++) combos.push([p, c]);
    combos = R.shuffle(combos).slice(0, PHOTOS.length);
    PHOTOS.forEach((k, i) => cells.push([k, combos[i][0], combos[i][1]]));
  }
  return cells;
}

function buildTrials(list) {
  const cells = buildCells(list);
  // Balanced flanker levels across artificial trials, balanced mirroring across photo trials.
  const artIdx = cells.map((c, i) => i).filter((i) => CONFIG.CONDITIONS[cells[i][2]].kind === "artificial");
  const levels = {};
  if (CONFIG.FLANKER_MODE === "high_low")  // alternate high/low within each target position
    [0, 1, 2].forEach((p) => R.shuffle(artIdx.filter((i) => cells[i][1] === p))
      .forEach((i, j) => { levels[i] = j % 2 ? "high" : "low"; }));
  const photoIdx = cells.map((c, i) => i).filter((i) => CONFIG.CONDITIONS[cells[i][2]].kind === "photo");
  const mirror = new Set(R.shuffle(photoIdx).slice(0, Math.round(CONFIG.MIRROR_PROPORTION * photoIdx.length)));
  // Balanced slots within each session: targets are shuffled separately within each target set
  // (plain / attractive), and the j-th target's group trial in condition c goes in slot (j + c) mod 3.
  // So every set x condition cell has a third of its targets in each slot, a target's group trials
  // land in different slots, and which target gets which slot differs between participants.
  const slotOf = {};
  if (CONFIG.BALANCE_SLOTS) {
    const order = {};
    const sets = {};
    cells.forEach(([k, p]) => { const f = faceId(k, p); const s = TARGET_SET[f] || "all";
      (sets[s] = sets[s] || new Set()).add(f); });
    Object.values(sets).forEach((fs) => R.shuffle([...fs]).forEach((f, j) => { order[f] = j; }));
    cells.forEach(([k, p, c], i) => {
      if (CONFIG.CONDITIONS[c].kind === "artificial") slotOf[i] = POS[(order[faceId(k, p)] + c) % 3];
    });
  }
  return cells.map(([k, p, c], i) => makeTrial(k, p, c, mirror.has(i), levels[i], slotOf[i]));
}

// ---------- display ----------
// Arrow x for a photo trial: measured position of the person (stim_layout.js), else a fixed third.
function photoArrowX(t) {
  if (t.task !== "rating") return ARROW_X[t.screen_pos];
  if (t.screen_pos === "M" && t.condition_code === "S") return 0.5;
  const lay = typeof STIM_LAYOUT !== "undefined" && STIM_LAYOUT[String(t.photo)];
  const x = lay && lay[t.person_pos] !== undefined ? lay[t.person_pos] : ARROW_X[t.person_pos];
  return t.mirrored ? 1 - x : x;
}

function arrowSVG(xFrac, visible = true) {
  return `<svg width="40" height="48" viewBox="0 0 40 48"
      style="position:absolute;top:0;left:${xFrac * 100}%;transform:translateX(-50%);visibility:${visible ? "visible" : "hidden"};">
      <path d="M14 0 H26 V28 H38 L20 48 L2 28 H14 Z" fill="#D7261E"/></svg>`;
}

// One display, drawn in a given phase:
//   "image": the image(s) only, no arrow
//   "arrow": the image(s) removed, the arrow alone at the target's position
// Both phases use the same layout (hidden elements keep their space), so the arrow lands
// exactly where the target was, including on mirrored trials.
function stimulusHTML(t, phase) {
  const h = CONFIG.IMAGE_HEIGHT_PX;
  const showImg = phase === "image" ? "visible" : "hidden";
  const showArrow = phase === "arrow";
  if (t.kind === "boxed_single" || t.kind === "artificial") {
    // The arrow is anchored to the target's own box, so crops of different widths still line up.
    const targetBox = t.kind === "artificial" ? POS.indexOf(t.screen_pos) : 0;
    const boxes = t.images.map((im, i) => `
      <div style="position:relative;padding-top:56px;">
        ${i === targetBox ? arrowSVG(0.5, showArrow) : ""}
        <div style="border:${CONFIG.BOX_BORDER};line-height:0;visibility:${showImg};">
          <img src="${CONFIG.IMAGE_DIR}${im}" style="height:${h}px;display:block;"></div>
      </div>`).join("");
    return `<div style="display:inline-flex;gap:${CONFIG.BOX_GAP_PX}px;align-items:flex-end;">${boxes}</div>`;
  }
  const flip = t.mirrored ? "transform:scaleX(-1);" : "";
  return `<div style="position:relative;display:inline-block;padding-top:56px;">${arrowSVG(photoArrowX(t), showArrow)}
            <img src="${CONFIG.IMAGE_DIR}${t.images[0]}" style="height:${h}px;display:block;visibility:${showImg};${flip}"></div>`;
}

// A trial is three screens, as in the lab study: image alone, then arrow alone, then the slider.
function ratingTrial(t) {
  const data = Object.assign({}, t); delete data.images;
  const phaseScreen = (phase, ms) => ({
    type: jsPsychHtmlKeyboardResponse, choices: "NO_KEYS", trial_duration: ms,
    stimulus: stimulusHTML(t, phase), data: { task: phase + "_phase" }
  });
  return { timeline: [
    phaseScreen("image", CONFIG.IMAGE_MS),
    phaseScreen("arrow", CONFIG.ARROW_MS),
    {
      type: jsPsychHtmlSliderResponse,
      stimulus: `<p style="font-size:20px;margin:18px 0 4px;">${CONFIG.PROMPT}</p>`,
      labels: CONFIG.SLIDER_LABELS,
      min: CONFIG.SLIDER_MIN, max: CONFIG.SLIDER_MAX, step: 1,
      slider_start: CONFIG.SLIDER_START,
      slider_width: 700,
      require_movement: true,
      button_label: "Continue",
      data: data,
      on_finish: (d) => {
        d.rating = Number(d.response);
        if (t.task === "catch") d.catch_passed = Math.abs(d.rating - t.correct_rating) <= CONFIG.CATCH_TOLERANCE;
      }
    }
  ] };
}

const blank = { type: jsPsychHtmlKeyboardResponse, stimulus: "", choices: "NO_KEYS",
                trial_duration: CONFIG.ITI_MS, data: { task: "iti" } };

// ---------- timeline ----------
async function main() {
  // Counterbalancing list: ?list= in the URL wins, then DataPipe's balanced assignment, then random.
  const nLists = CONFIG.DESIGN === "one_per_person" ? CONFIG.CONDITIONS.length : 1;
  let list = parseInt(url("list"));
  if (isNaN(list)) {
    list = Math.floor(Math.random() * nLists);
    if (CONFIG.DATAPIPE_ID && !DEBUG && nLists > 1) {
      try { list = (await jsPsychPipe.getCondition(CONFIG.DATAPIPE_ID)) % nLists; } catch (e) { /* keep random */ }
    }
  }
  jsPsych.data.addProperties({ participant: PID, study_id: STUDY_ID, session_id: SESSION_ID, list: list,
                               design: CONFIG.DESIGN, flanker_mode: CONFIG.FLANKER_MODE });

  let trials = buildTrials(list);
  if (DEBUG) trials = R.shuffle(trials).slice(0, 9);
  trials = R.shuffleNoRepeats(trials, (a, b) => a.photo === b.photo);

  // Catch trials: kind "boxed_single" shows the image like a Single trial (boxed, arrow centered);
  // otherwise it is shown like a photo with the arrow at a random position.
  const catchTrials = R.shuffle(CONFIG.CATCH_TRIALS.map((c) => ({
    task: "catch", kind: c.kind || "photo", images: [c.image], image: c.image, correct_rating: c.correct,
    screen_pos: c.kind === "boxed_single" ? "M" : R.sampleWithoutReplacement(POS, 1)[0], mirrored: false })));
  const mainTimeline = [];
  const gap = Math.max(1, Math.floor(trials.length / (catchTrials.length + 1)));
  let ci = 0;
  const nBlocks = CONFIG.BREAK_EVERY ? Math.ceil(trials.length / CONFIG.BREAK_EVERY) : 1;
  trials.forEach((t, i) => {
    if (CONFIG.BREAK_EVERY && i > 0 && i % CONFIG.BREAK_EVERY === 0) {
      const done = i / CONFIG.BREAK_EVERY;
      mainTimeline.push({ type: jsPsychHtmlButtonResponse, choices: ["Continue"], data: { task: "break" },
        stimulus: `<p>You have finished part ${done} of ${nBlocks}.</p><p>Take a short break if you like, then press Continue.</p>` });
    }
    mainTimeline.push(blank, ratingTrial(t));
    if (ci < catchTrials.length && (i + 1) % gap === 0) mainTimeline.push(blank, ratingTrial(catchTrials[ci++]));
  });

  const allImages = [...new Set([...trials, ...catchTrials].flatMap((t) => t.images)
    .concat(CONFIG.PRACTICE_IMAGES))].map((im) => CONFIG.IMAGE_DIR + im);

  const timeline = [];
  timeline.push({
    timeline: [{ type: jsPsychHtmlKeyboardResponse, choices: "NO_KEYS", data: { task: "screen_too_small" },
      stimulus: "<p>This study needs a larger screen. Please return the study on Prolific and use a laptop or desktop computer.</p>" }],
    conditional_function: () => window.innerWidth < CONFIG.MIN_WINDOW_WIDTH
  });
  timeline.push({ type: jsPsychHtmlButtonResponse, stimulus: CONFIG.CONSENT_HTML,
                  choices: ["I agree to take part"], data: { task: "consent" } });
  timeline.push({ type: jsPsychPreload, images: allImages, show_progress_bar: true,
                  message: "<p>Loading images...</p>", max_load_time: 120000,
                  error_message: "<p>The images failed to load. Please return the study and contact the researcher.</p>" });
  timeline.push({ type: jsPsychHtmlButtonResponse, stimulus: CONFIG.INSTRUCTIONS_HTML,
                  choices: ["Start"], data: { task: "instructions" } });
  CONFIG.PRACTICE_IMAGES.forEach((img) => timeline.push(blank, ratingTrial(
    { task: "practice", kind: "photo", images: [img], image: img, screen_pos: "M", mirrored: false })));
  if (CONFIG.PRACTICE_IMAGES.length) timeline.push({ type: jsPsychHtmlButtonResponse,
    stimulus: "<p>That was the practice. The main task starts now.</p>", choices: ["Continue"], data: { task: "instructions" } });
  timeline.push(...mainTimeline);
  timeline.push({
    type: jsPsychSurveyHtmlForm, data: { task: "demographics" }, button_label: "Continue",
    preamble: "<p>A few questions about you (optional).</p>",
    html: `<p>Age: <input name="age" type="number" min="18" max="100"></p>
           <p>Gender: <input name="gender" type="text"></p>
           <p>Any technical problems? <input name="problems" type="text" size="50"></p>`
  });
  if (CONFIG.DATAPIPE_ID && !DEBUG) {
    timeline.push({ type: jsPsychPipe, action: "save", experiment_id: CONFIG.DATAPIPE_ID,
                    filename: `${PID}_${SESSION_ID || Date.now()}.csv`,
                    data_string: () => jsPsych.data.get().filterCustom((d) =>
                      ["rating", "catch", "demographics"].includes(d.task)).csv() });
  }
  timeline.push({ type: jsPsychHtmlButtonResponse, choices: ["Finish and return to Prolific"],
                  stimulus: "<p>Thank you! Your responses have been saved.</p>", data: { task: "end" } });

  jsPsych.run(timeline);
}

main();
