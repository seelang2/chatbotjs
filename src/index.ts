import 'dotenv/config'
import readline from 'node:readline';
import type { Conversation, Message, MessageHistory, ResponseMessage } from './types/types.js'
import getCliArgs from './utils/getCliArgs.js'

// command-line arguments
const cliArgs = getCliArgs()

// AI model configuration
const ClaudeModel = "claude-haiku-4-5" // 404 "claude-3-haiku-20240307" // 
const OpenAIModel = ""
let currentModel = ClaudeModel

const sessionId = `session-${Date.now()}`

if (cliArgs.model.toLowerCase() === 'claude') {
    currentModel = ClaudeModel
} else if (cliArgs.model.toLowerCase() === 'openai') {
    currentModel = OpenAIModel
} else {
    console.error(`Unsupported model specified: ${cliArgs.model}. Defaulting to Claude.`)
    currentModel = ClaudeModel
}

// let conversationHistory: Array<{ role: string, content: string }> = []

let session: Conversation = {
    session_id: sessionId,
    started_at: new Date().toISOString(),
    ended_at: null,
    model: currentModel,
    messages: [],
    total_cost: 0,
    total_tokens: {
        input: 0,
        output: 0
    }
}


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
console.log(`You are now in a session with ID: ${sessionId} using model: ${currentModel}`)
console.log(`Type your message and press Enter to send. Type '/exit' or '/quit' to end the session.`)
console.log(`Available commands: /model [model_name], /clear, /save, /export, /cost`)


rl.prompt()

// function promptUser() {
//     rl.question(`Ask me a question: `, processQuery);
// }

async function processUserInput(query: string) {  
    console.log('\n')

    switch(query.toLowerCase()) {
        case '/exit':
        case '/quit':
            endSession();
            return;
        case '/model': // switch models
            console.log(query);
            break;
        case '/clear': // reset session message history
            console.log(query);
            break;
        case '/save': // save session as JSON file
            console.log(query);
            break;
        case '/export': // export to markdown
            console.log(query);
            break;
        case '/cost': // show current session cost and token usage
            console.log(query);
            break;
        case '':
            console.log('Please enter a valid query.')
            break
        default:
            let response: string | undefined = await processQuery(query);
            outputResponse(response)
            break;
    }
    
    rl.prompt() // show prompt while waiting for response

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
    
    //console.dir(getSessionMessages())

    // send query to model and get response
    let response = await sendQuery(getSessionMessages())

    console.log('Model response:')
    console.dir(response)

    // TODO should there be a retry mechanism here in case of no response or error from model?
    if (!response || !response.content) {
        //console.error('No response from model or response is missing content.')
        return 'No response from model or response is missing content.'
    }

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
        cost: response.usage.output_tokens * 0.00006 // example cost calculation, adjust based on actual pricing
    }

    // update session with model response, tokens, and cost
    updateSessionWithResponse(responseMessage)

    // Return content as string for display
    return responseMessage.content

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
    return contentText.pop()?.text || ''
}

function outputResponse(responseContent: string) {
    console.log('Claude says:')
    console.log(responseContent)
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

function switchModel(newModel: string) {
    session.model = newModel
    currentModel = newModel
}


function resetSession() {
    session = {
        session_id: `session-${Date.now()}`,
        started_at: new Date().toISOString(),
        ended_at: null,
        model: currentModel,
        messages: [],
        total_cost: 0,
        total_tokens: {
            input: 0,
            output: 0
        }
    }
}

function getSessionMessages() {
    return session.messages.map(msg => ({ role: msg.role, content: msg.content }))
}

function clearSessionMessages() {
    session.messages = []
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
    console.log('Message history:')
    console.dir(getSessionMessages())
    console.log('\n' + 'Session summary:' + '\n')
    console.dir(getSessionSummary())
    console.log('\n')
    
    closeInterface()
}


/////////////


import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlock } from '@anthropic-ai/sdk/resources/messages/messages.js';

async function sendQuery(query: MessageHistory[]) {
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
        model: ClaudeModel,
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

