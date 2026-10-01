export interface GmailAnnouncement {
  id: string;
  title: string;
  description: string;
  content: string;
  source: string;
  sender: string;
  createdAt: number;
  dateStr: string;
  category: string;
  isImportant: boolean;
  gmailLink: string;
}

function decodeBase64Url(str: string): string {
  if (!str) return "";
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  try {
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0) || 0);
    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.error("Error decoding base64url:", e);
    return "";
  }
}

function getHeaderValue(headers: any[], name: string): string {
  if (!headers) return "";
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : "";
}

function getEmailBody(payload: any): string {
  if (!payload) return "";
  
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  
  if (payload.parts) {
    return findTextPart(payload.parts);
  }
  
  return "";
}

function findTextPart(parts: any[]): string {
  // Try text/html first, then text/plain
  const htmlPart = parts.find((part) => part.mimeType === "text/html");
  if (htmlPart && htmlPart.body && htmlPart.body.data) {
    return decodeBase64Url(htmlPart.body.data);
  }

  const plainPart = parts.find((part) => part.mimeType === "text/plain");
  if (plainPart && plainPart.body && plainPart.body.data) {
    return decodeBase64Url(plainPart.body.data);
  }

  for (const part of parts) {
    if (part.parts) {
      const result = findTextPart(part.parts);
      if (result) return result;
    }
  }

  return "";
}

/**
 * Clean up HTML to extract plain text snippet or readable text if needed,
 * but keeping HTML formatting is also nice for display.
 */
function cleanEmailBody(body: string): string {
  if (!body) return "";
  // Check if it's HTML, we might want to sanitize slightly or just render it
  return body;
}

/**
 * Fetch a single Gmail message by ID
 */
export async function getGmailMessage(accessToken: string, messageId: string): Promise<any> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch message ${messageId}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Parse a raw Gmail message into a structured GmailAnnouncement object
 */
export function parseGmailMessage(rawMessage: any): GmailAnnouncement {
  const payload = rawMessage.payload || {};
  const headers = payload.headers || [];
  
  const subject = getHeaderValue(headers, "Subject") || "(No Subject)";
  const fromValue = getHeaderValue(headers, "From") || "allstudents@kkumail.com";
  const dateValue = getHeaderValue(headers, "Date");
  
  const parsedDate = dateValue ? new Date(dateValue) : new Date();
  const createdAt = parsedDate.getTime();
  
  // Format to YYYY-MM-DD
  const y = parsedDate.getFullYear();
  const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const d = String(parsedDate.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  
  const rawBody = getEmailBody(payload);
  const content = cleanEmailBody(rawBody);

  // Determine isImportant from subject or labels
  const lowerSubject = subject.toLowerCase();
  const hasUrgentKeyword = 
    lowerSubject.includes("ด่วน") || 
    lowerSubject.includes("สำคัญ") || 
    lowerSubject.includes("urgent") || 
    lowerSubject.includes("important") ||
    lowerSubject.includes("ประกาศสำคัญ");
  
  const labels = rawMessage.labelIds || [];
  const isImportant = hasUrgentKeyword || labels.includes("IMPORTANT") || labels.includes("STARRED");

  return {
    id: rawMessage.id,
    title: subject,
    description: rawMessage.snippet || "ไม่มีรายละเอียดสั้น",
    content: content || rawMessage.snippet || "",
    source: "KKU Official Announcement",
    sender: fromValue,
    createdAt,
    dateStr,
    category: "From KKU",
    isImportant,
    gmailLink: `https://mail.google.com/mail/u/0/#inbox/${rawMessage.id}`
  };
}

/**
 * Fetches recent announcements from Gmail sent by allstudents@kkumail.com
 */
export async function getKKUAnnouncements(accessToken: string, limit: number = 20): Promise<GmailAnnouncement[]> {
  try {
    // 1. List messages matching from:allstudents@kkumail.com
    const query = encodeURIComponent("from:allstudents@kkumail.com");
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${limit}`;
    
    const response = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    const listData = await response.json();
    const messages = listData.messages || [];

    if (messages.length === 0) {
      return [];
    }

    // 2. Fetch full details for each message in parallel
    const detailPromises = messages.map(async (msg: { id: string }) => {
      try {
        const rawMsg = await getGmailMessage(accessToken, msg.id);
        return parseGmailMessage(rawMsg);
      } catch (err) {
        console.error(`Failed to load details for message ${msg.id}:`, err);
        return null;
      }
    });

    const parsedMessages = await Promise.all(detailPromises);
    
    // Filter out nulls and sort by createdAt descending (newest first)
    return (parsedMessages.filter(m => m !== null) as GmailAnnouncement[])
      .sort((a, b) => b.createdAt - a.createdAt);

  } catch (error: any) {
    console.error("Error in getKKUAnnouncements:", error);
    throw error;
  }
}
