# Openverse SFX Search

## When this is loaded

The user chose Openverse to find a sound effect. This reference covers searching the Openverse API, downloading candidates, and the multi-choice approval flow.

## Overview

Openverse is a search engine for openly-licensed creative works (audio, images). It aggregates content from multiple sources and exposes a free REST API with no authentication required. All results carry CC0, Public Domain, or CC-BY licenses suitable for video production.

## Prerequisites

- `curl` available (standard on macOS/Linux)
- No API key required

## Rate limiting

The Openverse API applies rate limits. If you receive a 429 response, wait 2 seconds and retry. Rate limits expire after ~1 second, so a 2-second pause is always sufficient.

## API endpoint

**Search endpoint:** `GET https://api.openverse.org/v1/audio/`

**Query parameters:**

| Parameter | Required | Description |
|---|---|---|
| `q` | Yes | Search query. Use `+` to join words (e.g., `keyboard+typing`). |
| `license` | No | Comma-separated license filter. Default: `cc0,pdm,by`. |
| `category` | No | `music` or `sound_effect`. For SFX, always set `category=sound_effect`. |
| `page_size` | No | Results per page (1-50). Default: 20. |

**Example request:**

```bash
curl -s "https://api.openverse.org/v1/audio/?q=keyboard+typing&license=cc0,pdm,by&category=sound_effect&page_size=20"
```

**Response:** JSON object with a `results` array. Each result contains:

| Field | Description |
|---|---|
| `title` | Name of the audio asset. |
| `url` | Direct download URL for the audio file. |
| `creator` | Author/uploader name. |
| `license` | License identifier (e.g., `cc0`, `by`, `pdm`). |
| `tags` | Array of tag objects (`{ name: string }`). |
| `description` | Free-text description (may be empty). |
| `duration` | Duration in milliseconds. |
| `id` | UUID identifier for this asset. Used to construct the share link: `https://openverse.org/audio/<id>`. |

## Search workflow

### Step 1: Determine search query

Ask the user what sound they need (if not already clear from context). Construct a search query from their description:

- Use short, descriptive terms: `keyboard+typing`, `door+slam`, `whoosh`, `notification+chime`
- Add qualifiers if the user mentioned them: `mechanical+keyboard`, `soft+whoosh`

### Step 2: Execute search

```bash
curl -s "https://api.openverse.org/v1/audio/?q=<query>&license=cc0,pdm,by&category=sound_effect&page_size=20"
```

If the response is a 429 (rate limited), wait 2 seconds and retry:

```bash
sleep 2
curl -s "https://api.openverse.org/v1/audio/?q=<query>&license=cc0,pdm,by&category=sound_effect&page_size=20"
```

### Step 3: Evaluate results

Parse the JSON response. Filter results for relevance:

- Title or tags should match the desired sound
- Duration should be reasonable for an SFX (typically < 30s)
- Prefer `cc0` or `pdm` over `by` (no attribution required)

If no results match, try broadening the query (fewer terms, more generic words). If still nothing, inform the user and suggest alternative sources (BYO or ElevenLabs).

### Step 4: Multi-choice offer

If there are several qualifying matches (3+), offer the user a choice:

> We have found several possible SFX matches! Would you like us to:
>
> 1. **Download 5 candidates** -- you listen and pick your favorite
> 2. **Use the top match** -- we will download the best result directly

If fewer than 5 results qualify, download all qualifying results and adjust the numbered list accordingly (e.g., "Pick a number (1-3)" for 3 candidates).

If there are fewer than 3 matches, skip the offer and download the best match directly.

## Download: single track

Download the selected audio file into the SFX folder:

```bash
mkdir -p audio/originals/sfx/<slug>/
curl -L -o audio/originals/sfx/<slug>/audio.mp3 "<url from response>"
```

If the source URL points to a `.wav` or other format, save with the appropriate extension.

**Important:** Run curl with `-L` to follow redirects. Openverse URLs often redirect to the source hosting.

## Download: 5 candidates flow

When the user chooses the "download 5" option:

### Step A: Create candidates folder

```bash
mkdir -p audio/originals/sfx/<slug>/candidates/
```

### Step B: Download top 5 results

```bash
curl -L -o audio/originals/sfx/<slug>/candidates/1.mp3 "<url_1>"
curl -L -o audio/originals/sfx/<slug>/candidates/2.mp3 "<url_2>"
curl -L -o audio/originals/sfx/<slug>/candidates/3.mp3 "<url_3>"
curl -L -o audio/originals/sfx/<slug>/candidates/4.mp3 "<url_4>"
curl -L -o audio/originals/sfx/<slug>/candidates/5.mp3 "<url_5>"
```

If any download gets a 429, wait 2 seconds and retry that single request.

### Step C: Present candidates to user

Print a numbered list with clickable `file://` links and brief descriptions. **Internally track each candidate's `id` field** so you can record the winner's share link later.

```
Here are 5 SFX candidates in:
file:///absolute/path/to/audio/originals/sfx/<slug>/candidates/

1. <title_1> (by <creator_1>, <license_1>, <duration_1>s)
   file:///absolute/path/to/audio/originals/sfx/<slug>/candidates/1.mp3

2. <title_2> (by <creator_2>, <license_2>, <duration_2>s)
   file:///absolute/path/to/audio/originals/sfx/<slug>/candidates/2.mp3

3. ...

Pick a number (1-5), or let me know if you would like to hear more options.
```

### Step D: User picks a winner

Once the user picks (e.g., "3"):

1. Move the winner into position:
   ```bash
   mv audio/originals/sfx/<slug>/candidates/3.mp3 audio/originals/sfx/<slug>/audio.mp3
   ```

2. Delete the candidates folder:
   ```bash
   rm -rf audio/originals/sfx/<slug>/candidates/
   ```

3. Record the winner's `id` — use it to write the share link (`https://openverse.org/audio/<id>`) in the metadata `notes` field (Step 6).

4. Proceed to metadata and approval (Step 5 below).

If the user asks for more options or none of the 5 work, run a new search with adjusted terms or download the next batch of results.

## Step 5: Measure duration

```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  audio/originals/sfx/<slug>/audio.mp3
```

Round to 1 decimal place for `length_s`.

## Step 6: Write `sfx.ts`

Create `audio/originals/sfx/<slug>/sfx.ts`:

```ts
import type { SfxAsset } from "videowright";

export const sfx: SfxAsset = {
  name: "<title from Openverse or user-refined name>",
  description: "<description from Openverse or agent-written summary>",
  length_s: <measured duration>,
  source: "openverse",
  notes: "Openverse: <title> by <creator>. License: <license>. Share link: https://openverse.org/audio/<id>",
};

export default sfx;
```

Set `source: "openverse"` to record provenance. Always include the Openverse share link (`https://openverse.org/audio/<id>`), creator, and license in `notes` for attribution. The `<id>` is the `id` field from the API response.

There is no `generate.sh` for Openverse assets (the download is a one-time fetch, not a reproducible generation).

## Step 7: Trigger approval UX

Follow the approval flow from [../sfx.md](../sfx.md):

1. Print the clickable `file://` link to the audio file.
2. Prompt: Approve or Discard and request changes.
3. On Approve: asset is locked, ready for use in the audio plan.
4. On Discard: delete the folder, ask what to change, search again with adjusted terms.

## Iteration on discard

If the user discards and requests changes:

1. Delete the folder: `rm -rf audio/originals/sfx/<slug>/`
2. Ask what should change about the sound.
3. Adjust the search query based on feedback:
   - "Too long" -- filter results by duration
   - "Wrong type of sound" -- change the search terms
   - "Too noisy/quiet" -- try different search terms or suggest BYO/ElevenLabs instead
4. Re-run the search and download flow.

## Expected folder state after approval

```
audio/originals/sfx/<slug>/
  audio.mp3    # downloaded from Openverse (immutable after approval)
  sfx.ts       # typed metadata with provenance in notes
```

No `generate.sh` and no `candidates/` folder after approval.

## Edge cases

| Situation | Behavior |
|---|---|
| No results for the query | Broaden search terms. If still nothing, suggest BYO or ElevenLabs. |
| All results are too long (> 30s) | These may be music tracks miscategorized. Try adding more specific terms or switching to `category=music` if the user actually wants music. |
| Downloaded file is 0 bytes or corrupt | Delete and retry the download. If persistent, try a different result. |
| License is `by` (attribution required) | Note in `sfx.ts` notes that attribution is required. The agent does not enforce attribution in the final video but records the obligation. |
| Rate limited during batch download | Wait 2 seconds between each retry. Do not hammer the API. |
| User wants to search again after seeing candidates | Delete the candidates folder and re-run with new search terms. |
