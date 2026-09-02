# CURSOR MASTER MIGRATION COMMAND — HUBBARD KNOWLEDGE MAP V2

Read these files first:
1. `01_KNOWLEDGE_ARCHITECTURE_V2.md`
2. `02_BILINGUAL_CONTENT_DATA_SPEC.md`

Then inspect the existing repository completely before changing anything.

# OBJECTIVE
Refactor the existing 12-ray Hubbard Knowledge Map into the V2 architecture without destroying useful design, data, interactions or source references.

# CURRENT RAYS TO FIND
- Foundation
- Ethics
- Dianetics
- Tone
- Communication
- Study
- Auditing
- Ontology
- Admin
- Application
- Axioms
- History

Identify all current concept IDs such as F01, E03, M09, etc.

# TARGET
8 PRIMARY DOMAINS:
1. Foundations & Ontology
2. Survival & Dynamics
3. Ethics & Social Environment
4. Mind & Dianetics
5. Emotion, ARC & Communication
6. Knowledge & Study
7. Auditing & Bridge
8. Groups, Organization & Management

GLOBAL VIEWS:
- Map
- Tree
- Timeline
- Application
- Learning Paths
- Sources
- Formal Framework

Application, History and Axioms must no longer compete as equal primary rays.

# NON-NEGOTIABLE DATA RULE
ONE CONCEPT = ONE CANONICAL ID.

Merge semantic duplicates.

Examples:
M09 Charge + P04 Charge
→ canonical `charge`
→ legacyIds ["M09","P04"]

E07 Personal Integrity + R03 Personal Integrity
→ canonical `personal-integrity`
→ legacyIds ["E07","R03"]

Use stable English semantic IDs.
Preserve old IDs as `legacyIds`.

# LANGUAGE SYSTEM
Implement complete EN/RU localization.

English is canonical and default.
Russian is the complete alternate UI.

Add compact global language selector in upper-right:
EN | RU

Switching language must update the WHOLE product:
navigation, nodes, definitions, explanations, examples, statuses, breadcrumbs, tooltips, search, all views, sources, buttons, errors, mobile UI.

Preserve selected concept and current view during switching.

Preferred routes:
/en/concept/overt-act
/ru/concept/overt-act

Keep canonical slug the same.

# SEARCH
Index both English and Russian terminology.
English search may find Russian UI nodes and vice versa.

# MIGRATION
Follow the exact old→new mapping in `01_KNOWLEDGE_ARCHITECTURE_V2.md`.

Important moves:
- F01/F02/F03 → Survival & Dynamics
- F04/F05/F06/F07 → Foundations & Ontology
- F08 → Communication
- E-series → Ethics
- M01–M10 → Mind & Dianetics
- M11 Clear → Auditing & Bridge
- Tone + Communication → one domain: Emotion, ARC & Communication
- C10 Control Start/Change/Stop → Foundations & Ontology
- Study → Knowledge & Study
- Auditing → Auditing & Bridge
- Ontology → Foundations & Ontology, except OT → Auditing & Bridge
- Admin → Groups, Organization & Management
- Application → global Application View
- Axioms → global Formal Framework
- History → global Timeline

# APPLICATION VIEW
Do not duplicate concepts.
Group existing canonical IDs by context:
Self, Relationships, Marriage/Family, Children, Work, Leadership, Groups, Conflict, Decision Making, Study, Communication, Ethics, Production.

# TIMELINE
Use the current H01–H09 content as era records.
Timeline records reference canonical concepts.
Do not clone concepts into timeline.

# FORMAL FRAMEWORK
Include:
- Dianetic Axioms
- Scientology Axioms
- The Factors
- Logics
- Codes
- Scales
- Awareness Levels
- Perceptics
- Definitions
- Admin Scale

# SOURCES
Normalize sources as first-class data.
Never fabricate:
- page numbers
- chapter names
- dates
- identifiers

If page number exists, store edition metadata.

# EPISTEMIC STATUS
Preserve and normalize current status labels.
Support English + Russian labels.
Do not present religious/doctrinal or historical technical claims as established scientific facts.

# TREE VS GRAPH
Each canonical concept has:
- one primary domain
- one primary parent for Tree View
- unlimited semantic relations

Tree = orientation.
Graph = meaning.

# MAP
Replace 12 domain constellations with 8.
Keep the premium cosmic visual language and current successful interactions where possible.

# TREE
Show canonical hierarchy only.
Do not flood Tree View with cross-links.

# KNOWLEDGE PANEL
For each concept support:
- localized title
- original English term
- short definition
- core idea
- detailed explanation
- simple example
- practical use/context
- parent
- children
- related concepts
- epistemic status
- historical period
- sources
- recommended reading
- learning paths

In RU mode, show English original as a secondary term where useful.

# VALIDATION
Create automated checks for:
- duplicate canonical IDs
- broken relations
- missing relation targets
- duplicate semantic concepts
- missing EN title
- missing RU title
- invalid legacy ID collision
- missing source references
- nodes lacking a primary domain
- timeline duplication

If appropriate create:
`npm run validate:knowledge`

# MIGRATION REPORT
Create:
`MIGRATION_REPORT_V2.md`

For every old node record:
- old ID
- old branch
- new canonical ID
- new primary domain
- moved / merged / split / unchanged
- relations migrated
- unresolved issues
- missing RU translation
- source verification issues

# IMPLEMENTATION ORDER
PHASE A — Audit current repository
PHASE B — Implement canonical data model
PHASE C — Migrate 12 rays → 8 domains + global views
PHASE D — Merge duplicates and validate graph
PHASE E — Implement EN/RU localization
PHASE F — Update Map, Tree, Timeline, Application, Learning Paths, Sources, Formal Framework
PHASE G — Restore/refine premium cosmic visuals
PHASE H — QA desktop, mobile, performance, routes, search, data integrity

# IMPORTANT
Do NOT begin by rebuilding the visual design from scratch.
Do NOT blindly regenerate existing content.
Do NOT delete useful data.

First understand the existing project, then migrate it incrementally.

# FINAL RESULT
The site must feel like ONE bilingual living knowledge system:
- 8 clear subject domains
- one canonical graph
- full English/Russian switch
- no semantic duplicates
- historical Timeline
- practical Application view
- Formal Framework
- Sources
- Learning Paths
- cross-language search
- shareable concept routes
- preserved original English terminology
