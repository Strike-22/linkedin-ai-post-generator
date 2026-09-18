const topics = [
  {
    title: "XLOOKUP vs VLOOKUP - why column numbers break beginner reports",
    source: "Excel learning",
    signal: "Useful beginner skill for replacing messy lookup formulas in daily reporting tasks.",
    angle: "Show one simple before-and-after: old VLOOKUP confusion versus a cleaner XLOOKUP workflow.",
    summary:
      "XLOOKUP helps beginners avoid VLOOKUP column-index mistakes and build cleaner lookup reports.",
    imageIdea: "A clean laptop desk photo showing an Excel-style table, highlighted lookup column, and simple dashboard cards.",
    tags: ["Excel", "reporting", "beginner"]
  },
  {
    title: "Power BI dashboards that answer one business question",
    source: "Power BI learning",
    signal: "Strong portfolio topic because recruiters can quickly understand dashboard thinking.",
    angle: "Explain that a good dashboard is not about many charts, but one clear business question.",
    summary:
      "A beginner Power BI dashboard should focus on one clear business question, clean visuals, and a simple insight the viewer can act on.",
    imageIdea: "A modern analytics dashboard on a monitor with 3-4 clean charts and a person reviewing business metrics.",
    tags: ["Power BI", "dashboard", "analytics"]
  },
  {
    title: "LEFT JOIN vs INNER JOIN - why your row count changes",
    source: "SQL learning",
    signal: "Core interview and analytics skill for students entering data roles.",
    angle: "Use a classroom example: students table plus marks table, then explain why joins matter.",
    summary:
      "SQL joins help beginners understand why matched and unmatched rows can change analysis results.",
    imageIdea: "Two database tables on a screen connected by a highlighted key column, with a simple query notebook beside it.",
    tags: ["SQL", "database", "beginner"]
  },
  {
    title: "Pandas dropna mistake - why missing values need context first",
    source: "Python learning",
    signal: "Practical skill for internship projects, analytics assignments, and portfolio notebooks.",
    angle: "Tell a small story about turning messy rows into clean insights using pandas.",
    summary:
      "Pandas helps beginners clean missing values, but deleting rows too quickly can remove important business context.",
    imageIdea: "A Python notebook on a laptop showing a small data-cleaning workflow with neat before-and-after tables.",
    tags: ["Python", "pandas", "data cleaning"]
  },
  {
    title: "Train-test split - how to know if a model is learning or memorizing",
    source: "ML learning",
    signal: "Beginner-friendly ML concept that shows serious understanding without overcomplication.",
    angle: "Explain why testing on unseen data matters using a student exam analogy.",
    summary:
      "Train-test split helps beginners check whether a machine learning model works on unseen data.",
    imageIdea: "A simple split dataset visual on a whiteboard beside a laptop running a beginner ML notebook.",
    tags: ["Machine Learning", "model training", "beginner"]
  }
];

const API_BASE = "http://localhost:4000";
const TOPIC_BATCH_SIZE = 5;

const IMAGE_VISUAL_STYLES = [
  "Clean flat vector infographic style, soft cream background, muted coral and sky-blue accents, simple icon cards, neat charts, beginner-friendly educational layout.",
  "Modern pastel dashboard infographic style, light lavender background, purple, teal, green, and orange chart accents, rounded data cards, clean icons, airy spacing.",
  "Retro editorial infographic style, warm beige paper background, navy, brick red, soft orange, and periwinkle blocks, minimal geometric charts, magazine-like learning poster.",
  "Dark charcoal analytics infographic style, neon cyan, violet, and orange accents, glowing chart lines, world-map or dashboard elements, high contrast but readable.",
  "White clean SaaS dashboard style, subtle gray grid background, blue and green data highlights, KPI cards, bar charts, line charts, professional analytics report feel.",
  "Minimal classroom poster style, off-white background, marker-like diagrams, simple tables, arrows, sticky-note labels, calm blue and yellow accents, student learning feel.",
  "Bold LinkedIn carousel-cover style, large title area, strong geometric blocks, deep blue, teal, white, and warm yellow accents, clean hierarchy, scroll-stopping but not crowded.",
  "Isometric data workspace style, soft gradient background, 3D-style laptop, charts, database blocks, and notebook elements, polished educational tech illustration.",
  "Newspaper data explainer style, light gray background, strong black typography, thin chart lines, small colored highlights, structured editorial infographic layout.",
  "Colorful simple icon infographic style, pale background, circular icons, arrows, progress bars, mini charts, friendly beginner tone, clear visual story."
];

const state = {
  selectedTopic: topics[0],
  allBackendTopics: [],
  templateStyle: null,
  lastImageBrief: "",
  draftVariantIndex: 0,
  shownInSession: [],
  scheduleJobId: localStorage.getItem("scheduleJobId") || "",
  scheduleEnabled: JSON.parse(localStorage.getItem("scheduleEnabled") || "false"),
  log: JSON.parse(localStorage.getItem("runLog") || "[]")
};

const topicList = document.querySelector("#topicList");
const topicFilter = document.querySelector("#topicFilter");

const postPreview = document.querySelector("#postPreview");
const imagePrompt = document.querySelector("#imagePrompt");
const postImage = document.querySelector("#postImage");
const uploadedPreview = document.querySelector("#uploadedPreview");
const generationStatus = document.querySelector("#generationStatus");
const scheduleToggle = document.querySelector("#scheduleToggle");
const publishTimeInput = document.querySelector("#publishTime");
const timezoneInput = document.querySelector("#timezone");
const scheduleDot = document.querySelector("#scheduleDot");
const scheduleLabel = document.querySelector("#scheduleLabel");
const scheduleMeta = document.querySelector("#scheduleMeta");
const runLog = document.querySelector("#runLog");

publishTimeInput.value = localStorage.getItem("publishTime") || publishTimeInput.value;
timezoneInput.value = localStorage.getItem("timezone") || timezoneInput.value;

function renderTopics() {
  const query = topicFilter.value.trim().toLowerCase();
  const visibleTopics = topics.filter((topic) => {
    const haystack = [topic.title, topic.source, topic.summary, topic.tag || ""].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  topicList.innerHTML = "";

  if (!visibleTopics.length) {
    topicList.innerHTML = `<div class="empty-state">No topics yet. Click Refresh topics or check that the backend is running.</div>`;
    return;
  }

  visibleTopics.forEach((topic) => {
    const card = document.createElement("div");
    card.className = `topic-card ${state.selectedTopic.title === topic.title ? "selected" : ""}`;
    card.role = "button";
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="topic-card-header">
        <strong>${topic.title}</strong>
        <button class="topic-dismiss" type="button" aria-label="Hide this topic" title="Hide this topic">╳</button>
      </div>
      <span>${topic.summary}</span>
      <span class="topic-meta"><span>${topic.tag || topic.source || ""}</span></span>
    `;
    card.addEventListener("click", () => {
      state.selectedTopic = topic;
      state.templateStyle = null;
      renderTopics();
      renderSelectedTopic();
      generationStatus.textContent = "Topic changed. Click Generate with Gemini for a fresh AI post.";
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      card.click();
    });
    card.querySelector(".topic-dismiss").addEventListener("click", (event) => {
      event.stopPropagation();
      dismissTopic(topic);
    });
    topicList.appendChild(card);
  });
}

async function dismissTopic(topic) {
  const dismissedWasSelected = state.selectedTopic?.title === topic.title;

  if (topic?.title) {
    state.shownInSession.push(topic.title);
    const excludedParam = encodeURIComponent(state.shownInSession.join(','));
    
    try {
      const response = await fetch(`${API_BASE}/api/trends?excluded=${excludedParam}&count=1`);
      if (!response.ok) throw new Error('Failed to fetch replacement topic');
      
      const replacementTopic = await response.json();
      
      if (replacementTopic && replacementTopic.length > 0) {
        topics.splice(0, topics.length, ...replacementTopic);
        state.selectedTopic = topics[0];
        
        topicFilter.value = "";
        renderTopics();
        
        if (state.selectedTopic) {
          state.templateStyle = null;
          renderSelectedTopic();
          generationStatus.textContent = "Topic hidden. A replacement topic was loaded.";
        }
      } else {
        state.selectedTopic = null;
        topicFilter.value = "";
        renderTopics();
        generationStatus.textContent = "All topics have been shown. Click Refresh topics to start over.";
      }
    } catch (error) {
      state.selectedTopic = null;
      topicFilter.value = "";
      renderTopics();
      generationStatus.textContent = `Failed to load replacement topic: ${error.message}`;
    }
  }

  if (dismissedWasSelected && !state.selectedTopic) {
    postPreview.value = "";
    imagePrompt.value = "";
    generationStatus.textContent = "All topics have been shown. Click Refresh topics to start over.";
  }
}

async function loadTopics() {
  const excludedTitles = state.shownInSession || [];
  const excludedParam = encodeURIComponent(excludedTitles.join(','));
  
  try {
    const response = await fetch(`${API_BASE}/api/trends?excluded=${excludedParam}&count=10`);
    if (!response.ok) throw new Error('Failed to fetch trends');
    
    const newTopics = await response.json();
    
    if (newTopics.length === 0) {
      state.shownInSession = [];
      return await loadTopics();
    }
    
    state.shownInSession.push(...newTopics.map(t => t.title));
    topics.splice(0, topics.length, ...newTopics);
    
    state.selectedTopic = topics[0];
    state.templateStyle = null;
    topicFilter.value = "";
    renderTopics();
    renderSelectedTopic();
    state.log.unshift(`${new Date().toLocaleString()} - Loaded ${newTopics.length} topics.`);
    localStorage.setItem("runLog", JSON.stringify(state.log));
    renderSchedule();
  } catch (error) {
    state.log.unshift(`${new Date().toLocaleString()} - Failed to load topics: ${error.message}.`);
      renderSchedule();
  }
}

async function initializeTopics() {
  topicList.innerHTML = `<div class="empty-state">Loading fresh educational topics...</div>`;
  postPreview.value = "Loading topic draft...";

  try {
    await loadTopics();
  } catch (error) {
    state.log.unshift(`${new Date().toLocaleString()} - Failed to initialize topics: ${error.message}.`);
    renderSchedule();
  }
}


function renderSelectedTopic() {
  imagePrompt.value = buildImagePrompt(state.selectedTopic);
}

function getImageVisualStyle(topic) {
  const seedText = `${topic.title || ""}|${topic.tags?.join(",") || ""}|${state.draftVariantIndex}`;
  let hash = 0;

  for (let index = 0; index < seedText.length; index += 1) {
    hash = (hash * 31 + seedText.charCodeAt(index)) >>> 0;
  }

  return IMAGE_VISUAL_STYLES[hash % IMAGE_VISUAL_STYLES.length];
}

function buildImagePrompt(topic) {
  const title = topic.title;
  const tag = topic.tag || "Data Analytics";
  const visualBrief = state.lastImageBrief || `Show a clean educational infographic explaining: ${topic.summary || title}`;
  const visualStyle = getImageVisualStyle(topic);

  return `Create a professional 16:9 LinkedIn educational infographic.

Topic: ${title}

Visual style:
${visualStyle}

Main visual:
${visualBrief}

General rules:
No human faces.
No watermark.
No logos.
No random text.
No spelling mistakes.
Do not show "16:9" text in the image.
Keep all text large and readable.
Professional, attractive, scroll-stopping LinkedIn educational infographic.

Topic category: ${tag}`;
}







function cleanPostFormatting(postText) {
  return postText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}(?=#)/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getTopicPostDetails(topic) {
  const text = `${topic.title} ${topic.tags?.join(" ") || ""}`.toLowerCase();

  if (text.includes("sql") || text.includes("join") || text.includes("group by")) {
    return {
      area: "SQL",
      context: "Think tables, keys, filters, row counts, and query output.",
      input: "Tables, columns, and a clear question",
      process: "Write the query, check the logic, then compare the result",
      output: "A query result you can explain",
      mistake: "Writing syntax before understanding what rows should come back",
      practice: "Use two small tables and compare the output before and after the query"
    };
  }

  if (text.includes("python") || text.includes("pandas") || text.includes("code")) {
    return {
      area: "Python",
      context: "Think code cells, DataFrames, functions, cleaning steps, and output checks.",
      input: "A small CSV, list, or DataFrame",
      process: "Run one operation, inspect the output, then write what changed",
      output: "Cleaner data or a small result table",
      mistake: "Copying code without checking what the output means",
      practice: "Use one small dataset and explain each code output in plain English"
    };
  }

  if (text.includes("power") || text.includes("tableau") || text.includes("dashboard") || text.includes("visual")) {
    return {
      area: "Dashboard",
      context: "Think KPIs, filters, charts, dashboard layout, and one business question.",
      input: "A dataset with categories, dates, and measures",
      process: "Build one visual, add one filter, then explain the insight",
      output: "A dashboard view that answers one question",
      mistake: "Adding too many visuals before deciding the main insight",
      practice: "Create one dashboard page around one clear question"
    };
  }

  if (text.includes("excel") || text.includes("pivot") || text.includes("xlookup") || text.includes("vlookup")) {
    return {
      area: "Excel",
      context: "Think sheets, formulas, tables, highlighted cells, and clean reports.",
      input: "A small worksheet with rows and columns",
      process: "Apply one formula or feature, then compare before vs after",
      output: "A cleaner report or summary table",
      mistake: "Learning the feature without understanding the lookup, summary, or reporting need",
      practice: "Use one small sheet and turn it into a simple summary"
    };
  }

  if (text.includes("machine") || text.includes("model") || text.includes("deep") || text.includes("neural")) {
    return {
      area: "ML/AI",
      context: "Think data, features, labels, train/test split, model output, and errors.",
      input: "A small dataset with features and a target",
      process: "Train or explain one model step, then check the prediction/output",
      output: "A model result or learning concept you can explain",
      mistake: "Using advanced terms before understanding data, output, and evaluation",
      practice: "Use one tiny ML example and explain what the model is trying to learn"
    };
  }

  return {
    area: "Data Analytics",
    context: "Think data, questions, steps, output, and explanation.",
    input: "A small dataset or learning example",
    process: "Apply one concept and check the result",
    output: "A clear answer you can explain",
    mistake: "Learning the definition without applying it once",
    practice: "Use one small example and explain the result in plain English"
  };
}

function getUseCases(topic) {
  const text = `${topic.title} ${topic.tags?.join(" ") || ""}`.toLowerCase();
  if (text.includes("excel")) return "• Reports\n• Data cleaning\n• Monthly summaries\n• Business tracking";
  if (text.includes("power") || text.includes("tableau") || text.includes("dashboard")) return "• Dashboards\n• KPI tracking\n• Business reporting\n• Portfolio projects";
  if (text.includes("sql")) return "• Data analysis\n• Database queries\n• Joining tables\n• Interview questions";
  if (text.includes("python") || text.includes("pandas")) return "• Data cleaning\n• Automation\n• Exploratory analysis\n• ML preparation";
  if (text.includes("machine") || text.includes("model")) return "• Prediction\n• Classification\n• Model evaluation\n• Data science projects";
  if (text.includes("deep")) return "• Image recognition\n• NLP\n• Pattern learning\n• AI applications";
  return "• Learning projects\n• Portfolio posts\n• Interview preparation\n• Real-world practice";
}

function getTopicExplanation(topic) {
  const text = `${topic.title} ${topic.tags?.join(" ") || ""}`.toLowerCase();
  if (text.includes("xlookup")) {
    return {
      short: "A lookup function that finds matching values without the common VLOOKUP column-number confusion.",
      medium: "XLOOKUP helps search a table in a cleaner way, so reports become easier to build and easier to read.",
      long: "XLOOKUP connects a search value with the result you need, which makes Excel reporting cleaner and less error-prone."
    };
  }
  if (text.includes("pivot")) {
    return {
      short: "A quick Excel summary tool for grouping and calculating data without writing complex formulas.",
      medium: "Pivot tables help turn many rows into simple summaries like totals, counts, and category-wise breakdowns.",
      long: "Pivot tables are useful when raw data feels too large, because they help summarize patterns in a few clicks."
    };
  }
  if (text.includes("power") || text.includes("dashboard")) {
    return {
      short: "A dashboard skill for turning raw numbers into clear visuals and business insights.",
      medium: "Power BI helps organize charts, filters, and KPIs so users can understand one business question faster.",
      long: "A good Power BI dashboard is not about adding many visuals; it is about helping someone answer a question clearly."
    };
  }
  if (text.includes("sql") || text.includes("join") || text.includes("group by")) {
    return {
      short: "A database concept that helps ask useful questions from structured tables.",
      medium: "SQL helps retrieve, combine, filter, and summarize data stored across tables.",
      long: "SQL is the language that turns database tables into answers, especially when data is spread across multiple places."
    };
  }
  if (text.includes("tableau")) {
    return {
      short: "A data visualization skill for building charts that tell a clear story.",
      medium: "Tableau helps transform data into interactive visuals that are easier to explore and explain.",
      long: "Tableau is useful when the goal is not only analysis, but also communicating the story behind the numbers."
    };
  }
  if (text.includes("python") || text.includes("pandas")) {
    return {
      short: "A coding skill for cleaning, transforming, and analyzing data step by step.",
      medium: "Python and pandas help handle messy datasets so they become ready for analysis, dashboards, or ML.",
      long: "Python is powerful for data work because it can clean, automate, analyze, and prepare data in one workflow."
    };
  }
  if (text.includes("machine") || text.includes("model") || text.includes("confusion")) {
    return {
      short: "A machine learning concept that helps understand how models learn and make predictions.",
      medium: "Machine learning basics help check whether a model is learning useful patterns or only memorizing examples.",
      long: "Machine learning becomes easier when each concept is linked to model training, testing, errors, and real predictions."
    };
  }
  if (text.includes("deep") || text.includes("neural")) {
    return {
      short: "A deep learning idea that explains how neural networks learn patterns from examples.",
      medium: "Deep learning uses layers to learn patterns, which makes it useful for images, text, audio, and complex data.",
      long: "Deep learning concepts become clearer when you think of layers as steps that gradually learn useful patterns."
    };
  }
  if (text.includes("prompt") || text.includes("ai")) {
    return {
      short: "An AI skill for giving clearer instructions and getting more useful responses.",
      medium: "Prompting improves when the task, context, examples, and output format are written clearly.",
      long: "AI prompting is not just asking questions; it is designing instructions so the model understands the goal."
    };
  }
  return {
    short: "A beginner-friendly concept that supports practical data and AI learning.",
    medium: "This topic helps connect basic understanding with practical exercises and small portfolio examples.",
    long: "This topic is useful because it can be learned through a small example, explained clearly, and connected to real projects."
  };
}

function getImportancePoints(topic) {
  const text = `${topic.title} ${topic.tags?.join(" ") || ""}`.toLowerCase();
  if (text.includes("excel")) return "✅ Reduces manual reporting effort\n✅ Improves spreadsheet accuracy\n✅ Helps create cleaner summaries\n✅ Useful in almost every business role";
  if (text.includes("power") || text.includes("tableau") || text.includes("dashboard")) return "✅ Makes data easier to understand\n✅ Improves business communication\n✅ Helps tell a story with visuals\n✅ Useful for portfolio dashboards";
  if (text.includes("sql")) return "✅ Helps work directly with databases\n✅ Builds strong analytics fundamentals\n✅ Common in data interviews\n✅ Useful before Power BI, Tableau, Python, and ML";
  if (text.includes("python") || text.includes("pandas")) return "✅ Handles messy real-world data\n✅ Supports automation\n✅ Prepares data for analysis and ML\n✅ Useful for notebook-based projects";
  if (text.includes("machine") || text.includes("deep") || text.includes("model")) return "✅ Builds AI fundamentals\n✅ Helps understand prediction errors\n✅ Improves model evaluation thinking\n✅ Useful for beginner ML projects";
  if (text.includes("ai") || text.includes("prompt")) return "✅ Improves AI output quality\n✅ Saves time during learning\n✅ Helps structure better questions\n✅ Useful across many tools";
  return "✅ Builds fundamentals\n✅ Improves practice quality\n✅ Helps explain concepts clearly\n✅ Supports portfolio learning";
}

async function generatePost(regenerate = false) {
  const tone = document.querySelector("#tone").value.toLowerCase().replace("founder-like", "professional").replace("warm mentor", "mentor").replace("insightful", "professional").replace("contrarian", "provocative");
  const length = document.querySelector("#length").value;
  const audience = document.querySelector("#audience").value.toLowerCase().replace("students", "students").replace("institute instructors", "instructors").replace("hr and recruiters", "recruiters").replace("professional connections", "general");
  const topic = state.selectedTopic;

  postPreview.value = "Generating with Gemini...";
  generationStatus.textContent = regenerate ? "Refreshing post with same template style..." : "Calling backend Gemini generator...";

  try {
    const response = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        tone,
        audience,
        length,
        previousTemplateStyle: regenerate ? state.templateStyle : null
      })
    });

    if (!response.ok) throw new Error("Generate API failed");

    const data = await response.json();
    state.templateStyle = data.templateStyle;
    state.lastImageBrief = data.imageVisualBrief || "";
    postPreview.value = cleanPostFormatting(data.postText);
    imagePrompt.value = buildImagePrompt(state.selectedTopic);
    generationStatus.textContent = regenerate ? "Post refreshed with fresh content in the same style." : "Generated with Gemini. Review before publishing.";
    renderTopics();
  } catch (error) {
    generationStatus.textContent = `Gemini generation failed. Check backend terminal.`;
    state.log.unshift(`${new Date().toLocaleString()} - Backend generation failed: ${error.message}.`);
    renderSchedule();
  }
}

function renderSchedule() {
  scheduleToggle.checked = state.scheduleEnabled;
  scheduleDot.classList.toggle("active", state.scheduleEnabled);

  if (state.scheduleEnabled) {
    const time = publishTimeInput.value;
    const timezone = timezoneInput.value;
    scheduleLabel.textContent = "Schedule enabled";
    scheduleMeta.textContent = `Daily publishing at ${time} (${timezone}).`;
  } else {
    scheduleLabel.textContent = "Schedule disabled";
    scheduleMeta.textContent = "No automatic publishing is active.";
  }

  runLog.innerHTML = "";
  const logs = state.log.length ? state.log : ["No scheduler events yet."];
  logs.slice(0, 5).forEach((entry) => {
    const item = document.createElement("p");
    item.textContent = entry;
    runLog.appendChild(item);
  });
}

async function setSchedule(enabled) {
  state.scheduleEnabled = enabled;

  try {
    if (enabled) {
      const response = await fetch(`${API_BASE}/api/schedule/daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: state.selectedTopic,
          tone: document.querySelector("#tone").value.toLowerCase(),
          audience: document.querySelector("#audience").value.toLowerCase(),
          length: document.querySelector("#length").value,
          publishTime: publishTimeInput.value,
          timezone: timezoneInput.value
        })
      });

      if (!response.ok) throw new Error("Schedule API failed");

      const data = await response.json();
      state.scheduleJobId = data.job.jobId;
      state.log.unshift(`${new Date().toLocaleString()} - Enabled backend daily schedule for "${state.selectedTopic.title}".`);
    } else {
      if (state.scheduleJobId) {
        await fetch(`${API_BASE}/api/schedule/${state.scheduleJobId}`, { method: "DELETE" });
      }
      state.scheduleJobId = "";
      state.log.unshift(`${new Date().toLocaleString()} - Disabled schedule. Future daily runs stopped immediately.`);
    }
  } catch (error) {
    state.log.unshift(`${new Date().toLocaleString()} - Schedule API unavailable. Local toggle state updated only.`);
  }

  renderSchedule();
}

document.querySelector("#generatePost").addEventListener("click", () => generatePost(false));
document.querySelector("#refreshTemplate").addEventListener("click", () => {
  generatePost(true);
});
document.querySelector("#refreshTopics").addEventListener("click", loadTopics);
document.querySelector("#copyImagePrompt").addEventListener("click", async () => {
  await navigator.clipboard.writeText(imagePrompt.value);
  generationStatus.textContent = "Image prompt copied. Use it in your image tool, then upload the PNG/JPG here.";
});
postImage.addEventListener("change", () => {
  const file = postImage.files?.[0];
  if (!file) {
    uploadedPreview.textContent = "No image selected.";
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  uploadedPreview.innerHTML = `<img src="${objectUrl}" alt="Uploaded LinkedIn post image preview">`;
});
document.querySelector("#publishTextOnly").addEventListener("click", async () => {
  if (!confirm("This will publish a real text-only post to your personal LinkedIn profile. Continue?")) return;

  try {
    generationStatus.textContent = "Publishing text-only post to LinkedIn...";
    const response = await fetch(`${API_BASE}/api/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postText: postPreview.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(formatPublishError(data));
    generationStatus.textContent = `Published text post successfully. ${data.url || ""}`;
  } catch (error) {
    generationStatus.textContent = `Publish failed: ${error.message}`;
  }
});
document.querySelector("#publishWithImage").addEventListener("click", async () => {
  const file = postImage.files?.[0];
  if (!file) {
    generationStatus.textContent = "Upload a PNG/JPG image before publishing with image.";
    return;
  }

  if (!confirm("This will publish a real post with image to your personal LinkedIn profile. Continue?")) return;

  try {
    generationStatus.textContent = "Publishing image post to LinkedIn...";
    const formData = new FormData();
    formData.append("postText", postPreview.value);
    formData.append("image", file);

    const response = await fetch(`${API_BASE}/api/publish/image`, {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(formatPublishError(data));
    generationStatus.textContent = `Published image post successfully. ${data.url || ""}`;
  } catch (error) {
    generationStatus.textContent = `Image publish failed: ${error.message}`;
  }
});

function formatPublishError(data) {
  const details = data.linkedinDetails ? ` LinkedIn: ${JSON.stringify(data.linkedinDetails)}` : "";
  const status = data.linkedinStatus ? ` Status: ${data.linkedinStatus}.` : "";
  return `${data.error || "Publish failed"}.${status}${details}`;
}
topicFilter.addEventListener("input", renderTopics);
scheduleToggle.addEventListener("change", (event) => setSchedule(event.target.checked));
publishTimeInput.addEventListener("change", () => {
  localStorage.setItem("publishTime", publishTimeInput.value);
  renderSchedule();
});
timezoneInput.addEventListener("change", () => {
  localStorage.setItem("timezone", timezoneInput.value);
  renderSchedule();
});
["#tone", "#length", "#audience"].forEach((selector) => {
  document.querySelector(selector).addEventListener("change", () => {
    generationStatus.textContent = "Settings changed. Click Generate with Gemini for a fresh AI post.";
  });
});

const themeToggle = document.querySelector("#themeToggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
  themeToggle.textContent = "☀️";
} else {
  themeToggle.textContent = "🌙";
}

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "🌙";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "☀️";
  }
});

renderSchedule();
initializeTopics();
