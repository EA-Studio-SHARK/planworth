import type { Article, ArticleCategory } from "../types";

/** English text for src/data/articles.ts. Dates, sources and links stay in the Chinese file. */
export const SOURCE_LABELS_EN: Record<string, string> = {
  "https://www.anthropic.com/supported-countries": "Anthropic supported countries and regions",
  "https://support.claude.com/en/articles/8241253-safeguards-warnings-and-appeals": "Warnings, bans and appeals",
  "https://www.anthropic.com/legal/consumer-terms": "Consumer terms of service",
  "https://www.anthropic.com/legal/aup": "Usage policy",
  "https://support.claude.com/en/articles/8287232-verify-your-phone-number": "Phone number verification",
  "https://support.claude.com/en/articles/14328960-identity-verification-on-claude": "Identity verification",
  "https://support.claude.com/en/articles/9402418-why-was-my-card-declined": "Why was my card declined",
  "https://support.claude.com/en/articles/11647753": "How usage works on paid plans",
  "https://claude.com/pricing": "Claude pricing",
  "https://platform.claude.com/docs/en/about-claude/pricing": "Claude API list prices",
  "https://code.claude.com/docs/en/quickstart": "Claude Code quickstart",
  "https://www.anthropic.com/transparency/system-trust-reporting": "Anthropic Transparency Hub",
};

export const CATEGORIES_EN: Record<ArticleCategory, { title: string; lede: string }> = {
  safety: { title: "Avoiding bans", lede: "What the official rules say, what is only rumor, and what to do if something goes wrong." },
  pay: { title: "Paying", lede: "How to pay, why a card gets declined, and which plan is the best value." },
  guide: { title: "How to use it", lede: "From your first week to Claude Code, so the money goes where it counts." },
};

export const FAQ_EN: { q: string; a: string }[] = [
  {
    q: "Can I use Claude in mainland China within the rules?",
    a: "Mainland China, Hong Kong and Macau are not on Anthropic's current list of supported regions, so being there rules it out. Chinese nationality in itself is not a restriction.",
  },
  {
    q: "How do I appeal after a ban?",
    a: "First confirm the message really is an account suspension, not a used-up quota or a failed payment. Sign in to the suspended account and fill in the appeal form on the restricted page truthfully.",
  },
  {
    q: "If the environment check is all green, can I use Claude?",
    a: "No. The environment check is a third-party hint about your network and browser. It is not an official eligibility check, and it cannot tell you why an account was banned.",
  },
  {
    q: "Is the top-up on this site an official channel?",
    a: "No. The shop is a promotional placement. A third-party top-up cannot change your regional eligibility, and it should never ask for your password. Some items need an SK or token, and the shop marks which.",
  },
];

type ArticleText = Pick<Article, "title" | "summary" | "keyPoints" | "body">;

export const ARTICLES_EN: Record<string, ArticleText> = {
  "claude-safety": {
    title: "Account stopped: tell the causes apart, then use the official path",
    summary: "Separate a suspension from a used-up quota, a failed payment and identity verification. If it really is a suspension, sign in to that account and appeal. If you are in mainland China, Hong Kong or Macau, read the region policy first. Changing your IP does not change where you are.",
    keyPoints: [
      "Separate a suspension, a used-up quota, a failed payment and identity verification. Only a restricted page with an appeal form is a ban.",
      "Eligibility depends on where you physically are. Mainland China, Hong Kong and Macau are not on the supported list. A different network exit or a foreign card does not change that. This article does not teach workarounds.",
      "If the account is suspended, appeal from that same account. Send ID documents, passwords and codes only through the official flow, never to the shop.",
    ],
    body: [
      { type: "h2", text: "Read the page first: which one is it?" },
      { type: "p", text: "Don't change devices, change networks or open a new account at the first error. Of the four situations below, only the first is a ban, and each has a different door." },
      {
        type: "table",
        headers: ["What you see", "What it is", "Where to go"],
        rows: [
          ["A restricted page with an appeal form after signing in", "Account suspended", "Sign in to that account and fill in the form on the page"],
          ["Payment failed, card declined", "Payment problem", "If you are in a supported region, follow the official billing steps"],
          ["A usage limit message that clears in a few hours", "Quota used up", "Wait for the reset, or check usage in Settings"],
          ["Identity verification failed", "Verification problem", "Retry in the official flow. Contact official support when the retries are used up"],
        ],
      },
      { type: "h2", text: "The region rule is about where you are" },
      { type: "p", text: "The supported-region list checked on 2026-10-25 includes the US, Japan, Singapore, South Korea and Taiwan, among others, but not mainland China, Hong Kong or Macau. Regions that are not listed count as unsupported. The policy covers people physically in an unsupported region, and organizations registered, headquartered, or majority-controlled there." },
      {
        type: "callout",
        tone: "warn",
        title: "A new exit or a new card does not move you",
        text: "The help center says physically located. Using Claude from mainland China, Hong Kong or Macau is already outside the policy. A VPN exit or a foreign bank card does not change where you are. Chinese nationality in itself is not the restriction. From a supported region you still have to follow the rules for the account and the organization it belongs to. The usage policy lists accessing the service against the supported-region policy, or helping someone else do that, as abuse. This article does not describe workarounds.",
      },
      { type: "h2", text: "Official rules, and rumors" },
      { type: "p", text: "Anthropic has not published ban weights for IP, device, time zone or plan tier. Only the rows with an official source below are rules. The rest cannot tell you why one account was stopped." },
      {
        type: "table",
        headers: ["The claim", "What is actually true"],
        rows: [
          ["Chatting in Chinese gets you banned", "Not in the published terms. Stories about everyday Chinese words triggering a ban are rumors, not an official clause"],
          ["You are physically in mainland China, Hong Kong or Macau", "This is a stated reason for suspension. Later checks, card binding and identity verification do not undo it"],
          ["An all-green environment check means you can keep using it", "This site's environment page is not an Anthropic eligibility check. Green does not mean you are in a supported region"],
          ["A higher plan always requires identity verification, and failure means an instant ban", "The official docs do not say that. You can retry within the allowed attempts, then contact official support"],
          ["If you get banned, just open a new account", "Don't use a new account to evade an existing suspension. Appeal from the original account first"],
        ],
      },
      { type: "h2", text: "When the account is restricted, don't do these" },
      { type: "p", text: "Each row is here so an appeal stays possible. This is not a bypass list." },
      {
        type: "table",
        headers: ["Don't", "Why", "What to do instead"],
        rows: [
          ["Switch network exits to get around the region rule", "The exit changed. You did not. A detector cannot grant eligibility", "Check the supported-region policy first"],
          ["Treat an environment check as an official risk score", "Anthropic has not published weights for IP, time zone or fingerprint", "Keep the exact on-screen text and follow the official instructions"],
          ["Verify with VoIP, Google Voice or a rented number", "The official phone rules do not accept those numbers", "Use your own SMS-capable number from a supported region"],
          ["Buy a shared or ready-made account, or hand over a verification code", "You cannot reach the original email, so appeal and export fail, and the credentials can leak", "Use only an account you control"],
          ["Upload a fake document, or send ID photos to the shop", "That fails the official check, and ID photos should not go to a third party", "Submit a real, valid physical document only on the official verification page"],
          ["Register a new account right after a suspension", "That can break the terms, and it does not fix the original account", "Sign in to the original account and appeal"],
        ],
      },
      { type: "h2", text: "If you are in a supported region, bind your own card" },
      { type: "p", text: "An official subscription first requires that you are physically in a supported region and that the payment method qualifies. If you are not, a different card or a third-party top-up does not change regional eligibility. If you are, and the card is declined, check the issuing country, billing address and 3DS." },
      {
        type: "steps",
        items: [
          { title: "Sign in with your own email", text: "Don't use an account someone else registered. You need that inbox for later appeals and verification." },
          { title: "Open Settings, then Billing", text: "Pick the plan. Web subscriptions renew automatically. Official billing accepts credit and debit cards, not PayPal or Venmo." },
          { title: "Match the issuing country and billing address", text: "The billing address must match the issuing country and the bank's record. Finish 3DS in the bank app if it asks. Don't close the page halfway." },
          { title: "If it is declined, use the official checklist", text: "Check the balance, retry later, or call the issuer. Then contact Anthropic support. A third-party top-up is not an exception to the region policy." },
        ],
      },
      { type: "tool", to: "/shop", title: "If the card will not go through, look at the shop", text: "The shop is a promotional placement, not an official channel. Each item is labelled with the official tier it corresponds to. Price and stock are on the shop page. Never send a password or a verification code to the shop." },
      { type: "h2", text: "If identity verification fails, retry the official flow" },
      { type: "p", text: "Anthropic may ask for a physical government photo ID, and sometimes a live selfie, for a specific feature or a security check. It checks that you are a real person, that the document is valid, and that the selfie matches the document. It does not prove you are in a supported region, and it does not restore a suspended account by itself." },
      {
        type: "callout",
        tone: "tip",
        title: "Send documents only to the official page",
        text: "A blurry photo, an expired document or a page error can also fail the check. Retry inside the official flow, then use the official help form when the attempts are used up. Do not send ID photos, selfies, passwords or codes to the shop. This site cannot promise that verification or an appeal will succeed.",
      },
      { type: "h2", text: "If it is already suspended, appeal before you add new signals" },
      {
        type: "steps",
        items: [
          { title: "Read the exact message", text: "A used-up quota, a declined card, an organization pause and an account suspension are different doors. Only a restricted page with an appeal form is a ban." },
          { title: "Sign in to the suspended account", text: "The official form requires that account. If you cannot open its email, this path is mostly closed." },
          { title: "Write the facts once", text: "Include the email, when it happened, and the exact words on the page or in the email. Don't invent a trip to the US. Overturn numbers on the Transparency Hub cover all appeals, not a success rate for region suspensions." },
          { title: "Wait, and don't open a new account", text: "Official replies can be slower than usual. Don't register a new account to get around the decision while you wait. Export data if the restricted page still allows it. This site cannot promise that any account will keep working." },
        ],
      },
      { type: "p", text: "The Transparency Hub update of 2026-07-23 says Anthropic banned 11.4 million accounts from January through June 2026, received 398 thousand appeals, and overturned 42 thousand. That is the total across products. They do not publish a separate overturn rate for region suspensions." },
      { type: "tool", to: "/checkcc", title: "The environment check is only a hint", text: "You can see whether time zone, language and exit IP disagree. Green does not mean you meet the region policy, and it cannot tell you why an account was banned." },
    ],
  },
  "claude-region": {
    title: "Which regions Claude supports: it is about where you are, not your IP or nationality",
    summary: "Mainland China, Hong Kong and Macau are not on the official list. A VPN or a foreign bank card cannot change where you actually are, and Chinese nationality in itself is not a restriction.",
    keyPoints: [
      "The official list includes the US, Japan, Singapore, South Korea and Taiwan, among others, but not mainland China, Hong Kong or Macau.",
      "The test is where you are physically located, not your network exit or your nationality.",
      "From a supported region you can use it normally, and chatting in Chinese is not a publicly listed reason for a ban.",
    ],
    body: [
      { type: "h2", text: "Three common situations" },
      {
        type: "table",
        headers: ["Your situation", "Can you use it?"],
        rows: [
          ["Chinese national living in a supported region such as Japan or Singapore", "Yes. Nationality is not a restriction, though account rules and your organization's rules still apply"],
          ["Physically in mainland China, Hong Kong or Macau", "Not on the supported list"],
          ["In an unsupported region, using a VPN or a foreign bank card", "Your location has not changed, and the usage policy treats this kind of access as abuse"],
        ],
      },
      { type: "h2", text: "What does not change your eligibility" },
      {
        type: "ul",
        items: [
          "Changing your network exit, or getting an all-green environment check.",
          "Using a foreign bank card, or a third-party top-up.",
          "Passing identity verification or linking a phone number. The stated reasons for suspension still apply.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Organizations have region rules too",
        text: "The policy also covers organizations registered or headquartered in unsupported regions. For company accounts, check the policy that applies to your organization.",
      },
      { type: "tool", to: "/checkcc", title: "See the environment hints", text: "The environment check is only a hint, not an official eligibility lookup. A green result does not mean you meet the region policy." },
    ],
  },
  "claude-appeal": {
    title: "Your account was banned: how to appeal, step by step",
    summary: "You can only appeal by signing in to the banned account. Confirm it is a ban, back up your data, fill in the form with the facts, then wait.",
    keyPoints: [
      "The appeal form only opens when you sign in to the banned account, so don't lose that email, and don't rush to open a new account.",
      "Stick to the facts. Inventing a location or uploading fake documents only makes things worse.",
      "In the first half of 2026 about one in ten appeals was overturned. It isn't easy, but there is a real chance.",
    ],
    body: [
      { type: "h2", text: "Do these five things in order" },
      {
        type: "steps",
        items: [
          { title: "Confirm it really is a ban", text: "Sign in to claude.ai. A restricted page with an appeal form means a ban. A used-up quota or a declined card needs no appeal. If the page says your organization was paused for unusual activity, click \"Request a review\" to ask the team to look again." },
          { title: "Export your data first", text: "Accounts banned for usage policy violations can usually still export data or delete the account themselves, without contacting support. Export can be restricted in some cases, so do it while you can." },
          { title: "Deal with any active subscription", text: "A subscription does not necessarily stop while you appeal. Check where you originally paid, so you aren't charged during the appeal." },
          { title: "Fill in the appeal form", text: "Use the form on the restricted page. Say what you use Claude for and why you think the ban is a mistake. Facts only, no long essays." },
          { title: "Wait for the result", text: "Anthropic says replies are slower than usual right now. Don't sign up for a new account in the meantime to get around the ban. That only complicates things." },
        ],
      },
      { type: "h2", text: "What to put in the form" },
      {
        type: "ul",
        items: [
          "The account email, and roughly when you signed up and started paying.",
          "The region you are actually in, truthfully.",
          "Your main uses, such as coding, translation or organizing documents.",
          "The specific reasons you think it is a mistake. If you did use prohibited content, say that you have stopped.",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        title: "These three go to the official flow only",
        text: "ID documents, passwords and verification codes go only to official pages. Never give them to anyone who claims they can \"appeal for you\" or \"unban from the inside\".",
      },
      { type: "h2", text: "What are the odds?" },
      {
        type: "quote",
        text: "From January to June 2026, Anthropic banned 11.4 million accounts, received 398,000 appeals and overturned 42,000.",
        cite: "Anthropic Transparency Hub",
      },
      { type: "p", text: "That works out to about one in ten appeals overturned. No separate rate is published for region-related bans, so if you really are in an unsupported region, don't apply this figure to yourself." },
      { type: "h2", text: "If you only received a warning" },
      { type: "p", text: "A warning is not a ban. It means Anthropic believes some prompts broke the usage policy. If you think it is a mistake, write to the email address given in the help center article with the details and your account information. Take care not to trigger it again and again, since repeated violations are the reason for a ban." },
    ],
  },
  "claude-billing": {
    title: "How to pay for Claude: the official flow, and seven reasons a card gets declined",
    summary: "From a supported region, use your own account and card in the official Billing page. If the card is declined, work through the seven reasons.",
    keyPoints: [
      "Credit and debit cards are accepted. PayPal and Venmo are not.",
      "The most common failures are a billing address that doesn't match, or an unfinished 3D Secure.",
      "From an unsupported region, no change of card or top-up service makes you eligible.",
    ],
    body: [
      { type: "h2", text: "The four official steps" },
      {
        type: "steps",
        items: [
          { title: "Decide which plan", text: "If unsure, start with Pro and upgrade if you run out. The Compare page estimates roughly how many tokens each plan is worth." },
          { title: "Open Billing", text: "Sign in to claude.ai and go to Settings → Billing." },
          { title: "Enter your card and billing address", text: "The address must match your bank's record, and the issuing country and billing country must both be on the supported list." },
          { title: "Finish 3D Secure", text: "Confirm in your banking app or enter the one-time password. Don't close the page halfway." },
        ],
      },
      {
        type: "table",
        headers: ["Plan", "Monthly", "Usage", "API credits included"],
        rows: [
          ["Pro", "$20 (about $17/mo billed annually)", "Base tier, counted as 1×", "None"],
          ["Max", "$100", "5× Pro", "$100/mo"],
          ["Ultra", "$200", "Weekly quota 10× Pro", "$200/mo"],
        ],
      },
      { type: "h2", text: "Card declined? Check these seven" },
      {
        type: "table",
        headers: ["Reason", "What to do"],
        rows: [
          ["Billing region not supported", "Check that the billing address and issuing country are both on the supported list and match"],
          ["Billing address doesn't match", "Match your bank's record character by character, including spelling and accents"],
          ["3D Secure not finished", "Complete it with the one-time password or in your banking app"],
          ["Payment method not supported", "Use a credit or debit card. PayPal and Venmo are not accepted"],
          ["Insufficient funds", "Make sure the card covers the full amount, and ask your bank if unsure"],
          ["Temporary technical problem", "Try again later, or use another card"],
          ["Declined by your bank", "Call the issuer for the reason. Anthropic doesn't receive it"],
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Running out doesn't always mean upgrading",
        text: "When you hit the limit you can turn on usage credits, keep working and pay as you go. An occasional overage doesn't justify a higher plan. Upgrade if it happens often.",
      },
      { type: "tool", to: "/worth", title: "Work out which plan is worth it", text: "Enter a budget or import a bill to see what the same money buys on Claude, ChatGPT or the API." },
    ],
  },
  "sub-vs-api": {
    title: "$20 on Pro or on the API: work out your usage first",
    summary: "Subscriptions don't publish exact token counts. Only API list prices, official multipliers and included credits can be calculated, and this article shows how to compare them.",
    keyPoints: [
      "For the same $20, with Sonnet 5.5 at 70% input, the API buys about 4.55M tokens.",
      "Max and Ultra include matching API credits, so the $100 tier is estimated at about 45.5M, twice the direct API.",
      "Choose the API for light or irregular use. Choose a subscription for daily use with Claude Code and web chat.",
    ],
    body: [
      { type: "h2", text: "Only three things can be calculated" },
      {
        type: "ul",
        items: [
          "API list prices: Sonnet 5.5 costs $2 input and $10 output per million tokens.",
          "Official multipliers: Max is 5× Pro, and Ultra's weekly quota is 10× Pro. These are relative usage, not token counts.",
          "Included credits: $100/mo on Max, $200/mo on Ultra, none on Pro.",
        ],
      },
      { type: "p", text: "The exact quota for web chat is not published, so everything in this site's subscription column is marked as an estimate: multiplier × base plan price, converted to tokens at model list price, plus credits." },
      { type: "h2", text: "The numbers" },
      {
        type: "table",
        headers: ["Spend", "How", "About how many tokens", "Basis"],
        rows: [
          ["$20", "Direct API", "4.55M", "Calculated from list price"],
          ["$20", "Pro", "4.55M", "Estimate"],
          ["$100", "Direct API", "22.7M", "Calculated from list price"],
          ["$100", "Max", "45.5M", "Estimate, half usage and half credits"],
          ["$200", "Direct API", "45.5M", "Calculated from list price"],
          ["$200", "Ultra", "90.9M", "Estimate, half usage and half credits"],
        ],
      },
      { type: "p", text: "All based on Sonnet 5.5 at 70% input and 30% output, a blended $4.40 per million tokens. On Opus 5.5 the same money buys half the tokens." },
      { type: "h2", text: "How to choose" },
      {
        type: "table",
        headers: ["Your situation", "Suggestion"],
        rows: [
          ["Under $16 a month of API usage", "Buy the API directly and pay for what you use"],
          ["Daily use with web chat and Claude Code", "Start with Pro"],
          ["Often hitting the Pro limit", "Try usage credits for a month, then move to Max if that isn't enough"],
          ["Connecting your own programs", "API. Subscription accounts can't run scripts"],
        ],
      },
      { type: "tool", to: "/worth", title: "Run your own numbers", text: "Drop in a billing CSV. It reads your usage and calculates with your own input and output mix." },
    ],
  },
  "third-party-recharge": {
    title: "Top-up cards and paid top-ups: what they can and can't fix",
    summary: "A third-party top-up only solves the payment step, not regional eligibility. Before buying, check which official plan it matches and work out the markup.",
    keyPoints: [
      "A third-party top-up is not an official channel, and this site's shop is only a promotional placement.",
      "It doesn't solve regional eligibility or lower the risk of a ban.",
      "Never give a seller your password or verification code. An SK or token works like a login credential, so think before you submit one.",
    ],
    body: [
      { type: "h2", text: "What it actually solves" },
      { type: "p", text: "If you are in a supported region, the account is your own and your card just can't pay, a top-up card can get you past payment. Beyond that it changes nothing." },
      {
        type: "table",
        headers: ["Problem", "Does a top-up card help?"],
        rows: [
          ["Your card can't pay", "Yes"],
          ["You are in an unsupported region", "No, eligibility depends on where you are"],
          ["The account is already banned", "No, use the official appeal"],
          ["Worried about being banned", "No, it adds another layer of uncertainty"],
        ],
      },
      { type: "h2", text: "Four things to check before buying" },
      {
        type: "check",
        items: [
          "Does it say which official plan it matches? For example, a \"Claude Pro monthly card\" matches the official $20.",
          "Is the markup acceptable? The Claude Pro monthly card promoted here is ¥156. The official $20 at the 2026-11-04 midpoint rate of 6.7180 is about ¥134, a markup of about ¥22. The shop works this out for every item.",
          "Does the seller ask for your password or verification code? If so, don't buy. Think hard about items that need an SK or token too: these work like login credentials, so whoever has one can get into your account. The shop here marks what each item needs.",
          "Who is responsible if something goes wrong? Stock and delivery are up to the shop, and Anthropic does not handle third-party orders.",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        title: "Shared and ready-made accounts are a different matter",
        text: "The terms clearly forbid sharing and reselling accounts. With these you don't control the original email and can't appeal a ban.",
      },
      { type: "tool", to: "/shop", title: "See promoted items", text: "Each one shows the official plan it matches. This is a promotional placement, not an official channel." },
    ],
  },
  "claude-first-week": {
    title: "Your first week with Claude: don't burn through the quota on day one",
    summary: "Just paid for Pro? Spend a week learning how far the quota goes. A day-by-day plan: choose models, set up a project, try the toggles, then move on to Claude Code.",
    keyPoints: [
      "Web, desktop and Claude Code share one quota, and the 5-hour window starts with your first message.",
      "Use lower effort for everyday tasks and start new chats promptly, and the quota lasts a long time.",
      "The goal of week one isn't to use it all, but to learn how much work one window gets you.",
    ],
    body: [
      { type: "h2", text: "First, how the quota works" },
      {
        type: "ul",
        items: [
          "Session limit: resets every 5 hours, counted from your first message.",
          "Weekly limit: all models combined, resetting at a fixed time for your account. Some plans also have a separate weekly limit for Fable.",
          "Settings → Usage shows how much is left.",
        ],
      },
      { type: "h2", text: "A plan for the first week" },
      {
        type: "steps",
        items: [
          { title: "Day 1: try real work", text: "Don't ask \"who are you\". Give it something you are working on, such as a document that needs editing. State the goal, the reader and the format. Afterward, check Usage to see what it cost." },
          { title: "Day 2: compare models", text: "Run the same task on Haiku, Sonnet and Opus, and compare the results and the quota used. Sonnet is enough for most everyday work." },
          { title: "Day 3: set up a project", text: "Put material you will use long-term in a Project and write a few instructions. Keep them short and delete files you don't need, since they use quota too." },
          { title: "Day 4: try the toggles", text: "Web search, connected apps and thinking are worth turning on only when useful. Turn them off afterward so the next chat doesn't pay for them." },
          { title: "Day 5: practice starting new chats", text: "When a topic is done, start a new chat. A long chat carries everything before it on each turn, so it gets more expensive as it goes." },
          { title: "Weekend: decide whether to upgrade", text: "Count how many times you hit the limit. Never? Stay on Pro. Occasionally? Use usage credits. Often? Look at Max." },
        ],
      },
      { type: "h2", text: "Three habits for asking" },
      {
        type: "table",
        headers: ["Not this", "This"],
        rows: [
          ["Fix this article for me", "Cut this article to 500 words for beginners, and keep the three data points"],
          ["How do I fix this error?", "Paste the full error, and say what you did and what you expected"],
          ["Five things at once", "Split it into steps, and confirm each before the next"],
        ],
      },
      { type: "tool", to: "/worth", title: "Work it out when you run short", text: "See whether Pro, Max or the direct API suits your usage best." },
    ],
  },
  "claude-code-start": {
    title: "Getting started with Claude Code: from install to your first code change",
    summary: "Install with one command, sign in, ask your first question in a project and make your first change. Common commands and beginner mistakes are all here.",
    keyPoints: [
      "It works on Pro, Max and Ultra, or pay as you go with a Console account.",
      "It shares the subscription quota with web chat, so heavy use can max out chat too.",
      "Have it understand the project before changing anything, and be specific with each task.",
    ],
    body: [
      { type: "h2", text: "Step 1: install" },
      { type: "code", label: "macOS / Linux / WSL", text: "curl -fsSL https://claude.ai/install.sh | bash" },
      { type: "code", label: "Windows PowerShell", text: "irm https://claude.ai/install.ps1 | iex" },
      { type: "code", label: "Homebrew", text: "brew install --cask claude-code" },
      { type: "p", text: "Afterward, open a new terminal and confirm it prints a version number. If claude isn't found, the install folder usually isn't on your PATH yet. On Windows, installing Git for Windows is recommended." },
      { type: "code", text: "claude --version" },
      { type: "h2", text: "Step 2: enter your project and sign in" },
      { type: "code", text: "cd your-project\nclaude" },
      { type: "p", text: "The first time, it asks you to sign in through the browser. It remembers after that. To switch accounts later, type /login inside it." },
      { type: "h2", text: "Step 3: try things in this order" },
      {
        type: "steps",
        items: [
          { title: "Ask first, change nothing", text: "Ask \"what does this project do\" and \"where is the entry point\". It reads the files it needs, so you don't have to paste them." },
          { title: "Make one small change", text: "For example, \"add a hello world function to the main file\". It shows you the change and asks for approval." },
          { title: "Finish with Git", text: "Say \"which files did I change\" and \"commit with one clear sentence\". You can also just talk about branches and merge conflicts." },
          { title: "Then do a real task", text: "Fix a bug, write tests, update the README. Describe both what happens and what you expect." },
        ],
      },
      { type: "h2", text: "Common commands" },
      {
        type: "table",
        headers: ["Command", "What it does"],
        rows: [
          ["claude", "Start interactively"],
          ["claude \"task\"", "Start with a task"],
          ["claude -p \"question\"", "Ask once and exit"],
          ["claude -c", "Continue the latest chat in this folder"],
          ["claude -r", "Pick an earlier chat to continue"],
          ["/help", "See all commands"],
          ["/clear", "Clear the chat, for switching tasks"],
          ["Shift + Tab", "Switch permission modes"],
        ],
      },
      { type: "h2", text: "Common beginner mistakes" },
      {
        type: "check",
        items: [
          "Tasks that are too vague. Don't say \"fix the bug\". Say \"the page goes blank after a wrong password, fix that\".",
          "Asking for too much at once. Split big tasks into steps and confirm each one.",
          "Not clearing when you switch tasks. The last task's context keeps using quota, so run /clear.",
          "Approving without looking. At least glance at what it will change, especially deletions and commands.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Subscription or API key?",
        text: "If ANTHROPIC_API_KEY is set and you agree to use it, you are billed per use rather than from your subscription quota. To use your subscription, make sure this variable isn't set by mistake.",
      },
    ],
  },
  "claude-usage-save": {
    title: "Always running out? Five official fixes, and when to upgrade",
    summary: "On the same Pro plan, some people get half a day's work from one window and others hit the limit in half an hour. The difference mostly comes down to these five things.",
    keyPoints: [
      "The two most effective moves: start a new chat instead of continuing a long one, and lower effort for everyday tasks.",
      "Chat, desktop and Claude Code share one quota. They are not counted separately.",
      "Use usage credits for an occasional overage, and upgrade if you hit the limit often.",
    ],
    body: [
      { type: "h2", text: "What uses the most quota" },
      { type: "p", text: "Anthropic lists four things: longer and more complex chats, the features you use, the model you choose and the effort level you choose. Usage on claude.ai, Claude Code and desktop all counts toward the same limit." },
      { type: "h2", text: "Five official fixes" },
      {
        type: "steps",
        items: [
          { title: "Lower effort for everyday tasks", text: "Fixing typos or translating doesn't need the top level." },
          { title: "Turn off thinking on models that allow it", text: "Simple questions don't need extended thinking." },
          { title: "Start new chats instead of continuing", text: "Start a new one when the topic changes. This is the most noticeable saving." },
          { title: "Turn off connections and search you don't need", text: "Turn off connected apps and web search when you don't need them." },
          { title: "Trim your projects", text: "Keep project instructions short and delete files you don't use." },
        ],
      },
      { type: "h2", text: "When you hit the limit" },
      {
        type: "table",
        headers: ["Situation", "What to do"],
        rows: [
          ["Once or twice a week", "Wait for the 5-hour window to reset, and set non-urgent work aside"],
          ["Work you can't pause", "Turn on usage credits and keep going, paying as you go"],
          ["Nearly every day", "Look at Max: the $100 tier is 5× Pro and includes $100 in API credits"],
          ["Mostly running programs", "Use the API. Subscription accounts can't run scripts"],
        ],
      },
      { type: "tool", to: "/worth", title: "Work out whether to upgrade", text: "Enter your monthly usage to see what the direct API would cost and which plan is enough." },
    ],
  },
};
