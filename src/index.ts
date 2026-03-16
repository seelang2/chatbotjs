import 'dotenv/config'
import type { Conversation, Message, MessageHistory, ResponseMessage, Model, ModelType, Token } from './types/types.js'
import getCliArgs from './utils/getCliArgs.js'
import ChatManager from './chat/ChatManager.js'


const supportedModelTypes: ModelType[] = ['claude', 'gpt']


// command-line arguments
const cliArgs = getCliArgs()


//let currentModel = ClaudeModel





// Command-line parameters
// if (cliArgs.model.toLowerCase() === 'claude') {
//     setModel(ClaudeModel)
// } else if (cliArgs.model.toLowerCase() === 'openai') {
//     setModel(GptModel)
// } else {
//     console.error(`Unsupported model specified: ${cliArgs.model}. Defaulting to Claude.`)
//     setModel(GptModel)
// }

let modelType: string = 'claude'

if (cliArgs.model.toLowerCase() === 'claude') {
    modelType = 'claude'
} else if (cliArgs.model.toLowerCase() === 'gpt') {
    modelType = 'gpt'
} else {
    console.error(`Unsupported model specified: ${cliArgs.model}. Defaulting to Claude.`)
}


const chat = new ChatManager(modelType)


// TODO: add --stream and --verbose flag processing
if (cliArgs.stream) {
    console.log('Streaming mode enabled. (Not implemented yet)')
}

if (cliArgs.verbose) {
    console.log('Verbose logging enabled. (Not implemented yet)')
}

// let conversationHistory: Array<{ role: string, content: string }> = []


chat.start()




// rl.setPrompt(`>>> `)


// function promptUser() {
//     rl.question(`Ask me a question: `, processQuery);
// }

/*
function setModel(model: Model) {
    currentModel = model
    session.model = model.name
    console.log(`Using model: ${model.name}`)
}

function setModelByType(modelType: string) {
    switch(modelType.split(' ')[1]) {
        case 'claude':
            setModel(ClaudeModel)
            console.log(`Switched to model: ${ClaudeModel.name}`)
            break;
        case 'gpt':
            setModel(GptModel)
            console.log(`Switched to model: ${GptModel.name}`)
            break;
        default:
            console.error(`Unsupported model type specified: ${modelType}.  ` +
                `Supported types are: ${supportedModelTypes.join(', ')}.  \n` +
                `No changes made.`)
            break;
    }
}
*/


/////////////

/*

file:///Users/chrisl/Library/Mobile%20Documents/com~apple~CloudDocs/Development/AI/BootCamp/chatbotjs/node_modules/@anthropic-ai/sdk/core/error.mjs:55
            return new RateLimitError(status, error, message, headers);
                   ^

RateLimitError: 429 {"type":"error","error":{"type":"rate_limit_error","message":"Number of concurrent connections has exceeded your rate limit. Please try again later or contact sales at https://www.anthropic.com/contact-sales to discuss your options for a rate limit increase."},"request_id":"req_011CYxCD2ZR4zxLEXUyPkjj7"}
    at APIError.generate (file:///Users/chrisl/Library/Mobile%20Documents/com~apple~CloudDocs/Development/AI/BootCamp/chatbotjs/node_modules/@anthropic-ai/sdk/core/error.mjs:55:20)
    at Anthropic.makeStatusError (file:///Users/chrisl/Library/Mobile%20Documents/com~apple~CloudDocs/Development/AI/BootCamp/chatbotjs/node_modules/@anthropic-ai/sdk/client.mjs:155:32)
    at Anthropic.makeRequest (file:///Users/chrisl/Library/Mobile%20Documents/com~apple~CloudDocs/Development/AI/BootCamp/chatbotjs/node_modules/@anthropic-ai/sdk/client.mjs:309:30)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async sendQuery (file:///Users/chrisl/Library/Mobile%20Documents/com~apple~CloudDocs/Development/AI/BootCamp/chatbotjs/dist/index.js:376:21)
    at async processQuery (file:///Users/chrisl/Library/Mobile%20Documents/com~apple~CloudDocs/Development/AI/BootCamp/chatbotjs/dist/index.js:137:20)
    at async routeQuery (file:///Users/chrisl/Library/Mobile%20Documents/com~apple~CloudDocs/Development/AI/BootCamp/chatbotjs/dist/index.js:121:20)
    at async Interface.processUserInput (file:///Users/chrisl/Library/Mobile%20Documents/com~apple~CloudDocs/Development/AI/BootCamp/chatbotjs/dist/index.js:113:13) {
  status: 429,
  headers: Headers {},
  requestID: 'req_011CYxCD2ZR4zxLEXUyPkjj7',
  error: {
    type: 'error',
    error: {
      type: 'rate_limit_error',
      message: 'Number of concurrent connections has exceeded your rate limit. Please try again later or contact sales at https://www.anthropic.com/contact-sales to discuss your options for a rate limit increase.'
    },
    request_id: 'req_011CYxCD2ZR4zxLEXUyPkjj7'
  }
}


*/






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

