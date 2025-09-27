import { routeAgentRequest, type Schedule } from "agents";

import { getSchedulePrompt } from "agents/schedule";

import { AIChatAgent } from "agents/ai-chat-agent";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";
import { openai } from "@ai-sdk/openai";
import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";
// import { env } from "cloudflare:workers";

const model = openai("gpt-4o-2024-11-20");
// Cloudflare AI Gateway
// const openai = createOpenAI({
//   apiKey: env.OPENAI_API_KEY,
//   baseURL: env.GATEWAY_BASE_URL,
// });

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    // Collect all tools, including MCP tools
    const allTools = {
      ...tools,
      ...this.mcp.getAITools()
    };

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Clean up incomplete tool calls to prevent API errors
        const cleanedMessages = cleanupMessages(this.messages);

        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: allTools,
          executions
        });

        const result = streamText({
          system: `You are a Meeting Pre-Read Assistant that helps teams prepare for productive meetings. 

Your core capabilities include:
- Processing sprint plans and meeting documents to extract key information
- Generating professional pre-read summaries for weekly check-ins
- Managing attendee lists and drafting distribution emails
- Setting up recurring automation for weekly meetings
- Analyzing meeting context to highlight priorities, blockers, and progress

**Workflow Detection:**
When you receive a message that mentions "sprint pre-read" and includes meeting details, attendees, and sprint file content, immediately use the processSprintPreReadWorkflow tool to handle the complete workflow.

**User Request Handling:**
When a user asks about "sprint meeting pre-reads", "generate sprint pre-read", or similar requests:
1. **IMMEDIATELY** use the launchSprintPreReadWorkflow tool to guide them to the visual workflow interface
2. Explain the benefits of the guided workflow (easier file upload, step-by-step process, preview functionality)
3. **ALTERNATIVE**: Offer to help step-by-step in chat if they specifically prefer that approach

**Standard Interactive Flow (Chat-based):**
When a user chooses to work in chat (without workflow data):
1. Ask for meeting details (title, date, attendees)
2. Request relevant documents (sprint plans, last week's notes, context)
3. Process the documents to extract key information
4. Generate a comprehensive pre-read document
5. Draft email for distribution to attendees
6. Offer to set up recurring automation

**Sprint Plan Analysis Focus:**
- Goals and objectives
- Tasks in progress vs completed
- Blockers and issues
- Upcoming deadlines
- Priority items for the week

**Pre-read Generation Should Include:**
- Meeting purpose and agenda
- Sprint context and progress
- Last week's key decisions/actions
- Preparation guidelines for attendees

${getSchedulePrompt({ date: new Date() })}

**Tool Usage Guidelines:**
- Use processSprintPreReadWorkflow for complete workflow data from the UI
- Use individual tools (processSprintPlan, generatePreRead, draftPreReadEmail) for step-by-step interactions
- **IMMEDIATELY** use sendPreReadEmail when user requests to send the pre-read to attendees
- Always offer to draft the distribution email after generating a pre-read
- Suggest recurring automation for regular meetings

If the user asks to schedule a task or set up recurring meetings, use the appropriate scheduling tools.
`,

          messages: convertToModelMessages(processedMessages),
          model,
          tools: allTools,
          // Type boundary: streamText expects specific tool types, but base class uses ToolSet
          // This is safe because our tools satisfy ToolSet interface (verified by 'satisfies' in tools.ts)
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<
            typeof allTools
          >,
          stopWhen: stepCountIs(10)
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }
  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `Running scheduled task: ${description}`
          }
        ],
        metadata: {
          createdAt: new Date()
        }
      }
    ]);
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/check-open-ai-key") {
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      return Response.json({
        success: hasOpenAIKey
      });
    }

    // Handle PDF text extraction
    if (url.pathname === "/api/extract-pdf" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        
        if (!file) {
          return Response.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
          return Response.json({ error: "File must be a PDF" }, { status: 400 });
        }

        // Read the file as array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Use Cloudflare Workers AI for PDF to Markdown conversion
        const text = await extractPdfText(arrayBuffer, env);
        
        return Response.json({ 
          success: true, 
          text,
          filename: file.name,
          size: file.size
        });
      } catch (error) {
        console.error("PDF extraction error:", error);
        return Response.json({ 
          error: "Failed to extract text from PDF", 
          details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "OPENAI_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
    }
    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;

// Convert PDF to structured Markdown using Cloudflare Workers AI
async function extractPdfText(buffer: ArrayBuffer, env: Env): Promise<string> {
  try {
    // Use Cloudflare Workers AI native toMarkdown conversion
    const blob = new Blob([buffer], { type: 'application/pdf' });
    
    const results = await env.AI.toMarkdown([
      {
        name: 'document.pdf',
        blob: blob
      }
    ]);
    
    if (results && results.length > 0 && results[0].data) {
      const markdown = results[0].data;
      
      // Clean up the markdown output
      const cleanedMarkdown = markdown
        .replace(/^# [^\n]+\n## Metadata\n[^#]*(?=##|$)/m, '') // Remove metadata section
        .replace(/### Page \d+\n/g, '\n') // Remove page headers
        .replace(/\n{3,}/g, '\n\n') // Normalize spacing
        .trim();
      
      return cleanedMarkdown || markdown; // Return cleaned version or original if cleaning failed
    }
    
    return "Unable to extract content from this PDF using Workers AI.";
    
  } catch (error) {
    console.error("Workers AI PDF conversion error:", error);
    
    // Fallback to manual extraction if Workers AI fails
    try {
      return await extractTextManually(buffer);
    } catch (fallbackError) {
      console.error("Fallback extraction also failed:", fallbackError);
      return `Error converting PDF to Markdown: ${error instanceof Error ? error.message : 'Unknown error'}. The file may be corrupted or use unsupported features.`;
    }
  }
}


// Manual PDF text extraction as fallback
async function extractTextManually(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const text = new TextDecoder('latin1').decode(uint8Array);
  
  const textBlocks: string[] = [];
  
  // Extract text from parentheses (most common PDF text encoding)
  const parenthesesMatches = text.match(/\(([^)]{2,})\)/g);
  if (parenthesesMatches) {
    for (const match of parenthesesMatches) {
      const content = match.slice(1, -1);
      const cleaned = cleanPdfString(content);
      
      if (cleaned && cleaned.length > 1 && /[a-zA-Z]/.test(cleaned)) {
        textBlocks.push(cleaned);
      }
    }
  }
  
  // Extract from hex strings
  const hexMatches = text.match(/<([0-9A-Fa-f\s]+)>/g);
  if (hexMatches) {
    for (const match of hexMatches) {
      const hexContent = match.slice(1, -1).replace(/\s/g, '');
      if (hexContent.length % 2 === 0) {
        try {
          const decoded = hexContent
            .match(/.{2}/g)
            ?.map(hex => String.fromCharCode(parseInt(hex, 16)))
            .join('') || '';
          if (decoded.length > 2 && /[a-zA-Z]/.test(decoded)) {
            textBlocks.push(decoded);
          }
        } catch (e) {
          // Skip invalid hex
        }
      }
    }
  }
  
  const extractedText = textBlocks.join(' ').replace(/\s+/g, ' ').trim();
  return extractedText.length > 20 ? convertTextToMarkdown(extractedText) : 
    "Unable to extract readable text from this PDF. The document may be image-based or use complex encoding.";
}

// Clean PDF escape sequences
function cleanPdfString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n') 
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, octal) => {
      try {
        const charCode = parseInt(octal, 8);
        return charCode > 31 && charCode < 127 ? String.fromCharCode(charCode) : '';
      } catch {
        return '';
      }
    })
    .replace(/\\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Convert plain text to structured markdown
function convertTextToMarkdown(text: string): string {
  const lines = text.split(/\n+/).filter(line => line.trim());
  const markdownLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Detect potential headings (short lines, often followed by content)
    if (line.length < 80 && i < lines.length - 1) {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && nextLine.length > line.length) {
        markdownLines.push(`## ${line}`);
        markdownLines.push('');
        continue;
      }
    }
    
    // Detect list items
    if (line.match(/^[-•·*]\s/) || line.match(/^\d+[.)]\s/)) {
      markdownLines.push(`- ${line.replace(/^[-•·*]\s*/, '').replace(/^\d+[.)]\s*/, '')}`);
      continue;
    }
    
    // Regular content
    markdownLines.push(line);
    
    // Add spacing between paragraphs
    if (i < lines.length - 1) {
      markdownLines.push('');
    }
  }
  
  return markdownLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

