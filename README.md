# 📅 Sprint Pre-Read Generator

![npm i agents command](./npm-agents-banner.svg)

<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/bradenweii/cf_ai_preread_generator"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>

## 💡 About This Project

I built this Sprint Pre-Read Generator to solve a real problem I faced in my development teams - spending too much time manually creating meeting pre-reads from sprint documents. This project started from the [Cloudflare Agents starter template](https://github.com/cloudflare/agents) and evolved into a specialized workflow tool.

**What I added:**
- 📋 **Step-by-step workflow UI** - A guided interface that walks users through document upload, meeting details, and attendee management
- 🤖 **Smart document processing** - AI-powered extraction and analysis of sprint documents (PDF, Word, Markdown, text)
- ✏️ **Editable pre-reads** - Generated content that users can review and customize before sending
- 📧 **Email integration** - Ready-to-send email drafts with proper formatting
- ✅ **Human-in-the-loop confirmations** - Approve/reject buttons for all AI actions to maintain control

This tool transforms a 30-minute manual process into a 5-minute guided workflow, while ensuring consistent, professional meeting documentation.

## ✨ How It Works

### 🎯 The Problem I Solved
Before building this tool, creating sprint pre-reads was a manual, time-consuming process:
1. ⏰ **30+ minutes** to read through sprint documents
2. 📝 **Manual extraction** of key points and action items
3. 🔄 **Inconsistent formatting** across different team members
4. 📧 **Email drafting** and attendee management overhead

### 🚀 My Solution
Now it's a streamlined 5-minute process:
1. **📤 Upload** your sprint document (any format)
2. **📋 Fill in** meeting details through guided steps
3. **👥 Add** attendee emails
4. **✏️ Review & edit** the AI-generated pre-read
5. **📧 Send** with one-click email generation

### 🛠️ Technical Implementation
- **Cloudflare Workers** for edge computing and fast global performance
- **React + TypeScript** for a modern, type-safe UI
- **AI SDK integration** with OpenAI/Workers AI for document processing
- **Tailwind CSS** for responsive, beautiful design
- **Human-in-the-loop** confirmations to maintain control over AI actions

## 🚀 Try It Out

### 💻Run Locally

```bash
# Clone and setup
git clone https://github.com/bradenweii/cf_ai_preread_generator.git
cd cf_ai_preread_generator
npm install

# Add your API key
echo "OPENAI_API_KEY=your_key_here" > .dev.vars

# Start development server
npm start
# Visit http://localhost:5173
```

## 📖 Using the Tool

### 🎯 The Guided Workflow (My Favorite Way)
you can simply start by asking the agent you want to generate a pre read for the sprint meeting next tuesday. The workflow will automatically pop up. 
Try using this example sprint pdf doc

1. **Click the 📅 calendar icon** in the header (or just type "Generate sprint meeting pre-reads" in chat)
2. **Upload your sprint document** - drag & drop any PDF, Word doc, Markdown, or text file
3. **Fill in meeting details** - title, date, time (takes 30 seconds)
4. **Add attendee emails** - paste them in or type one by one
5. **Review the generated pre-read** - the AI extracts key points, action items, and creates a structured summary
6. **Edit if needed** - click "Edit" to customize the content
7. **Get your email draft** - ready to copy/paste and send!

### 💬 Chat Interface (For Quick Questions)

Just start typing! The AI can help with:
- "Generate a pre-read for tomorrow's sprint review"
- Upload documents directly in chat
- Ask follow-up questions about the generated content
- Get help with specific formatting or content requests

## 🎯 Who This Helps

### 👩‍💻 Development Teams
**Before:** "Ugh, I need to spend 30 minutes reading through all these tickets and writing a summary..."  
**After:** "Just uploaded the sprint doc, got a perfect pre-read in 2 minutes!"

- Weekly sprint reviews become consistent and professional
- No more scrambling to prepare meeting materials
- Everyone gets the same high-quality information

### 🏢 Scrum Masters & Project Managers
**Before:** "I'm spending more time on meeting prep than actual project work..."  
**After:** "I can focus on facilitating great meetings instead of document prep!"

- Standardized communication across all teams
- More time for strategic work, less on administrative tasks
- Stakeholder updates that actually look professional

### 🎯 Product Teams
**Before:** "Our sprint summaries are inconsistent and missing key details..."  
**After:** "Every stakeholder gets comprehensive, well-formatted updates!"

- Executive summaries that highlight what matters
- Client updates that build confidence
- Cross-team coordination that actually works






## 📝 License

MIT License - basically, do whatever you want with this code. Just don't blame me if your sprint meetings become too efficient! 😄

---

