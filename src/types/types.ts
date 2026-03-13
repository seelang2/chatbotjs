
// interface Message {
//     model: string,
//     id: string,
//     timestamp: string,
//     type: string,
//     role: string,
//     content: Array<{ type: string, text: string }>
// }

interface Message {
    role: 'user' | 'assistant',
    content: string,
    timestamp: string
}

interface ResponseMessage extends Message {
    tokens: Token,
    cost: number
}

type MessageHistory = {
    role: 'user' | 'assistant',
    content: string,
}

type Token = {
    input: number,
    output: number
}

// interface TokenUsage extends Token {
//     cost: number
// }

/*
More interesting suggestions
type TokenUsage = {
    input_tokens: number,
    cache_creation_input_tokens: number,
    cache_read_input_tokens: number,
    cache_creation: {
        ephemeral_5m_input_tokens: number,
        ephemeral_1h_input_tokens: number
    },
    output_tokens: number
}

type TokenCost = {
    inputCostPer1k: number,
    outputCostPer1k: number
}

*/
type ModelType = "claude" | "gpt"

interface Model {
    name: string,
    type: ModelType,
    inputCostPerCS: number,             // USD cost per cost scale for input tokens, adjust based on actual pricing
    outputCostPerCS: number,            // USD cost per cost scale for output tokens, adjust based on actual pricing
    costScale: number,                  // multiplier to convert token counts to cost (e.g. 1000 for per-1k pricing)
    windowSize: number,                 // context window size in tokens
    windowReservePercentage: number     // percentage of window to reserve as buffer to avoid hitting limits
}

interface Conversation {
    session_id: string,
    started_at: string,
    ended_at: string | null,
    model: string,
    messages: Message[],
    total_cost: number,
    total_tokens: Token
}

// unnecessary since model stores its own cost info, but could be useful for quick access
interface CostCalculation {
  inputTokens: number;
  outputTokens: number;
  inputCostPer1k: number;   // $0.003 for Claude Sonnet
  outputCostPer1k: number;  // $0.015 for Claude Sonnet
  totalCost: number;
}


export type { 
    Message, 
    ResponseMessage, 
    MessageHistory, 
    Model, 
    ModelType, 
    Conversation, 
    Token, 
    CostCalculation 
}
