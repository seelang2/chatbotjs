
// interface Message {
//     model: string,
//     id: string,
//     timestamp: string,
//     type: string,
//     role: string,
//     content: Array<{ type: string, text: string }>
// }

interface Client {
    model: Model,
    sendQuery: (query: MessageHistory[]) => Promise<ResponseMessage>,
    getModel: () => Model
}

interface ChatClient extends Client {
    setModel: (modelType: string)=> string
}

interface SdkClient<TResponse, TContent> extends Client {
    sdk: unknown,
    mapResponseToMessage: (response: TResponse) => unknown,
    getModelDataFromEnv: () => Model,
    parseContent(content: TContent): unknown
}

interface Message {
    role: 'user' | 'assistant',
    content: string,
    timestamp: string
}

interface ResponseMessage extends Message {
    tokens: Token,
    cost: number
}

interface ApiResponse {
    id: string,
    usage: {
        input_tokens: number,
        output_tokens: number
    }
}

// Only defining text ContextBlock for now
type AnthropicTextContent = {
    type: 'text',
    text: string
}

interface AnthropicResponse extends ApiResponse {
    content: AnthropicTextContent[] 
}

type GptTextContent = {
    type: 'output_text',
    text: string
}

type GptOutput = {
    content: GptTextContent[],
    type: string
}

interface GptResponse extends ApiResponse {
    output: GptOutput[],
    output_text: string
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
    Client,
    ChatClient,
    SdkClient,
    AnthropicResponse,
    AnthropicTextContent,
    GptResponse,
    GptOutput,
    GptTextContent,
    Message, 
    ResponseMessage, 
    MessageHistory, 
    Model, 
    ModelType, 
    Conversation, 
    Token, 
    CostCalculation 
}
