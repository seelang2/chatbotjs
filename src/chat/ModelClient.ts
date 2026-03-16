
import type { Client, ChatClient, MessageHistory, ResponseMessage, Model, ModelType } from '../types/types.js'
import { ClaudeClient } from '../models/ClaudeClient.js'
import { GptClient } from '../models/GptClient.js'


export class ModelClient implements ChatClient {
    
    client: Client 
    model: Model

   constructor(modelType: string) {
        switch (modelType) {
            case 'claude':
                this.client = new ClaudeClient()
                break
            case 'gpt':
                this.client = new GptClient()
                break
            default:
                throw new Error(`Unsupported model type: ${modelType}`)
        }
        this.model = this.client.getModel()
    }

    setModel = (modelType: string): string => {
        switch (modelType) {
            case 'claude':
                this.client = new ClaudeClient()
                break
            case 'gpt':
                this.client = new GptClient()
                break
            default:
                throw new Error(`Unsupported model type: ${modelType}`)
        }
        this.model = this.client.getModel()
        return this.model.name
    }

    getModel = () => {
        // This will return the model information for the current client instance
        if (!this.client || typeof this.client.getModel !== 'function') {
            throw new Error('Model client is not set or does not have a getModel method')
        }
        return this.client.getModel()
    }

    async sendQuery(query: MessageHistory[]): Promise<ResponseMessage> {
        // This will call the sendQuery function of the specific model client instance (e.g. ClaudeClient, GptClient) to send the query and get the response
        if (!this.client || typeof this.client.sendQuery !== 'function') {
            throw new Error('Model client is not set or does not have a sendQuery method')
        }

        const response = await this.client.sendQuery(query)
        return response
    }

}


