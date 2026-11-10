// Study settings. Edit this file; experiment.js should not need changes.
const CONFIG = {
  // ---- Prolific and data saving ----
  // Completion code from your Prolific study page (Study > Completion paths).
  PROLIFIC_COMPLETION_CODE: "CSDGFR2Z",
  // DataPipe experiment ID (https://pipe.jspsych.org). Leave "" to skip saving (testing only).
  DATAPIPE_ID: "0pxk8DHAkLZp",

  // ---- Design ----
  // "all_conditions": every person is rated once in EVERY condition, all in random order
  //   (291 people x number of conditions; with Single + Artificial that is 582 trials, about 45 min).
  // "one_per_person": every person (97 photos x 3 positions = 291) is rated once, in one
  //   condition. Conditions rotate across counterbalanced lists (one list per condition),
  //   so across participants every person is seen in every condition. About 20 min.
  // "one_per_photo": each photo is used once, for one person in one condition (97 trials,
  //   about 7 min). Position x condition cells are balanced within each participant.
  DESIGN: "all_conditions",
  N_PHOTOS: 97,
  // Optional: run only these photo numbers (e.g. [1, 2, 3] for a pilot). null = all photos 1..N_PHOTOS.
  PHOTOS: null,

  // Conditions. "kind" says how the trial is drawn:
  //   "boxed_single": the target's Single crop (IMG_{L|M|R}S{k}.png) alone in a bordered box
  //   "artificial":   the target's Single crop plus two Single crops from OTHER photos,
  //                   each in its own bordered box with a small gap (built on screen,
  //                   no new image files needed). The target keeps its original slot.
  //   "photo":        an original image; code "N" = IMG_N{k}.png (natural group),
  //                   code "E" = IMG_{L|M|R}E{k}.png (emoji), code "S" = IMG_{L|M|R}S{k}.png
  // Remove a line to drop a condition; the number of lists follows the number of conditions.
  CONDITIONS: [
    { name: "Single",          kind: "boxed_single" },
    { name: "Artificial_low",  kind: "artificial", flankers: "low" },   // flankers from FLANKER_POOL_LOW
    { name: "Artificial_high", kind: "artificial", flankers: "high" }   // flankers from FLANKER_POOL_HIGH
    // { name: "Group",   kind: "photo", code: "N" },
    // { name: "Emoji",   kind: "photo", code: "E" },
  ],

  // 2 x 2 design. Targets and flankers come from the two ends of the lab alone-ratings (0-9):
  // the 106 lowest-rated and 106 highest-rated faces, each split in alternating rank order into
  // targets and flankers so the two halves are equally attractive. Middle faces are not used.
  TARGET_FACES_LOW: ["Face255", "Face259", "Face124", "Face101", "Face170", "Face229", "Face247", "Face199", "Face263", "Face34", "Face76", "Face152", "Face231", "Face51", "Face39", "Face81", "Face221", "Face262", "Face42", "Face251", "Face7", "Face248", "Face40", "Face260", "Face139", "Face261", "Face10", "Face282", "Face291", "Face186", "Face100", "Face43", "Face75", "Face228", "Face38", "Face250", "Face155", "Face225", "Face220", "Face70", "Face120", "Face35", "Face98", "Face201", "Face173", "Face172", "Face274", "Face134", "Face79", "Face109", "Face20", "Face136", "Face209"],     // lab mean 3.95
  TARGET_FACES_HIGH: ["Face80", "Face72", "Face288", "Face32", "Face29", "Face57", "Face208", "Face218", "Face31", "Face140", "Face168", "Face245", "Face270", "Face223", "Face215", "Face205", "Face45", "Face71", "Face52", "Face227", "Face19", "Face84", "Face65", "Face194", "Face115", "Face189", "Face123", "Face82", "Face106", "Face53", "Face164", "Face253", "Face83", "Face104", "Face273", "Face110", "Face272", "Face239", "Face207", "Face85", "Face96", "Face121", "Face86", "Face188", "Face93", "Face177", "Face133", "Face187", "Face89", "Face175", "Face269", "Face285", "Face180"],   // lab mean 5.45
  FLANKER_POOL_LOW: ["Face161", "Face235", "Face233", "Face237", "Face49", "Face232", "Face222", "Face47", "Face145", "Face41", "Face8", "Face6", "Face97", "Face162", "Face257", "Face150", "Face159", "Face242", "Face169", "Face102", "Face214", "Face1", "Face266", "Face132", "Face46", "Face258", "Face107", "Face147", "Face13", "Face287", "Face185", "Face33", "Face252", "Face137", "Face118", "Face226", "Face138", "Face243", "Face119", "Face241", "Face142", "Face224", "Face230", "Face14", "Face158", "Face240", "Face77", "Face203", "Face196", "Face36", "Face48", "Face135", "Face280"],      // lab mean 3.97
  FLANKER_POOL_HIGH: ["Face55", "Face59", "Face193", "Face26", "Face183", "Face54", "Face200", "Face195", "Face68", "Face44", "Face268", "Face108", "Face141", "Face246", "Face289", "Face165", "Face113", "Face176", "Face4", "Face267", "Face290", "Face149", "Face181", "Face27", "Face50", "Face88", "Face166", "Face87", "Face16", "Face94", "Face278", "Face128", "Face160", "Face91", "Face182", "Face122", "Face144", "Face190", "Face284", "Face90", "Face56", "Face60", "Face103", "Face116", "Face64", "Face117", "Face211", "Face256", "Face127", "Face21", "Face105", "Face276", "Face112"],    // lab mean 5.43
  // How flankers in artificial groups are chosen, using FACE_NORMS (lab alone-ratings):
  //   "random":   any two people from two other photos
  //   "high_low": each artificial trial is assigned (balanced) to high or low flankers,
  //               drawn from the top or bottom third of alone-ratings. This manipulates
  //               flanker attractiveness directly.
  FLANKER_MODE: "random",
  // All faces in this set are the same gender, so no matching is needed. For a mixed set,
  // add a "gender" field to FACE_NORMS entries and set this to true.
  FLANKER_MATCH_GENDER: false,

  // Box appearance for "boxed_single" and "artificial" trials.
  BOX_BORDER: "4px solid #222222",
  BOX_GAP_PX: 16,

  // Proportion of "photo" trials shown mirror-flipped (0 = none). The arrow follows the person.
  MIRROR_PROPORTION: 0,

  // ---- Stimuli ----
  IMAGE_DIR: "stimuli/",
  // Attention checks, spread evenly through the session in random order.
  // famous1.png (Taylor Swift) is shown like a Single trial and pictured in the instructions;
  // participants are told to move the slider all the way to the left whenever she appears.
  CATCH_TRIALS: [
    { image: "famous1.png", correct: 0, kind: "boxed_single" },
    { image: "famous1.png", correct: 0, kind: "boxed_single" },
    { image: "famous1.png", correct: 0, kind: "boxed_single" },
    { image: "famous1.png", correct: 0, kind: "boxed_single" }
  ],
  PRACTICE_IMAGES: [],       // e.g. ["TUT1.png", "TUT2.png"]; [] skips practice
  IMAGE_HEIGHT_PX: 340,      // displayed height of every image (all crops share one height, so face scale is equal)
  ITI_MS: 400,
  BREAK_EVERY: 160,         // optional rest screen after every this many trials (0 = none)
  // Balance the target's slot (left, middle, right) in group trials within each session: a third of
  // each target set x flanker condition in each slot, a target's two group trials in different slots,
  // and which target gets which slot reshuffled for every participant. One version for everyone.
  BALANCE_SLOTS: true,
  IMAGE_MS: 1000,           // image shown alone
  ARROW_MS: 1000,           // then the image is removed and the arrow shown alone at the target's position

  // ---- Response scale ----
  // Numberless slider, recorded 0 (left end) to 1000 (right end), starting in the middle.
  SLIDER_MIN: 0,
  SLIDER_MAX: 1000,
  SLIDER_START: 500,
  SLIDER_LABELS: ["Unattractive", "Attractive"],
  CATCH_TOLERANCE: 50,       // catch trial passes if within this distance of the requested value
  PROMPT: "How attractive was the person the arrow pointed to?",

  // ---- Text ----
  // Time and payment assume 106 targets x 3 conditions = 318 trials (about 25 minutes).
  CONSENT_HTML: `
    <h2>The Perception of Facial Attractiveness</h2>
    <div style="text-align:left; max-width:760px; margin:auto; font-size:16px; line-height:1.5">
    <p>Drew Walker, PhD, of the Department of Cognitive Science at the University of California San Diego,
    is conducting a research study to learn how people judge the attractiveness of faces seen alone and
    in groups. You are being asked to take part because you are an adult who is eligible for this study on Prolific.</p>
    <p><b>What you will do.</b> You will see pictures of people and rate how attractive one marked person is,
    using a slider. The study takes about 25 minutes. You will receive $6.00 through Prolific for completing it.</p>
    <p><b>Risks.</b> The main risk is that information about you could be released to an unauthorized party.
    To reduce this risk, your responses are identified only by your Prolific ID and a study number,
    and the record linking them is kept separately from the study data. Data are stored securely
    on the Open Science Framework. We will keep your records confidential to the extent allowed by law,
    but we cannot guarantee confidentiality.</p>
    <p><b>Benefits.</b> There is no direct benefit to you. The study may help researchers understand how the
    visual system processes faces and how we make social judgments.</p>
    <p><b>Your rights.</b> Taking part is voluntary. You may stop at any time by closing this window, without
    penalty. If you stop early, you will not receive payment.</p>
    <p><b>Questions.</b> Contact Drew Walker at dehoffma@ucsd.edu. For questions about your rights as a research participant,
    contact the UC San Diego Office of IRB Administration at 858-246-4777 or irb@health.ucsd.edu.</p>
    <p>By clicking "I agree to take part" below, you confirm that you are 18 or older, have read this
    information, and agree to participate.</p>
    </div>`,
  INSTRUCTIONS_HTML: `
    <h2>Instructions</h2>
    <p style="text-align:left">On each trial you will briefly see a picture of one or more people.
    The picture will then disappear and an arrow will point to where one person was.
    Use the slider to rate how attractive that person was, from Unattractive to Attractive,
    then press Continue.</p>
    <p style="text-align:left"><b>Important:</b> if Taylor Swift appears, move the slider all the way to the left (Unattractive).</p>
    <img src="stimuli/famous1.png" style="height:200px;border:4px solid #222222;">`,
  MIN_WINDOW_WIDTH: 900
};
