# Meeting Summaries API

Read-only JSON API over the SingularityNET Ambassador Program meeting archive.
Every endpoint supports filtering, sorting and pagination.

Base path: `/api/v1`

## Authentication

Every request needs the server API key. Send it in one of these ways:

```
x-api-key: <key>
Authorization: Bearer <key>
```

The legacy `api_key` header is also accepted. The key is the value of the
`SERVER_API_KEY` environment variable on the server. It is a secret: never
embed it in client-side code.

| Status | Code                   | Meaning                                    |
|--------|------------------------|--------------------------------------------|
| 401    | `missing_api_key`      | No key was sent                            |
| 403    | `invalid_api_key`      | The key does not match                     |
| 500    | `server_misconfigured` | `SERVER_API_KEY` is not set on the server  |

Note that the dashboard pages (`/search`, `/charts`) render the same data
without a key. The key protects the API surface, not the dataset itself.

## Response shape

Successful responses:

```json
{
  "data": [ ... ],
  "meta": {
    "total": 1234,
    "limit": 50,
    "offset": 0,
    "hasMore": true,
    "loadedAt": "2026-09-25T10:15:00.000Z"
  }
}
```

`loadedAt` is when the server last loaded the dataset from the database. The
server caches the dataset in memory for five minutes.

Errors:

```json
{ "error": { "code": "invalid_param", "message": "limit must be an integer between 1 and 500" } }
```

| Status | Code                 |
|--------|----------------------|
| 400    | `invalid_param`      |
| 404    | `not_found`          |
| 405    | `method_not_allowed` |
| 500    | `internal_error`     |

Only `GET` and `OPTIONS` are allowed. CORS is open (`*`). Responses are sent
with `Cache-Control: private, no-store`.

## Meeting summary object

`/meetings` returns rows in this shape. Fields inside `summary` are only
present when the documenter filled them in, so treat everything except
`workgroup`, `workgroup_id`, `meetingInfo`, `type`, `canceledSummary` and
`noSummaryGiven` as optional. Even `agendaItems` is absent on cancelled or
no-summary meetings. The example below shows every field observed across the
archive; a typical row has far fewer.

```json
{
  "meeting_id": "ff4d5ef9-3354-4192-86b9-e5e66601cc8f",
  "created_at": "2026-01-12T19:51:16.20138+00:00",
  "updated_at": "2026-02-10T13:29:25.625+00:00",
  "confirmed": true,
  "workgroup_id": "649a933f-3067-468f-891e-dbe47adcb88a",
  "name": "Monthly",
  "date": "2026-01-12T00:00:00",
  "summary": {
    "workgroup": "AI Ethics WG",
    "workgroup_id": "649a933f-3067-468f-891e-dbe47adcb88a",
    "type": "custom",
    "meetingInfo": {
      "name": "Monthly",
      "date": "2026-01-12",
      "host": "CallyFromAuron",
      "documenter": "CallyFromAuron",
      "peoplePresent": "CallyFromAuron, UKnowZork, PeterE",
      "purpose": "Monthly meeting of the AI Ethics Workgroup",
      "workingDocs": [
        { "title": "AI Ethics WorkGroup Github board", "link": "https://github.com/..." }
      ],
      "meetingVideoLink": "https://...",
      "miroBoardLink": "https://...",
      "otherMediaLink": "https://...",
      "transcriptLink": "https://...",
      "mediaLink": "https://...",
      "googleSlides": "https://...",
      "townHallNumber": "42",
      "timestampedVideo": {
        "url": "https://...",
        "intro": "Opening remarks",
        "timestamps": "00:00 Intro\n05:12 Updates",
        "sections": [ { "title": "Intro", "content": "..." } ]
      }
    },
    "agendaItems": [
      {
        "agenda": "Unconference recordings",
        "status": "carry over",
        "narrative": "Free-text summary of the discussion, may contain markdown",
        "discussion": "Older free-text field, rarely used",
        "discussionPoints": [ "Point one", "Point two" ],
        "meetingTopics": [ "Topic" ],
        "issues": [ "Issue" ],
        "learningPoints": [ "Lesson" ],
        "townHallUpdates": "...",
        "townHallSummary": "...",
        "gameRules": "...",
        "actionItems": [
          {
            "text": "Vani and Tina to work on the AI And Ecology session",
            "assignee": "CallyFromAuron, Tina Shriver",
            "dueDate": "26 January 2026",
            "status": "in progress"
          }
        ],
        "decisionItems": [
          {
            "decision": "Introduction to qualitative coding session with Esther",
            "rationale": "Why the decision was taken",
            "opposing": "Arguments raised against it, if any",
            "effect": "mayAffectOtherPeople"
          }
        ]
      }
    ],
    "tags": {
      "topicsCovered": "interview transcription, interviews, transcription backlog",
      "emotions": "forward-looking, organised, quiet",
      "gamesPlayed": "Only used by the gaming workgroups",
      "other": "..."
    },
    "noSummaryGiven": false,
    "noSummaryGivenText": "No Summary Given",
    "canceledSummary": false,
    "canceledSummaryText": "Meeting was cancelled"
  }
}
```

Field notes:

| Field | Notes |
|-------|-------|
| `meeting_id` | Stable unique id. Use it with `/meetings/{meeting_id}`. |
| `confirmed` | `true` for archived summaries. `false` rows are recent drafts with no archived version yet. |
| `date` | Row-level timestamp of the meeting date. Prefer `summary.meetingInfo.date`, which is a plain `YYYY-MM-DD`. |
| `summary.type` | Summary template. Currently `custom`, though casing varies (`Custom` also occurs). The `type` filter is case-insensitive. |
| `summary.meetingInfo.peoplePresent` | Comma-separated names in one string. |
| `summary.meetingInfo.workingDocs` | Present on most rows. Links, slides and video fields are present only when provided. |
| `summary.agendaItems` | Absent when `canceledSummary` or `noSummaryGiven` is `true`. |
| `summary.agendaItems[].status` | `carry over` or `resolved`. |
| `summary.agendaItems[].actionItems[].text` | Occasionally missing. `/action-items` skips items with no text. |
| `summary.agendaItems[].actionItems[].assignee` | Comma-separated names in one string. The `assignee` filter matches any one of them. |
| `summary.agendaItems[].actionItems[].dueDate` | Human-readable, for example `26 January 2026`. Not ISO. Use the `due*` filters on `/action-items` for date comparisons. |
| `summary.agendaItems[].actionItems[].status` | Lower-case, for example `todo`, `in progress`, `done`, `cancelled`. `/facets` lists the values in use. |
| `summary.agendaItems[].decisionItems[].effect` | `affectsOnlyThisWorkgroup` or `mayAffectOtherPeople`, or absent. |
| `summary.agendaItems[].decisionItems[].rationale` / `opposing` | Optional free text. |
| `summary.tags` | Absent on some rows. Each value is a comma-separated string, not an array. `topicsCovered` and `emotions` are the common ones; `gamesPlayed` and `other` are rare. The `tag` filter matches any single entry across all of them. |
| `summary.canceledSummary` / `noSummaryGiven` | When `true`, the meeting was cancelled or no summary was written and `agendaItems` will be empty. |

### Templates vary by workgroup

Each workgroup writes its summaries from its own meeting template, so which
`agendaItems` and `meetingInfo` fields are filled in depends on the workgroup
more than on the meeting. Do not assume a field is present because another
workgroup's rows have it. The main patterns in the archive:

| Fields | Used by |
|--------|---------|
| `actionItems`, `decisionItems`, `discussionPoints`, `tags.topicsCovered`, `tags.emotions`, `workingDocs` | Most workgroups. This is the common core. |
| `agendaItems[].agenda`, `meetingInfo.miroBoardLink` | Treasury Guild, Treasury Automation WG, Treasury Policy WG, Knowledge Base Workgroup, Dework PBL, GitHub PBL WG. These groups structure the summary by agenda item title. |
| `agendaItems[].narrative` | African Guild, AI Ethics WG, Governance Workgroup, LatAm Guild, Strategy Guild, Writers Workgroup. A free-text write-up instead of, or alongside, bullet points. |
| `agendaItems[].townHallSummary`, `meetingInfo.townHallNumber`, `meetingInfo.timestampedVideo` | Ambassador Town Hall and Deep Funding Town Hall. Town halls are recorded, so most rows carry a video URL with timestamped sections. |
| `agendaItems[].gameRules`, `tags.gamesPlayed` | Gamers Guild only. |
| `agendaItems[].meetingTopics` | Research and Development Guild, Education Workgroup, WG Sync Call. |
| `agendaItems[].issues`, `agendaItems[].learningPoints`, `agendaItems[].townHallUpdates` | Onboarding Workgroup, occasionally Writers Workgroup. |
| `agendaItems[].discussion` | WG Sync Call only. An older free-text field. |
| `meetingInfo.meetingVideoLink` | Archives Workgroup on almost every row; scattered elsewhere. |
| `tags.other` | Rare, mostly LatAm Guild. |

`meetingInfo.name` is the meeting cadence rather than a title: `Weekly`,
`Biweekly`, `Monthly` or `One-off event`. A few workgroups use their own
labels such as `Think-Tank` or `Sandbox`.

When writing a client, read the fields you need with a fallback for absence,
and use the `q` search (which looks across every text field) rather than
targeting one field if you want results from all workgroups.

`/action-items` and `/decisions` return the nested items flattened into one
row each, with `workgroup`, `workgroup_id`, `meeting_id` and the meeting date
added. See those sections for their fields.

## Common parameters

These apply to `/meetings`, `/action-items` and `/decisions`.

| Param       | Type            | Description |
|-------------|-----------------|-------------|
| `q`         | string          | Case-insensitive substring search. See each endpoint for the fields searched. |
| `workgroup` | string          | Matches the `workgroup_id` exactly, or the workgroup name case-insensitively. Call `/api/v1/facets` for the list of valid ids and names. |
| `date`      | `YYYY-MM-DD`    | Exact meeting date. |
| `dateFrom`  | `YYYY-MM-DD`    | Inclusive lower bound on the meeting date. |
| `dateTo`    | `YYYY-MM-DD`    | Inclusive upper bound on the meeting date. |
| `sort`      | enum            | Sort field. Options differ per endpoint. |
| `order`     | `asc` \| `desc` | Sort direction. Default `desc`. |
| `limit`     | integer         | Page size, 1 to 500. Default 50. |
| `offset`    | integer         | Number of items to skip. Default 0. |

Unknown parameters are ignored. Invalid values return 400.

## GET /api/v1/meetings

Returns full meeting summary rows (`meeting_id`, `created_at`, `updated_at`,
`confirmed`, `workgroup_id`, `name`, `date`, and the `summary` JSON with
agenda items, action items, decisions, meeting info and tags).

| Param       | Description |
|-------------|-------------|
| `q`         | Searches tags and content: workgroup, meeting name, purpose, host, documenter, people present, agenda narratives, discussion points, topics, issues, learning points, action item text, decisions, and timestamped video notes. When set, each result includes `matches: { tags, content }` with the number of hits. |
| `tag`       | Case-insensitive match against any tag in `topicsCovered`, `emotions` or `other`. |
| `type`      | Case-insensitive match on `summary.type`. |
| `confirmed` | `true` or `false`. Confirmed rows are archived summaries. Unconfirmed rows are drafts from the last three months with no archived version. |
| `host`      | Case-insensitive match on the meeting host. |
| `assignee`  | Meetings containing at least one action item assigned to this person. |
| `sort`      | `date` (default) or `updated_at`. |

```bash
curl -H "x-api-key: $KEY" \
  "https://<host>/api/v1/meetings?q=treasury&workgroup=Archives%20Workgroup&dateFrom=2025-01-01&limit=10"
```

## GET /api/v1/meetings/{meeting_id}

Returns a single meeting summary in `data`. 404 if the id is unknown.

```bash
curl -H "x-api-key: $KEY" "https://<host>/api/v1/meetings/<meeting_id>"
```

## GET /api/v1/action-items

Returns action items flattened out of every meeting. Each item has `text`,
`assignee`, `dueDate`, `status`, `workgroup`, `workgroup_id`, `meeting_id` and
`meetingDate`.

| Param      | Description |
|------------|-------------|
| `q`        | Searches text, assignee, workgroup and status. |
| `status`   | Case-insensitive match, for example `in progress`. |
| `assignee` | Case-insensitive exact match against any name in a comma-separated assignee list. |
| `due`      | Exact due date, `YYYY-MM-DD`. |
| `dueFrom`  | Inclusive lower bound on the due date. |
| `dueTo`    | Inclusive upper bound on the due date. |
| `sort`     | `dueDate` (default) or `date` (meeting date). |

Items with no due date are excluded whenever a `due*` filter is set.

```bash
curl -H "x-api-key: $KEY" \
  "https://<host>/api/v1/action-items?status=in%20progress&dueFrom=2025-01-01&sort=dueDate&order=asc"
```

## GET /api/v1/decisions

Returns decisions flattened out of every meeting. Each has `decision`,
`effect`, `rationale`, `opposing`, `workgroup`, `workgroup_id`, `date` and
`meeting_id`.
`meta.stats` carries totals over the whole filtered set:

```json
"stats": { "total": 42, "withRationale": 30, "withEffect": 40, "rationalePercentage": 71, "effectPercentage": 95 }
```

| Param    | Description |
|----------|-------------|
| `q`      | Searches decision, effect, rationale and workgroup. |
| `effect` | Exact match, usually `affectsOnlyThisWorkgroup` or `mayAffectOtherPeople`. |
| `sort`   | `date` only. |

```bash
curl -H "x-api-key: $KEY" \
  "https://<host>/api/v1/decisions?effect=mayAffectOtherPeople&q=budget"
```

## GET /api/v1/facets

Returns the distinct values available for each filter, with counts, so a
client can build dropdowns. `workgroups` lists every workgroup with its `id`
and display `name`; either can be used as the `workgroup` filter on the other
endpoints, and names are matched case-insensitively. `statuses`, `assignees`,
`effects`, `tags` and `types` give the valid values for those filters.

```json
{
  "data": {
    "workgroups": [ { "id": "...", "name": "Archives Workgroup", "count": 120 } ],
    "statuses":   [ { "value": "in progress", "label": "In Progress", "count": 15 } ],
    "assignees":  [ { "value": "jane", "label": "Jane", "count": 8 } ],
    "effects":    [ { "value": "mayAffectOtherPeople", "label": "mayAffectOtherPeople", "count": 40 } ],
    "tags":       [ { "value": "governance", "label": "governance", "count": 33 } ],
    "types":      [ { "value": "custom", "label": "Custom", "count": 200 } ]
  },
  "meta": { "loadedAt": "..." }
}
```

```bash
# list the workgroup names, then filter by one (URL-encode spaces)
curl -H "x-api-key: $KEY" "https://<host>/api/v1/facets"
curl -H "x-api-key: $KEY" "https://<host>/api/v1/meetings?workgroup=Archives%20Workgroup"
```

## Fetching everything

Page size is capped at 500. To download the whole archive, step `offset` by
`limit` until `meta.hasMore` is `false`:

```bash
curl -H "x-api-key: $KEY" "https://<host>/api/v1/meetings?limit=500&offset=0"
curl -H "x-api-key: $KEY" "https://<host>/api/v1/meetings?limit=500&offset=500"
# continue while meta.hasMore is true
```

`meta.total` on the first response tells you how many pages to expect. Add
`confirmed=true` to fetch only archived summaries.

With 1003 meetings in the archive, the first page looks like this
(`summary` objects abbreviated):

```json
{
  "data": [
    {
      "meeting_id": "ff4d5ef9-3354-4192-86b9-e5e66601cc8f",
      "created_at": "2026-01-12T19:51:16.20138+00:00",
      "updated_at": "2026-02-10T13:29:25.625+00:00",
      "confirmed": true,
      "workgroup_id": "649a933f-3067-468f-891e-dbe47adcb88a",
      "name": "Monthly",
      "date": "2026-01-12T00:00:00",
      "summary": { "workgroup": "AI Ethics WG", "meetingInfo": { "date": "2026-01-12" }, "agendaItems": [ ... ] }
    },
    {
      "meeting_id": "0a1b2c3d-...",
      "confirmed": true,
      "workgroup_id": "2d56e7d8-52ba-4be0-837f-a9a14ae4dc6e",
      "name": "Weekly",
      "date": "2026-01-10T00:00:00",
      "summary": { "workgroup": "African Guild", "meetingInfo": { "date": "2026-01-10" }, "agendaItems": [ ... ] }
    }
    // ... 498 more
  ],
  "meta": { "total": 1003, "limit": 500, "offset": 0, "hasMore": true, "loadedAt": "2026-09-25T06:55:47.075Z" }
}
```

The second page (`offset=500`) has the same shape with `"offset": 500` and
`"hasMore": true`. The third (`offset=1000`) returns the last three rows:

```json
{
  "data": [ { ... }, { ... }, { ... } ],
  "meta": { "total": 1003, "limit": 500, "offset": 1000, "hasMore": false, "loadedAt": "2026-09-25T06:55:47.075Z" }
}
```

Concatenating the three `data` arrays gives all 1003 meetings, ordered by
meeting date, newest first. Each item is the object described under "Meeting
summary object" above. The same applies to `/action-items` and `/decisions`.
