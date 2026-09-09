---
name: static-site-maintenance
description: Use when maintaining this multi-page static HTML site: update Home, Products, Projects, or About pages, preserve shared asset wiring, improve responsive presentation, or verify links and markup.
metadata:
  author: project
  version: "1.0.0"
  argument-hint: <page-or-change>
---

# Static Site Maintenance

Maintain the site's pages as one connected static experience. Keep changes focused, preserve the existing visual language, and verify the result in a browser when the change affects presentation or navigation.

## Workflow

1. Identify the owning page and behavior.
   - Map requests to `index.html`, `products.html`, `product.html`, `projects.html`, or `about.html`.
   - Read the page and the nearest analogous page before editing. Treat the existing CSS, JavaScript, image URLs, and generated-export structure as intentional.
   - If the page only wires data or markup, identify the controlling shared path, but keep the edit on the HTML surface unless the request explicitly permits shared-file changes.

2. State a local hypothesis and a cheap check.
   - Example: a broken product view is likely caused by a data key or selector mismatch; check the rendered route and browser console first.
   - Prefer a nearby existing pattern over introducing a new component, dependency, or layout system.

3. Make the smallest compatible edit.
   - Keep shared navigation, data shapes, class names, and asset paths consistent across pages.
   - Keep page-specific markup in the owning HTML file. Do not edit CSS, JavaScript, or asset files for a local HTML request; report the limitation when the requested behavior requires one of those files.
   - Use existing assets when they represent the requested content. Do not replace working asset references with invented paths.
   - Preserve semantic HTML, keyboard access, visible focus states, meaningful image alt text, and responsive behavior.

4. Validate the changed slice immediately.
   - Check the changed page and any directly linked route.
   - Confirm no browser console errors, failed asset requests, broken internal links, or missing images.
   - At narrow and wide viewport sizes, verify that text, controls, navigation, and images do not overlap or overflow.
   - For JavaScript changes, exercise the affected interaction and its empty, invalid, or missing-data state when applicable.

5. Review the final diff.
   - Confirm only relevant files changed.
   - Check that shared paths remain relative and work from each page's location.
   - Remove temporary debugging output and avoid unrelated formatting or content changes.

## Decision Points

- If a change affects one page only, edit that page unless the behavior is controlled by shared CSS or JavaScript.
- If multiple pages repeat the same behavior, prefer the shared data or helper path rather than duplicating logic.
- If an asset is missing, use an existing suitable asset or report the missing input; do not silently create a misleading placeholder.
- If browser verification is unavailable, perform static checks for paths, selectors, IDs, and markup, and clearly report the unverified behavior.
- If the request is ambiguous between visual and structural changes, preserve the current layout and ask for the intended interaction only when a safe local interpretation is impossible.

## Completion Checklist

- The owning page and controlling CSS or JavaScript path were identified.
- The change follows existing naming, asset, and layout conventions.
- Internal links, images, stylesheets, and scripts resolve.
- The affected interaction works, including relevant empty or error states.
- The page remains usable at desktop and mobile widths.
- No new console errors or unrelated file changes remain.
