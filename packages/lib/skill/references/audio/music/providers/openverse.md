# Openverse Music Search

## When this is loaded

The user chose Openverse to find background music. This reference covers searching the Openverse API, downloading candidates, and the multi-choice approval flow.

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
| `q` | Yes | Search query. Use `+` to join words (e.g., `corporate+uplifting`). |
| `license` | No | Comma-separated license filter. Default: `cc0,pdm,by`. |
| `category` | No | `music` or `sound_effect`. For music, always set `category=music`. |
| `page_size` | No | Results per page (1-50). Default: 20. |

**Example request:**

```bash
curl -s "https://api.openverse.org/v1/audio/?q=corporate+uplifting&license=cc0,pdm,by&category=music&page_size=20"
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

Ask the user what mood/style of music they want (if not already clear from context). Construct a search query:

- Use mood + genre terms: `corporate+uplifting`, `calm+ambient+piano`, `energetic+electronic`
- Add qualifiers: `instrumental`, `background`, `no+vocals`
- Consider the video's tone and duration when selecting terms

### Step 2: Execute search

```bash
curl -s "https://api.openverse.org/v1/audio/?q=<query>&license=cc0,pdm,by&category=music&page_size=20"
```

If the response is a 429 (rate limited), wait 2 seconds and retry:

```bash
sleep 2
curl -s "https://api.openverse.org/v1/audio/?q=<query>&license=cc0,pdm,by&category=music&page_size=20"
```

### Step 3: Evaluate results

Parse the JSON response. Filter results for relevance:

- Title, tags, or description should match the desired mood/genre
- Duration should be reasonable for background music (typically 30s-5min)
- Prefer `cc0` or `pdm` over `by` (no attribution required)
- Longer tracks are generally better (can always slice; cannot extend)

If no results match, try broadening the query (fewer terms, more generic words). If still nothing, inform the user and suggest alternative sources (BYO or ElevenLabs).

### Step 4: Multi-choice offer

If there are several qualifying matches (3+), offer the user a choice:

> We have found several possible music matches! Would you like us to:
>
> 1. **Download 5 candidates** -- you listen and pick your favorite
> 2. **Use the top match** -- we will download the best result directly

If fewer than 5 results qualify, download all qualifying results and adjust the numbered list accordingly (e.g., "Pick a number (1-3)" for 3 candidates).

If there are fewer than 3 matches, skip the offer and download the best match directly.

## Download: single track

Download the selected audio file into the music folder:

```bash
mkdir -p audio/originals/music/<slug>/
curl -L -o audio/originals/music/<slug>/audio.mp3 "<url from response>"
```

If the source URL points to a `.wav` or other format, save with the appropriate extension.

**Important:** Run curl with `-L` to follow redirects. Openverse URLs often redirect to the source hosting.

## Download: 5 candidates flow

When the user chooses the "download 5" option:

### Step A: Create candidates folder

```bash
mkdir -p audio/originals/music/<slug>/candidates/
```

### Step B: Download top 5 results

```bash
curl -L -o audio/originals/music/<slug>/candidates/1.mp3 "<url_1>"
curl -L -o audio/originals/music/<slug>/candidates/2.mp3 "<url_2>"
curl -L -o audio/originals/music/<slug>/candidates/3.mp3 "<url_3>"
curl -L -o audio/originals/music/<slug>/candidates/4.mp3 "<url_4>"
curl -L -o audio/originals/music/<slug>/candidates/5.mp3 "<url_5>"
```

If any download gets a 429, wait 2 seconds and retry that single request.

### Step C: Present candidates to user

Print a numbered list with clickable `file://` links and brief descriptions. **Internally track each candidate's `id` field** so you can record the winner's share link later.

```
Here are 5 music candidates in:
file:///absolute/path/to/audio/originals/music/<slug>/candidates/

1. <title_1> (by <creator_1>, <license_1>, <duration_1>s)
   file:///absolute/path/to/audio/originals/music/<slug>/candidates/1.mp3

2. <title_2> (by <creator_2>, <license_2>, <duration_2>s)
   file:///absolute/path/to/audio/originals/music/<slug>/candidates/2.mp3

3. ...

Pick a number (1-5), or let me know if you would like to hear more options.
```

### Step D: User picks a winner

Once the user picks (e.g., "3"):

1. Move the winner into position:
   ```bash
   mv audio/originals/music/<slug>/candidates/3.mp3 audio/originals/music/<slug>/audio.mp3
   ```

2. Delete the candidates folder:
   ```bash
   rm -rf audio/originals/music/<slug>/candidates/
   ```

3. Record the winner's `id` — use it to write the share link (`https://openverse.org/audio/<id>`) in the metadata `notes` field (Step 6).

4. Proceed to metadata and approval (Step 5 below).

If the user asks for more options or none of the 5 work, run a new search with adjusted terms or download the next batch of results.

## Step 5: Measure duration

```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  audio/originals/music/<slug>/audio.mp3
```

Round to 1 decimal place for `length_s`.

## Step 6: Write `music.ts`

Create `audio/originals/music/<slug>/music.ts`:

```ts
import type { MusicAsset } from "videowright";

export const music: MusicAsset = {
  name: "<title from Openverse or user-refined name>",
  description: "<description from Openverse or agent-written summary>",
  length_s: <measured duration>,
  source: "openverse",
  notes: `
    Openverse: <title> by <creator>. License: <license>.
    Share link: https://openverse.org/audio/<id>
    BPM: <from metadata or user-confirmed>
    Mood: <observed mood>
    Structure: <observed sections if discernible>
  `,
};

export default music;
```

Set `source: "openverse"` to record provenance. Always include the Openverse share link (`https://openverse.org/audio/<id>`), creator, and license in `notes` for attribution. The `<id>` is the `id` field from the API response.

### Agent-observed details

After downloading, the agent should note in `notes` any details available from Openverse metadata (tags, description, title). Additionally, ask the user to listen and confirm:

- BPM (only include if provided by Openverse metadata or confirmed by the user — do not estimate)
- Mood and energy level (infer from tags/title/description)
- Whether the track likely has vocals (flag as a concern for VO ducking; infer from tags if available)
- Loop-ability (infer from title/tags if indicated)
- Any other relevant details from the metadata

There is no `generate.sh` for Openverse assets.

## Step 7: Trigger approval UX

Follow the approval flow from [../music.md](../music.md):

1. Print the clickable `file://` link to the audio file.
2. Prompt: Approve or Discard and request changes.
3. On Approve: asset is locked, ready for use in the audio plan.
4. On Discard: delete the folder, ask what to change, search again with adjusted terms.

## Iteration on discard

If the user discards and requests changes:

1. Delete the folder: `rm -rf audio/originals/music/<slug>/`
2. Ask what should change about the music.
3. Adjust the search query based on feedback:
   - "Too energetic" -- try `calm`, `ambient`, `gentle`
   - "Too boring" -- try `upbeat`, `energetic`, `dynamic`
   - "Wrong genre" -- change genre terms entirely
   - "Too short" -- filter by duration in results, prefer longer tracks
   - "Has vocals" -- add `instrumental` to query
4. Re-run the search and download flow.

## Expected folder state after approval

```
audio/originals/music/<slug>/
  audio.mp3    # downloaded from Openverse (immutable after approval)
  music.ts     # typed metadata with provenance and musical details in notes
```

No `generate.sh` and no `candidates/` folder after approval.

## Edge cases

| Situation | Behavior |
|---|---|
| No results for the query | Broaden search terms. If still nothing, suggest BYO or ElevenLabs. |
| All results are very short (< 15s) | These may be SFX miscategorized as music. Try more specific genre terms or increase `page_size`. |
| Downloaded file is 0 bytes or corrupt | Delete and retry the download. If persistent, try a different result. |
| License is `by` (attribution required) | Note in `music.ts` notes that attribution is required. The agent does not enforce attribution in the final video but records the obligation. |
| Rate limited during batch download | Wait 2 seconds between each retry. Do not hammer the API. |
| Track has vocals | Warn the user that vocals may conflict with voiceover. Suggest searching with `instrumental` added to the query. |
| User wants to search again after seeing candidates | Delete the candidates folder and re-run with new search terms. |
| Music is shorter than the video | Use `aloop` in ffmpeg to loop it. Note loop points in `music.ts` notes. See [../../ffmpeg_cookbook.md](../../ffmpeg_cookbook.md). |
