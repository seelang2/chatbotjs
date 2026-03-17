import 'dotenv/config'
import OpenAI from "openai";
import type { Message, ResponseMessage, Model, SdkClient, GptResponse, GptOutput, GptTextContent } from '../types/types.js'
import { calculateMessageCost } from '../utils/costCalculator.js';


// const GptModel: Model = {
//     name: "gpt-4.1-nano",
//     type: "gpt",
//     inputCostPerCS: 0.00006, 
//     outputCostPerCS: 0.00006, 
//     costScale: 1000, 
//     windowSize: 200000,
//     windowReservePercentage: 0.1
// }

// async function sendQuery(query: MessageHistory[]) {
//     const client = new OpenAI();

//     const response = await client.responses.create({
//         model: "gpt-4.1-nano",
//         // input: "Write a one-sentence bedtime story about a unicorn."
//         input: query
//     });

//     return response // will need to transform this response into the standard ResponseMessage format defined in types.ts, including calculating tokens and cost based on the GptModel parameters
// }


export class GptClient implements SdkClient<GptResponse, GptResponse> {
 
    sdk = new OpenAI()
    model: Model
    
    constructor() {
        this.model = this.getModelDataFromEnv();
    }
    
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
            // input: "Write a one-sentence bedtime story about a unicorn."
            input: query
        });

        return this.mapResponseToMessage(response as GptResponse)
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

