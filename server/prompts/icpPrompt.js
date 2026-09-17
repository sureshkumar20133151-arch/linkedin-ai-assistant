/**
 * ICP (Ideal Client Persona) Research Prompt Builder
 * Transforms user's business offer into a comprehensive international ICP report.
 */

const ICP_SYSTEM_INSTRUCTION = `You are an International Ideal Client Persona (ICP) Research Specialist.

Your job is to take a user's business offer, target market, product/service, and transformation and create a detailed, actionable international customer persona.

The goal is not merely to describe demographics. You must identify:
- Who the ideal customer is
- What they need, want, desire
- Their goals, fears, frustrations
- Their buying motivations and triggers
- Their financial/economic profile
- Where they spend time and what they consume
- Who influences them and which communities they participate in
- How to find them, approach them, qualify them, and close them

IMPORTANT RULES:
1. Never invent facts not provided by the user.
2. Clearly label assumptions as "HYPOTHESIS" or "INFERENCE."
3. Label verified user information as "FACT."
4. Do not confuse leads with qualified leads.
5. Do not promise guaranteed results.
6. Focus on buying triggers rather than generic demographics.
7. Prioritize high-intent prospects.
8. Outreach should be personalized and value-driven, never spam.
9. The ICP should be specific enough that someone could build a prospect list from it.
10. Always explain WHY the customer buys, not merely WHO they are.`;

function buildICPPrompt({ targetAudience, whatYouHelp, howYouHelp, desiredResult, countries, pricePoint, persona }) {
  const positioningStatement = `I help ${targetAudience || 'my target audience'} achieve ${desiredResult || 'their desired result'} using ${howYouHelp || 'my method'}.`;

  const userContext = `
=== USER'S BUSINESS OFFER ===
Positioning: ${positioningStatement}
Target Audience: ${targetAudience || 'Not specified'}
What I Help With: ${whatYouHelp || 'Not specified'}
How I Help: ${howYouHelp || 'Not specified'}
Desired Result / Transformation: ${desiredResult || 'Not specified'}
Target Countries/Regions: ${countries || 'International / Not specified'}
Price Point / Budget: ${pricePoint || 'Not specified'}
Additional Context / Profile: ${persona?.detailedProfile || 'Not specified'}
Services: ${persona?.services || 'Not specified'}
Skills: ${persona?.skills || 'Not specified'}
Portfolio: ${persona?.portfolioUrl || 'Not specified'}
`;

  const userContent = `
${userContext}

Generate a complete International Ideal Client Persona (ICP) Research Report with ALL sections below. Be specific, actionable, and honest about what is fact vs hypothesis.

Use this EXACT structure:

# International Ideal Client Persona Report

## 1. Core ICP
One-sentence ICP definition.

## 2. Positioning Statement
"I help [ICP] achieve [result] using [method]."

## 3. Persona Snapshot
A table with: Profession/Role, Business Type, Industry, Company Stage, Primary Problem, Primary Need, Desired Outcome, Buying Motivation, Decision Maker, Marketing Sophistication, Technology Sophistication, Geographic Scope, Preferred Acquisition Channel, Core Solution.

## 4. Customer Needs
- Functional needs
- Business needs
- Marketing needs
- Financial needs
- Emotional needs
- Obvious problem vs. Underlying problem

## 5. Wants
What the customer explicitly wants (bulleted list).

## 6. Desires
The emotional/aspirational outcome. Write the deeper desire in one powerful sentence.

## 7. Goals
### Short-Term Goals (next 1-3 months)
### Medium-Term Goals (3-12 months)
### Long-Term Goals (1-3 years)

## 8. Fears
- Business fears
- Financial fears
- Marketing fears
- Buying fears
**Biggest Fear:** "Their biggest fear is..."

## 9. Frustrations
What frustrates them about their current situation (bulleted list).

## 10. Economic Profile
- Economic buyer type
- Business purchasing power
- Likely marketing/infrastructure budget
- Economic value of solving the problem
- ROI required to justify purchase
(Note: If exact numbers unavailable, say "requires validation")

## 11. Demographics
Age, Gender, Location, Profession, Industry, Company size, Business stage, Experience, Seniority. If unknown, write "Not specified."

## 12. Geography
### Tier 1 Markets (Highest potential)
### Tier 2 Markets (Secondary opportunities)
### Tier 3 Markets (Testing opportunities)
For each: reason it's a good market, market maturity, purchasing power.

## 13. Where They Spend Time
### Online: Social networks, professional platforms, forums, communities, newsletters, podcasts, YouTube
### Offline: Conferences, trade shows, networking events, associations

## 14. Daily Routine (HYPOTHESIS)
Realistic hypothetical routine: Morning → Workday → Meetings → Marketing → Sales → Learning → Evening.
Label clearly: "Likely behavior / hypothesis"

## 15. Social Media
For each relevant platform: Why they use it, What they consume, What they post, How to find them, What content attracts them.

## 16. Potential Certifications
Relevant professional qualifications/certifications to look for. Label as "Potential certifications to investigate."

## 17. Key Influencers (HYPOTHESIS — top 5)
For each: Name, Area, Why ICP follows them, What it tells us about ICP.

## 18. Relevant Podcasts (HYPOTHESIS — top 5)
For each: Podcast, Topic, Why it matters, Prospecting opportunity.

## 19. LinkedIn Achievement Behavior
What the ICP posts on LinkedIn (Business, Professional, Product, Social Proof milestones). How to use these as prospecting signals.

## 20. Content Consumption
Content categories they consume. Answer: "What content would make this person stop scrolling?"

## 21. Events
5-8 event types/conferences they attend. For each: Event, Audience, Why ICP attends, Prospecting opportunity.

## 22. Communities
5 relevant communities (LinkedIn groups, Facebook groups, Slack, Discord, Reddit, associations). For each: Who participates, Why ICP joins, What discussions happen, How to ethically prospect.

## 23. Buying Triggers
### High-Intent Signals (strongest signs they need help NOW)
Events that indicate the customer may be ready to buy (growth, hiring, launch, funding, poor performance, competition, new leadership, agency dissatisfaction, etc.).

## 24. Prospecting Strategy
### Channel 1 — LinkedIn
### Channel 2 — Meta Ads
### Channel 3 — Google Ads
### Channel 4 — Communities
### Channel 5 — Events

## 25. Qualification Framework
Rate prospects 1-10 on:
- Fit (right industry/role/stage)
- Pain (has urgent significant problem)
- Economics (can afford, ROI makes sense)
- Authority (decision maker)
- Timing (needs solution now)

## 26. Outreach Strategy (Never generic sales pitch)
Step 1: Observation → Step 2: Relevant problem → Step 3: Insight → Step 4: Question → Step 5: Conversation
Include 3 example outreach messages.

## 27. Discovery Questions (7-10 questions)
Questions to uncover: current acquisition system, volume, quality, cost, conversion, bottleneck, desired outcome, cost of inaction, urgency.

## 28. Objections & Responses (top 5 objections)
For each: What the objection really means, How to respond, What evidence would reduce concern.

## 29. Closing Strategy
Problem → Impact → Desired Future → Gap → Solution → Proof → Next Step

## 30. Messaging
- One-line positioning
- Problem-focused positioning
- Outcome-focused positioning
- LinkedIn headline
- Cold outreach angle (short, personalized conversation opener)
- 5-7 Content pillars

## 31. Client-Finding Matrix
Table: ICP Signal | Where to Find | What to Look For | Outreach Angle

## 32. International 30/60/90-Day Strategy
### First 30 Days: Validation & List Building
### Days 31-60: Double Down & Test Channels
### Days 61-90: Scale & Automate

## 33. Assumptions & Validation
### FACT (from user input)
### INFERENCE (reasonable conclusion)
### HYPOTHESIS (should be tested)

---

## 34. Ready-to-Use DM & Outreach Scripts

This is a critical section. Write COMPLETE, COPY-PASTE READY scripts. Not templates with [brackets] — write them as if you ARE the user sending the message. Use the persona's information, services, and offer.

### Script 1 — LinkedIn Connection Request Note (300 char max)
A short, human note to send with a connection request. NOT salesy. Personalized, curious, genuine.

### Script 2 — Cold Outreach DM (First Message After Connecting)
A natural first DM after connecting. DO NOT pitch immediately. Ask a genuine question. 3-5 sentences max.

### Script 3 — Project Enquiry Reply
When a prospect asks "Can you build a website for me?" or similar. Professional, qualifying, excitement.
Include: acknowledge → ask 2 qualifying questions → mention portfolio → suggest next step.

### Script 4 — Sales / Promotion Decline (Polite Professional)
When someone sends a sales or promotion message you don't need right now.
Include: thank them → politely decline → keep the door open → professional close.

### Script 5 — Connection Thank-You Reply
When someone thanks you for accepting their connection request.
Include: warm acknowledgement → 1-line intro → genuine curiosity question.

### Script 6 — Job Seeker Reply
When someone messages asking for a job/referral/internship you can't offer.
Include: acknowledge effort → encourage genuinely → give 1 useful tip → professional close.

### Script 7 — Follow-Up Message (After No Reply — Day 3)
A non-pushy follow-up if they didn't reply to your first message. 2-3 sentences max.

### Script 8 — Follow-Up Message (After No Reply — Day 7)
A final follow-up that adds value. Share a useful insight or ask a different question. Then let it go.

### Script 9 — Sales Call Booking Message
After a good conversation, when the prospect seems interested. Ask for a call or discovery meeting.
Include: summary of their problem → value you can offer → propose a specific time → easy next step.

### Script 10 — Post-Sales-Call Thank You Message
After a discovery call. Recap, next step, social proof.
Include: thank them → recap their problem → confirm what was discussed → clear next step.

---

## 35. LinkedIn Comment Outreach Scripts
(Use these to comment on ICP's posts to start natural conversations)

### Comment Type 1 — On a Problem Post
When ICP posts about a challenge your service solves.

### Comment Type 2 — On a Milestone / Achievement Post
When ICP posts a business win or milestone.

### Comment Type 3 — On a Question Post
When ICP asks a question in their post that you can answer genuinely.

Each comment: 2-3 sentences, add real value, DO NOT mention your service in the comment.

---

### ICP in One Sentence
One highly specific sentence describing the ideal customer.

### Most Important Insight
The single most important strategic insight about how to find and sell to this ICP.

---

OUTPUT FORMAT: Use clean markdown with headers, tables, and bullet points. Be specific enough that the user could immediately build a prospect list and copy-paste the scripts directly. Never use placeholder brackets like [Name] or [X] — write real example text as if you are the user. Never be vague.
`;


  return { systemInstruction: ICP_SYSTEM_INSTRUCTION, userContent };
}

module.exports = { buildICPPrompt };
