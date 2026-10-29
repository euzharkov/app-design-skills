# Serving, capturing, checking

The canvas is plain static files, driven entirely by its URL, so every view
can be reproduced and every capture named.

## Serving

The tokens section reads CSS rules, which browsers block on `file://`.
Always serve over http.

- **Claude Code with the browser pane**: add a launch entry once and use
  `preview_start {name: "mockup"}`:

  ```json
  {
    "name": "mockup",
    "runtimeExecutable": "sh",
    "runtimeArgs": ["-c", "python3 -m http.server \"${PORT:-4680}\" --directory PATH/TO/mockup"],
    "port": 4680,
    "autoPort": true
  }
  ```

- **Anywhere else**: `python3 -m http.server 4680 --directory PATH/TO/mockup`
  or `npx serve PATH/TO/mockup`. No build step.

## URLs

| URL | Shows |
| --- | --- |
| `/?solo=tokens` | the tokens section and contrast audit |
| `/?solo=<section-id>` | one section |
| `/?solo=<section-id>&theme=dark` | the same, dark |
| `/settings.html?solo=<section-id>` | a section on another page |
| `/?solo=<section-id>#<screen-id>` | one section, scrolled to one screen |
| `/?zoom=100` | frames at production size (50, 70, 85, 100) |

Older mockups used `?solo=foundations`; it still opens the tokens section.

## Capturing

Capture section by section through `?solo=`, never by scrolling a long page:
deep scrolls freeze headless captures, and solo renders only what is asked.

Name each capture after what it shows, from the ids:

```
<page>/<section-id>.png                    whole section, light
<page>/<section-id>.dark.png               whole section, dark
<page>/<section-id>--<screen>.png          one screen
```

One screen alone: capture the element `#<screen-id> .screen` (the frame's
content box) or crop the section capture to that column.

Headless Chrome, when the browser pane is unavailable or stalls:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --window-size=1600,1200 --hide-scrollbars --virtual-time-budget=8000 \
  --screenshot=out.png "http://localhost:4680/?solo=SECTION&theme=dark&zoom=100"
```

`--virtual-time-budget` gives webfonts and icon scripts time to load. If a
browser still stalls (CSS `zoom` on wide rails is the usual cause), hide the
other sections before capturing:
`document.querySelectorAll('.sec').forEach(s => s.style.display = s.id === 'TARGET' ? '' : 'none')`.

## Checking the canvas

After each change, check the canvas, not the design. Screen content is the
person's; these are the things the skill is responsible for:

1. **Console** is clean. An unclosed backtick in a template literal blanks
   the whole page; it is not a style choice.
2. **Grouping**: each section is one flow, columns in the order the user
   meets them, one frame per column.
3. **Names**: every new column has a `name` in the product's words, unique
   in its section (twins excepted); section ids are kebab-case and
   unchanged from before.
4. **Tags**: platform tags on every column off the page's primary
   platform, spelled exactly as in canvas.md; states in names, not tags.
5. **Frames**: right platform chrome; nothing clipped by the frame unless
   the clip is the point; nothing product-shaped outside a frame.
6. **Tokens**: no raw colors or sizes inside screens; the tokens section has
   no `unresolved` rows; dark captures actually show dark values.
7. **Labels and notes** fit under their frame at 70% and 100% zoom, and
   notes state decisions, not filler.

Then show the person the captures, two to four at a time, each with its
screen id, and ask about what they asked for. Don't attach a critique of
the screen content unless they asked for one.

## When something looks wrong

Work from the outside in: (1) console errors; (2) the element inspector: is
the screen using the token you think, or a raw value; (3) the section alone
with `?solo=`; (4) only then CSS. Don't patch with inline styles; find which
layer owns the mistake (tokens, screen, canvas, frame).

`*/` inside a CSS comment (easy to write in prose like `--font-*/--weight-*`)
ends the comment early and the leftover text swallows the next rule, with
no console error. The symptom is the tokens section suddenly showing
unresolved values or system fonts; the fix is rewording the comment.
