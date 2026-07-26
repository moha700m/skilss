# Atlas Zero — Keyless agent architecture

Atlas Zero is the action layer inside SkillAtlas. Its design goal is useful intelligence with no
user-supplied AI key, no mandatory account, and no hidden cloud-model dependency.

## The three-layer brain

| Layer | Starts when | What it does | Network behavior |
| --- | --- | --- | --- |
| Atlas Core | Immediately | Finds, ranks, compares, explains, favorites, and prepares safe install plans for the full catalog | None for catalog reasoning |
| Public research | Only when the user enables web research or asks for it explicitly | Retrieves visible sources from fixed public providers | Sends a bounded query to GitHub, npm, and Wikipedia |
| Portable local AI | Only after explicit user approval | Runs Qwen3-0.6B in a Web Worker with WebGPU and browser caching | One public model download, then local inference |

The portable model is intentionally opt-in because its quantized files are hundreds of megabytes.
Atlas Core remains available on browsers that do not support WebGPU.

## Verified execution loop

```text
User request
    │
    ├──► deterministic intent + catalog retrieval
    │          │
    │          ├──► validated site actions
    │          └──► small grounding packet
    │                         │
    └────────────────────────► optional local model
                              │
                              ▼
                    natural-language response
                              │
                              ▼
                 user chooses an allowed action
```

The language model never receives shell access and never directly performs a write. Navigation,
favorite storage, copying, source opening, and install-plan generation are typed actions checked by
the deterministic executor. Future actions that affect external accounts must use OAuth and explicit
confirmation; “keyless” does not mean bypassing another service's authorization.

## Public internet research

Internet research is an explicit tool, not an invisible side effect. The server accepts a short query
and sends it only to fixed public endpoints:

- GitHub public repository search;
- the public npm registry;
- Arabic or English Wikipedia.

The user cannot supply a fetch destination, which removes an SSRF path. Requests have a timeout,
per-instance rate limit, bounded result count, plain-text sanitization, and visible source URLs. No AI
API key or server-side chat history is used. Queries are still shared with the selected public
providers, so the interface discloses that before use.

## Local privacy and storage

- Conversation history and favorites stay in browser storage.
- Local-model computation runs in a dedicated Worker so the interface remains responsive.
- Model artifacts use the browser cache and are not downloaded until the user asks.
- The model sees a compact grounding packet, not the entire 997-record catalog.
- Disabling the local brain releases its Worker/GPU resources. Clearing site data from browser settings
  removes local history and cached model state.

## Daily maintenance without a user API key

GitHub Actions refreshes upstream catalog metadata twice each day, runs parser tests, lint,
TypeScript, a production dependency audit, and the full build before committing a generated snapshot.
Dependabot proposes dependency changes in reviewed pull requests. A failed scheduled sync opens or
updates one maintenance issue instead of silently publishing partial data.

Runtime and model versions are pinned and should not be replaced automatically every day. They are
updated through tested pull requests because a model/runtime update has a larger supply-chain and
behavioral risk than a catalog-data refresh.

## Honest limits

- A 0.6B local model is a private planner and writer, not a replacement for the largest hosted models.
- WebGPU support and available memory vary by browser and device.
- Public APIs enforce anonymous quotas and can be temporarily unavailable.
- External private data and write actions require the relevant user's OAuth approval.
- Generated install instructions must be reviewed before execution; Atlas Zero does not run upstream
  scripts automatically.
