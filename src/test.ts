/*
import parseArgs from './utils/parseargs.js'
import readline from 'node:readline';

let args = process.argv.slice(2)

let flags = parseArgs(args)

console.log(flags)

if ('--blah2' in flags) {
    console.log(`Processing --blah2 with value: ${flags['--blah2']}`)
}


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`What's your name?`, name => {
  console.log(`Hi ${name}!`);
  rl.close();
});

*/

import { parseArgs } from "node:util";

//import { parseArgs } from './utils/parseargs.js'

// parseArgs({
//   options: {
//     '--blah': {
//       type: 'string',
//       short: '-b',
//       default: 'default value'
//     },
//     '--flag': {
//       type: 'boolean',
//       short: '-f'
//     }
//   }
// })

const { values, positionals } = parseArgs({
  options: {
    'model': {
      type: 'string',
      short: 'm',
      default: 'claude'
    },
    'stream': {
      type: 'boolean',
      short: 's'
    },
    'verbose': {
      type: 'boolean',
      short: 'v'
    }
  }
})

console.log('Parsed values:', values)
console.log('Positional arguments:', positionals)

if (values.verbose) {
  console.log('Verbose mode is ON')
} else {
  console.log('Verbose mode is OFF')
}

if (values.stream === true) {
  console.log('Streaming mode is ON')
}


