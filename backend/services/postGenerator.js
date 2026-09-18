import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const TONE_INSTRUCTIONS = {
  professional: 'Authoritative but approachable. Use concrete details. Avoid slang.',
  casual: 'Conversational, warm, first-person storytelling. Feels like a smart colleague talking.',
  provocative: 'Challenge assumptions with a useful, defensible take. Do not manufacture outrage.',
  mentor: 'Patient, practical, and encouraging. Teach without sounding basic.',
};

const AUDIENCE_CONTEXT = {
  students: 'Audience: students and complete beginners learning Excel, Power BI, SQL, Tableau, Python, ML, AI, or deep learning. Write like you are explaining to someone who has never used these tools before. Use everyday examples.',
  instructors: 'Audience: institute instructors and mentors who teach beginners. Make the post teachable, structured, and easy to explain in a classroom setting.',
  recruiters: 'Audience: HR professionals and recruiters reviewing candidates. Show practical skill development, learning discipline, and employability — but keep the content educational.',
  general: 'Audience: LinkedIn connections who are early in their data analytics journey. Keep it beginner-friendly, clear, and useful. No heavy jargon, no assumptions about prior knowledge.',
};

const LENGTH_WORDS = {
  short: 100,
  medium: 180,
  long: 280,
};

const TEMPLATE_STYLES = {
  'Tip Stack': `LINE 1-2: Hook naming a real time-waster or mistake related to the topic.
LINE 3: One bridge sentence.
LINE 4: "Here's what actually works:" (or similar)
LINE 5-7: Three lines, each starting with →, each naming a SPECIFIC function/method/shortcut/syntax with real code or exact key combo, followed by one sentence on when to use it.
LINE 8-9: A 1-2 sentence real scenario including a NUMBER (rows, minutes, percentage, errors).
LINE 10: End with an engagement question that invites the reader to share their experience or opinion. Examples:
  'Which of these do you use most — drop it in the comments.'
  'Have you tried this approach? What worked for you?'
  'Which one tripped you up first? Let me know below.'
  'Trying any of these this week? Share below.'
  The question must be directly related to the post topic, not generic. Never use 'Save this' or 'Bookmark this' as the final CTA — always end with a question that invites a comment.
LINE 11: Exactly 5 hashtags - 2 broad (e.g. #DataAnalytics, #Python), 2 niche (e.g. #PandasTips), 1 audience (e.g. #DataAnalyst).

FULL WORKED EXAMPLE FOR THE TOPIC "Handling missing values in pandas - fillna dropna":
---
Most beginners run df.dropna() and lose 30% of their dataset without realizing it.

Missing data isn't always an error - sometimes it's information.

Here's what actually works:

→ df.isnull().sum() - run this FIRST to see how many nulls per column before deciding anything
→ df.fillna(df.mean()) - replaces nulls with column average, good for numeric columns like sales or age
→ df.dropna(subset=['email']) - only drops rows missing critical fields, keeps everything else

On a 5000-row customer dataset, blindly using dropna() deleted 1,400 rows. Using fillna on non-critical columns kept 1,380 of them.

Which of these have you run into on a real dataset? Drop it below.

#DataAnalytics #Python #PandasTips #DataCleaning #DataAnalyst
---`,

  'Mistake to Fix': `LINE 1-2: Hook describing a common mistake or misconception related to the topic. Name the mistake directly.
LINE 3: One sentence explaining why this mistake is so common.
LINE 4: "Here's how to fix it:" (or similar)
LINE 5-7: Three lines, each formatted "❌ Wrong: [wrong approach] → ✅ Fix: [correct approach]" with specific code/syntax/shortcut.
LINE 8-9: A 1-2 sentence before-and-after comparison including a NUMBER showing the impact of the fix.
LINE 10: A "Try this next time" or "Practice this fix" style CTA.
LINE 11: Exactly 5 hashtags - 2 broad, 2 niche, 1 audience.`,

  'X vs Y': `Hook naming two competing approaches/tools/methods. Write "[Topic A] vs [Topic B]" as the hook.

[Topic A]:
→ [specific limitation or use case with real syntax]
→ [specific limitation or use case with real syntax]

[Topic B]:
→ [specific advantage or use case with real syntax]
→ [specific advantage or use case with real syntax]

[1-2 line real scenario with a NUMBER showing why the difference matters]

[Engagement question directly related to the topic — never "Save this" or "Bookmark this"]
[Exactly 5 hashtags - 2 broad, 2 niche, 1 audience]

NEVER alternate between topics paragraph by paragraph. Group ALL points about Topic A together first, then ALL points about Topic B together. Each point starts with →.`,

  'Numbered Insights': `LINE 1-2: Hook naming a surprising, useful, or underrated aspect of the topic.
LINE 3: One bridge sentence.
LINE 4: "Here are X insights:" (or similar) where X is 3-5.
LINE 5-9: 3-5 numbered lines, each naming a specific function/method/shortcut/syntax with real code or exact key combo, followed by one sentence on when or why to use it.
LINE 10: A closing summary sentence plus a "Save this" or "Bookmark this" style CTA.
LINE 11: Exactly 5 hashtags - 2 broad, 2 niche, 1 audience.`,

  'Story to Lesson': `LINE 1-2: A short personal or relatable story related to the topic. Use "I" or "you" to feel real.
LINE 3: The turning point or realization.
LINE 4: "Here's the lesson:" (or similar)
LINE 5-7: 2-3 actionable takeaways, each including specific code/syntax/shortcut with a brief explanation.
LINE 8-9: A 1-2 sentence connecting the story back to daily analytical work, including a NUMBER.
LINE 10: A "Keep this in mind" or "Next time you" style CTA.
LINE 11: Exactly 5 hashtags - 2 broad, 2 niche, 1 audience.`,
};

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY in .env');
  }

  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function generatePost({ topic, tone = 'casual', audience = 'general', length = 'medium', previousTemplateStyle = null }) {
  const client = getClient();
  const wordTarget = LENGTH_WORDS[length] ?? LENGTH_WORDS.medium;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  let structureInstructions;
  let styleInstruction;

  if (previousTemplateStyle && TEMPLATE_STYLES[previousTemplateStyle]) {
    structureInstructions = `YOU MUST use the following template structure:

${TEMPLATE_STYLES[previousTemplateStyle]}

Use this EXACT structure but write completely fresh content and wording. Rephrase every sentence. Do NOT copy any wording from the example.`;
    styleInstruction = `TEMPLATE STYLE: ${previousTemplateStyle}. Return only the post text. No quotes, no extra formatting.`;
  } else {
    const allStyles = Object.entries(TEMPLATE_STYLES).map(([name, structure]) =>
      `--- ${name} ---\n${structure}`
    ).join('\n\n');

    structureInstructions = `Choose ONE of the following template styles and use its structure exactly:

${allStyles}

Pick the style that best fits the topic. Start your response with the template name in square brackets on line 1, for example:
[Tip Stack]

Then a blank line, then the post content. Do NOT include the style name anywhere else.`;
    styleInstruction = 'Start your response with [Style Name] on line 1, then a blank line, then the post. No other text, quotes, or formatting.';
  }

  const system = `You are an expert LinkedIn ghostwriter. You write SPECIFIC, ACTIONABLE posts - never vague advice about "learning" or "understanding concepts."

TOPIC: ${topic.title}
CONTEXT: ${topic.summary || 'No summary available'}

${structureInstructions}

BANNED PHRASES (if you write any of these, you have failed):
"helps you understand", "the data is already there", "plain meaning", "the operations you need most", "used in:", "3-step habit", "explain the result", "check the output", "learning in public"

BANNED HASHTAGS: #LearningInPublic #CareerSkills

RULES:
- Every actionable line MUST contain actual code, a function name with parentheses, or an exact keyboard shortcut.
- The number in the scenario must be specific (not "many" or "a lot").
- STRICT LENGTH LIMIT: Maximum ${wordTarget} words total for the entire post including hashtags. Count carefully. If using Mistake to Fix template, use maximum 2 wrong/fix pairs, not 3. Cut scenario to 1 sentence maximum.
- ${TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.casual}
- ${AUDIENCE_CONTEXT[audience] || AUDIENCE_CONTEXT.general}
- ${styleInstruction}
- Do not use markdown bold (**text**) or italic formatting - LinkedIn does not render markdown. Write in plain text only.
- CRITICAL FORMATTING: Add a blank line (double newline \n\n) between EVERY section: after the hook, after each → point, after the scenario, and before the CTA. Each → point must be on its own line. Never run points together in the same paragraph. LinkedIn only creates visual breaks with blank lines.
- After writing the post (including hashtags), add a final section starting with 'IMAGE_BRIEF:' that describes in 2-3 lines what specific diagram/comparison/code visual would best represent THIS post's actual content (use the same functions/numbers you just wrote about). Do not include the IMAGE_BRIEF line in the post content itself.
 
Now write a post for the topic given above. Never use these words: leverage, synergy, game-changer, disruptive, revolutionize, transformative.`;

  const user = `Topic title: ${topic.title}
Summary: ${topic.summary || 'No summary available'}
Source URL: ${topic.url || 'No source URL'}
Category: ${topic.tag || 'AI/ML'}`;

  const response = await client.models.generateContent({
    model,
    contents: `${system}\n\n${user}`,
    config: {
      maxOutputTokens: 3000,
      temperature: 0.6,
    },
  });

  const generatedText = response.text;
  if (!generatedText) throw new Error('AI provider returned no text content');

  let templateStyle = previousTemplateStyle;
  let postText = generatedText;

  if (!previousTemplateStyle) {
    const styleMatch = generatedText.match(/^\[([^\]]+)\]\s*\n/);
    if (styleMatch && TEMPLATE_STYLES[styleMatch[1]]) {
      templateStyle = styleMatch[1];
      postText = generatedText.replace(/^\[[^\]]+\]\s*\n/, '');
    } else {
      templateStyle = 'Tip Stack';
    }
  }

  let imageVisualBrief = '';
  const imageBriefMatch = postText.match(/IMAGE_BRIEF:\s*\n?([\s\S]*)/);
  if (imageBriefMatch) {
    imageVisualBrief = imageBriefMatch[1].trim();
    postText = postText.replace(/IMAGE_BRIEF:\s*\n?[\s\S]*$/, '').trim();
  }

  return { postText: limitHashtags(postText.trim()), templateStyle, imageVisualBrief };
}

export async function generateEducationalTopics({
  focusAreas = ['Excel', 'Power BI', 'SQL', 'Tableau', 'Python', 'Machine Learning', 'AI', 'Deep Learning'],
  level = 'basic beginner',
  count = 12,
} = {}) {
  const client = getClient();
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const prompt = `You are a Data Analytics content strategist for LinkedIn.

Generate ${count} specific, beginner-friendly educational post topics.

Focus areas: ${focusAreas.join(', ')}
Level: ${level}
Target audience: freshers, MIS executives, junior data analysts, students, institute instructors, HR/recruiters, and professional LinkedIn connections.

Topic rules:
- Each topic must be a specific concept, not a broad category.
- Frame each topic as a problem, comparison, beginner mistake, interview issue, dashboard/reporting use case, or real-world work scenario.
- Avoid generic titles like "Introduction to Python", "SQL basics", "What is Power BI", or "Excel formulas".
- Prefer titles like:
  - "WHERE vs HAVING in SQL - most beginners confuse these"
  - "NULL vs empty string in SQL - they are not the same"
  - "CTE vs Subquery - when to use which"
  - "Window functions explained with a sales dataset"
  - "TOP 5 SQL mistakes freshers make in interviews"
  - "VLOOKUP exact match mistake that breaks reports"
  - "Power BI slicers - how one filter changes the whole dashboard"

Return only valid JSON array. No markdown.
Each item must have:
- title
- summary
- tag
- angle
- imageIdea

Each title should sound like a useful LinkedIn educational post, not a course module.
Topics should be practical, basic-level, and useful for someone learning data analytics and AI skills.`;

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      maxOutputTokens: 1800,
      temperature: 0.9,
      responseMimeType: 'application/json',
    },
  });

  const generatedText = response.text;
  if (!generatedText) throw new Error('AI provider returned no topic ideas');

  return JSON.parse(generatedText);
}

function limitHashtags(postText) {
  const hashtags = postText.match(/#\w+/g) || [];
  if (hashtags.length <= 4) return postText;

  let cleaned = postText;
  for (const hashtag of hashtags.slice(4)) {
    cleaned = cleaned.replace(hashtag, '');
  }

  return cleaned.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
