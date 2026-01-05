/**
 * Chatbase API Client
 * Proxy for Chatbase API to hide API key on the server side
 */

const CHATBASE_API_URL = "https://www.chatbase.co/api/v1";

interface ChatbaseMessage {
    role: "user" | "assistant";
    content: string;
}

interface ChatbaseResponse {
    text: string;
    conversationId?: string;
}

export async function sendMessageToChatbase(
    message: string,
    conversationId?: string
): Promise<ChatbaseResponse> {
    const apiKey = process.env.CHATBASE_API_KEY;
    const botId = process.env.CHATBASE_BOT_ID;

    if (!apiKey || !botId) {
        throw new Error("Chatbase API credentials not configured");
    }

    const body: Record<string, unknown> = {
        messages: [{ role: "user", content: message }],
        chatbotId: botId,
        stream: false,
    };

    if (conversationId) {
        body.conversationId = conversationId;
    }

    const response = await fetch(`${CHATBASE_API_URL}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Chatbase API error:", error);
        throw new Error(`Chatbase API error: ${response.status}`);
    }

    const data = await response.json();

    return {
        text: data.text || data.response || "",
        conversationId: data.conversationId,
    };
}
