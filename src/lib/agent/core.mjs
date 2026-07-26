const ARABIC_CHARACTER = /[\u0600-\u06ff]/;
const MAX_MATCHES = 5;

const ARABIC_NUMBER = new Intl.NumberFormat("ar-SA");
const ENGLISH_NUMBER = new Intl.NumberFormat("en-US");

const TERM_EXPANSIONS = new Map(
  Object.entries({
    "برمجه": ["code", "coding", "development", "developer", "programming", "software"],
    "كود": ["code", "coding", "development", "programming"],
    "تطوير": ["development", "developer", "code", "software"],
    "بيانات": ["data", "database", "analytics", "analysis", "spreadsheet"],
    "تحليل": ["analysis", "analytics", "insight", "data"],
    "تقارير": ["report", "reporting", "analytics", "document"],
    "ملفات": ["file", "files", "document", "pdf", "docx", "storage"],
    "وثائق": ["document", "documents", "docs", "pdf", "docx"],
    "مستندات": ["document", "documents", "docs", "pdf", "docx"],
    "كتابه": ["writing", "writer", "content", "copy", "article"],
    "محتوي": ["content", "writing", "media", "article", "copy"],
    "تسويق": ["marketing", "ads", "advertising", "seo", "campaign", "growth"],
    "اعلانات": ["ads", "advertising", "marketing", "campaign"],
    "بريد": ["email", "gmail", "outlook", "mail"],
    "ايميل": ["email", "gmail", "outlook", "mail"],
    "اجتماعات": ["meeting", "meetings", "calendar", "zoom", "scheduling"],
    "تقويم": ["calendar", "scheduling", "meeting"],
    "تصميم": ["design", "image", "creative", "figma", "canvas"],
    "صور": ["image", "images", "photo", "creative", "media"],
    "فيديو": ["video", "media", "youtube", "editing"],
    "بحث": ["research", "search", "discovery"],
    "انترنت": ["internet", "web", "browser", "research", "search"],
    "ويب": ["web", "website", "browser", "internet"],
    "موقع": ["website", "web", "frontend", "development"],
    "امن": ["security", "systems", "forensics", "threat"],
    "اداره": ["management", "productivity", "project", "organization"],
    "مشروع": ["project", "management", "planning", "productivity"],
    "تنظيم": ["organization", "productivity", "management", "planning"],
    "ترجمه": ["translate", "translation", "language"],
    "جداول": ["spreadsheet", "excel", "xlsx", "data"],
    "اكسل": ["excel", "spreadsheet", "xlsx", "data"],
    "مبيعات": ["sales", "crm", "lead", "leads"],
    "عملاء": ["customer", "customers", "crm", "support", "sales"],
    "دعم": ["support", "helpdesk", "customer"],
    "تواصل": ["communication", "messaging", "slack", "teams", "collaboration"],
    "متجر": ["ecommerce", "commerce", "shopify", "payments"],
    "دفع": ["payment", "payments", "stripe", "commerce"],
    "تخزين": ["storage", "files", "drive", "cloud"],
    "سحابه": ["cloud", "storage", "drive", "files"],
    "تطبيق": ["app", "application", "automation"],
    "تطبيقات": ["apps", "applications", "automation"],
    "اتمته": ["automation", "workflow", "integration"],
    "تلقائي": ["automation", "workflow", "automatic"],
    "اختبار": ["test", "testing", "qa", "quality"],
    "pdf": ["pdf", "document"],
    "coding": ["code", "development", "developer", "programming"],
    "programming": ["code", "coding", "development", "developer"],
    "developer": ["development", "code", "coding", "programming"],
    "analyse": ["analyze", "analysis", "analytics", "data"],
    "analyze": ["analysis", "analytics", "data", "insight"],
    "analytics": ["analysis", "data", "insight"],
    "write": ["writing", "writer", "content", "copy"],
    "writer": ["writing", "content", "article"],
    "documents": ["document", "docs", "pdf", "docx", "files"],
    "email": ["mail", "gmail", "outlook"],
    "meetings": ["meeting", "calendar", "zoom", "scheduling"],
    "images": ["image", "photo", "design", "creative"],
    "automate": ["automation", "workflow", "integration"],
    "automated": ["automation", "workflow", "integration"],
    "spreadsheets": ["spreadsheet", "excel", "xlsx", "data"],
    "customers": ["customer", "crm", "support", "sales"],
  }),
);

const QUERY_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "best",
  "can",
  "could",
  "do",
  "find",
  "for",
  "give",
  "help",
  "i",
  "in",
  "is",
  "me",
  "need",
  "of",
  "open",
  "please",
  "recommend",
  "search",
  "show",
  "skill",
  "skills",
  "the",
  "to",
  "tool",
  "tools",
  "want",
  "with",
  "you",
  "ابي",
  "ابحث",
  "ابغي",
  "ابغى",
  "احتاج",
  "اداه",
  "اريد",
  "افتح",
  "افضل",
  "اقتراح",
  "اقترح",
  "الي",
  "المناسب",
  "المناسبه",
  "او",
  "اي",
  "بحث",
  "بين",
  "ساعدني",
  "شي",
  "شيء",
  "عن",
  "علي",
  "في",
  "كيف",
  "لاجل",
  "لي",
  "ما",
  "ممكن",
  "من",
  "مهاره",
  "مهارات",
  "هذا",
  "هل",
  "هو",
  "وش",
  "ايش",
  "و",
]);

const OPEN_LICENSE_PATTERNS = [
  /\bApache(?: License)?[- ]?2(?:\.0)?\b/i,
  /\bMIT\b/i,
  /\bA?GPL[- ]?[23](?:\.0)?\b/i,
  /\bBSD(?:[- ][23](?:-Clause)?)?\b/i,
  /\bMPL[- ]?2(?:\.0)?\b/i,
  /\bCC0[- ]?1(?:\.0)?\b/i,
];

/** Normalize Arabic variants, accents, punctuation, and whitespace for matching. */
export function normalizeText(value) {
  return String(value ?? "")
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectLocale(value) {
  return ARABIC_CHARACTER.test(String(value ?? "")) ? "ar" : "en";
}

function cleanDisplay(value, maxLength = 160) {
  return String(value ?? "")
    .replace(/[<>\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function expandTerm(term) {
  const normalized = normalizeText(term);
  const variants = [normalized];

  if (normalized.startsWith("ال") && normalized.length > 4) variants.push(normalized.slice(2));
  if (normalized.startsWith("لل") && normalized.length > 4) variants.push(normalized.slice(2));

  for (const variant of [...variants]) {
    variants.push(...(TERM_EXPANSIONS.get(variant) ?? []));
  }

  return unique(variants.map(normalizeText));
}

function queryTerms(value) {
  return unique(
    normalizeText(value)
      .split(" ")
      .filter((term) => term.length > 1 && !QUERY_STOP_WORDS.has(term)),
  );
}

function exactTokenMatch(haystack, term) {
  return (` ${haystack} `).includes(` ${term} `);
}

function makeMatch(skill, score, matchedTerms) {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    kind: skill.kind,
    sourceType: skill.sourceType,
    sourceUrl: skill.sourceUrl,
    license: skill.license,
    hasScripts: skill.hasScripts,
    featured: skill.featured,
    score: Math.round(score),
    matchedTerms: unique(matchedTerms),
  };
}

function searchCatalog(skills, rawQuery, limit = MAX_MATCHES) {
  const terms = queryTerms(rawQuery);
  const fullQuery = terms.join(" ");

  if (!terms.length) {
    return [...skills]
      .sort((a, b) => {
        if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
        if (a.kind !== b.kind) return a.kind === "curated" ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit)
      .map((skill, index) => makeMatch(skill, 20 - index, []));
  }

  const groups = terms.map(expandTerm);
  const ranked = [];

  for (const skill of skills) {
    const name = normalizeText(skill.name);
    const slug = normalizeText(skill.slug);
    const description = normalizeText(skill.description);
    const category = normalizeText(skill.category);
    const author = normalizeText(skill.author ?? "");
    const searchText = normalizeText(skill.searchText ?? "");
    const allText = `${name} ${slug} ${description} ${category} ${author} ${searchText}`;
    let score = 0;
    let coveredGroups = 0;
    let hasStrongIdentityMatch = false;
    const matchedTerms = [];

    if (name === fullQuery || slug === fullQuery) score += 180;
    else {
      if (fullQuery && name.includes(fullQuery)) score += 82;
      if (fullQuery && slug.includes(fullQuery)) score += 76;
      if (fullQuery && category.includes(fullQuery)) score += 30;
      if (fullQuery && description.includes(fullQuery)) score += 24;
    }

    for (let index = 0; index < groups.length; index += 1) {
      const group = groups[index];
      let groupScore = 0;
      let bestTerm = "";

      for (const candidate of group) {
        let candidateScore = 0;
        if (exactTokenMatch(name, candidate)) {
          candidateScore = 38;
          hasStrongIdentityMatch = true;
        }
        else if (name.includes(candidate)) candidateScore = 30;
        else if (exactTokenMatch(slug, candidate)) {
          candidateScore = 28;
          hasStrongIdentityMatch = true;
        }
        else if (slug.includes(candidate)) candidateScore = 24;
        else if (exactTokenMatch(category, candidate)) candidateScore = 20;
        else if (category.includes(candidate)) candidateScore = 16;
        else if (exactTokenMatch(description, candidate)) candidateScore = 14;
        else if (description.includes(candidate)) candidateScore = 11;
        else if (allText.includes(candidate)) candidateScore = 7;

        if (candidateScore > groupScore) {
          groupScore = candidateScore;
          bestTerm = candidate;
        }
      }

      if (groupScore > 0) {
        coveredGroups += 1;
        score += groupScore;
        matchedTerms.push(bestTerm || terms[index]);
      }
    }

    // A precise skill name/slug (for example `pdf`) is reliable even when a
    // surrounding task word such as "analysis" is absent from its short copy.
    // Keep strict multi-term coverage for looser description/category hits.
    const minimumCoverage = hasStrongIdentityMatch
      ? 1
      : groups.length < 3
        ? groups.length
        : Math.ceil(groups.length * 0.6);
    if (coveredGroups < minimumCoverage) continue;

    score += (coveredGroups / groups.length) * 28;
    if (skill.featured) score += 7;
    if (skill.kind === "curated") score += 9;
    if (skill.hasScripts) score += 2;

    ranked.push(makeMatch(skill, score, matchedTerms));
  }

  return ranked
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function getSkill(skills, id) {
  return skills.find((skill) => skill.id === id);
}

function mentionedSkills(text, skills) {
  const normalized = normalizeText(text);
  const mentions = [];

  for (const skill of skills) {
    const name = normalizeText(skill.name);
    if (name.length < 2 || !exactTokenMatch(normalized, name)) continue;
    const index = normalized.indexOf(name);
    if (index >= 0) mentions.push({ skill, index, nameLength: name.length });
  }

  return mentions
    .sort((a, b) => a.index - b.index || b.nameLength - a.nameLength)
    .filter((mention, index, list) => {
      return !list.slice(0, index).some(
        (other) =>
          other.skill.id === mention.skill.id ||
          (other.index === mention.index && other.nameLength > mention.nameLength),
      );
    })
    .map(({ skill }) => skill);
}

function ordinalIndex(text) {
  const normalized = normalizeText(text);
  const ordinals = [
    [0, ["الاول", "الاولي", "اول", "first", "1"]],
    [1, ["الثاني", "الثانيه", "ثاني", "second", "2"]],
    [2, ["الثالث", "الثالثه", "ثالث", "third", "3"]],
    [3, ["الرابع", "الرابعه", "رابع", "fourth", "4"]],
    [4, ["الخامس", "الخامسه", "خامس", "fifth", "5"]],
  ];

  for (const [index, words] of ordinals) {
    if (words.some((word) => exactTokenMatch(normalized, word))) return index;
  }
  return null;
}

function conversationTarget(messages, skills, latestText) {
  const currentMentions = mentionedSkills(latestText, skills);
  if (currentMentions.length) return currentMentions[0];

  const wantedIndex = ordinalIndex(latestText);
  for (let index = messages.length - 2; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "assistant") continue;
    const mentions = mentionedSkills(message.content, skills);
    if (mentions.length) return mentions[wantedIndex ?? 0] ?? mentions[0];
  }

  return null;
}

function intentQuery(text) {
  const normalized = normalizeText(text);
  const intentWords = new Set([
    "add",
    "command",
    "compare",
    "copy",
    "favorite",
    "favourite",
    "install",
    "license",
    "licence",
    "source",
    "versus",
    "vs",
    "اضف",
    "انسخ",
    "تثبيت",
    "ثبت",
    "رخصه",
    "ترخيص",
    "قارن",
    "مقارنه",
    "مصدر",
    "المصدر",
    "مفضله",
    "للمفضله",
    "مقابل",
  ]);
  return normalized
    .split(" ")
    .filter((word) => !intentWords.has(word) && !QUERY_STOP_WORDS.has(word))
    .join(" ");
}

function classifyIntent(text) {
  const value = normalizeText(text);
  if (!value || /^(مرحبا|اهلا|السلام عليكم|hello|hi|hey)$/.test(value)) return "help";
  if (/(?:مساعده|ماذا تستطيع|وش تسوي|ايش تسوي|help|what can you do|capabilities)/.test(value)) return "help";
  if (/(?:كم مهار|احصائي|ارقام|عدد المهار|catalog stats|statistics|how many skills)/.test(value)) return "stats";
  if (/(?:اخر تحديث|اخر مزامنه|متي تحديث|متى تحديث|sync status|last sync|latest update|upstream commit)/.test(value)) return "sync";
  if (/(?:^| )(?:قارن|مقارنه|مقابل|compare|versus|vs)(?: |$)/.test(value)) return "compare";
  if (/(?:ترخيص|رخصه|license|licence)/.test(value)) return "license";
  if (/(?:ثبت|تثبيت|امر التثبيت|انسخ الامر|install|copy command)/.test(value)) return "install";
  if (/(?:اضف.*مفضله|للمفضله|favorite|favourite)/.test(value)) return "favorite";
  if (/(?:افتح المصدر|رابط المصدر|افتح.*github|رابط.*github|source link|open source|github (?:source|link))/.test(value)) return "source";
  if (navigationTarget(value)) return "navigate";
  return "search";
}

function navigationTarget(normalizedText) {
  const targets = [
    { words: ["الرئيسيه", "home page", "homepage"], href: "/", ar: "الرئيسية", en: "Home" },
    { words: ["استكشف", "الدليل", "explore", "directory"], href: "/explore", ar: "دليل المهارات", en: "Skills directory" },
    { words: ["تعلم", "دليل التعلم", "learn", "learning guide"], href: "/learn", ar: "صفحة التعلّم", en: "Learning guide" },
    { words: ["عن الموقع", "about"], href: "/about", ar: "عن المشروع", en: "About" },
    { words: ["الوكيل", "المساعد الذكي", "agent page"], href: "/agent", ar: "الوكيل أطلس", en: "Atlas Agent" },
  ];
  const hasNavigationVerb = /(?:افتح|اذهب|خذني|انتقل|open|go|navigate|show)/.test(normalizedText);
  return targets.find((target) => {
    const found = target.words.some((word) => normalizedText.includes(normalizeText(word)));
    return found && (hasNavigationVerb || normalizedText.split(" ").length <= 3);
  }) ?? null;
}

function isOpenLicense(license) {
  return OPEN_LICENSE_PATTERNS.some((pattern) => pattern.test(String(license ?? "")));
}

function installCommand(skill) {
  if (!skill?.repositoryPath) return null;
  const directory = skill.repositoryPath.replace(/\/SKILL\.md$/i, "");
  if (
    !directory ||
    directory.startsWith("/") ||
    directory.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(directory) ||
    directory.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    return null;
  }
  const targetName = directory.split("/").at(-1) ?? skill.slug;
  const shellQuote = (value) => `'${String(value).replace(/'/g, `'"'"'`)}'`;
  return [
    "git clone --depth 1 https://github.com/ComposioHQ/awesome-claude-skills.git",
    "mkdir -p ~/.config/claude-code/skills",
    `cp -R ${shellQuote(`awesome-claude-skills/${directory}`)} ~/.config/claude-code/skills/${shellQuote(targetName)}`,
  ].join("\n");
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function formatNumber(value, locale) {
  return (locale === "ar" ? ARABIC_NUMBER : ENGLISH_NUMBER).format(Number(value) || 0);
}

function formatDate(value, locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanDisplay(value, 40) || (locale === "ar" ? "غير معروف" : "unknown");
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function labels(locale) {
  return locale === "ar"
    ? {
        explore: "استكشف الدليل",
        favorite: "أضف إلى المفضلة",
        install: "انسخ أمر التثبيت",
        learn: "دليل الاستخدام",
        open: "افتح المهارة",
        source: "افتح المصدر",
        viewAll: "اعرض كل النتائج",
      }
    : {
        explore: "Explore directory",
        favorite: "Add to favorites",
        install: "Copy install command",
        learn: "Usage guide",
        open: "Open skill",
        source: "Open source",
        viewAll: "View all results",
      };
}

function skillActions(skill, locale, options = {}) {
  const text = labels(locale);
  const actions = [];
  if (options.open !== false) {
    actions.push({ type: "open_skill", label: `${text.open}: ${skill.name}`, href: `/skills/${encodeURIComponent(skill.slug)}` });
  }
  if (options.favorite) {
    actions.push({ type: "favorite", label: text.favorite, skillId: skill.id });
  }
  if (options.source) {
    const href = safeExternalUrl(skill.sourceUrl);
    if (href) actions.push({ type: "open_source", label: text.source, href });
  }
  if (options.copy) {
    const command = installCommand(skill);
    if (command) actions.push({ type: "copy", label: text.install, text: command });
  }
  return actions;
}

function dedupeActions(actions) {
  const seen = new Set();
  return actions.filter((action) => {
    const key = `${action.type}:${action.href ?? action.skillId ?? action.text ?? action.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveTarget(input, query) {
  const fromConversation = conversationTarget(input.messages, input.skills, input.latestText);
  if (fromConversation) return fromConversation;
  const match = searchCatalog(input.skills, query || input.latestText, 1)[0];
  return match ? getSkill(input.skills, match.id) : null;
}

function helpResponse(input) {
  const text = labels(input.locale);
  const matches = searchCatalog(input.skills, "", 3);
  const reply = input.locale === "ar"
    ? "أنا وكيل أطلس بلا مفاتيح API: أبحث في كامل دليل المهارات، أوصي لك حسب المهمة، أقارن الخيارات، أشرح الترخيص، أجهّز أمر التثبيت، أفتح المصادر، وأدير المفضلة والتنقّل. معرفتي بالموقع تُحدَّث آليًا من GitHub كل يوم، ولا تُرسل رسائلك إلى نموذج مدفوع. جرّب: «أفضل مهارة لتحليل ملفات PDF» أو «قارن بين pdf و xlsx»."
    : "I am Atlas Agent with no API key: I search the full skills catalog, recommend for a task, compare options, explain recorded licenses, prepare install commands, open sources, and handle favorites or navigation. My site knowledge refreshes from GitHub every day, and your messages are not sent to a paid model. Try “best skill for PDF analysis” or “compare pdf and xlsx.”";
  return {
    reply,
    matches,
    actions: [
      { type: "navigate", label: text.explore, href: "/explore" },
      { type: "navigate", label: text.learn, href: "/learn" },
    ],
  };
}

function statsResponse(input) {
  const snapshot = input.snapshot;
  const text = labels(input.locale);
  const categoryCounts = Object.entries(snapshot.categoryCounts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const topCategories = categoryCounts
    .map(([name, count]) => `${name} (${formatNumber(count, input.locale)})`)
    .join(input.locale === "ar" ? "، " : ", ");

  const reply = input.locale === "ar"
    ? `يحمل الدليل الآن ${formatNumber(snapshot.total, "ar")} مهارة: ${formatNumber(snapshot.curated, "ar")} مختارة و${formatNumber(snapshot.automation, "ar")} للأتمتة. منها ${formatNumber(snapshot.internal, "ar")} داخل المستودع و${formatNumber(snapshot.external, "ar")} مصدرًا خارجيًا، موزعة على ${formatNumber(snapshot.categories.length, "ar")} فئة.${topCategories ? ` أكبر الفئات: ${topCategories}.` : ""}`
    : `The catalog currently holds ${formatNumber(snapshot.total, "en")} skills: ${formatNumber(snapshot.curated, "en")} curated and ${formatNumber(snapshot.automation, "en")} automations. ${formatNumber(snapshot.internal, "en")} are in the repository and ${formatNumber(snapshot.external, "en")} point to external sources, across ${formatNumber(snapshot.categories.length, "en")} categories.${topCategories ? ` Largest categories: ${topCategories}.` : ""}`;
  return {
    reply,
    matches: [],
    actions: [{ type: "navigate", label: text.explore, href: "/explore" }],
  };
}

function syncResponse(input) {
  const snapshot = input.snapshot;
  const commit = cleanDisplay(snapshot.upstreamCommit, 40);
  const date = formatDate(snapshot.syncedAt, input.locale);
  const upstreamDate = formatDate(snapshot.upstreamCommitDate, input.locale);
  const href = `https://github.com/ComposioHQ/awesome-claude-skills/commit/${encodeURIComponent(commit)}`;
  const reply = input.locale === "ar"
    ? `آخر مزامنة للمعرفة كانت ${date} (UTC). الإصدار الحالي من المصدر هو ${commit.slice(0, 7)} بتاريخ ${upstreamDate}. يفحص GitHub Actions المصدر يوميًا ويعيد بناء الدليل بعد نجاح الاختبارات.`
    : `The knowledge catalog was last synced at ${date} (UTC). Its current upstream revision is ${commit.slice(0, 7)}, dated ${upstreamDate}. GitHub Actions checks the source daily and rebuilds the catalog only after tests pass.`;
  return {
    reply,
    matches: [],
    actions: [{ type: "open_source", label: input.locale === "ar" ? "اعرض نسخة GitHub" : "View GitHub revision", href }],
  };
}

function navigationResponse(input) {
  const target = navigationTarget(normalizeText(input.latestText));
  if (!target) return helpResponse(input);
  return {
    reply: input.locale === "ar" ? `جاهز — سأنقلك إلى ${target.ar}.` : `Ready — I can take you to ${target.en}.`,
    matches: [],
    actions: [{ type: "navigate", label: input.locale === "ar" ? `اذهب إلى ${target.ar}` : `Go to ${target.en}`, href: target.href }],
  };
}

function targetNotFound(input) {
  const text = labels(input.locale);
  return {
    reply: input.locale === "ar"
      ? "لم أستطع تحديد المهارة المقصودة بعد. اكتب اسمها، أو اطلب مني البحث بالمهمة أولًا ثم قل «افتح الثانية» مثلًا."
      : "I could not identify the intended skill yet. Enter its name, or ask me to search by task first and then say “open the second one.”",
    matches: [],
    actions: [{ type: "navigate", label: text.explore, href: "/explore" }],
  };
}

function installResponse(input) {
  const target = resolveTarget(input, intentQuery(input.latestText));
  if (!target) return targetNotFound(input);
  const command = installCommand(target);
  const match = makeMatch(target, 100, [normalizeText(target.name)]);

  if (!command) {
    return {
      reply: input.locale === "ar"
        ? `${target.name} مصدر خارجي ولا يملك مسار تثبيت داخل هذا المستودع. يمكنك فتح صفحته أو المصدر لاتباع تعليماته الأصلية.`
        : `${target.name} is an external source and has no install path in this repository. Open its page or source for the original instructions.`,
      matches: [match],
      actions: skillActions(target, input.locale, { source: true }),
    };
  }

  return {
    reply: input.locale === "ar"
      ? `جهزت أمر تثبيت ${target.name}. راجعه قبل التنفيذ؛ فهو ينسخ مجلد المهارة من المستودع إلى مجلد مهارات Claude المحلي.`
      : `I prepared the install command for ${target.name}. Review it before running; it copies the skill directory from the repository into the local Claude skills folder.`,
    matches: [match],
    actions: skillActions(target, input.locale, { copy: true, source: true }),
  };
}

function favoriteResponse(input) {
  const target = resolveTarget(input, intentQuery(input.latestText));
  if (!target) return targetNotFound(input);
  return {
    reply: input.locale === "ar"
      ? `حددت ${target.name}. استخدم الإجراء أدناه لإضافتها إلى مفضلة هذا المتصفح.`
      : `I selected ${target.name}. Use the action below to add it to this browser's favorites.`,
    matches: [makeMatch(target, 100, [normalizeText(target.name)])],
    actions: skillActions(target, input.locale, { favorite: true }),
  };
}

function sourceResponse(input) {
  const target = resolveTarget(input, intentQuery(input.latestText));
  if (!target) return targetNotFound(input);
  return {
    reply: input.locale === "ar"
      ? `هذا هو المصدر الأصلي المسجل لمهارة ${target.name}${target.sourceType === "external" ? "، وهو رابط خارجي" : " داخل نسخة المستودع المتزامنة"}.`
      : `Here is the recorded original source for ${target.name}${target.sourceType === "external" ? ", which is an external link" : " in the synced repository revision"}.`,
    matches: [makeMatch(target, 100, [normalizeText(target.name)])],
    actions: skillActions(target, input.locale, { source: true }),
  };
}

function licenseResponse(input) {
  const query = intentQuery(input.latestText);
  const target = resolveTarget(input, query);

  if (!target && !query) {
    const declared = input.skills.filter((skill) => skill.license).length;
    const open = input.skills.filter((skill) => isOpenLicense(skill.license)).length;
    return {
      reply: input.locale === "ar"
        ? `يسجل الدليل نص ترخيص لـ ${formatNumber(declared, "ar")} مهارة، ومنها ${formatNumber(open, "ar")} تحمل صيغة ترخيص مفتوح معروفة. غياب الترخيص لا يعني السماح بالاستخدام؛ افتح مصدر المهارة وتحقق من شروطها قبل النسخ أو النشر.`
        : `The catalog records license text for ${formatNumber(declared, "en")} skills; ${formatNumber(open, "en")} use a recognized open-license form. A missing license does not grant permission—check the skill source before copying or publishing it.`,
      matches: [],
      actions: [{ type: "navigate", label: labels(input.locale).explore, href: "/explore" }],
    };
  }

  if (!target) return targetNotFound(input);
  const declaredLicense = cleanDisplay(target.license, 100);
  let statement;
  if (!declaredLicense) {
    statement = input.locale === "ar"
      ? "لا يسجل الكتالوج ترخيصًا صريحًا لها. هذا لا يعني أنها حرة الاستخدام؛ راجع المصدر الأصلي."
      : "The catalog does not record an explicit license. That does not make it free to use; check the original source.";
  } else if (isOpenLicense(declaredLicense)) {
    statement = input.locale === "ar"
      ? `الترخيص المسجل هو ${declaredLicense}، وهو من صيغ التراخيص المفتوحة المعروفة. تبقى الشروط الأصلية في المصدر هي المرجع.`
      : `Its recorded license is ${declaredLicense}, a recognized open-license form. The original source remains authoritative.`;
  } else {
    statement = input.locale === "ar"
      ? `النص المسجل للترخيص هو: ${declaredLicense}. لا أصنّفه تلقائيًا كترخيص مفتوح؛ راجع الشروط الأصلية قبل الاستخدام.`
      : `The recorded license text is: ${declaredLicense}. I do not automatically classify it as open; review the original terms before use.`;
  }

  return {
    reply: `${target.name}: ${statement}`,
    matches: [makeMatch(target, 100, [normalizeText(target.name)])],
    actions: skillActions(target, input.locale, { source: true }),
  };
}

function comparisonParts(value) {
  let normalized = normalizeText(value)
    .replace(/\b(?:compare|versus|vs)\b/g, " ")
    .replace(/(?:قارن|مقارنه|بين|مقابل)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = normalized.split(/\s+(?:و|مع|and|against)\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, 2);
  normalized = normalized.replace(/\s+/g, " ");
  return normalized ? [normalized] : [];
}

function compareResponse(input) {
  const parts = comparisonParts(input.latestText);
  const targets = [];

  for (const part of parts) {
    const match = searchCatalog(input.skills, part, 1)[0];
    const skill = match ? getSkill(input.skills, match.id) : null;
    if (skill && !targets.some((candidate) => candidate.id === skill.id)) targets.push(skill);
  }

  if (targets.length < 2) {
    const fallback = searchCatalog(input.skills, intentQuery(input.latestText), 5);
    for (const match of fallback) {
      const skill = getSkill(input.skills, match.id);
      if (skill && !targets.some((candidate) => candidate.id === skill.id)) targets.push(skill);
      if (targets.length === 2) break;
    }
  }

  if (targets.length < 2) {
    return {
      reply: input.locale === "ar"
        ? "اكتب اسمي مهارتين واضحتين، مثل: «قارن بين pdf و xlsx»."
        : "Enter two clear skill names, for example: “compare pdf and xlsx.”",
      matches: targets.map((skill) => makeMatch(skill, 100, [normalizeText(skill.name)])),
      actions: targets.flatMap((skill) => skillActions(skill, input.locale)),
    };
  }

  const [first, second] = targets;
  const describe = (skill) => {
    const type = skill.kind === "curated"
      ? (input.locale === "ar" ? "مختارة" : "curated")
      : (input.locale === "ar" ? "أتمتة" : "automation");
    const source = skill.sourceType === "internal"
      ? (input.locale === "ar" ? "داخل المستودع" : "in-repository")
      : (input.locale === "ar" ? "مصدر خارجي" : "external source");
    const scripts = skill.hasScripts
      ? (input.locale === "ar" ? "وتتضمن سكربتات" : "with scripts")
      : (input.locale === "ar" ? "من دون سكربتات مرفقة" : "without bundled scripts");
    const separator = input.locale === "ar" ? "، " : ", ";
    return `${skill.name} — ${[skill.category, type, source, scripts].join(separator)}`;
  };
  const reply = input.locale === "ar"
    ? `مقارنة مباشرة من بيانات الدليل:\n1) ${describe(first)}.\n2) ${describe(second)}.\nاختر الأولى عندما تطابق مهمتك وصف ${cleanDisplay(first.description, 110)}؛ واختر الثانية عندما تحتاج ${cleanDisplay(second.description, 110)}. افتح الصفحتين للتحقق من التعليمات والترخيص قبل التنفيذ.`
    : `Direct catalog comparison:\n1) ${describe(first)}.\n2) ${describe(second)}.\nChoose the first when your task matches “${cleanDisplay(first.description, 110)}”; choose the second when you need “${cleanDisplay(second.description, 110)}.” Open both pages to verify instructions and licensing before use.`;

  return {
    reply,
    matches: targets.map((skill, index) => makeMatch(skill, 110 - index, [normalizeText(skill.name)])),
    actions: targets.flatMap((skill) => skillActions(skill, input.locale)),
  };
}

function searchResponse(input) {
  const query = intentQuery(input.latestText) || normalizeText(input.latestText);
  if (!query) return helpResponse(input);
  const matches = searchCatalog(input.skills, query, MAX_MATCHES);
  const text = labels(input.locale);

  if (!matches.length) {
    const displayQuery = cleanDisplay(input.latestText, 90);
    return {
      reply: input.locale === "ar"
        ? `لم أجد تطابقًا موثوقًا لعبارة «${displayQuery}». جرّب وصف النتيجة بكلمات أبسط مثل: تحليل بيانات، كتابة محتوى، أتمتة بريد، أو تطوير كود.`
        : `I found no confident match for “${displayQuery}.” Try describing the outcome with simpler terms such as data analysis, content writing, email automation, or code development.`,
      matches: [],
      actions: [{ type: "navigate", label: text.explore, href: "/explore" }],
    };
  }

  const list = matches
    .map((match, index) => `${index + 1}. ${match.name} — ${cleanDisplay(match.description, 120)}`)
    .join("\n");
  const reply = input.locale === "ar"
    ? `وجدت ${formatNumber(matches.length, "ar")} خيارات مناسبة، مرتبة حسب تطابق الاسم والوصف والفئة:\n${list}\nيمكنك الآن قول «افتح الثانية» أو «ثبّت الأولى».`
    : `I found ${formatNumber(matches.length, "en")} relevant options, ranked by name, description, and category match:\n${list}\nYou can now say “open the second” or “install the first.”`;
  const actions = matches.slice(0, 3).map((match) => ({
    type: "open_skill",
    label: `${text.open}: ${match.name}`,
    href: `/skills/${encodeURIComponent(match.slug)}`,
  }));
  actions.push({
    type: "search",
    label: text.viewAll,
    href: `/explore?q=${encodeURIComponent(query)}`,
  });

  return { reply, matches, actions };
}

/** Run the deterministic, keyless SkillAtlas agent over an injected catalog. */
export function runAgent({ messages, skills, snapshot }) {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  const latestText = cleanDisplay(latest?.content ?? "", 4_000);
  const locale = detectLocale(latestText);
  const intent = classifyIntent(latestText);
  const input = { messages, skills, snapshot, latestText, locale };

  let result;
  switch (intent) {
    case "help":
      result = helpResponse(input);
      break;
    case "stats":
      result = statsResponse(input);
      break;
    case "sync":
      result = syncResponse(input);
      break;
    case "navigate":
      result = navigationResponse(input);
      break;
    case "install":
      result = installResponse(input);
      break;
    case "favorite":
      result = favoriteResponse(input);
      break;
    case "source":
      result = sourceResponse(input);
      break;
    case "license":
      result = licenseResponse(input);
      break;
    case "compare":
      result = compareResponse(input);
      break;
    default:
      result = searchResponse(input);
      break;
  }

  return {
    reply: result.reply,
    locale,
    matches: result.matches,
    actions: dedupeActions(result.actions).slice(0, 8),
    meta: {
      mode: "keyless",
      intent,
      catalogTotal: snapshot.total,
      syncedAt: snapshot.syncedAt,
      upstreamCommit: snapshot.upstreamCommit,
      upstreamCommitDate: snapshot.upstreamCommitDate,
      dailySync: true,
      privacy: "local-catalog",
    },
  };
}
