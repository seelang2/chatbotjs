import type { Conversation, Message, UserMessage, ResponseMessage, ChatClient, ModelType, TextFrame, TokenFrame } from '../types/types.js'
import readline from 'node:readline';
import { ChatSession } from './ChatSession.js'
import { ModelClient } from './ModelClient.js'
import { saveSessionAsJson, exportSessionToMarkdown } from '../utils/fileExporter.js'
import { Ansi } from '../utils/TextColor.js';
import { calculateMessageCost, countTokens } from '../utils/helpers.js';
import { ClientRequest } from 'node:http';

export default class ChatManager {

    supportedModelTypes: ModelType[] = ['claude', 'gpt']
    streaming: boolean = false
    verbose: boolean = false
    debug: boolean = false
    contextWindowStartIndex = 0
    
    // cached stream data
    streamResponse: ResponseMessage = {
        role: 'assistant',
        content: '',
        timestamp: '',
        cost: 0,
        tokens: { input: 0, output: 0 }
    }

    // User context window threshold to warn users they are nearing limit (percent)
    contextWindowWarningThreshold = 80 // TODO: Maybe move this to .env instead of hardcoded
    
    session: ChatSession
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: `>>> `
    })
    client: ChatClient

    constructor(modelType: string, streaming = false, verbose = false, debug = false) {
        this.streaming = streaming
        this.verbose = verbose
        this.debug = debug
        this.session = new ChatSession(this.verbose)
        this.client = new ModelClient(modelType)
        this.session.setModelName(this.client.getModel().name)

    }

    start = () => {
        this.rl.on('line', this.processUserInput)

        let sessionId = this.session.getId()
        let modelName = this.session.getModelName()

        // Intro
        console.log('\n')
        console.log(`Welcome to the CLI Chatbot!`)
        console.log(`You are now in a session with ID: ${sessionId} using model: ${modelName}`)
        console.log(`Type your message and press Enter to send. Type '/exit' or '/quit' to end the session.`)
        console.log(`Type /help for available commands`)

        // Initial user prompt
        this.prompt()

    }

    processUserInput = async (query: string) => {  
        console.log('\n')
        query = query.toLowerCase()

        switch(true) {
            case query === '/exit':
            case query === '/quit':
                this.end();
                return;
            case (query.split(' ')[0]) === '/model': 
                this.setModel(query)
                break;
            case (query.split(' ')[0]) === '/debug': 
                this.setDebug(query)
                break;
            case (query.split(' ')[0]) === '/verbose': 
                this.setVerbose(query)
                break;
            case query === '/clear': // reset session message history
                this.clear()
                break;
            case query === '/save': // save session as JSON file
                await saveSessionAsJson(this.session.getId(), this.session.get());
                break;
            case query === '/export': // export to markdown
                await exportSessionToMarkdown(this.session.get());
                break;
            case query === '/cost': // show current session cost and token usage
                this.displaySessionCostAndUsage()
                break;
            case query === '/context':
                this.displayContext()
                break;
            case query === '/history':
                this.displayHistory()
                break;
            case query === '/reset':
                this.reset()
                break;
            case query === '/help':
                this.displayHelp()
                break;
            case query[0] === '/':
                console.log('Invalid command.')
                this.displayHelp()
                break;
            case query.length === 0:
                console.log('Please enter a valid query or command. (/help for available commands)')
                break;
            default:
                await this.handleQuery(query)
                break;
        }
        
        // Call prompt again after processing input. This repeats until user exits.
        this.prompt() 
    }
    
    prompt = () => {
        console.log('\n')
        this.rl.prompt()
    }

    end = () => {
        this.displayChatSummary(this.session.end())
        console.log('\n')
        
        this.closeInterface()
    }

    closeInterface = () => {
        console.log('Goodbye!')
        this.rl.close()
    }

    reset = () => {
        const oldSession = this.session.reset()
        this.contextWindowStartIndex = 0
        console.log(`Session has been reset. New session id: ${this.session.getId()}`)
    }

    clear = () => {
        this.session.clearMessages()
        this.contextWindowStartIndex = 0
    }

    setDebug = (query: string) => {
        const state = query.split(' ')[1] || ' '
        switch(state.toLowerCase()) {
            case 'on':
                this.debug = true
                console.log('Debug mode is now enabled.')
                break
            case 'off':
                this.debug = false
                console.log('Debug mode is now disabled.')
                break
            default:
                console.log('Invalid option. Valid options are on, off')
        }
    }

    setVerbose = (query: string) => {
        const state = query.split(' ')[1] || ' '
        switch(state.toLowerCase()) {
            case 'on':
                this.verbose = true
                console.log('Verbose mode is now enabled.')
                break
            case 'off':
                this.verbose = false
                console.log('Verbose mode is now disabled.')
                break
            default:
                console.log('Invalid option. Valid options are on, off')
        }
    }

    setModel = (query: string) => {
        const modelType = query.split(' ')[1] || ' '
        let modelName: string
        try {
            modelName = this.client.setModel(modelType)
        } catch (e) {
            console.log(`Unsupported model type: ${modelType}`)
            console.log('Model has not been changed.')
            return
        }
        this.session.setModelName(modelName)
        console.log(`Model has been changed to ${modelType}: ${modelName}`)
    }

    displayHelp = () => {
        console.log('Available commands:')
        console.log(`  /model [model_name] - Switch models. Valid options are: ${this.supportedModelTypes.join(', ')}.`)
        console.log('  /debug [on | off] - Display debug information')
        console.log('  /verbose [on | off] - Verbose information')
        console.log('  /clear - Reset session message history')
        console.log('  /save - Save session as JSON file')
        console.log('  /export - Export to markdown')
        console.log('  /cost - Show current session cost and token usage')
        console.log('  /context - Show messages in the current context window')
        console.log('  /history - Show all messages in session history')
        console.log('  /reset - Reset session')
        console.log('  /help - Show this help message')
        console.log('  /exit or /quit - End the session')
    }

    handleQuery = async (query: string) => {
        const userMessage: UserMessage = {
            role: 'user',
            content: query,
            timestamp: new Date().toISOString()
        }
        this.session.addMessage(userMessage)

        if (this.streaming) {
            await this.processStreamQuery()
        } else {
            let response: ResponseMessage = await this.processQuery()
            this.displayResponse(response)
        
        }
        this.checkContentWindowLimit()
    }

    processQuery = async () => {
        const context = this.getContext()

        if (this.debug) {
            console.log(Ansi.orange + 'Active message chain:' + Ansi.reset)
            console.dir(context)
            console.log('\n')
        }

        // TODO: add rate limiting

        let responseMessage = await this.client.sendQuery(context)
        
        // TODO: Rework error handling

        this.session.addResponseMessage(responseMessage)
        this.session.updateTotals({ 
            cost: responseMessage.cost, 
            input_tokens: responseMessage.tokens.input, 
            output_tokens: responseMessage.tokens.output 
        })

        return responseMessage
    }

    processStreamQuery = async () => {
        const context = this.getContext()

        if (this.debug) {
            console.log(Ansi.orange + 'Active message chain:' + Ansi.reset)
            console.dir(context)
            console.log('\n')
        }

        // clear stream ResponseMessage
        this.resetStreamResponse() 

        const streamEvents = await this.client.sendStreamQuery(context, this.processStreamEvent)

        this.streamResponse.cost = calculateMessageCost(
            { 
                input_tokens: this.streamResponse.tokens.input, 
                output_tokens: this.streamResponse.tokens.output 
            }, this.client.getModel())

        this.session.addResponseMessage(this.streamResponse)
        this.session.updateTotals({ 
            cost: this.streamResponse.cost, 
            input_tokens: this.streamResponse.tokens.input, 
            output_tokens: this.streamResponse.tokens.output 
        })

        console.log('\n')
        // process.stdout.write('\n')

        if (this.debug) {
            console.log('\nStream Events:')
            console.dir(streamEvents, {depth: 6})
        }

    }

    // This has to display delta text and assemble a ResponseMessage
    processStreamEvent = (frame: TextFrame | TokenFrame) => {
        // frame types: delta_text, token_usage
        let f
        switch (frame.type) {
            case 'delta_text':
                f = frame as TextFrame
                this.streamResponse.content += f.text
                this.displayStreamText(f.text)
                break
            case 'token_usage':
                f = frame as TokenFrame
                this.streamResponse.tokens = f.tokens
            default:
                return // only dealing with text or token data for now
        }

    }

    resetStreamResponse = () => {
        this.streamResponse = {
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            cost: 0,
            tokens: { input: 0, output: 0 }
        }
    }

    getContext = (muted = false): Message[] => {
        const messages = this.session.getMessages()
        if (this.debug) { 
            console.log(`getContext: messages: `); 
            console.dir(messages, {depth: 6}); 
            console.log(`Total messages: ${messages.length}`) 
        }
        
        const info = this.getUserWindowInfo()

        if (info.currentUserContextSize < info.maxUserContextSize) {
            const context = messages.map((msg) => { return { role: msg.role, content: msg.content } })
            return context
        } else { 
            if (!muted) {
                console.log(
                    `getContext: user context window size exceeded ` + 
                    `(${info.currentUserContextSize} of ${info.maxUserContextSize} tokens used.)`
                )
            }

            let totalTokens = 0
            let context = []

            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i]
                
                if (!msg) { continue }
                
                const msgTokens = countTokens(msg)
                
                if (totalTokens + msgTokens >= info.maxUserContextSize) {
                    this.contextWindowStartIndex = i + 1 // include current item
                    break
                }
                
                totalTokens += msgTokens
                context.unshift(msg) // add to front as we're moving backwards
            }

            // display info about items dropped
            if (!muted) {
                if (this.verbose) {
                    console.log(`Older messages will be pruned to message index ${this.contextWindowStartIndex}. `)
                }

                if (this.debug) {
                    console.log('Content pruned:')
                    console.dir(messages.slice(0, this.contextWindowStartIndex))
                }

                if (this.verbose) {
                    console.log(
                        `Number of messages in context window: ${context.length}. Window size* ${totalTokens}` + 
                        `* Window size does not include the user message added this turn.`
                    ) 
                }
            }

            return context.map((msg) => { return { role: msg.role, content: msg.content } })
        }
    }

    getUserWindowInfo = () => {
        const userContextWindow = this.client.getUserContextWindowSize()
        const contextWindowSize = this.session.getContextWindowSize(this.contextWindowStartIndex)
        const totalUserContextTokens = contextWindowSize.input + contextWindowSize.output

        return {
            maxUserContextSize: userContextWindow,
            currentUserContextSize: totalUserContextTokens,
            userContextUsagePercent: (totalUserContextTokens / userContextWindow) * 100
        }
    }

    userContextLimitReached = ():boolean => {
        const info = this.getUserWindowInfo()
        return info.currentUserContextSize > info.maxUserContextSize
    }

    checkContentWindowLimit = () => {
        const info = this.getUserWindowInfo()
        const overLimit = info.currentUserContextSize < info.maxUserContextSize ? false : true
        if (info.userContextUsagePercent > this.contextWindowWarningThreshold) {
            console.log(
                `WARNING: ` + 
                `You ${overLimit ? 'have exceeded' : 'are nearing'} ` + 
                `the context window limit. ${overLimit ? 'O': 'If the limit is reached, o'}lder messages ` +
                `will be removed from the context queue and may affect conversation quality. `
            ) 
            if (this.verbose) {
                console.log(
                    `${info.userContextUsagePercent.toFixed(3)}% (${info.currentUserContextSize}) of ` + 
                    `${info.maxUserContextSize} tokens used.`
                )
            }
        }
    }

    displayContext = () => {
        const context = this.session.getMessages()
        console.dir(context, {depth: 6})
        console.log(`Total messages in history: ${context.length}`)
    }

    displayHistory = () => {
        const history = this.session.getMessages()
        console.dir(history, {depth: 6})
        console.log(`Total messages in history: ${history.length}`)
    }

    displayResponse = (response: ResponseMessage) => {
        console.log(response.content)
        console.log('\n')

        if (this.verbose) {
            this.displayStreamCostAndUsage(response)
        }
    }

    displayStreamText = (text: string) => {
        process.stdout.write(text) // console.log adds newlines
    }

    displayStreamCostAndUsage = (response: ResponseMessage) => {
        const summary = this.session.getSummary()
        console.log(Ansi.grey +
            `[ Tokens: ${response.tokens.input} input, ${response.tokens.output} output | ` + 
            `Cost: $${response.cost.toFixed(6)} | Total: $${summary.total_cost.toFixed(6)} ]`
            + Ansi.reset)
    }

    displaySessionCostAndUsage = () => {
        const summary = this.session.getSummary()
        console.log(`Current session cost and token usage:`)
        console.log(`Input tokens: ${summary.total_tokens.input}`)
        console.log(`Output tokens: ${summary.total_tokens.output}`)
        console.log(`Total cost: $${summary.total_cost.toFixed(6)}`)
    }

    displayChatSummary = (session: Conversation) => {

        if (this.debug) {
            console.log(Ansi.grey + 'Session dump:' + Ansi.reset)
            console.dir(session)
        }

        console.log('Session Summary:')
        console.log(`Session ID: ${session.session_id}`)
        console.log(`Model: ${session.model}`)
        console.log(`Started at: ${session.started_at}`)
        console.log(`Ended at: ${session.ended_at || 'In progress'}`)
        console.log(`Total messages: ${session.messages.length}`)
        console.log(`Total tokens: ${session.total_tokens.input} input, ` +
            `${session.total_tokens.output} output, ` + 
            `${session.total_tokens.input + session.total_tokens.output} total`)
        console.log(`Total cost: $${session.total_cost.toFixed(6)}`)
    }

}
