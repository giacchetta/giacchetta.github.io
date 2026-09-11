#!/usr/bin/env python3
"""to-linkedin.py — convert a generated blog post's Markdown body into
plain text ready to paste into LinkedIn's post composer.

Why this exists: LinkedIn's composer accepts plain text only — no Markdown,
no HTML. Bold headings, bold bullet lead-ins, and inline code in the
generated posts (see linkedin-post.system.md's Structure section) render as
literal `**stars**` and backticks if pasted as-is. This script maps that
Markdown onto Unicode "Mathematical Alphanumeric Symbols" look-alike glyphs
(bold/italic/monospace letters that are visually styled but are still plain
text, not Markdown) and Markdown bullets onto the `•`/`◦`/`▪` characters
LinkedIn's own composer produces when you type them by hand — the same trick
every LinkedIn-formatter web tool (e.g. authoredup.com) performs, done here
so it's part of the pipeline instead of a manual copy/paste/reformat step.

Known, accepted trade-off: Unicode math-alphabet letters are NOT real bold/
italic text to screen readers or to LinkedIn's own search index — some
screen readers skip them, others spell them out letter by letter, and
LinkedIn does not index text set in them the way it indexes plain text. This
is the same trade every plain-text LinkedIn formatter makes. It is accepted
here knowingly: the hook, lead, and prose stay ordinary ASCII, so only bold
lead-ins, section headings, and inline-code identifiers are affected.

Second, sharper trade-off: every character mapped to a Unicode math glyph is
in the Supplementary Multilingual Plane (astral) and costs TWO UTF-16 code
units — not one. LinkedIn's own character counter (and, per public reports,
its post-length enforcement) counts UTF-16 code units, the same as
JavaScript's `String.length`, not Unicode codepoints. A post that looks like
2,900 characters in a plain-text editor can be 3,400+ once its bold/code
spans are converted — see linkedin-post.system.md's Length section, which
was tightened alongside this script for exactly this reason. This script
reports BOTH counts and treats the UTF-16 one as the binding constraint.

Frontmatter is dropped entirely — this tool converts the BODY only. The
post's `title` is deliberately NOT prepended to the output: the body's first
line is designed as a standalone hook (linkedin-post.system.md's Hook rule)
because that line is exactly what LinkedIn shows in its "…see more" mobile
preview. Prepending the title would push the real hook below the fold.

Usage:
    python3 to-linkedin.py <post.md> [-o out.txt] [--strict]
    python3 to-linkedin.py --self-test

Converted text goes to stdout (or -o's file); a one-line stats summary goes
to stderr, so stdout stays a pure copy-paste payload. Exit code is always 0
unless --strict is given and the UTF-16 length exceeds LinkedIn's cap —
matching sanitize-post.py's warn-don't-fail stance (see that script's
header): this tool never blocks the post PR by default, the CODEOWNER
review is the backstop, and --strict is for local/manual use only.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

LINKEDIN_LIMIT = 3000
HOOK_LIMIT = 140

# --------------------------------------------------------------------------
# Unicode "Mathematical Alphanumeric Symbols" block offsets. Each family maps
# A-Z, a-z (and, where the block defines them, 0-9) to a contiguous run
# starting at a fixed codepoint. Digits are only defined for bold and
# monospace, not italic or bold-italic — the CommonMark spec doesn't run
# italic across digits anyway, so this is not a practical gap.
# --------------------------------------------------------------------------
_BOLD = (0x1D5D4, 0x1D5EE, 0x1D7EC)  # A, a, 0
_ITALIC = (0x1D608, 0x1D622, None)
_BOLD_ITALIC = (0x1D63C, 0x1D656, None)
_MONO = (0x1D670, 0x1D68A, 0x1D7F6)


def _map_alphabet(text: str, offsets: tuple[int, int, int | None]) -> str:
    upper, lower, digit = offsets
    out = []
    for ch in text:
        if "A" <= ch <= "Z":
            out.append(chr(upper + (ord(ch) - ord("A"))))
        elif "a" <= ch <= "z":
            out.append(chr(lower + (ord(ch) - ord("a"))))
        elif digit is not None and "0" <= ch <= "9":
            out.append(chr(digit + (ord(ch) - ord("0"))))
        else:
            out.append(ch)  # punctuation/space/digits-without-a-variant: left as ASCII
    return "".join(out)


NBSP = " "

# --------------------------------------------------------------------------
# Inline conversion. Code spans are resolved to placeholders FIRST: CommonMark
# binds code spans tighter than emphasis, and a bold span commonly wraps a
# code span in these posts (`**\`sessions_spawn\`**`) — running an emphasis
# regex first would see the inner backticks as ordinary characters and either
# swallow them into the bold run or mis-pair them.
#
# Placeholders use single characters from the Private Use Area (U+E000+) —
# not, say, digit-bearing tokens like "\x00 0 \x00" — because _map_alphabet
# also transforms ASCII digits (the bold/mono alphabets define bold/mono
# digit glyphs). A digit-bearing placeholder embedded inside a **bold** span
# would itself get digit-mapped by the outer emphasis pass before the
# placeholder is ever looked up again, breaking the restore. PUA codepoints
# match none of _map_alphabet's branches, so they pass through every layer
# unchanged no matter how many emphasis levels wrap them.
# --------------------------------------------------------------------------
_CODE_RE = re.compile(r"`([^`\n]+)`")
_BOLD_ITALIC_RE = re.compile(r"\*\*\*(.+?)\*\*\*|___(.+?)___")
_BOLD_RE = re.compile(r"\*\*(.+?)\*\*|__(.+?)__")
_ITALIC_RE = re.compile(r"(?<!\*)\*([^*\n]+)\*(?!\*)|(?<!_)_([^_\n]+)_(?!_)")
_LINK_RE = re.compile(r"!?\[([^\]]*)\]\(([^)]+)\)")
_AUTOLINK_RE = re.compile(r"<((?:https?|ftp)://[^\s<>]+)>")
_ESCAPE_RE = re.compile(r"\\([\\`*_{}\[\]()#+\-.!<>~|])")
_PLACEHOLDER_BASE = 0xE000


def _convert_inline(text: str) -> str:
    placeholders: list[str] = []

    def stash(rendered: str) -> str:
        placeholders.append(rendered)
        return chr(_PLACEHOLDER_BASE + len(placeholders) - 1)

    # Code spans -> monospace, stashed so later passes can't see the backticks.
    text = _CODE_RE.sub(lambda m: stash(_map_alphabet(m.group(1), _MONO)), text)

    # Links: [text](url) -> "text (url)"; bare image syntax drops the image,
    # keeping alt text as label text (there are no images in these posts, but
    # handle it rather than leave literal "![alt](url)" on the page).
    def _link(m: re.Match[str]) -> str:
        label, url = m.group(1), m.group(2)
        return f"{label} ({url})" if label else url

    text = _LINK_RE.sub(_link, text)
    text = _AUTOLINK_RE.sub(lambda m: m.group(1), text)

    # Bold-italic, then bold, then italic — longest marker run first so
    # `***x***` isn't consumed as bold leaving stray `*x*`.
    text = _BOLD_ITALIC_RE.sub(
        lambda m: stash(_map_alphabet(m.group(1) or m.group(2), _BOLD_ITALIC)), text
    )
    text = _BOLD_RE.sub(lambda m: stash(_map_alphabet(m.group(1) or m.group(2), _BOLD)), text)
    text = _ITALIC_RE.sub(lambda m: stash(_map_alphabet(m.group(1) or m.group(2), _ITALIC)), text)

    text = _ESCAPE_RE.sub(r"\1", text)

    # Restore LAST-stashed first: an outer emphasis pass (e.g. bold) can
    # capture an already-stashed inner placeholder (e.g. code) inside its own
    # matched text and stash a NEW, later placeholder whose rendered value
    # still contains that earlier token unresolved. Restoring newest-first
    # unwraps that nesting; restoring oldest-first would try to replace the
    # inner token before the outer one has exposed it in the visible text.
    for i in range(len(placeholders) - 1, -1, -1):
        text = text.replace(chr(_PLACEHOLDER_BASE + i), placeholders[i])
    return text


# --------------------------------------------------------------------------
# Block-level conversion.
# --------------------------------------------------------------------------
_FENCE_RE = re.compile(r"^ {0,3}(`{3,}|~{3,})")
_ATX_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
_BULLET_RE = re.compile(r"^( *)([-*+])\s+(.*)$")
_ORDERED_RE = re.compile(r"^( *)(\d+[.)])\s+(.*)$")
_QUOTE_RE = re.compile(r"^ {0,3}>\s?(.*)$")
_RULE_RE = re.compile(r"^ {0,3}((?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$")

_RULE_OUT = "─" * 16


def _bullet_prefix(indent: int) -> str:
    if indent == 0:
        return "• "
    if indent <= 3:
        return NBSP * 2 + "◦ "
    return NBSP * 4 + "▪ "


def convert_body(body: str) -> str:
    lines = body.replace("\r\n", "\n").split("\n")
    out: list[str] = []
    in_fence = False
    fence_marker = ""
    in_quote = False

    for raw_line in lines:
        line = raw_line.rstrip()

        if in_fence:
            if line.strip().startswith(fence_marker) and set(line.strip()) <= set(fence_marker[0]):
                in_fence = False
                continue
            out.append(_map_alphabet(line, _MONO))
            continue

        m = _FENCE_RE.match(line)
        if m:
            in_fence = True
            fence_marker = m.group(1)
            continue

        if _RULE_RE.match(line):
            out.append(_RULE_OUT)
            in_quote = False
            continue

        qm = _QUOTE_RE.match(line)
        if qm:
            content = _convert_inline(qm.group(1))
            prefix = "❝ " if not in_quote else ""
            out.append(f"{prefix}{content}")
            in_quote = True
            continue
        in_quote = False

        atx = _ATX_RE.match(line)
        if atx:
            out.append(_map_alphabet(_convert_inline(atx.group(2)), _BOLD))
            continue

        bm = _BULLET_RE.match(line)
        if bm:
            indent = len(bm.group(1))
            out.append(_bullet_prefix(indent) + _convert_inline(bm.group(3)))
            continue

        om = _ORDERED_RE.match(line)
        if om:
            indent = len(om.group(1))
            prefix = (NBSP * 2 if indent else "") + f"{om.group(2)} "
            out.append(prefix + _convert_inline(om.group(3)))
            continue

        if line.strip() == "":
            out.append("")
            continue

        out.append(_convert_inline(line))

    # Collapse a single blank line between two consecutive bullet-derived
    # lines (the current posts put a blank line between every bullet — a
    # "loose list" in CommonMark terms; on LinkedIn that reads as separate
    # paragraphs and costs length for no visual gain). Blank lines between
    # other blocks (heading -> bullets, bullets -> closing line, etc.) are
    # kept, since those genuinely are paragraph breaks.
    def _is_bullet_line(s: str) -> bool:
        return s.startswith(("• ", NBSP * 2 + "◦ ", NBSP * 4 + "▪ "))

    collapsed: list[str] = []
    i = 0
    while i < len(out):
        if (
            out[i] == ""
            and 0 < i < len(out) - 1
            and _is_bullet_line(out[i - 1])
            and _is_bullet_line(out[i + 1])
        ):
            i += 1
            continue
        collapsed.append(out[i])
        i += 1

    # Collapse runs of 3+ blank lines to at most 2, then trim to a single
    # trailing newline.
    text = "\n".join(collapsed)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip("\n") + "\n"


# --------------------------------------------------------------------------
# Frontmatter split (reuses sanitize-post.py's convention: first line must be
# a bare `---`; everything up to the next bare `---` is frontmatter).
# --------------------------------------------------------------------------
def split_frontmatter(raw: str) -> str:
    lines = raw.split("\n")
    if lines and lines[0].rstrip() == "---":
        for i in range(1, len(lines)):
            if re.match(r"^---\s*$", lines[i]):
                return "\n".join(lines[i + 1 :])
    return raw


def convert(raw: str) -> str:
    return convert_body(split_frontmatter(raw))


# --------------------------------------------------------------------------
# Length stats. LinkedIn counts UTF-16 code units, matching JavaScript's
# `String.length` — every Unicode math-alphabet glyph used above is astral
# (outside the Basic Multilingual Plane) and costs 2 units, not 1.
# --------------------------------------------------------------------------
def utf16_length(text: str) -> int:
    return len(text.encode("utf-16-le")) // 2


def stats_line(text: str) -> tuple[str, bool]:
    codepoints = len(text)
    utf16 = utf16_length(text)
    hook = text.split("\n", 1)[0]
    hook_len = len(hook)

    over = utf16 > LINKEDIN_LIMIT
    parts = [f"{codepoints:,} codepoints", f"{utf16:,}/{LINKEDIN_LIMIT:,} UTF-16 units"]
    if over:
        parts.append(f"OVER BY {utf16 - LINKEDIN_LIMIT:,}")
    else:
        parts.append("OK")
    parts.append(f"hook: {hook_len}/{HOOK_LIMIT} chars {'OVER' if hook_len > HOOK_LIMIT else 'OK'}")
    return " · ".join(parts), over


# --------------------------------------------------------------------------
# Self-tests (no external framework/deps — none exist in this repo; mirrors
# sanitize-post.py's self-test shape).
# --------------------------------------------------------------------------
_SELF_TESTS: list[tuple[str, str, str]] = [
    (
        "bold section heading with leading emoji",
        "⚡ **Gateway WebSocket Lifecycle**\n",
        "⚡ 𝗚𝗮𝘁𝗲𝘄𝗮𝘆 𝗪𝗲𝗯𝗦𝗼𝗰𝗸𝗲𝘁 𝗟𝗶𝗳𝗲𝗰𝘆𝗰𝗹𝗲\n",
    ),
    (
        "bold lead-in bullet with a code span, single-space unaffected",
        "- **Dependency isolation** — `tui/` owns its packaging.\n",
        "• 𝗗𝗲𝗽𝗲𝗻𝗱𝗲𝗻𝗰𝘆 𝗶𝘀𝗼𝗹𝗮𝘁𝗶𝗼𝗻 — 𝚝𝚞𝚒/ owns its packaging.\n",
    ),
    (
        "bold wrapping a code span collapses to monospace (no bold+mono glyph exists)",
        "Run **`sessions_spawn`** before yielding.\n",
        "Run 𝚜𝚎𝚜𝚜𝚒𝚘𝚗𝚜_𝚜𝚙𝚊𝚠𝚗 before yielding.\n",
    ),
    (
        "italic",
        "This is *emphasis* mid-sentence.\n",
        "This is 𝘦𝘮𝘱𝘩𝘢𝘴𝘪𝘴 mid-sentence.\n",
    ),
    (
        "bold-italic",
        "***Critical*** — read this first.\n",
        "𝘾𝙧𝙞𝙩𝙞𝙘𝙖𝙡 — read this first.\n",
    ),
    (
        "escaped asterisk is unescaped, not treated as emphasis",
        "Use a literal \\* character here.\n",
        "Use a literal * character here.\n",
    ),
    (
        "nested bullet gets NBSP nested-marker prefix",
        "- top level\n  - nested one\n",
        "• top level\n" + NBSP * 2 + "◦ nested one\n",
    ),
    (
        "blank line between two bullets of the same list is collapsed",
        "- first\n\n- second\n",
        "• first\n• second\n",
    ),
    (
        "blank line between a heading and its bullets is kept",
        "⚡ **Heading**\n\n- bullet\n",
        "⚡ 𝗛𝗲𝗮𝗱𝗶𝗻𝗴\n\n• bullet\n",
    ),
    (
        "legacy ATX heading becomes a bold line, marker dropped, emoji kept",
        "### 📐 Design\n",
        "📐 𝗗𝗲𝘀𝗶𝗴𝗻\n",
    ),
    (
        "legacy asterisk bullet handled the same as a dash bullet",
        "* first point\n",
        "• first point\n",
    ),
    (
        "markdown link becomes 'text (url)'",
        "See [the docs](https://example.com/docs) for details.\n",
        "See the docs (https://example.com/docs) for details.\n",
    ),
    (
        "autolink becomes a bare url",
        "See <https://example.com/path> for details.\n",
        "See https://example.com/path for details.\n",
    ),
    (
        "horizontal rule becomes a plain dash run",
        "above\n\n---\n\nbelow\n",
        "above\n\n" + _RULE_OUT + "\n\nbelow\n",
    ),
    (
        "fenced code block markers dropped, contents monospaced",
        "```\nplain text\n```\n",
        "𝚙𝚕𝚊𝚒𝚗 𝚝𝚎𝚡𝚝\n",
    ),
    (
        "frontmatter is stripped, title not prepended",
        '---\ntitle: "A Title"\nslug: x\n---\nHook line.\n',
        "Hook line.\n",
    ),
    (
        "idempotent: converting already-converted text is a no-op",
        "• 𝗗𝗲𝗽𝗲𝗻𝗱𝗲𝗻𝗰𝘆 𝗶𝘀𝗼𝗹𝗮𝘁𝗶𝗼𝗻 — 𝚝𝚞𝚒/ owns its packaging.\n",
        "• 𝗗𝗲𝗽𝗲𝗻𝗱𝗲𝗻𝗰𝘆 𝗶𝘀𝗼𝗹𝗮𝘁𝗶𝗼𝗻 — 𝚝𝚞𝚒/ owns its packaging.\n",
    ),
]


def run_self_tests() -> int:
    passed = 0
    failed = 0
    for name, given, expected in _SELF_TESTS:
        got = convert(given)
        if got == expected:
            passed += 1
        else:
            failed += 1
            print(f"FAIL: {name}", file=sys.stderr)
            print(f"  expected: {expected!r}", file=sys.stderr)
            print(f"  got:      {got!r}", file=sys.stderr)
    total = passed + failed

    # A couple of standalone, non-table checks: UTF-16 vs codepoint counting
    # on a known astral string, and that the counter binds on UTF-16.
    sample = _map_alphabet("AB", _BOLD)  # 2 codepoints, 4 UTF-16 units
    if len(sample) == 2 and utf16_length(sample) == 4:
        passed += 1
    else:
        failed += 1
        print(
            f"FAIL: utf16 counting — codepoints={len(sample)} utf16={utf16_length(sample)}",
            file=sys.stderr,
        )
    total += 1

    print(f"to-linkedin: {passed}/{total} self-tests passed")
    return 0 if failed == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert a generated post's Markdown body into LinkedIn-ready plain text."
    )
    parser.add_argument("infile", nargs="?", help="path to the post's Markdown file")
    parser.add_argument("-o", "--output", help="write converted text here instead of stdout")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="exit 1 if the converted text exceeds LinkedIn's UTF-16 length cap",
    )
    parser.add_argument("--self-test", action="store_true", help="run self-tests and exit")
    args = parser.parse_args()

    if args.self_test:
        return run_self_tests()

    if not args.infile:
        parser.error("infile is required unless --self-test is given")

    raw = Path(args.infile).read_text(encoding="utf-8")
    converted = convert(raw)
    line, over = stats_line(converted)

    if args.output:
        Path(args.output).write_text(converted, encoding="utf-8")
    else:
        sys.stdout.write(converted)

    print(line, file=sys.stderr)
    if over:
        print(
            f"::warning::to-linkedin: converted post exceeds LinkedIn's {LINKEDIN_LIMIT:,}-"
            f"character (UTF-16) limit — {line}",
            file=sys.stderr,
        )

    if args.strict and over:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
