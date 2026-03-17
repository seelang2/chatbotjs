import 'dotenv/config'
import type { ModelType } from './types/types.js'
import getCliArgs from './utils/getCliArgs.js'
import ChatManager from './chat/ChatManager.js'
import { Ansi } from './utils/TextColor.js'

let streaming: boolean = false
let verbose: boolean = false
let modelType: string = 'claude'
 
// command-line arguments
const cliArgs = getCliArgs()

if (cliArgs.model.toLowerCase() === 'claude') {
    modelType = 'claude'
} else if (cliArgs.model.toLowerCase() === 'gpt') {
    modelType = 'gpt'
} else {
    console.error(`Unsupported model specified: ${cliArgs.model}. Defaulting to Claude.`)
}

// TODO: add --stream and --verbose flag processing
if (cliArgs.stream) {
    console.log('Streaming mode enabled. (Not implemented yet)')
    streaming = true
}

if (cliArgs.verbose) {
    console.log(Ansi.orange + 'Verbose logging enabled. (Not implemented yet)' + Ansi.reset)
    verbose = true
}

const chat = new ChatManager(modelType, streaming, verbose)
chat.start()

