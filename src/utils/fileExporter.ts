import { open } from 'node:fs/promises';
import type { Conversation } from '../types/types.js'

async function saveSessionAsJson(sessionId: string, session: Conversation) {
    const filename = `session-${sessionId}.json`
    const fileHandle = await open(filename, 'w')
    try {
        await fileHandle.writeFile(JSON.stringify(session, null, 2))
        console.log(`Session saved as ${filename}`)
    } catch (err) {
        console.error('Error writing session to file:', err)
    } finally {
        await fileHandle.close()
    }
}

async function exportSessionToMarkdown(session: Conversation) {
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

    const fileHandle = await open(filename, 'w')
    try {
        await fileHandle.writeFile(markdownContent)
        console.log(`Session exported as ${filename}`)
    } catch (err) {
        console.error('Error writing session to file:', err)
    } finally {
        await fileHandle.close()
    }
}

export { saveSessionAsJson, exportSessionToMarkdown }
