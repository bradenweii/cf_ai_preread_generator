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

### 🌐 Option 1: Deploy Your Own (Recommended)

**What you'll need:**
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works!)
- [OpenAI API key](https://platform.openai.com/api-keys) (or use Cloudflare Workers AI)

**Quick deploy:**
```bash
git clone https://github.com/bradenweii/cf_ai_preread_generator.git
cd cf_ai_preread_generator
npm install

# Add your OpenAI key to .dev.vars
echo "OPENAI_API_KEY=your_key_here" > .dev.vars

# Deploy to Cloudflare (it's free!)
npm run deploy
```

### 💻 Option 2: Run Locally

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

### 🎯 Option 3: Try the Demo

*Coming soon - I'm working on hosting a live demo version*

## 📖 Using the Tool

### 🎯 The Guided Workflow (My Favorite Way)

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

## 🛠️ What's Under the Hood

I built this on top of some amazing technologies:

- **[Cloudflare Agents](https://github.com/cloudflare/agents)** - The AI agent framework that makes the magic happen
- **Cloudflare Workers** - Edge computing so it's fast everywhere in the world
- **React + TypeScript** - Modern UI that's actually maintainable
- **AI SDK** - Works with OpenAI, Claude, or Cloudflare's own AI models
- **Tailwind CSS** - Because life's too short for custom CSS

### 🔧 Want to Customize It?

The cool thing about building on Cloudflare Agents is how easy it is to modify:

**Add new document types:** Just update the accepted file types in `tools.ts`  
**Change the pre-read format:** Modify the template in the `generatePreRead` tool  
**Switch AI models:** Swap OpenAI for Cloudflare Workers AI or Claude  
**Custom email templates:** Update the email generation logic  

Everything is in the code and well-commented. Fork it and make it yours!

## 🔒 Privacy & Security

**Your documents are safe:**
- Files are processed locally in your browser first
- Nothing gets stored permanently anywhere
- AI processing happens on secure edge servers
- Your API keys stay in your environment variables

**No vendor lock-in:**
- Deploy to your own Cloudflare account
- Use your own AI API keys
- Full control over your data and processing

## 🤝 Want to Help Make This Better?

I'd love your contributions! Here are some ideas:

**Easy wins:**
- 🐛 Found a bug? [Open an issue](https://github.com/bradenweii/cf_ai_preread_generator/issues)
- 📝 Improve the documentation
- 🎨 Make the UI even prettier
- 📧 Add more email template options

**Bigger features:**
- 🔗 Integration with Slack/Teams for direct sending
- 📊 Analytics on meeting prep time saved
- 🗓️ Calendar integration for automatic scheduling
- 🌍 Multi-language support

Just fork it, make your changes, and send a PR. I'm pretty responsive!

## 💬 Questions or Issues?

- **Found a bug?** [Open an issue](https://github.com/bradenweii/cf_ai_preread_generator/issues)
- **Need help?** Check out the [Cloudflare Agents docs](https://developers.cloudflare.com/agents/) or [Cloudflare Discord](https://discord.cloudflare.com)
- **Want to chat?** Feel free to reach out through GitHub issues

## 📝 License

MIT License - basically, do whatever you want with this code. Just don't blame me if your sprint meetings become too efficient! 😄

---

## 🎉 Thanks

Huge thanks to the Cloudflare team for building such an awesome platform. The [Agents framework](https://github.com/cloudflare/agents) made this project possible, and Workers makes deployment a breeze.

**Ready to never manually write a sprint pre-read again?** 🚀  

👆 [Deploy it now](https://deploy.workers.cloudflare.com/?url=https://github.com/bradenweii/cf_ai_preread_generator) or [run it locally](#try-it-out) and see the magic happen!