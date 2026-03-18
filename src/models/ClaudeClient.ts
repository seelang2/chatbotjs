import type { Message, ResponseMessage, Model, SdkClient, AnthropicResponse, AnthropicTextContent } from '../types/types.js'
import Anthropic from "@anthropic-ai/sdk";
//import type { ContentBlock, Message } from '@anthropic-ai/sdk/resources/messages/messages.js';

import 'dotenv/config'
import { calculateMessageCost } from '../utils/helpers.js';


export class ClaudeClient implements SdkClient<AnthropicResponse, AnthropicTextContent[]> {

    sdk = new Anthropic()
    model: Model
    
    constructor() {
        this.model = this.getModelDataFromEnv();
    }

    // TODO: get data from .env and not hardcoded data
    getModelDataFromEnv(): Model {
        return {
            name: "claude-haiku-4-5",
            type: "claude",
            inputCostPerCS: 1, 
            outputCostPerCS: 5, 
            costScale: 1000000, 
            windowSize: 200000,
            windowReservePercentage: 0.3 // 0.3 in normal mode; 0.975 (5000 user tokens for 200K limit) for window testing
        }
    }

   getModel() {
        return this.model;
    }

    async sendQuery(query: Message[]): Promise<ResponseMessage> {
        const response = await this.sdk.messages.create({
            model: this.model.name,
            max_tokens: 1024,
            // messages: [{ role: "user", content: query }]
            messages: query
        });

        return this.mapResponseToMessage(response as AnthropicResponse)
    }

    async sendStreamQuery(query: Message[], streamEventHandler: CallableFunction) {
        const stream = this.sdk.messages.stream({
            model: this.model.name,
            messages: query,
            max_tokens: 1024
        })

        var events = []
        for await (const event of stream) {
            events.push(event)

            // will need to translate the event data into a universal format both APIs can map to
            // currently only dealing with text and usage info
            let frame = {}

            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                frame = { type: 'delta_text', text: event.delta.text }
            } else if (event.type === "message_delta" && event.usage) {
                frame = { type: 'token_usage', tokens: { input: event.usage.input_tokens, output: event.usage.output_tokens } }
            }

            streamEventHandler(frame)
            // if (event.type === 'message_stop') break
        }

        return events
    }
 
    // TODO: need to handle different content types in the response (e.g. text, images, etc.) and extract the relevant information to populate the content field of the ResponseMessage accordingly
    // It's fine for now as this client is command-line based and we can assume text responses, but if we want to expand this to other interfaces in the future we'll need to handle this more robustly
    parseContent(content: AnthropicTextContent[]): string {
        let contentText = content.filter(block => block.type === 'text')
        return contentText.pop()?.text || '(No text content in response)'
    }

    mapResponseToMessage = (apiResponse: AnthropicResponse) => {
        let response: ResponseMessage = {
            role: 'assistant',
            content: this.parseContent(apiResponse.content),
            timestamp: new Date().toISOString(),
            tokens: {
                input: apiResponse.usage.input_tokens,
                output: apiResponse.usage.output_tokens
            },
            cost: calculateMessageCost(apiResponse.usage, this.model)
        }

        return response;
    }

}

