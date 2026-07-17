# HOLLOW OATH — Rename & Narrative Brief

*A&M internal — companion brief to GAME_DESIGN.md. Archived verbatim as the record
of the decision that drove the DOIDS → Hollow Oath rename. For what was actually
executed against this brief, see [CHANGELOG.md](CHANGELOG.md).*

Last updated: July 2026

---

## 0. Purpose

Two jobs in one pass:

1. Rename the project from DOIDS to HOLLOW OATH, cleanly, everywhere it's
   visible or discoverable.
2. Thread the title's meaning through the narrative properly, rather than
   leaving "Hollow" and "Oath" as separate, unconnected ideas the player has
   to infer.

Nothing here changes core mechanics, scoring balance, or level structure.
This is copy, naming, and a small amount of new rank/reveal logic.

---

## 1. Rename scope

Everywhere the project is currently called DOIDS or "Doids" needs to change.
Working list — verified against the actual codebase during execution:

- **Title screen / in-game title text**
- **`<title>` tag and any meta description in `index.html`**
- **`manifest.webmanifest`** — `name` and `short_name` fields
- **Apple touch icon labels**, if any reference the name as alt text
- **GitHub repository name** (`Doids` → new repo name) and the live URL
  that follows from it.
- **Branch names** — left as-is (not user-facing).
- **Code comments / internal variable names** referencing "Doids" — comments
  updated for clarity; identifiers left as-is (not user-facing).
- **`localStorage` keys** — left as-is (invisible to players; renaming would
  wipe existing testers' saved progress).

**Resolved:** on-screen title uses **mixed case — "Hollow Oath"**.

---

## 2. Making the title earn its place

The mechanic already supports the theme — chasing secrets in the Hollows can cost
you the no-fire "oath" bonus — but nothing in the game said so. The fix is a
handful of copy insertions plus one small new piece of logic (§3).

### 2.1 A line in Glycon's mouth
Delivered on THE SHRINE reveal, attributed to the maker:

> *"An oath you never test is easy to keep."*

### 2.2 Naming the counterfeit's method directly
Added to the Workshop reveal — the moment the player connects "hollow" to the
title:

> *"Not corrupted. Hollow. Built empty, and dressed to be carried home."*

### 2.3 Ending text — say what the title already means

| Ending | Existing | Add |
|---|---|---|
| THE ANSWERED CALL | *"like a fever breaking"* | *"The oath, kept whole."* |
| SILENCE BY FIRE | Sector Warden rank | *"Quiet, at a cost. The oath, hollowed."* |
| ROTATION COMPLETE | unresolved | *"Left hollow. The Static answers still."* |

---

## 3. New rank tier: Hollow Keeper

Give players who broke their no-fire streak while chasing secrets (lure-trees,
hollow rocks) a distinct, named outcome, rather than folding silently into a
lower score.

**Trigger:** player reaches THE ANSWERED CALL ending, **but** fired at a
lure-tree or hollow rock during the run (broke the oath via secret-hunting, not
via combat). Flavour: *"You found what he hid. It cost you the oath to do it."*

**Resolved (from a code read):** the scoring state previously tracked only
*whether* a shot was fired (`runFired`), not *why*. Execution added `firedAtSecret`
and `firedAtCombat` flags; HOLLOW KEEPER = answered + `firedAtSecret` +
`!firedAtCombat`.

---

## 4. Not in scope for this pass

- No changes to sector structure, enemy behaviour, scoring values, or the
  secrets inventory.
- No new art assets required — all insertions are text.
- The "Future ideas (unbuilt)" list in GAME_DESIGN.md §10 is untouched.

---

## 5. Decisions taken

1. Title casing: **mixed case, "Hollow Oath".**
2. Repo rename: **yes** — `Doids` → `Hollow-Oath` (GitHub Settings action;
   in-repo references updated in anticipation — see CHANGELOG.md).
3. Copy insertions (§2): used as drafted.
4. Hollow Keeper (§3): **built.**
5. Androids renamed to **Scions** — carriers of true medical science, the
   culmination of generations of human and machine endeavour.
