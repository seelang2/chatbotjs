
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

interface Conversation {
    session_id: string,
    started_at: string,
    ended_at: string | null,
    model: string,
    messages: Message[],
    total_cost: number,
    total_tokens: Token
}

interface CostCalculation {
  inputTokens: number;
  outputTokens: number;
  inputCostPer1k: number;   // $0.003 for Claude Sonnet
  outputCostPer1k: number;  // $0.015 for Claude Sonnet
  totalCost: number;
}


export type { Message, ResponseMessage, MessageHistory, Conversation, Token, CostCalculation }
