# BILINGUAL CONTENT & DATA SPEC — ENGLISH + RUSSIAN

# 1. CORE LANGUAGE RULE
The canonical technical terminology layer is English.
The complete public interface must also exist in Russian.

Default:
ENGLISH

Available:
EN — English
RU — Русский

Put a compact global language switcher in the upper-right corner on desktop.
On mobile, place it in top controls or settings.

Do not use flags as the primary language control.

# 2. GLOBAL SWITCH
Changing language must update EVERYTHING:
- site navigation
- domain names
- nodes
- definitions
- core ideas
- detailed explanations
- examples
- status labels
- relation labels
- breadcrumbs
- tooltips
- search
- Tree View
- Timeline
- Application
- Learning Paths
- Sources
- Formal Framework
- buttons
- errors
- empty states
- accessibility labels

Preserve:
- selected node
- current view
- graph focus
- open panel
- camera position where practical

Never send the user back to root merely because language changed.

# 3. ORIGINAL TERMINOLOGY
English term is canonical.

Russian mode should normally show the Russian term while preserving the English original as a secondary technical reference where useful.

Examples:

EN: Overt Act
RU: Оверт (Overt Act)

EN: Withhold
RU: Висхолд (Withhold)

EN: Thetan
RU: Тэтан (Thetan)

EN: ARC Triangle
RU: Треугольник АРО (ARC Triangle)

Use one glossary globally.
Never translate a technical term differently on different screens.

# 4. CANONICAL IDS
IDs must not depend on display language.

Good:
- overt-act
- eight-dynamics
- reactive-mind
- arc-triangle

Never create Russian IDs as separate canonical records.

# 5. ROUTING
Preferred:
- /en/...
- /ru/...

Example:
/en/concept/overt-act
/ru/concept/overt-act

Switching language preserves the same canonical concept slug.

At root `/`:
- use saved preference if available
- otherwise default to English

# 6. SEARCH
Search both language indexes.

Any of these should find one canonical concept:
- Overt
- Overt Act
- Оверт
- оверт-акт

The result display language follows the active locale.

# 7. CONCEPT MODEL
Recommended:

```ts
type LocalizedText = {
  en: string
  ru: string
}

type KnowledgeConcept = {
  id: string
  legacyIds?: string[]

  type:
    | "concept"
    | "domain"
    | "application_topic"
    | "formal_framework"
    | "timeline_era"

  primaryDomainId?: string
  parentId?: string | null

  title: LocalizedText
  shortTitle?: LocalizedText

  aliases?: {
    en?: string[]
    ru?: string[]
  }

  shortDefinition: LocalizedText
  coreIdea?: LocalizedText
  explanation?: LocalizedText
  simpleExample?: LocalizedText
  practicalUse?: LocalizedText
  caution?: LocalizedText

  epistemicStatus?: {
    key: string
    label: LocalizedText
  }

  tags?: string[]
  sourceIds?: string[]
  learningPathIds?: string[]
  applicationContextIds?: string[]

  metadata?: {
    firstKnownPeriod?: string
    originalTerm?: string
    notes?: LocalizedText
  }
}
```

# 8. RELATIONS
Relations are language-independent.

```ts
type KnowledgeRelation = {
  id: string
  sourceId: string
  targetId: string
  type:
    | "parent_of"
    | "related_to"
    | "depends_on"
    | "contrasts_with"
    | "historically_precedes"
    | "historically_develops_into"
    | "applied_in"
    | "source_for"
    | "part_of_learning_path"

  label?: LocalizedText
  weight?: number
}
```

Do NOT create separate EN and RU graph relations.

# 9. SOURCE MODEL
```ts
type SourceRecord = {
  id: string
  originalTitle: string

  title?: {
    en?: string
    ru?: string
  }

  author?: string
  year?: number
  exactDate?: string

  sourceType:
    | "book"
    | "lecture"
    | "article"
    | "bulletin"
    | "policy_letter"
    | "course"
    | "compilation"
    | "reference"

  edition?: string
  chapter?: string
  section?: string
  page?: string

  linkedConceptIds: string[]

  verificationStatus:
    | "verified"
    | "partially_verified"
    | "needs_verification"
}
```

# 10. SOURCE TITLE RULE
Preserve the original title.
Russian translation is an additional presentation field, never a replacement for the original.

# 11. PAGE NUMBER RULE
Never attach a page number without edition information.

Prefer:
- work title
- chapter
- section
- lecture title/date
- bulletin/policy identifier

# 12. EPISTEMIC STATUS
Normalize status keys, for example:

internal_model
EN: Model within Hubbard's system
RU: Модель внутри системы Хаббарда

historical_dianetics_model
EN: Historical Dianetics model; not scientific consensus
RU: Историческая модель Дианетики; не научный консенсус

religious_doctrinal_claim
EN: Religious / doctrinal claim
RU: Религиозно-доктринальное утверждение

internal_technical_term
EN: Internal technical term
RU: Внутренний технический термин

organizational_framework
EN: Organizational framework within Hubbard's system
RU: Организационная модель внутри системы Хаббарда

formal_system_statement
EN: Formal proposition within the system
RU: Формальное положение системы

# 13. TRANSLATION WORKFLOW
1. Create/verify canonical English record.
2. Add Russian translation.
3. Verify terminology against global glossary.
4. Track translation status internally.

Optional:
translationStatus.ru = verified | draft | missing

# 14. FALLBACK
In development:
- English fallback is acceptable
- mark missing Russian translation for editors

In production:
- do not break layout
- preferably do not publish required nodes until both core languages are ready

# 15. USER EXPERIENCE GOAL
English mode:
best for terminology close to original works.

Russian mode:
best for comprehension and discussion.

It is ONE graph, ONE database, ONE set of canonical concepts, with TWO complete presentation languages.
