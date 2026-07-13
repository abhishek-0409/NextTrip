

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../constants/errors';

const SYSTEM_PROMPT =
  'You are a helpful travel assistant for Toureez, a travel booking platform. ' +
  'Help users with trip planning, booking queries, vendor recommendations, and travel advice. ' +
  'Keep answers short and friendly. Do not answer questions unrelated to travel.';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

let genAI: GoogleGenerativeAI | null = null;

const getClient = (): GoogleGenerativeAI => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey === undefined || apiKey.trim() === '') {
    throw new AppError('AI assistant is not configured', 503);
  }

  if (genAI === null) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI;
};

const SEARCH_PARSE_PROMPT =
  'You convert a traveler\'s free-text trip search into JSON filters. ' +
  'Return ONLY a compact JSON object (no prose, no markdown) with any of these optional keys: ' +
  'destination (string, a city/place name), state (string), trip_type ("domestic"|"international"), ' +
  'category (string, one of: adventure, leisure, pilgrimage, honeymoon, family, wildlife), ' +
  'min_price (number, INR), max_price (number, INR), min_rating (number 0-5). ' +
  'Omit keys you cannot confidently infer. Example input "cheap adventure trips in Himachal under 15k" -> ' +
  '{"destination":"Himachal","category":"adventure","max_price":15000}.';

export interface ParsedSearchFilters {
  destination?: string;
  state?: string;
  trip_type?: 'domestic' | 'international';
  category?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseSearchQuery = async (query: string): Promise<ParsedSearchFilters> => {
  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SEARCH_PARSE_PROMPT,
  });

  let raw: string;

  try {
    const result = await model.generateContent(query);
    raw = result.response.text().trim();
  } catch {
    return {};
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch === null) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return {};
  }

  if (!isPlainObject(parsed)) {
    return {};
  }

  const filters: ParsedSearchFilters = {};

  if (typeof parsed.destination === 'string' && parsed.destination.trim() !== '') {
    filters.destination = parsed.destination.trim();
  }
  if (typeof parsed.state === 'string' && parsed.state.trim() !== '') {
    filters.state = parsed.state.trim();
  }
  if (parsed.trip_type === 'domestic' || parsed.trip_type === 'international') {
    filters.trip_type = parsed.trip_type;
  }
  if (typeof parsed.category === 'string' && parsed.category.trim() !== '') {
    filters.category = parsed.category.trim();
  }
  if (typeof parsed.min_price === 'number' && Number.isFinite(parsed.min_price)) {
    filters.min_price = parsed.min_price;
  }
  if (typeof parsed.max_price === 'number' && Number.isFinite(parsed.max_price)) {
    filters.max_price = parsed.max_price;
  }
  if (typeof parsed.min_rating === 'number' && Number.isFinite(parsed.min_rating)) {
    filters.min_rating = parsed.min_rating;
  }

  return filters;
};

export const getChatReply = async (
  message: string,
  history: ChatMessage[],
  tripContext?: string,
): Promise<string> => {
  const systemInstruction =
    tripContext === undefined || tripContext.trim() === ''
      ? SYSTEM_PROMPT
      : `${SYSTEM_PROMPT}\n\nThe traveler is asking about this specific upcoming/ongoing trip:\n${tripContext}`;

  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
  });

  const chat = model.startChat({
    history: history.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    })),
  });

  try {
    const result = await chat.sendMessage(message);
    const reply = result.response.text().trim();

    if (reply === '') {
      throw new AppError('AI assistant returned an empty response', 502);
    }

    return reply;
  } catch (caughtError) {
    if (caughtError instanceof AppError) {
      throw caughtError;
    }

    throw new AppError('AI assistant is temporarily unavailable', 502);
  }
};
