import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';

const OUTPUT_DIR = path.resolve('generated-images');

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY in .env');
  }

  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function safeSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildEducationalImagePrompt(topic) {
  return `Create a professional LinkedIn educational infographic image.

Topic: ${topic.title}
Summary: ${topic.summary || ''}
Category: ${(topic.tags && topic.tags[0]) || topic.tag || 'Data Analytics'}

Style:
- Modern educational infographic
- Clean blue, teal, white, and dark navy palette
- Looks like a professional LinkedIn learning post
- Strong visual concept related to the topic
- No human faces or portraits
- No watermark
- No fake logos
- Minimal text only, because exact caption text will be outside the image
- If text appears, keep it simple and correct: topic name only

Composition:
- 16:9 landscape layout
- Central topic visual
- Supporting icons, charts, tables, code blocks, or neural network elements as appropriate
- Balanced spacing, polished design, attractive and scroll-stopping`;
}

export async function generateGeminiTopicImage(topic) {
  const client = getClient();
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const prompt = buildEducationalImagePrompt(topic);

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseModalities: ['IMAGE'],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart) {
    throw new Error('Gemini returned no image data');
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  const extension = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
  const fileName = `${Date.now()}-${safeSlug(topic.title)}.${extension}`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  await fs.writeFile(filePath, Buffer.from(imagePart.inlineData.data, 'base64'));

  return {
    fileName,
    filePath,
    url: `/generated-images/${fileName}`,
    prompt,
    mimeType,
  };
}
