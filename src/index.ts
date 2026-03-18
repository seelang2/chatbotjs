import 'dotenv/config'
import getCliArgs from './utils/getCliArgs.js'
import ChatManager from './chat/ChatManager.js'
import { Ansi } from './utils/TextColor.js'

let streaming = false
let verbose = false
let debug = false
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

if (cliArgs.stream) {
    console.log('Streaming mode enabled. (Not implemented yet)')
    streaming = true
}

if (cliArgs.verbose) {
    verbose = true
}

if (cliArgs.debug) {
    console.log(Ansi.orange + 'Debug logging enabled. (Not implemented yet)' + Ansi.reset)
    debug = true
}

const chat = new ChatManager(modelType, streaming, verbose, debug)
chat.start()
