import type { UserMessage, ResponseMessage, ChatClient, ModelType, Conversation } from '../types/types.js'
import readline from 'node:readline';
import { ChatSession } from './ChatSession.js'
import { ModelClient } from './ModelClient.js'
import { saveSessionAsJson, exportSessionToMarkdown } from '../utils/fileExporter.js'
import { Ansi } from '../utils/TextColor.js';
import { maxHeaderSize } from 'node:http';

export default class ChatManager {

    supportedModelTypes: ModelType[] = ['claude', 'gpt']
    streaming: boolean
    verbose: boolean

    // User context window threshold to warn users they are nearing limit (percent)
    contextWindowWarningThreshold = 80 // TODO: Maybe move this to .env instead of hardcoded
    
    session: ChatSession
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: `>>> `
    })
    client: ChatClient

    constructor(modelType: string, streaming: boolean = false, verbose: boolean = false) {
        this.streaming = streaming
        this.verbose = verbose
        this.session = new ChatSession()
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
        console.log(`Available commands: /model [model_name], /clear, /save, /export, /cost, /help`)
        // console.log('\n')

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
            case (query.split(' ')[0]) === '/model': // switch models
                this.setModel(query)
                break;
            case query === '/clear': // reset session message history
                this.session.clearMessages()
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
        console.log('  /clear - Reset session message history')
        console.log('  /save - Save session as JSON file')
        console.log('  /export - Export to markdown')
        console.log('  /cost - Show current session cost and token usage')
        console.log('  /help - Show this help message')
        console.log('  /exit or /quit - End the session')
    }

    handleQuery = async (query: string) => {
        let response: ResponseMessage = await this.processQuery(query);
        this.displayResponse(response)
        this.checkContentWindowLimit()
    }

    processQuery = async (query: string) => {
        // update session with user message
        const userMessage: UserMessage = {
            role: 'user',
            content: query,
            timestamp: new Date().toISOString()
        }
        this.session.addMessage(userMessage)

        // TODO: add sliding context window management here.
        /*
            Sliding context window adjusts the context size being sent to the API by
            omitting the earliest messages so the input tokens is under the limit 
            specified by Model.windowSize and Model.windowReservePercentage respectively.
        */

        //const context = this.getContext()

        

        // the check here is to prune context

        if (this.verbose) {
            // console.log('contextWindowSize')
            // console.dir(contextWindowSize)
            // console.log(`Current window size: ${contextWindowSize.input + contextWindowSize.output} `+
            //     `(${contextWindowSize.input} input, ${contextWindowSize.output} output)`)
            
            
        }

        

        if (this.verbose) {
            // console.log(`You asked: ${query}`);
            console.log(Ansi.grey + 'Active message chain:' + Ansi.reset)
            console.dir(this.session.getMessages(true))
            console.log('\n')
        }

        // send query to model and get response
        // TODO: add throtting here and manage message history to stay within model context window limits
        let responseMessage = await this.client.sendQuery(this.session.getMessages(true)) 
        
        // TODO: Rework error handling

        // update session with model response, tokens, and cost
        this.session.addResponseMessage(responseMessage)

        this.session.updateTotals({ 
            cost: responseMessage.cost, 
            input_tokens: responseMessage.tokens.input, 
            output_tokens: responseMessage.tokens.output 
        })

        return responseMessage

    }

    getContext = () => {}

    getUserWindowInfo = () => {
        const userContextWindow = this.client.getUserContextWindowSize()
        const contextWindowSize = this.session.getContextWindowSize()
        const totalUserContextTokens = contextWindowSize.input + contextWindowSize.output

        return {
            maxUserContextSize: userContextWindow,
            currentUserContextSize: totalUserContextTokens,
            userContextUsagePercent: (totalUserContextTokens / userContextWindow) * 100
        }
    }

    warnContextLimitNear = ():boolean => {
        return this.getUserWindowInfo().userContextUsagePercent > this.contextWindowWarningThreshold
    }

    userContextLimitReached = ():boolean => {
        const info = this.getUserWindowInfo()
        return info.currentUserContextSize > maxHeaderSize
    }

    checkContentWindowLimit = () => {
        const info = this.getUserWindowInfo()
        if (this.warnContextLimitNear()) {
            console.log(
                `WARNING: ` + 
                `You are nearing the context window limit. If the limit is reached, older messages ` +
                `will be removed from the context queue and may affect conversation quality. `
            ) 
            if (this.verbose) {
                console.log(
                    `${info.userContextUsagePercent}% (${info.currentUserContextSize}) of ` + 
                    `${info.maxUserContextSize} tokens used.`
                )
            }
        }
    }

    displayResponse = (response: ResponseMessage) => {
        const summary = this.session.getSummary()
        console.log(response.content)
        console.log('\n')

        if (this.verbose) {
            console.log(Ansi.grey +
                `[ Tokens: ${response.tokens.input} input, ${response.tokens.output} output | ` + 
                `Cost: $${response.cost.toFixed(6)} | Total: $${summary.total_cost.toFixed(6)} ]`
                + Ansi.reset)
        }

    }

    displaySessionCostAndUsage = () => {
        const summary = this.session.getSummary()
        console.log(`Current session cost and token usage:`)
        console.log(`Input tokens: ${summary.total_tokens.input}`)
        console.log(`Output tokens: ${summary.total_tokens.output}`)
        console.log(`Total cost: $${summary.total_cost.toFixed(6)}`)
    }

    displayChatSummary = (session: Conversation) => {

        if (this.verbose) {
            console.log(Ansi.grey + 'Session dump:' + Ansi.reset)
            console.dir(session)
        }

        //const summary = this.session.getSummary()
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
