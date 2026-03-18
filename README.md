# ChatbotJS - NodeJS AI chatbot

This is a CLI chatbot written in TypeScript. It supports Anthropic (Claude) and OpenAI (GPT) APIs. As this is a command line bot, only text is supported.

## Setup

Make sure you have API keys for Anthropic and OpenAI. Create an `.env` file in the project root with the following keys:

```
OPENAI_API_KEY=[YourAPIKey]
ANTHROPIC_API_KEY=[YourAPIKey]
```

Run `npm run build` to transpile the files into the ./dist directory.

## Startup

To start the chatbot use:

```shell
node ./dist/index.js --model [model] --stream --verbose --debug
```

You can also use:

```shell
npm run start
```

This is equivalent to:

```shell
node ./dist/index.js --stream --model claude
```

## Command-line arguments

| Argument | Description |
| --- | --- |
| --model [model] | Specifies which API to use. Valid options are 'claude' or 'gpt'. Default is 'claude' |
| --stream | Enable streaming mode. When active, responses are displayed in realtime instead of waiting until the response finishes and displaying the text all at once. This is not on by default. |
| --verbose | Displays information about cost, usage, and context window limits. |
| --debug | Displays information useful for debugging. You usually don't want this. |

## Runtime commands

| Command | Description |
| --- | --- |
| /exit | End the session. |
| /quit |  |
| /model [model] | Switch models to [mode]. Valid options are 'claude' or 'gpt'. |
| /cost | Show current session cost and token usage. |
| /save | Save session as a JSON file. WARNING: This will overwrite any previously saved files from the current session. |
| /export | Export session to markdown file. WARNING: This will overwrite any previously saved files from the current session. |
| /clear | Reset session message history. |
| /reset | Reset session completely and generate new session identifier. |
| /verbose [mode] | Displays additional information about cost, token usage, and context window limits. Valid options are 'on' or 'off'. Same as the --verbose command-line option. |
| /debug [mode] | Display debug information. Valid options are 'on' or 'off'. Same as the --debug command-line option. |
| /context | Show messages in the current context window. Mostly useful for debugging. |
| /history | Show all messages in session history. Mostly useful for debugging. |
| /help | Displays command list. |

## Other Usage Notes

When the bot is started, a session is created and given a session id. This remains the same until the session ends (when you `/exit` or `/quit` the bot). This means that using `/save` or `/export` more than once during the session will overwrite the previous files. To prevent ths, either move the files out of the project root before saving or exporting again, or use `/reset` to generate a new chat session with a new session id. **NOTE** All messages will be cleared from the history.

In extremely long conversations, you may run into the context window's token limit. The bot will warn you when you're getting close. If the limit is exceeded, the oldest messages will be dropped from the context window to remain within the limit. **No messages are actually removed from the session.** Saving or exporting the session will include the entire session message history. The only time messages are removed is when you use `/clear` or `/reset`.












