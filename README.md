# SmartSearch — AI Floor Manager (Phase 1)

## Hackathon-ready project structure

- `server.js` — Node/Express backend + deterministic availability engine
- `public/index.html` — polished frontend
- `public/styles.css` — responsive visual design
- `public/app.js` — search UI, filters, rendering
- `package.json` — one-command setup

## Run locally

1. Install Node.js 18+.
2. Open a terminal in this folder.
3. Run:
   `npm install`
4. Run:
   `npm start`
5. Open:
   `http://localhost:3000`

## What the demo does

Natural-language requests are parsed into:
- floor
- feature
- capacity
- duration

The backend then checks every occupied timetable interval and only returns a room as available if the complete requested duration is free.

## Import the actual 10 timetables

The challenge description says the website should use 10 supplied timetables. The chat did not contain those timetable files, so this project ships with demo data to make the site immediately runnable.

Use the Import timetable button with a JSON file like:

{
  "rooms": [
    {
      "id": "G-101",
      "floor": "Ground Floor",
      "capacity": 40,
      "features": ["AC", "Projector"],
      "occupied": [["09:00","10:00"],["13:00","14:00"]]
    }
  ]
}

For the final submission, replace the demo records with the 10 actual timetable records.

## AI architecture for the presentation

User sentence -> intent extraction -> timetable availability engine -> floor-wise ranking/display.

For production, the `parseIntent()` function can be replaced by an LLM endpoint. Keep the timetable conflict check deterministic so the AI cannot hallucinate room availability.
