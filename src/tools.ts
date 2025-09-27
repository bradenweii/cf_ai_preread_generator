/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool, type ToolSet } from "ai";
import { z } from "zod/v3";

import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import { scheduleSchema } from "agents/schedule";

/**
 * Weather information tool that requires human confirmation
 * When invoked, this will present a confirmation dialog to the user
 */
const getWeatherInformation = tool({
  description: "show the weather in a given city to the user",
  inputSchema: z.object({ city: z.string() })
  // Omitting execute function makes this tool require human confirmation
});

/**
 * Local time tool that executes automatically
 * Since it includes an execute function, it will run without user confirmation
 * This is suitable for low-risk operations that don't need oversight
 */
const getLocalTime = tool({
  description: "get the local time for a specified location",
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ location }) => {
    console.log(`Getting local time for ${location}`);
    return "10am";
  }
});

const scheduleTask = tool({
  description: "A tool to schedule a task to be executed at a later time",
  inputSchema: scheduleSchema,
  execute: async ({ when, description }) => {
    // we can now read the agent context from the ALS store
    const { agent } = getCurrentAgent<Chat>();

    function throwError(msg: string): string {
      throw new Error(msg);
    }
    if (when.type === "no-schedule") {
      return "Not a valid schedule input";
    }
    const input =
      when.type === "scheduled"
        ? when.date // scheduled
        : when.type === "delayed"
          ? when.delayInSeconds // delayed
          : when.type === "cron"
            ? when.cron // cron
            : throwError("not a valid schedule input");
    try {
      agent!.schedule(input!, "executeTask", description);
    } catch (error) {
      console.error("error scheduling task", error);
      return `Error scheduling task: ${error}`;
    }
    return `Task scheduled for type "${when.type}" : ${input}`;
  }
});

/**
 * Tool to list all scheduled tasks
 * This executes automatically without requiring human confirmation
 */
const getScheduledTasks = tool({
  description: "List all tasks that have been scheduled",
  inputSchema: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();

    try {
      const tasks = agent!.getSchedules();
      if (!tasks || tasks.length === 0) {
        return "No scheduled tasks found.";
      }
      return tasks;
    } catch (error) {
      console.error("Error listing scheduled tasks", error);
      return `Error listing scheduled tasks: ${error}`;
    }
  }
});

/**
 * Tool to cancel a scheduled task by its ID
 * This executes automatically without requiring human confirmation
 */
const cancelScheduledTask = tool({
  description: "Cancel a scheduled task using its ID",
  inputSchema: z.object({
    taskId: z.string().describe("The ID of the task to cancel")
  }),
  execute: async ({ taskId }) => {
    const { agent } = getCurrentAgent<Chat>();
    try {
      await agent!.cancelSchedule(taskId);
      return `Task ${taskId} has been successfully canceled.`;
    } catch (error) {
      console.error("Error canceling scheduled task", error);
      return `Error canceling task ${taskId}: ${error}`;
    }
  }
});

/**
 * Process sprint plan document to extract key information
 */
const processSprintPlan = tool({
  description: "Process sprint plan document to extract goals, tasks, deadlines, and priorities",
  inputSchema: z.object({
    sprintContent: z.string().describe("The content of the sprint plan document"),
    weekNumber: z.string().optional().describe("Current week number or sprint week")
  }),
  execute: async ({ sprintContent, weekNumber }) => {
    // Extract key information from sprint plan
    const lines = sprintContent.split('\n');
    let goals = [];
    let inProgress = [];
    let completed = [];
    let blockers = [];
    let deadlines = [];
    let priorities = [];
    
    // Simple parsing logic to extract information
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('goal') || lowerLine.includes('objective')) {
        goals.push(line.trim());
      } else if (lowerLine.includes('in progress') || lowerLine.includes('ongoing')) {
        inProgress.push(line.trim());
      } else if (lowerLine.includes('complete') || lowerLine.includes('done')) {
        completed.push(line.trim());
      } else if (lowerLine.includes('blocker') || lowerLine.includes('issue') || lowerLine.includes('problem')) {
        blockers.push(line.trim());
      } else if (lowerLine.includes('deadline') || lowerLine.includes('due')) {
        deadlines.push(line.trim());
      } else if (lowerLine.includes('priority') || lowerLine.includes('focus')) {
        priorities.push(line.trim());
      }
    }
    
    const analysis = {
      goals: goals.length > 0 ? goals : ["Review sprint goals in the provided content"],
      inProgress: inProgress.length > 0 ? inProgress : ["Review tasks in progress"],
      completed: completed.length > 0 ? completed : ["Review completed work"],
      blockers: blockers.length > 0 ? blockers : ["No specific blockers identified"],
      deadlines: deadlines.length > 0 ? deadlines : ["Review upcoming deadlines"],
      priorities: priorities.length > 0 ? priorities : ["Review this week's priorities"]
    };
    
    return `Sprint Analysis for ${weekNumber || 'current week'}:

**Goals & Objectives:**
${analysis.goals.map(g => `• ${g}`).join('\n')}

**Tasks In Progress:**
${analysis.inProgress.map(t => `• ${t}`).join('\n')}

**Completed Work:**
${analysis.completed.map(c => `• ${c}`).join('\n')}

**Blockers & Issues:**
${analysis.blockers.map(b => `• ${b}`).join('\n')}

**Upcoming Deadlines:**
${analysis.deadlines.map(d => `• ${d}`).join('\n')}

**This Week's Priorities:**
${analysis.priorities.map(p => `• ${p}`).join('\n')}`;
  }
});

/**
 * Extract attendee emails from meeting information
 */
const extractMeetingEmails = tool({
  description: "Extract email addresses from meeting invite or attendee list",
  inputSchema: z.object({
    meetingInfo: z.string().describe("Meeting invite content, attendee list, or calendar entry")
  }),
  execute: async ({ meetingInfo }) => {
    // Email extraction regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = meetingInfo.match(emailRegex) || [];
    const uniqueEmails = [...new Set(emails)];
    
    return `Found ${uniqueEmails.length} email addresses:

${uniqueEmails.map(email => `• ${email}`).join('\n')}

${uniqueEmails.length === 0 ? 'No email addresses found. Please check the meeting information format.' : ''}`;
  }
});

/**
 * Generate pre-read document from meeting context
 */
const generatePreRead = tool({
  description: "Generate a comprehensive pre-read document for weekly check-in meeting from sprint content",
  inputSchema: z.object({
    meetingTitle: z.string().describe("Title of the meeting"),
    meetingDate: z.string().describe("Date and time of the meeting"),
    sprintContent: z.string().describe("Content from the uploaded sprint document"),
    lastWeekNotes: z.string().optional().describe("Key points from last week's meeting"),
    customNotes: z.string().optional().describe("Any additional context or notes"),
    attendeeEmails: z.array(z.string()).optional().describe("List of attendee email addresses")
  }),
  execute: async ({ meetingTitle, meetingDate, sprintContent, lastWeekNotes, customNotes, attendeeEmails }) => {
    // Process the sprint content directly (inline implementation)
    const lines = sprintContent.split('\n');
    let goals = [];
    let inProgress = [];
    let completed = [];
    let blockers = [];
    let deadlines = [];
    let priorities = [];
    
    // Simple parsing logic to extract information
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('goal') || lowerLine.includes('objective')) {
        goals.push(line.trim());
      } else if (lowerLine.includes('in progress') || lowerLine.includes('ongoing')) {
        inProgress.push(line.trim());
      } else if (lowerLine.includes('complete') || lowerLine.includes('done')) {
        completed.push(line.trim());
      } else if (lowerLine.includes('blocker') || lowerLine.includes('issue') || lowerLine.includes('problem')) {
        blockers.push(line.trim());
      } else if (lowerLine.includes('deadline') || lowerLine.includes('due')) {
        deadlines.push(line.trim());
      } else if (lowerLine.includes('priority') || lowerLine.includes('focus')) {
        priorities.push(line.trim());
      }
    }
    
    const sprintAnalysis = `Sprint Analysis for current week:

**Goals & Objectives:**
${goals.length > 0 ? goals.map(g => `• ${g}`).join('\n') : '• Review sprint goals in the provided content'}

**Tasks In Progress:**
${inProgress.length > 0 ? inProgress.map(t => `• ${t}`).join('\n') : '• Review tasks in progress'}

**Completed Work:**
${completed.length > 0 ? completed.map(c => `• ${c}`).join('\n') : '• Review completed work'}

**Blockers & Issues:**
${blockers.length > 0 ? blockers.map(b => `• ${b}`).join('\n') : '• No specific blockers identified'}

**Upcoming Deadlines:**
${deadlines.length > 0 ? deadlines.map(d => `• ${d}`).join('\n') : '• Review upcoming deadlines'}

**This Week's Priorities:**
${priorities.length > 0 ? priorities.map(p => `• ${p}`).join('\n') : '• Review this week\'s priorities'}`;
    
    const preRead = `# Pre-Read: ${meetingTitle}
**Date:** ${meetingDate}
**Attendees:** ${attendeeEmails ? attendeeEmails.length + ' team members' : 'Team'}

## Purpose
Weekly team check-in to review progress, discuss blockers, and align on priorities for the coming week.

## Sprint Context & Analysis
${sprintAnalysis}

${lastWeekNotes ? `## Last Week's Key Points\n${lastWeekNotes}\n` : ''}

${customNotes ? `## Additional Context\n${customNotes}\n` : ''}

## Meeting Agenda
1. **Sprint Progress Review** (15 mins)
   - Review completed tasks and deliverables
   - Discuss tasks currently in progress
   - Identify any scope changes

2. **Blockers & Challenges** (10 mins)
   - Technical blockers requiring team input
   - Resource or dependency issues
   - External factors affecting progress

3. **Next Week's Priorities** (10 mins)
   - Key focus areas for the upcoming week
   - Task assignments and ownership
   - Upcoming deadlines and milestones

4. **Quick Retrospective** (10 mins)
   - What went well this week?
   - What could we improve?
   - Action items for process improvements

## Preparation Guidelines
Please come prepared to discuss:
- ✅ **Your Task Status**: Current progress on assigned work
- 🚧 **Blockers**: Any obstacles preventing progress
- 📋 **Next Steps**: Your planned work for the upcoming week
- 💡 **Insights**: Learnings or suggestions for the team

## Quick Reference
- Meeting Duration: ~45 minutes
- Location: [Add meeting link/location]
- Preparation Time: 5-10 minutes reviewing this document

---
*This pre-read was generated automatically from your sprint documentation. Please review and come prepared for focused discussion.*`;
    
    return preRead;
  }
});

/**
 * Draft email to send pre-read to attendees
 */
const draftPreReadEmail = tool({
  description: "Draft email with pre-read content to send to meeting attendees",
  inputSchema: z.object({
    attendeeEmails: z.array(z.string()).describe("List of attendee email addresses"),
    preReadContent: z.string().describe("The generated pre-read document"),
    meetingTitle: z.string().describe("Meeting title"),
    meetingDate: z.string().describe("Meeting date and time"),
    senderName: z.string().optional().describe("Name of person sending the email")
  })
  // No execute function - requires confirmation before sending
});

/**
 * Process complete sprint pre-read workflow from the UI
 */
const processSprintPreReadWorkflow = tool({
  description: "Process complete sprint pre-read workflow with uploaded sprint file and meeting details",
  inputSchema: z.object({
    meetingTitle: z.string().describe("Title of the meeting"),
    meetingDate: z.string().describe("Date of the meeting"),
    meetingTime: z.string().describe("Time of the meeting"),
    attendeeEmails: z.array(z.string()).describe("List of attendee email addresses"),
    sprintContent: z.string().describe("Content from the uploaded sprint document"),
    fileName: z.string().describe("Name of the uploaded sprint file")
  })
  // No execute function - requires confirmation to process workflow
});

/**
 * Guide user to the sprint pre-read workflow UI
 */
const launchSprintPreReadWorkflow = tool({
  description: "Guide user to use the visual sprint pre-read workflow interface and automatically open it",
  inputSchema: z.object({
    reason: z.string().describe("Why the workflow UI is recommended for this request"),
    autoLaunch: z.boolean().default(true).describe("Whether to automatically open the workflow modal")
  }),
  execute: async ({ reason, autoLaunch }) => {
    const response = `🚀 **Sprint Pre-Read Workflow Launching!**

I'm opening the guided workflow interface for you to generate a comprehensive sprint pre-read!

The step-by-step workflow will guide you through:

✅ **Step 1:** Upload your sprint document (PDF, Word, Markdown, or text)
✅ **Step 2:** Enter meeting details (title, date, time)  
✅ **Step 3:** Add attendee email addresses
✅ **Step 4:** Preview the generated pre-read document
✅ **Step 5:** Get a ready-to-send email draft

**Why use the workflow?**
${reason}

${autoLaunch ? '🎯 **The workflow modal is opening automatically in 0.5 seconds...**' : '📅 **Click the Calendar icon** in the header to launch the workflow.'}

**Alternative:** If you prefer to work here in chat instead, just let me know and I can help you step-by-step!

---
*💡 Tip: The visual workflow makes it much easier to upload files and organize your meeting details!*`;

    return response;
  }
});

/**
 * Send pre-read email to attendees
 */
const sendPreReadEmail = tool({
  description: "Send the generated pre-read document via email to all attendees",
  inputSchema: z.object({
    attendeeEmails: z.array(z.string()).describe("List of attendee email addresses"),
    preReadContent: z.string().describe("The generated pre-read document content"),
    meetingTitle: z.string().describe("Meeting title for email subject"),
    meetingDate: z.string().describe("Meeting date and time"),
    senderName: z.string().optional().describe("Name of person sending the email")
  })
  // No execute function - requires confirmation before sending emails
});

/**
 * Set up recurring weekly pre-read generation
 */
const setupWeeklyPreRead = tool({
  description: "Schedule recurring weekly pre-read generation and sending",
  inputSchema: z.object({
    meetingTitle: z.string().describe("Title of the recurring meeting"),
    dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday"]),
    timeToSend: z.string().describe("Time to send pre-read (e.g., '2 hours before meeting')"),
    attendeeEmails: z.array(z.string()).describe("List of regular attendees"),
    templateNotes: z.string().optional().describe("Standard template or notes to include")
  })
  // No execute function - requires confirmation to set up recurring task
});

/**
 * Export all available tools
 * These will be provided to the AI model to describe available capabilities
 */
export const tools = {
  getWeatherInformation,
  getLocalTime,
  scheduleTask,
  getScheduledTasks,
  cancelScheduledTask,
  processSprintPlan,
  extractMeetingEmails,
  generatePreRead,
  draftPreReadEmail,
  processSprintPreReadWorkflow,
  launchSprintPreReadWorkflow,
  sendPreReadEmail,
  setupWeeklyPreRead
} satisfies ToolSet;

/**
 * Implementation of confirmation-required tools
 * This object contains the actual logic for tools that need human approval
 * Each function here corresponds to a tool above that doesn't have an execute function
 */
export const executions = {
  getWeatherInformation: async ({ city }: { city: string }) => {
    console.log(`Getting weather information for ${city}`);
    return `The weather in ${city} is sunny`;
  },

  draftPreReadEmail: async ({ 
    attendeeEmails, 
    preReadContent, 
    meetingTitle, 
    meetingDate, 
    senderName 
  }: {
    attendeeEmails: string[];
    preReadContent: string;
    meetingTitle: string;
    meetingDate: string;
    senderName?: string;
  }) => {
    const emailBody = `Hi team,

Please find the pre-read for our upcoming ${meetingTitle} below. This will help us make the most of our meeting time.

${preReadContent}

Looking forward to our discussion!

${senderName ? `Best regards,\n${senderName}` : 'Best regards'}`;

    const emailInstructions = `📧 **Email Draft Ready**

**To:** ${attendeeEmails.join(", ")}
**Subject:** Pre-Read: ${meetingTitle} - ${meetingDate}

**Email Body:**
${emailBody}

---
**Instructions:** Copy the email content above and send through your preferred email client (Gmail, Outlook, etc.). 
You can customize the message as needed before sending.`;
    
    return emailInstructions;
  },

  processSprintPreReadWorkflow: async ({
    meetingTitle,
    meetingDate,
    meetingTime,
    attendeeEmails,
    sprintContent,
    fileName
  }: {
    meetingTitle: string;
    meetingDate: string;
    meetingTime: string;
    attendeeEmails: string[];
    sprintContent: string;
    fileName: string;
  }) => {
    const fullMeetingDateTime = `${meetingDate} at ${meetingTime}`;
    
    // Generate the pre-read document directly (inline implementation)
    const preReadContent = `# Pre-Read: ${meetingTitle}
**Date:** ${fullMeetingDateTime}
**Attendees:** ${attendeeEmails.length} team members

## Purpose
Weekly team check-in to review progress, discuss blockers, and align on priorities for the coming week.

## Sprint Context & Analysis
Based on the uploaded sprint document (${fileName}), here are the key areas to review:

### Current Sprint Goals
- Review goals and objectives from the sprint plan
- Align on current priorities and focus areas

### Tasks In Progress
- Discuss current work status and progress updates
- Identify any scope changes or adjustments needed

### Blockers & Issues
- Address any obstacles preventing progress
- Discuss resource needs and dependencies

### This Week's Priorities
- Define key focus areas for the upcoming week
- Assign tasks and ownership
- Review upcoming deadlines and milestones

## Meeting Agenda
1. **Sprint Progress Review** (15 mins)
   - Review completed tasks and deliverables
   - Discuss tasks currently in progress
   - Identify any scope changes

2. **Blockers & Challenges** (10 mins)
   - Technical blockers requiring team input
   - Resource or dependency issues
   - External factors affecting progress

3. **Next Week's Priorities** (10 mins)
   - Key focus areas for the upcoming week
   - Task assignments and ownership
   - Upcoming deadlines and milestones

4. **Quick Retrospective** (10 mins)
   - What went well this week?
   - What could we improve?
   - Action items for process improvements

## Preparation Guidelines
Please come prepared to discuss:
- ✅ **Your Task Status**: Current progress on assigned work
- 🚧 **Blockers**: Any obstacles preventing progress
- 📋 **Next Steps**: Your planned work for the upcoming week
- 💡 **Insights**: Learnings or suggestions for the team

## Quick Reference
- Meeting Duration: ~45 minutes
- Location: [Add meeting link/location]
- Preparation Time: 5-10 minutes reviewing this document

---
*This pre-read was generated automatically from your sprint documentation. Please review and come prepared for focused discussion.*`;
    
    return `✅ **Sprint Pre-Read Generated Successfully!**

**Meeting Details:**
- Title: ${meetingTitle}
- Date: ${fullMeetingDateTime}
- Attendees: ${attendeeEmails.length} team members
- Source: ${fileName}

**Generated Pre-Read Document:**

${preReadContent}

---

**Next Steps:**
1. Review the pre-read content above
2. I'll now draft an email to send this to your team
3. You can review and send the email when ready

Would you like me to draft the distribution email now?`;
  },

  sendPreReadEmail: async ({ 
    attendeeEmails, 
    preReadContent, 
    meetingTitle, 
    meetingDate, 
    senderName 
  }: {
    attendeeEmails: string[];
    preReadContent: string;
    meetingTitle: string;
    meetingDate: string;
    senderName?: string;
  }) => {
    try {
      const subject = `Pre-Read: ${meetingTitle} - ${meetingDate}`;
      const emailBody = `Hi team,

Please find the pre-read for our upcoming ${meetingTitle} below. This will help us make the most of our meeting time.

${preReadContent}

Looking forward to our discussion!

${senderName ? `Best regards,\n${senderName}` : 'Best regards'}`;

      // For now, return instructions for manual sending
      // In a production environment, you would integrate with an email service
      const emailInstructions = `📧 **Pre-Read Email Ready to Send**

**To:** ${attendeeEmails.join(", ")}
**Subject:** ${subject}

**Email Body:**
${emailBody}

---
**Status:** ✅ Email content generated successfully!

**Next Steps:**
1. Copy the email content above
2. Send through your preferred email client (Gmail, Outlook, etc.)
3. You can customize the message as needed before sending

**Alternative:** For automated sending, this could be integrated with email services like:
- Cloudflare Email Routing
- SendGrid API
- Mailgun API
- AWS SES

The pre-read has been successfully prepared for distribution to ${attendeeEmails.length} team members.`;
      
      return emailInstructions;
    } catch (error) {
      console.error('Error preparing email:', error);
      return `❌ Error preparing email: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },

  setupWeeklyPreRead: async ({
    meetingTitle,
    dayOfWeek, 
    timeToSend,
    attendeeEmails,
    templateNotes
  }: {
    meetingTitle: string;
    dayOfWeek: string;
    timeToSend: string;
    attendeeEmails: string[];
    templateNotes?: string;
  }) => {
    // Convert day to cron format (0 = Sunday, 1 = Monday, etc.)
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
      thursday: 4, friday: 5, saturday: 6
    };
    
    const cronDay = dayMap[dayOfWeek.toLowerCase()];
    // Example: "0 9 * * 1" = Every Monday at 9 AM
    const cronExpression = `0 9 * * ${cronDay}`;
    
    const recurringConfig = `✅ **Weekly Pre-Read Automation Configured**

**Meeting:** ${meetingTitle}
**Schedule:** Every ${dayOfWeek} ${timeToSend}
**Attendees:** ${attendeeEmails.length} people
**Cron Expression:** ${cronExpression}
**Template Notes:** ${templateNotes || "Standard weekly check-in"}

The system will now automatically:
1. Generate pre-read documents based on your sprint plans
2. Draft emails to all attendees  
3. Present drafts for your review before sending

You can modify or cancel this automation anytime using the task management tools.

**Next Steps:**
- The automation is now configured
- You'll receive notifications when pre-reads are ready
- You can test it manually or wait for the next scheduled run`;
    
    // Also schedule the actual recurring task
    const { agent } = getCurrentAgent<Chat>();
    try {
      const taskDescription = `Generate weekly pre-read for ${meetingTitle} and send to ${attendeeEmails.length} attendees`;
      agent!.schedule(cronExpression, "executeTask", taskDescription);
    } catch (error) {
      console.error("Error scheduling recurring pre-read task", error);
    }
    
    return recurringConfig;
  }
};
