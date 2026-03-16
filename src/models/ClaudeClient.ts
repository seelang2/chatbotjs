import type { MessageHistory, ResponseMessage, Model, SdkClient, AnthropicResponse, AnthropicTextContent } from '../types/types.js'
import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlock, Message } from '@anthropic-ai/sdk/resources/messages/messages.js';

import 'dotenv/config'
import { calculateMessageCost } from '../utils/costCalculator.js';


// const ClaudeModel: Model = {
//     name: "claude-haiku-4-5",
//     type: "claude",
//     inputCostPerCS: 1, 
//     outputCostPerCS: 5, 
//     costScale: 1000000,
//     windowSize: 200000,
//     windowReservePercentage: 0.3 // can use 0.975 for testing, leaving 2.5% (5000 tokens) for input - reaches limit faster to test window management
// }


// async function sendQuery(query: MessageHistory[]) {
//     const anthropic = new Anthropic();

//     //try {
//         const message = await anthropic.messages.create({
//             model: ClaudeModel.name,
//             max_tokens: 1024,
//             // messages: [{ role: "user", content: query }]
//             messages: query
//         });

//         return message // will need to transform this response into the standard ResponseMessage format defined in types.ts, including calculating tokens and cost based on the ClaudeModel parameters

//     //} catch (error) {
//     //    console.error('Error sending query:', error)
//     //}

// }

export class ClaudeClient implements SdkClient<AnthropicResponse, AnthropicTextContent[]> {

    sdk = new Anthropic()
    model: Model
    
    constructor() {
        this.model = this.getModelDataFromEnv();
    }

    getModelDataFromEnv(): Model {
        return {
            name: "claude-haiku-4-5",
            type: "claude",
            inputCostPerCS: 1, 
            outputCostPerCS: 5, 
            costScale: 1000000, 
            windowSize: 200000,
            windowReservePercentage: 0.3
        }
    }

   getModel() {
        return this.model;
    }

    async sendQuery(query: MessageHistory[]): Promise<ResponseMessage> {

        const response = await this.sdk.messages.create({
            model: this.model.name,
            max_tokens: 1024,
            // messages: [{ role: "user", content: query }]
            messages: query
        });

        return this.mapResponseToMessage(response as AnthropicResponse)
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

