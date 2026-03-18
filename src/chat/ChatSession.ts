import type { Conversation, UserMessage, Message, ResponseMessage, Model, ModelType, Token } from '../types/types.js'


export class ChatSession {

    verbose: boolean = false
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

    constructor(verbose?: boolean) {
        if ( typeof verbose !== 'undefined' ) this.verbose = verbose
        // if (this.verbose) console.log('ChatSession instantiated in verbose mode')
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

    addMessage = (message: UserMessage) => {
        this.session.messages.push(message) // Note: Anthropic has a limit of 100000 messages
    }

    getMessages = (useShortForm: boolean = false): Message[] => {
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

    getContextWindowSize = (startIndex: number = 0, altMessages?: Message[]): Token => {
        //console.log(`getContextWindowSize called. message length: ${this.session.messages.length}`)
        const messages = typeof altMessages === 'undefined' ? this.session.messages : altMessages

        if (messages.length < 1) return { input: 0, output: 0 }
        
        const contextWindow = messages.slice(startIndex)

        if (this.verbose) {
            console.log(`session.getContextWindowSize: context message source is ` + 
                `${typeof altMessages === 'undefined' ? 'session messages' : 'external (passed in)'} ` + 
                `starting from index ${startIndex}.`
            )
        }

        //let passes = 0
        let contextTokens = contextWindow.reduce(
            (total, message) => { 
                //console.log(`Reducing messages. Pass ${++passes}`)
                // Casting to ResponseMessage so TS recognizes token property
                let t = total as ResponseMessage, m = message as ResponseMessage
                
                // Assign the tokens field if missing from either t or m
                if (typeof t.tokens === 'undefined') t.tokens = { input: 0, output: 0 }
                if (typeof m.tokens === 'undefined') m.tokens = { input: 0, output: 0 }
                //console.log('Current total t:'); console.dir(t)
                t.tokens.input += m.tokens.input
                t.tokens.output += m.tokens.output
                // console.log('m to add to current total:'); console.dir(m)
                // console.log('New total t:'); console.dir(t)
                return t
            },
            {
                role: 'user',
                content: 'NOT PART OF THE MESSAGE QUEUE - This is an initialization value placed by Session.getContextWindowSize',
                timestamp: '',
                tokens: { input: 0, output: 0 }
            } as ResponseMessage
        ) as ResponseMessage

        //console.log('Finished reducing messages. contextTokens:'); console.dir(contextTokens)
        if (typeof contextTokens.tokens === 'undefined') contextTokens.tokens = { input: 0, output: 0 }

        return contextTokens.tokens
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


