<p align="center">
  <a href="https://app.exploreai.chat"><img src="public/avatar.png" alt="ExploreAI" width="88" height="88"></a>
</p>

<h1 align="center">ExploreAI</h1>

<p align="center"><b>The AI top-up kit: guides → usage → top-up → environment → fingerprint</b></p>
<p align="center">Read the rules and work out your quota before you pay. Check your setup and verify the model after.</p>

<p align="center">
  <a href="https://app.exploreai.chat"><img src="https://img.shields.io/badge/Website-app.exploreai.chat-0071e3?style=for-the-badge" alt="Website"></a>
  <a href="https://app.exploreai.chat/claude/brief"><img src="https://img.shields.io/badge/Daily_brief-EN_%2F_中文-1d1d1f?style=for-the-badge" alt="Daily brief"></a>
  <a href="https://x.com/_ExploreAI"><img src="https://img.shields.io/badge/X-__ExploreAI-000000?style=for-the-badge&logo=x&logoColor=white" alt="X"></a>
  <a href="https://t.me/ExploreAllStudio"><img src="https://img.shields.io/badge/Telegram-ExploreAllStudio-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram"></a>
  <a href="README.md"><img src="https://img.shields.io/badge/Lang-中文-6e6e73?style=for-the-badge" alt="中文"></a>
</p>

<p align="center">
  <a href="https://app.exploreai.chat"><img src=".github/assets/home-en.jpg" alt="ExploreAI home page" width="100%"></a>
</p>

## Five steps

| Step | Page | What it answers |
| --- | --- | --- |
| Guides | [Guides](https://app.exploreai.chat/claude) | Account safety, top-up and usage guides, covering official rules and appeals only |
| Usage | [Compare](https://app.exploreai.chat/worth) | 117 plans and 49 models: what the same money buys, with optional bill import |
| Top-up | [Shop](https://app.exploreai.chat/shop) | Promoted items, each labelled with its official tier and what you must submit. Not an official channel |
| Environment | [Environment](https://app.exploreai.chat/checkcc) | Checks your IP, timezone, language and connectivity |
| Fingerprint | [Fingerprint](https://app.exploreai.chat/fingerprint) | Shows which model an API most resembles |

There is also a [daily brief](https://app.exploreai.chat/claude/brief): a three-minute pick of AI projects from GitHub and Product Hunt.

<table>
  <tr>
    <td width="50%"><img src=".github/assets/worth-en.jpg" alt="Plan comparison"></td>
    <td width="50%"><img src=".github/assets/brief-en.jpg" alt="Daily brief"></td>
  </tr>
  <tr>
    <td align="center">Plan comparison</td>
    <td align="center">Daily brief</td>
  </tr>
</table>

## Privacy

This is a static site with no backend and no user database. Compare and Fingerprint run entirely in your browser. The environment check contacts third parties for IP and connectivity only after you start it, and that page lists them.

## Where the data comes from

- Plan and API prices come from official pages. `confidence: "live"` means checked against the official page. `"index"` means not yet checked page by page, and the site marks it as pending review.
- Quotas that vendors don't publish are labelled as inferred or unavailable, never presented as exact figures.
- The English site is written ahead of time, so page content never goes to a translation service. `npm run build` fails if Chinese shows up on the English site.

## How the brief ships

```mermaid
flowchart LR
  A["06:30 fetch material<br/>GitHub Actions"] --> B["07:30 draft<br/>Claude"]
  B --> C{"Checks"}
  C -- pass --> D["Merge and deploy"]
  C -- fail --> E["Skip; keep the previous issue"]
```

Times are Beijing time. The checks verify star counts, that projects exist, hype words, recent repeats and links. The writing rules are in [scripts/BRIEF-RULES.md](scripts/BRIEF-RULES.md).

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:5173/>.

## Contributors

<table>
  <tr>
    <td align="center" width="25%"><a href="https://github.com/EA-Studio-SHARK"><img src="https://github.com/EA-Studio-SHARK.png?size=120" width="72" height="72" alt="SHARK"><br><b>SHARK</b></a><br><sub>Product, data and operations</sub></td>
    <td align="center" width="25%"><a href="https://github.com/claude"><img src="https://github.com/claude.png?size=120" width="72" height="72" alt="Claude"><br><b>Claude</b></a><br><sub>Engineering and the daily brief</sub></td>
  </tr>
</table>

Found a stale price or a wrong source? [Open an issue](https://github.com/EA-Studio-SHARK/planworth/issues) with a link to the official page, or send a PR.

## Acknowledgements

The Environment and Fingerprint pages build on these open-source projects. Their authors have not committed to this repository. The code is used under the MIT license, with notices in [third_party/NOTICE.md](third_party/NOTICE.md).

<table>
  <tr>
    <td align="center" width="25%"><a href="https://github.com/yacuo"><img src="https://github.com/yacuo.png?size=120" width="64" height="64" alt="yacuo"><br><b>yacuo</b></a><br><sub><a href="https://github.com/yacuo/check-cc">CheckCC</a><br>Environment check</sub></td>
    <td align="center" width="25%"><a href="https://github.com/Ikaleio"><img src="https://github.com/Ikaleio.png?size=120" width="64" height="64" alt="Ikaleio"><br><b>Ikaleio</b></a><br><sub><a href="https://github.com/Ikaleio/lm-detector">LM Fingerpoint Detector</a><br>Model fingerprinting</sub></td>
    <td align="center" width="25%"><a href="https://github.com/xqy2006"><img src="https://github.com/xqy2006.png?size=120" width="64" height="64" alt="xqy2006"><br><b>xqy2006</b></a><br><sub><a href="https://github.com/xqy2006/ModelTrace">ModelTrace</a><br>Algorithm idea and some source data</sub></td>
  </tr>
</table>
