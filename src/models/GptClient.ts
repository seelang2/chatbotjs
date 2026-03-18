import 'dotenv/config'
import OpenAI from "openai";
import type { Message, ResponseMessage, Model, SdkClient, GptResponse, GptOutput, GptTextContent } from '../types/types.js'
import { calculateMessageCost } from '../utils/helpers.js';


export class GptClient implements SdkClient<GptResponse, GptResponse> {
 
    sdk = new OpenAI()
    model: Model
    
    constructor() {
        this.model = this.getModelDataFromEnv();
    }

    // TODO: get data from .env and not hardcoded data
    getModelDataFromEnv(): Model {
        return {
            name: "gpt-4.1-nano",
            type: "gpt",
            inputCostPerCS: 0.00006, 
            outputCostPerCS: 0.00006, 
            costScale: 1000, 
            windowSize: 200000,
            windowReservePercentage: 0.1
        }
    }

    getModel() {
        return this.model;
    }
   
    async sendQuery(query: Message[]): Promise<ResponseMessage> {
        const response = await this.sdk.responses.create({
            model: this.model.name,
            input: query
        });

        return this.mapResponseToMessage(response as GptResponse)
    }

     async sendStreamQuery(query: Message[], streamEventHandler: CallableFunction) {
        const stream = await this.sdk.responses.create({
            model: this.model.name,
            input: query,
            stream: true
        });

        var events = []
        for await (const event of stream) {
            events.push(event)

            // will need to translate the event data into a universal format both APIs can map to
            // currently only dealing with text and usage info
            let frame = {}

            if (event.type === "response.output_text.delta" && event.delta) {
                frame = { type: 'delta_text', text: event.delta }
            } else if (event.type === "response.completed" && event.response.usage) {
                frame = { 
                    type: 'token_usage', 
                    tokens: { input: event.response.usage.input_tokens, output: event.response.usage.output_tokens } }
            }

            streamEventHandler(frame)
        }

        return events
    }
 
   // Only handling text content in this CLI client, but will need to handle multiple content types in GUI clients
    parseContent(content: GptResponse): string {
        if (typeof content.output_text != 'undefined') return content.output_text

        // If output_text isn't available then we do it the long way
        // filter output for messages
        // filter message content for output_text
        // aggregate output_text blocks
        
        return '';
    }

    mapResponseToMessage = (apiResponse: GptResponse) => {
        let response: ResponseMessage = {
            role: 'assistant',
            content: this.parseContent(apiResponse),
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

