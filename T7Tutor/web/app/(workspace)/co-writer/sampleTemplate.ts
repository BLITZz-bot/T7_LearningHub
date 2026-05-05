const FENCE = "```";

export const CO_WRITER_SAMPLE_TEMPLATE = `# T7 Tutor Co-Writer

> T7 Tutor's built-in writing canvas for notes, reports, tutorials, and AI-assisted drafts.

### Features

- Support Standard Markdown / CommonMark / GFM for everyday writing
- Real-time preview for headings, tables, code, math, flowchart, and sequence diagrams
- AI editing workflows for rewrite, shorten, and expand
- HTML tag decoding for tags like <sub>, <sup>, <abbr>, and <mark>
- A practical starter draft for T7 Tutor product docs and learning content

## Table of Contents

[TOCM]

[TOC]

#T7 Tutor Mission
##T7 Tutor Product Surface
###T7 Tutor Learning Experience
####T7 Tutor Co-Writer
#####T7 Tutor Knowledge Layer
######T7 Tutor Agent Runtime

#T7 Tutor Docs [Project Overview](#t7-tutor-mission "Jump to project overview")
##T7 Tutor Authoring [Co-Writer Section](#t7-tutor-co-writer "Jump to co-writer section")
###T7 Tutor Research [Learning Note](#t7-tutor-learning-note "Jump to learning note")

## Headers (Underline)

T7 Tutor Learning Note
=============

T7 Tutor Study Outline
-------------

### Characters

----

~~Deprecated behavior~~ <s>Legacy formatting path</s>
*Italic* _Italic_
**Emphasis** __Emphasis__
***Emphasis Italic*** ___Emphasis Italic___

Superscript: X<sub>2</sub>, Subscript: O<sup>2</sup>

**Abbreviation(link HTML abbr tag)**

The <abbr title="Large Language Model">LLM</abbr> layer powers T7 Tutor while the <abbr title="Retrieval Augmented Generation">RAG</abbr> layer provides grounded knowledge support.

### Blockquotes

> T7 Tutor helps students turn questions into structured understanding.
>
> "Learn deeply, write clearly.", [T7 Tutor](#t7-tutor-co-writer)

### Links

[T7 Tutor Overview](#t7-tutor-mission)

[T7 Tutor Co-Writer](#t7-tutor-co-writer "co-writer section")

[T7 Tutor Runtime](#t7-tutor-agent-runtime)

[Reference link][t7tutor-doc]

[t7tutor-doc]: #t7-tutor-learning-note

### Code Blocks

#### Inline code

\`t7tutor chat --once "Summarize this section"\`

#### Code Blocks (Indented style)

    from t7tutor.runtime.orchestrator import ChatOrchestrator
    orchestrator = ChatOrchestrator()
    print("T7 Tutor is ready.")

#### Python

${FENCE}python
from t7tutor.runtime.orchestrator import ChatOrchestrator
from t7tutor.core.context import UnifiedContext


async def run_demo() -> str:
    orchestrator = ChatOrchestrator()
    context = UnifiedContext(
        user_query="Explain Newton's second law",
        capability="chat",
    )
    result = await orchestrator.run(context)
    return result.get("response", "")
${FENCE}

#### JSON config

${FENCE}json
{
  "app_name": "T7 Tutor",
  "default_capability": "chat",
  "enabled_tools": ["rag", "web_search", "code_execution", "reason"],
  "ui": {
    "co_writer_template": true
  }
}
${FENCE}

#### HTML code

${FENCE}html
<section class="t7tutor-card">
  <h1>T7 Tutor</h1>
  <p>Write, revise, and organize learning content with AI.</p>
</section>
${FENCE}

### Images

![](/logo-ver2.png)

> T7 Tutor brand mark used inside the co-writer template.

### Lists

- T7 Tutor Chat
- T7 Tutor Co-Writer
- T7 Tutor Research

1. Draft a concept note
2. Ask AI to refine it
3. Export the polished markdown

### Tables

Feature       | Description
------------- | -------------
Co-Writer     | Draft and refine Markdown content
Chat          | Ask questions and iterate ideas
Research      | Build structured multi-step reports

| Capability    | Primary Use Case                     |
| ------------- | ------------------------------------ |
| \`chat\`       | General tutoring and guidance        |
| \`deep_solve\` | Structured problem solving           |
| \`deep_question\` | Question generation and validation |

### Markdown extras

- [x] Draft a T7 Tutor product note
- [x] Add references and structure
- [ ] Polish the final explanation
  - [ ] Check headings
  - [ ] Check citations

### TeX (LaTeX)

$$ E=mc^2 $$

Inline $$E=mc^2$$ appears in physics notes, and Inline $$a^2+b^2=c^2$$ appears in geometry notes.

$$\(\sqrt{3x-1}+(1+x)^2\)$$

$$ \sin(\alpha)^{\theta}=\sum_{i=0}^{n}(x^i + \cos(f))$$

### FlowChart

${FENCE}flow
st=>start: Student asks a question
op=>operation: T7 Tutor analyzes intent
cond=>condition: Need deep workflow?
chat=>operation: Answer with chat capability
solve=>operation: Route to deep solve
e=>end: Return structured response

st->op->cond
cond(no)->chat
cond(yes)->solve
chat->e
solve->e
${FENCE}

### Sequence Diagram

${FENCE}seq
Student->T7 Tutor: Ask for help
T7 Tutor->KnowledgeBase: Load context
Note right of T7 Tutor: Collect memory\nand relevant knowledge
T7 Tutor-->Student: Return guided response
Student->>T7 Tutor: Request rewrite in co-writer
${FENCE}

### End
`;
