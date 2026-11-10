# Cheerleader effect study for Prolific (jsPsych 8)

Each trial shows a target person marked by a red arrow, rated on a continuous 0 to 9 slider.

## Conditions (default)

| Condition | What participants see | Images used |
|---|---|---|
| Single | The target's face cut-out alone, in a bordered box | `IMG_{L,M,R}S{k}.png` |
| Artificial | The target's crop plus two crops from **other** photos, each in its own bordered box with a small gap | `IMG_{L,M,R}S{k}.png` (built on screen) |
| Group | The original group photo | `IMG_N{k}.png` |

Artificial groups keep visible faces to average but remove any sign that the people belong together. All faces in the set are the same gender, so flankers are not gender-matched. Cut-outs keep a little of each photo's background (and sometimes a sliver of a neighbor), so a few background cues remain. The target keeps its original slot (left, middle or right), so position effects can be compared with the Group condition. The Emoji condition can be switched back on in `config.js`.

## Design

`DESIGN: "one_per_person"` (default): all 291 people are rated once each, about 20 minutes. Each person appears in one condition per participant, and the condition rotates across three counterbalanced lists, so across participants every person is seen in every condition. Recruit in multiples of 3.

`DESIGN: "one_per_photo"`: 97 trials (about 7 minutes). Each photo is used once, so no participant sees a person or photo twice.

`FLANKER_MODE: "high_low"` assigns each artificial trial to flankers from the top or bottom third of the lab's alone-ratings (`face_norms.js`), which manipulates flanker attractiveness directly. `"random"` draws any two people from two other photos.

## Setup

1. Download the image folder from Google Drive (Drive zips it), unzip it, then run
   `pip install pillow numpy` and `python3 tools/prepare_stimuli.py /path/to/unzipped/folder`.
   This trims the white canvas from every image, saves them into `stimuli/` with lowercase `.png` names, and writes `stim_layout.js` so arrows sit exactly over each person. `stimuli/` already holds three simple attention-check images; replace them with the lab versions if you prefer (same file names).
2. Edit `config.js`: consent text, instructions, Prolific completion code, design options.
3. Create a free DataPipe experiment at https://pipe.jspsych.org, connect it to an OSF project, turn on data collection and condition assignment (number of conditions = number of conditions in `config.js`), and paste its ID into `DATAPIPE_ID`.
4. Host the folder. Easiest: a public GitHub repository with GitHub Pages turned on. Pavlovia or Cognition.run also work.
5. In Prolific, set the study URL to
   `https://YOUR-SITE/index.html?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}`
   and restrict devices to desktop.

## Testing

Set `PHOTOS: [1, 2, 3]` in `config.js` for a short pilot on a few photos. Open `index.html?debug=1` in Chrome to run 9 trials and see the data at the end. Add `&list=1` to force a counterbalancing list. Chrome blocks local images from `file://` pages unless started with `--allow-file-access-from-files`; serving the folder is simpler: run `python3 -m http.server` in this folder and open `http://localhost:8000/index.html?debug=1`.

## Data (one row per trial)

| Column | Meaning |
|---|---|
| participant, study_id, session_id | Prolific IDs |
| list | Counterbalancing list |
| task | `rating`, `catch` or `demographics` |
| condition, kind | Condition name and how it was drawn |
| photo, person_pos, FACE | Photo number, the person's position in the original photo, person ID (same scheme as the lab data) |
| screen_pos | Where the arrow appeared (L, M, R) |
| image | Image file(s) shown, left to right, separated by `\|` |
| flank1_FACE, flank2_FACE, flank_norm_mean, flanker_level | Artificial trials: who the flankers were and their mean lab alone-rating |
| target_norm | Target's mean lab alone-rating |
| mirrored | Whether a photo was mirror-flipped |
| rating, rt | Response on the 0 to 9 scale, response time in ms |
| catch_passed | Catch trials: rating within 0.5 of the requested value |
