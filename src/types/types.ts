

// Only defining text ContextBlock for now
type AnthropicTextContent = {
    type: 'text',
    text: string
}

type GptTextContent = {
    type: 'output_text',
    text: string
}

type GptOutput = {
    content: GptTextContent[],
    type: string
}

type Token = {
    input: number,
    output: number
}

type Role = 'user' | 'assistant'

type Message = {
    role: Role,
    content: string,
}

interface UserMessage extends Message {
    timestamp: string
}

interface ResponseMessage extends UserMessage {
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

type TextFrame = {type: string, text: string}
type TokenFrame = {type: string, tokens: {input: number, output: number}}

interface AnthropicResponse extends ApiResponse {
    content: AnthropicTextContent[] 
}

interface GptResponse extends ApiResponse {
    output: GptOutput[],
    output_text: string
}

type ModelType = "claude" | "gpt"

interface Model {
    name: string,
    type: ModelType,
    inputCostPerCS: number,             // USD cost per cost scale for input tokens, adjust based on actual pricing
    outputCostPerCS: number,            // USD cost per cost scale for output tokens, adjust based on actual pricing
    costScale: number,                  // multiplier to convert token counts to cost (e.g. 1000 for per-1k pricing)
    windowSize: number,                 // context window size in tokens
    windowReservePercentage: number     // decimal percentage of window to reserve for output to avoid hitting limits
}

interface Conversation {
    session_id: string,
    started_at: string,
    ended_at: string | null,
    model: string,
    messages: UserMessage[],
    total_cost: number,
    total_tokens: Token
}

interface Client {
    model: Model,
    sendQuery: (query: Message[]) => Promise<ResponseMessage>,
    getModel: () => Model
    sendStreamQuery: (query: Message[], streamEventHandler: CallableFunction) => unknown
}

interface ChatClient extends Client {
    setModel: (modelType: string)=> string
    getUserContextWindowSize: () => number
}

interface SdkClient<TResponse, TContent> extends Client {
    sdk: unknown,
    mapResponseToMessage: (response: TResponse) => unknown,
    getModelDataFromEnv: () => Model,
    parseContent(content: TContent): unknown
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
    UserMessage, 
    ResponseMessage, 
    Model, 
    ModelType, 
    Conversation, 
    Token, 
    CostCalculation,
    TextFrame,
    TokenFrame
}
