# Production Setup & Breakdown Checklist

A phone-friendly, step-by-step checklist for weekly production setup and breakdown.
There are no build tools and no server. Open `index.html` in a browser to use it.

## Files

| File | What it is |
|---|---|
| `data/guides.js` | **All the steps.** Edit this file to change, add or reorder them. |
| `images/audio/` | Put the audio step photos here. |
| `data/config.js` | Where you paste the Google Sheet link (see below). |
| `google-sheet/` | The Google Sheet script and setup steps. |
| `index.html`, `app.js`, `styles.css` | The app itself. You normally don't need to touch these. |

## Adding a photo to a step

1. Take the photo. Landscape (4:3) looks best.
2. Save it to `images/audio/`, for example `images/audio/setup-mixer.jpg`.
3. In `data/guides.js`, find the step and set:
   ```js
   image: "images/audio/setup-mixer.jpg",
   ```
Until a step has a photo, it shows a "Photo coming soon" placeholder.

## Editing steps

- Every step needs a unique `id`. **Don't rename an `id` after people start using the app.** Saved check-offs are linked to it.
- `tip` shows in blue and `warning` shows in amber. Both are optional.
- To add the Visual steps later, copy the shape of the `audio` guide into the `visual` entry and remove `comingSoon: true`.

## Who ran it: the Google Sheet log

Each checklist starts by asking for a **name** and **date**. When it's finished, one row goes to a Google Sheet with the date, name, area, setup or breakdown, start and finish times, minutes taken, and notes.
To connect your sheet, follow [google-sheet/SETUP.md](google-sheet/SETUP.md). It takes about 5 minutes and is done once.

Check-offs made during a run are saved on the device being used. The finish screen has **Start a new setup/breakdown** for next week. **⋯ → Clear and start over** abandons a run partway through.

## Stock photos

All photos in `images/audio/stock/` are temporary examples from Wikimedia Commons (credits in `images/audio/stock/CREDITS.md`). They show an "Example photo" label in the app.
To replace one with your own, change the step's `image` path and **delete its `imageCredit` line**.
