import { GoogleGenAI } from '@google/genai';
import { QuotationData, DEFAULT_QUOTATION } from '../types/quote';

export async function parseQuoteFromNaturalText(
  inputText: string,
  currentData: QuotationData
): Promise<Partial<QuotationData>> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a financial quotation assistant. Convert the user's freeform text into a structured JSON quotation object.
Here is the user's text:
"${inputText}"

Return ONLY a valid JSON object with this exact shape:
{
  "client": {
    "name": "string",
    "company": "string",
    "address": "string",
    "phone": "string"
  },
  "details": {
    "projectDescription": "string"
  },
  "items": [
    {
      "description": "string",
      "quantity": number,
      "price": number
    }
  ],
  "pricing": {
    "currencySymbol": "string (e.g. ₱, $, €, £)",
    "taxAmount": number,
    "othersFee": number
  },
  "terms": "string"
}
If any field is not mentioned, make a reasonable guess based on the user's request. Return ONLY the raw JSON without markdown codeblocks or explanation.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const raw = response.text || '';
      const cleanJson = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        ...currentData,
        client: {
          ...currentData.client,
          ...(parsed.client || {}),
        },
        details: {
          ...currentData.details,
          ...(parsed.details || {}),
        },
        items: (parsed.items && parsed.items.length > 0)
          ? parsed.items.map((it: any, i: number) => ({
              id: `item-${Date.now()}-${i}`,
              description: it.description || 'Item description',
              quantity: Number(it.quantity) || 1,
              price: Number(it.price) || 0,
            }))
          : currentData.items,
        pricing: {
          ...currentData.pricing,
          ...(parsed.pricing || {}),
        },
        terms: parsed.terms || currentData.terms,
      };
    } catch (err) {
      console.warn('Gemini API call failed, using rule-based parser fallback:', err);
    }
  }

  // Robust Rule-Based Fallback Parser (works offline & without API key!)
  return parseWithSmartRules(inputText, currentData);
}

function parseWithSmartRules(text: string, current: QuotationData): QuotationData {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const updatedItems: { id: string; description: string; quantity: number; price: number }[] = [];

  let detectedClientName = current.client.name;
  let detectedCompany = current.client.company;
  let detectedCurrency = current.pricing.currencySymbol;
  let detectedDescription = current.details.projectDescription;

  // Detect currency
  if (text.includes('KSh') || text.includes('ksh') || text.includes('KES') || text.toLowerCase().includes('shilling')) {
    detectedCurrency = 'KSh';
  } else if (text.includes('₱') || text.toLowerCase().includes('php') || text.toLowerCase().includes('peso')) {
    detectedCurrency = '₱';
  } else if (text.includes('$') || text.toLowerCase().includes('usd')) {
    detectedCurrency = '$';
  } else if (text.includes('€') || text.toLowerCase().includes('eur')) {
    detectedCurrency = '€';
  } else if (text.includes('£') || text.toLowerCase().includes('gbp')) {
    detectedCurrency = '£';
  }

  // Detect client / company patterns like "For Mary Anne", "Client: ABC", "To: Acme Corp"
  const forMatch = text.match(/(?:for|client|to|customer):\s*([^,\n\.]+)/i);
  if (forMatch && forMatch[1]) {
    const rawTarget = forMatch[1].trim();
    if (rawTarget.toLowerCase().includes('inc') || rawTarget.toLowerCase().includes('corp') || rawTarget.toLowerCase().includes('ltd') || rawTarget.toLowerCase().includes('company')) {
      detectedCompany = rawTarget;
    } else {
      detectedClientName = rawTarget;
    }
  }

  // Detect item lines: e.g. "5 laptops at 100", "3x Chairs - $45", "10 units Cement @ 280", "Design work: 500"
  for (const line of lines) {
    // pattern: <qty> [units/pcs/x]? <name> [at/@] <price>
    const itemMatch = line.match(/^[-*•]?\s*(\d+)?\s*(?:x|units?|pcs?|items?)?\s*(?:of\s+)?([a-zA-Z0-9\s,\-_]+?)(?:\s+(?:at|@|for|costs?|amounting to|priced at|-)\s+|\s*[:=]\s*)[^\d]*([\d,]+(?:\.\d+)?)/i);
    
    if (itemMatch) {
      const qty = parseInt(itemMatch[1] || '1', 10);
      const desc = itemMatch[2].trim();
      const price = parseFloat(itemMatch[3].replace(/,/g, ''));

      if (desc && !isNaN(price) && desc.length > 2) {
        updatedItems.push({
          id: `item-${Date.now()}-${updatedItems.length}`,
          description: desc.charAt(0).toUpperCase() + desc.slice(1),
          quantity: Math.max(1, qty),
          price: price,
        });
        continue;
      }
    }

    // pattern: <name> - <qty> - <price>
    const parts = line.split(/[,;\t|]/);
    if (parts.length >= 3) {
      const desc = parts[0].trim();
      const qty = parseInt(parts[1].trim(), 10);
      const price = parseFloat(parts[2].replace(/[^\d.]/g, ''));
      if (desc && !isNaN(qty) && !isNaN(price)) {
        updatedItems.push({
          id: `item-${Date.now()}-${updatedItems.length}`,
          description: desc,
          quantity: qty,
          price: price,
        });
        continue;
      }
    }
  }

  // If no structured item matched, check if there's any mention of numbers
  if (updatedItems.length === 0) {
    const genericMatches = text.matchAll(/(\d+)\s+([a-zA-Z\s]{3,30})\s+(?:at|@)\s+([\d,]+)/gi);
    for (const match of genericMatches) {
      updatedItems.push({
        id: `item-${Date.now()}-${updatedItems.length}`,
        description: match[2].trim(),
        quantity: parseInt(match[1], 10),
        price: parseFloat(match[3].replace(/,/g, '')),
      });
    }
  }

  return {
    ...current,
    client: {
      ...current.client,
      name: detectedClientName,
      company: detectedCompany,
    },
    pricing: {
      ...current.pricing,
      currencySymbol: detectedCurrency,
    },
    items: updatedItems.length > 0 ? updatedItems : current.items,
  };
}
