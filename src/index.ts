import 'dotenv/config'
import readline from 'node:readline';
import type { Conversation, Message, MessageHistory, ResponseMessage, Model, ModelType, Token } from './types/types.js'
import getCliArgs from './utils/getCliArgs.js'
import { open } from 'node:fs/promises';

// command-line arguments
const cliArgs = getCliArgs()

// AI model configuration
const supportedModelTypes: ModelType[] = ['claude', 'gpt']
const ClaudeModel: Model = {
    name: "claude-haiku-4-5",
    type: "claude",
    inputCostPerCS: 1, // USD cost per cost scale for input tokens, adjust based on actual pricing
    outputCostPerCS: 5, // USD cost per cost scale for output tokens, adjust based on actual pricing
    costScale: 1000000 // scale factor to convert token counts to cost (e.g., per 1000 tokens)
}

const GptModel: Model = {
    name: "gpt-4.1-nano",
    type: "gpt",
    inputCostPerCS: 0.00006, // USD cost per cost scale for input tokens, adjust based on actual pricing
    outputCostPerCS: 0.00006, // USD cost per cost scale for output tokens, adjust based on actual pricing
    costScale: 1000 // scale factor to convert token counts to cost (e.g., per 1000 tokens)
}

let currentModel = ClaudeModel

// Session tracking
const sessionId = `session-${Date.now()}`

let session: Conversation = {
    session_id: sessionId,
    started_at: new Date().toISOString(),
    ended_at: null,
    model: currentModel.name,
    messages: [],
    total_cost: 0,
    total_tokens: {
        input: 0,
        output: 0
    }
}

if (cliArgs.model.toLowerCase() === 'claude') {
    setModel(ClaudeModel)
} else if (cliArgs.model.toLowerCase() === 'openai') {
    setModel(GptModel)
} else {
    console.error(`Unsupported model specified: ${cliArgs.model}. Defaulting to Claude.`)
    setModel(GptModel)
}

// let conversationHistory: Array<{ role: string, content: string }> = []


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `>>> `
});

// rl.setPrompt(`>>> `)

rl.on('line', processUserInput)

// Intro
console.log('\n')
console.log(`Welcome to the CLI Chatbot!`)
console.log(`You are now in a session with ID: ${sessionId} using model: ${currentModel.name}`)
console.log(`Type your message and press Enter to send. Type '/exit' or '/quit' to end the session.`)
console.log(`Available commands: /model [model_name], /clear, /save, /export, /cost, /help`)

// Initial user prompt
rl.prompt()

// function promptUser() {
//     rl.question(`Ask me a question: `, processQuery);
// }

async function processUserInput(query: string) {  
    console.log('\n')
    query = query.toLowerCase()

    switch(query) {
        case '/exit':
        case '/quit':
            endSession();
            return;
        case '/model': // switch models
            setModelByType(query);
            break;
        case '/clear': // reset session message history
            clearSessionMessages()
            break;
        case '/save': // save session as JSON file
            saveSessionAsJson();
            break;
        case '/export': // export to markdown
            exportSessionToMarkdown();
            break;
        case '/cost': // show current session cost and token usage
            displaySessionCostAndUsage()
            break;
        case '/help':
            displayHelp()
            break;
        case '':
            console.log('Please enter a valid query or command. (/help for available commands)')
            break;
        default:
            await routeQuery(query)
            break;
    }
    
    // Call prompt again after processing input. This repeats until user exits.
    console.log('\n')
    rl.prompt() 

}

async function routeQuery(query: string) {
    let response: ResponseMessage = await processQuery(query);
    displayResponse(response)
}

async function processQuery(query: string) {
    console.log(`You asked: ${query}`);

    // update session with user message
    const userMessage: Message = {
        role: 'user',
        content: query,
        timestamp: new Date().toISOString()
    }
    updateSessionWithMessage(userMessage)
    
    console.log('Message history:')
    console.dir(getSessionMessages(true))

    // send query to model and get response
    let response = await sendQuery(getSessionMessages(true))

    console.log('Model response:')
    console.dir(response)

    // TODO should there be a retry mechanism here in case of no response or error from model?
    // if (!response || !response.content) {
    //     //console.error('No response from model or response is missing content.')
    //     return 'No response from model or response is missing content.'
    // }

    // const responseMessage: ResponseMessage = {
    //     role: 'assistant',
    //     content: response.content.map((part: { type: string, text: string }) => part.text).join(''),
    //     timestamp: new Date().toISOString(),
    //     tokens: {
    //         input: response.usage.input_tokens,
    //         output: response.usage.output_tokens
    //     },
    //     cost: calculateCost(response.usage)
    // }
    // updateSessionWithResponse(responseMessage)

    // TODO: parse content properly, handle different content types (text, images, etc.)
    const responseMessage: ResponseMessage = {
        role: response.role,
        content: parseContent(response.content),
        timestamp: new Date().toISOString(),
        tokens: {
            input: response.usage.input_tokens,
            output: response.usage.output_tokens
        },
        cost: calculateMessageCost(response.usage, currentModel)
    }

    // update session with model response, tokens, and cost
    updateSessionWithResponse(responseMessage)

    return responseMessage

}

// Helper function to parse content blocks into a single string (can be expanded to handle different types)
// NOTE: Multiple text ContentBlocks don't happen. There will only be one ContentBlock of any given type.
function parseContent(content: ContentBlock[]): string {
    //let contentText = ''
    let contentText = content.filter(block => block.type === 'text')

    // for (const block of content) {
    //     if (block.type === 'text') {
    //         return block.text + '\n'
    //     } else {
    //         // handle other content types (e.g., images, lists) as needed
    //         // contentText += `[${block.type} content]\n`
    //     }
    // }

    //return contentText
    return contentText.pop()?.text || '(No text content in response)'
}

function displayResponse(response: ResponseMessage) {
    console.log('Claude says:')
    console.log(response.content)
    console.log('\n')
    console.log(
        // `Tokens: ${session.total_tokens.input} input, ${session.total_tokens.output} output | ` + 
        `Tokens: ${response.tokens.input} input, ${response.tokens.output} output | ` + 
        `Cost: $${response.cost.toFixed(6)} | Total: $${session.total_cost.toFixed(6)}`)

    console.log('\n')
}

function displaySessionCostAndUsage() {
    console.log(`Current session cost and token usage:`)
    console.log(`Input tokens: ${session.total_tokens.input}`)
    console.log(`Output tokens: ${session.total_tokens.output}`)
    console.log(`Total cost: $${session.total_cost.toFixed(6)}`)
    console.log('\n')
}

function displayHelp() {
    console.log('Available commands:')
    console.log(`  /model [model_name] - Switch models. Valid options are: ${supportedModelTypes.join(', ')}.`)
    console.log('  /clear - Reset session message history')
    console.log('  /save - Save session as JSON file')
    console.log('  /export - Export to markdown')
    console.log('  /cost - Show current session cost and token usage')
    console.log('  /help - Show this help message')
    console.log('  /exit or /quit - End the session')
    console.log('\n')
}

// function calculateCost(usage: { input_tokens: number, output_tokens: number }): number {
//     const inputCost = usage.input_tokens * 0.00006 // example input token cost
//     const outputCost = usage.output_tokens * 0.00006 // example output token cost
//     return inputCost + outputCost
// }




function closeInterface() {
  console.log('Goodbye!');
  rl.close();
}

/////////////

// function updateSessionWithMessage(role: string, content: string) {
//     const timestamp = new Date().toISOString()
//     session.messages.push({ role, content, timestamp })
// }

// function updateSessionWithResponse(content: string, tokens: { input: number, output: number }, cost: number) {
//     const timestamp = new Date().toISOString()
//     session.messages.push({ role: 'assistant', content, timestamp })
//     session.total_tokens.input += tokens.input
//     session.total_tokens.output += tokens.output
//     session.total_cost += cost
// }

function calculateMessageCost(usage: { input_tokens: number, output_tokens: number }, model: Model): number {
    // token_cost = 
    const inputCost = (usage.input_tokens / model.costScale) * model.inputCostPerCS
    const outputCost = (usage.output_tokens / model.costScale) * model.outputCostPerCS
    return inputCost + outputCost
}

function setModel(model: Model) {
    currentModel = model
    session.model = model.name
    console.log(`Using model: ${model.name}`)
}

function setModelByType(modelType: string) {
    switch(modelType.split(' ')[1]) {
        case 'claude':
            setModel(ClaudeModel)
            break;
        case 'gpt':
            setModel(GptModel)
            break;
        default:
            console.error(`Unsupported model type specified: ${modelType}. \n' + 
                'Supported types are: ${supportedModelTypes.join(', ')}. \n' + 
                'No changes made.`)
            break;
    }
}


function saveSessionAsJson() {
    const filename = `session-${session.session_id}.json`
    open(filename, 'w')
        .then(fileHandle => {
            return fileHandle.writeFile(JSON.stringify(getSession(), null, 2))
                .then(() => {
                    console.log(`Session saved as ${filename}`)
                    return fileHandle.close()
                })
                .catch(err => {
                    console.error('Error writing session to file:', err)
                    return fileHandle.close()
                })
        })
        .catch(err => {
            console.error('Error opening file for saving session:', err)
        })
}

function exportSessionToMarkdown() {
    const filename = `session-${session.session_id}.md`
    let markdownContent = `# Chat Session ${session.session_id}\n\n`
    markdownContent += `**Model:** ${session.model}\n\n`
    markdownContent += `**Started at:** ${session.started_at}\n\n`
    markdownContent += `**Ended at:** ${session.ended_at || 'In progress'}\n\n`
    markdownContent += `## Conversation:\n\n`

    session.messages.forEach(msg => {
        markdownContent += `### ${msg.role.toUpperCase()} (${msg.timestamp}):\n\n`
        markdownContent += `${msg.content}\n\n`
    })

    open(filename, 'w')
        .then(fileHandle => {
            return fileHandle.writeFile(markdownContent)
                .then(() => {
                    console.log(`Session exported as ${filename}`)
                    return fileHandle.close()
                })
                .catch(err => {
                    console.error('Error writing session to file:', err)
                    return fileHandle.close()
                })
        })
        .catch(err => {
            console.error('Error opening file for exporting session:', err)
        })
}

function resetSession() {
    session = {
        session_id: `session-${Date.now()}`,
        started_at: new Date().toISOString(),
        ended_at: null,
        model: currentModel.name,
        messages: [],
        total_cost: 0,
        total_tokens: {
            input: 0,
            output: 0
        }
    }
}

function clearSessionMessages() {
    session.messages = []
    console.log('Session messages cleared.')
}

function getSessionMessages(useShortForm: boolean = false): MessageHistory[] {
    return session.messages.map(msg => (useShortForm ? { role: msg.role, content: msg.content } : msg))
}

function updateSessionWithMessage(message: Message) {
    session.messages.push(message)
}

function updateSessionWithResponse(message: ResponseMessage) {
    const timestamp = new Date().toISOString()
    session.messages.push(message)
    session.total_tokens.input += message.tokens.input
    session.total_tokens.output += message.tokens.output
    session.total_cost += message.cost
}

function getSession() {
    return session
}

function getSessionSummary() {
    return {
        session_id: session.session_id,
        started_at: session.started_at,
        ended_at: session.ended_at,
        model: session.model,
        total_messages: session.messages.length,
        total_cost: session.total_cost,
        total_tokens: session.total_tokens
    }
}

function endSession() {
    session.ended_at = new Date().toISOString()
    // console.log('Message history:')
    // console.dir(getSessionMessages())
    // console.log('\n' + 'Session summary:' + '\n')
    // console.dir(getSessionSummary())
    console.log('Session data:') // for debugging
    console.dir(getSession())
    console.log('\n')
    
    closeInterface()
}


/////////////


import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlock } from '@anthropic-ai/sdk/resources/messages/messages.js';

async function sendQuery(query: MessageHistory[]) {
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
        model: ClaudeModel.name,
        max_tokens: 1024,
        // messages: [{ role: "user", content: query }]
        messages: query
    });

    return message
}

/*
API response:

{
  model: 'claude-haiku-4-5-20251001',
  id: 'msg_018Rqy5tnawNPBFWNedboehC',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: "Yes, I'm here! I'm Claude, an AI assistant. How can I help you today?"
    }
  ],
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: {
    input_tokens: 11,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
    output_tokens: 24,
    service_tier: 'standard',
    inference_geo: 'not_available'
  }
}

*/

