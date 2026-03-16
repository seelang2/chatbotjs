import type { Conversation, Message, MessageHistory, ResponseMessage, Model, ModelType, Token } from '../types/types.js'


export class ChatSession {

    constructor() {}

    session: Conversation = {
        session_id: `session-${Date.now()}`,
        started_at: new Date().toISOString(),
        ended_at: null,
        model: '',
        messages: [],
        total_cost: 0,
        total_tokens: {
            input: 0,
            output: 0
        }
    }

    setModelName = (modelName: string) => {
        this.session.model = modelName
    }

    getId = () => { return this.session.session_id }
    
    getModelName = () => { return this.session.model }

    get = () => { return this.session }

    /** Reset session to default and return original session data. */
    reset = () => {
        const oldSession = this.end()
        this.session = {
            session_id: `session-${Date.now()}`,
            started_at: new Date().toISOString(),
            ended_at: null,
            model: '',
            messages: [],
            total_cost: 0,
            total_tokens: {
                input: 0,
                output: 0
            }
        }
        return oldSession
    }

    addMessage = (message: Message) => {
        this.session.messages.push(message)
    }

    getMessages = (useShortForm: boolean = false): MessageHistory[] => {
        return this.session.messages.map(msg => (useShortForm ? { role: msg.role, content: msg.content } : msg))
    }

    clearMessages() {
        this.session.messages = []
        console.log('Session messages cleared.')
    }

    addResponseMessage(message: ResponseMessage) {
        this.session.messages.push(message)
    }

    updateTotals = (data: { cost: number, input_tokens: number, output_tokens: number }) => {
        this.session.total_tokens.input += data.input_tokens
        this.session.total_tokens.output += data.output_tokens
        this.session.total_cost += data.cost
    }

    getSummary = () => {
        return {
            session_id: this.session.session_id,
            started_at: this.session.started_at,
            ended_at: this.session.ended_at,
            model: this.session.model,
            total_messages: this.session.messages.length,
            total_cost: this.session.total_cost,
            total_tokens: this.session.total_tokens
        }
    }

    end = () => {
        this.session.ended_at = new Date().toISOString()
        return this.get()
    }



}


