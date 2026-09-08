# Publishing Contested Worlds

The intended repository is `jamesgpearce/contestedworlds`; the purchased domain is **contestedworlds.com**. The site is a static export. GitHub Pages needs no server, database, API key, or paid hosting service.

## First GitHub publication

From the `contestedworlds` Git checkout, create an empty public repository on GitHub, without initializing another README or license. Then push this existing history:

```sh
git remote add origin https://github.com/jamesgpearce/contestedworlds.git
git push -u origin main
```

If you publish through a Git client instead, select this existing repository and preserve its commit history. Only add `origin` if it is not already configured.

1. Open **Settings → Pages** in the GitHub repository.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages → Run workflow** for the first deployment. An initial run before Pages was enabled can simply be rerun.
4. Wait for validation, build, and deployment to succeed. The `github-pages` environment exposes the published URL.

Until the custom domain is connected, the address is `https://jamesgpearce.github.io/contestedworlds/`. The workflow reads the actual Pages URL and builds for that path automatically. Subsequent pushes to `main` validate and deploy; pull requests validate without publishing. No personal access token is needed. [GitHub's custom-workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Connect contestedworlds.com

Verify the domain in your personal **GitHub Settings → Pages** using the TXT record GitHub supplies. In the repository's **Settings → Pages → Custom domain**, save `contestedworlds.com` before changing DNS.

At the registrar, configure:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `jamesgpearce.github.io` |

Replace conflicting parking records. Keep unrelated email records. Use explicit apex and `www` records rather than wildcards. The `www` target has no repository path.

After DNS validation, enable **Enforce HTTPS** and rerun the Pages workflow. It rebuilds at `/` with canonical links and preview-image URLs on `https://contestedworlds.com/`. GitHub redirects the configured `www` alias. DNS and certificate provisioning can take up to 24 hours. This Actions deployment does not need a committed `CNAME` file. [GitHub's domain instructions and current DNS values](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

Useful checks after connecting:

```sh
dig +short contestedworlds.com A
dig +short www.contestedworlds.com CNAME
curl -I https://contestedworlds.com/
curl -I https://contestedworlds.com/social-card.png
```

## Build settings

`site.config.json` contains the project's canonical domain, repository URL and public Analytics ID. These are configuration, not secrets. Environment variables can override them:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Full canonical URL, including a trailing slash and any project path |
| `NEXT_PUBLIC_BASE_PATH` | Empty at a custom domain; `/contestedworlds` at the GitHub project URL |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID; set to an empty string to disable collection |

The Pages workflow gets the URL and path from `actions/configure-pages`. Repository variable `GA_MEASUREMENT_ID` can override this project's tag. Set that variable to `off` to disable Analytics in the workflow. Forks default to Analytics off unless they supply their own ID.

To check the project URL locally:

```sh
NEXT_PUBLIC_BASE_PATH=/contestedworlds \
NEXT_PUBLIC_SITE_URL=https://jamesgpearce.github.io/contestedworlds/ \
NEXT_PUBLIC_GA_ID= \
npm run build
NEXT_PUBLIC_BASE_PATH=/contestedworlds \
NEXT_PUBLIC_SITE_URL=https://jamesgpearce.github.io/contestedworlds/ \
npm run check:export
```

For a normal local preview, run `npm run build && npm run preview`. `scripts/prepare-static.mjs` flattens Vinext's path-prefixed export for Pages, then adds `.nojekyll`, `robots.txt` and `sitemap.xml`. Upload **only `dist/client/`**, not the source tree or `dist/server/`.

## Analytics

The project's GA4 tag is **G-EYQ3SGDHPC**. It loads after the initial render, only when the current hostname matches the configured site URL. Localhost, Do Not Track and Global Privacy Control disable loading. The integration disables Google signals and ad personalization, and uses the canonical page URL instead of forwarding selected islands, record IDs or arbitrary query parameters.

In Google Analytics, open **Admin → Data streams → this web stream → Enhanced measurement → Page views → advanced settings** and turn off **Page changes based on browser history events**. The atlas deliberately replaces its URL as filters and tooltips change; these are not extra page visits. The code sends one explicit page view per load. `send_page_view: false` alone does not disable Enhanced Measurement's history listener. [Google's page-view documentation](https://developers.google.com/analytics/devguides/collection/ga4/views).

Validate the live integration with GA's Realtime report on the configured production domain. An ad blocker or browser privacy signal may suppress it. The integration has no advertising or user-identification features; it is not a consent-management platform.

## Social previews

The static HTML contains canonical, Open Graph and Twitter large-image metadata. `public/social-card.png` is a 1200×630 Greater Antilles chart generated from the actual period-packing and event-axis code. It uses the same mark, muted colors and flags as the atlas. Every shared filter URL has this page-level preview; the interactive state still restores when the link is opened.

After a relevant dataset or design change:

```sh
npm run social:build
```

Commit the PNG and SVG together. `apple-touch-icon.png` is regenerated by the same command. Set the repository's **Settings → General → Social preview** to `public/social-card.png` if you want the GitHub repository itself to use the same image. Social crawlers need the public GitHub/custom-domain site; the owner-only Sites preview is not crawlable. [Open Graph protocol](https://ogp.me/).

## Rollback

Revert the offending source commit and push `main`; the workflow rebuilds and deploys that state. Source JSON, chart code and deployment settings remain versioned together. The existing `.openai/hosting.json` is for the separate owner-only Sites preview and is not used by GitHub Pages.
