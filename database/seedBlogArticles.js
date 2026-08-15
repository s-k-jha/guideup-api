// Standalone script — seeds real, substantive blog articles for GuideUp's
// content/SEO strategy. Idempotent: upserts by slug, safe to re-run.
// Run with: node database/seedBlogArticles.js
require('dotenv').config();
const connectDB = require('./connection');
const Category = require('../models/Category');
const Article = require('../models/Article');

const CATEGORIES = [
  { name: 'Placements', slug: 'placements', description: 'Placement preparation, company-specific strategy, and offer negotiation.' },
  { name: 'Web Development', slug: 'web-development', description: 'Full-stack and web development learning roadmaps.' },
  { name: 'Interview Preparation', slug: 'interview-preparation', description: 'DSA, system design, and technical interview preparation.' },
];

const ARTICLES = [
  {
    title: 'How to Crack a Product-Based Company in the AI Era (2026 Guide)',
    slug: 'crack-product-based-company-ai-era-2026',
    categorySlug: 'placements',
    excerpt: 'Product-based companies changed what they screen for once AI tools became normal in every codebase. Here is what actually matters now — and what stopped mattering.',
    tags: ['product based companies', 'placements', 'AI', 'interview preparation', 'software engineer jobs'],
    authorName: 'GuideUp Team',
    authorTitle: 'Career Guidance Team, GuideUp',
    seoTitle: 'How to Crack a Product-Based Company in 2026 (AI Era Guide)',
    seoDescription: 'A practical, no-fluff guide to cracking product-based company interviews in 2026 — what changed because of AI, what to prioritize, and a realistic prep plan.',
    content: `
<p>Every placement season, someone says the same thing: "product-based companies have become harder to crack." What actually changed in the last two years isn't the difficulty of the DSA round — it's <strong>what the rest of the interview is now testing for</strong>. AI coding assistants are everywhere, so companies stopped asking "can you write this function" and started asking "can you reason about a system, catch what the AI got wrong, and explain your decisions." This guide is about preparing for that shift, not the interview process from three years ago.</p>

<h2>What "product-based company" actually means</h2>
<p>A product-based company builds and owns a product used by real customers — think a company that owns its own app, platform, or SaaS tool, as opposed to a service-based company that builds software for other companies on contract. Product companies usually pay more, promote faster, and interview harder, because a bad engineering decision directly hurts a product they'll own for years, not a project that ships and gets handed off.</p>

<h2>What changed because of AI — and what didn't</h2>
<p>Two things happened at the same time, and it's easy to confuse them:</p>
<ul>
  <li><strong>What didn't change:</strong> Core data structures and algorithms, the ability to break a problem into steps, and clear communication under pressure. These are still the backbone of every technical round.</li>
  <li><strong>What changed:</strong> Companies now assume you'll use AI tools on the job, so they probe for judgment — can you tell when generated code is subtly wrong, can you justify a design choice instead of just producing one, and can you debug something you didn't write line-by-line yourself.</li>
</ul>
<p>In practice, this shows up as more "why" follow-up questions after you solve a problem, more system design even for entry-level roles, and take-home assignments that reward reasoning documented in your README over a polished UI.</p>

<h2>The four things interviewers are actually screening for</h2>
<h3>1. Problem decomposition, not memorized patterns</h3>
<p>Grinding 400 LeetCode problems without understanding the underlying pattern is increasingly obvious to interviewers — and increasingly useless, because AI tools can already produce a correct-looking solution to a memorized problem. What interviewers want to see is you thinking out loud: clarifying constraints, considering edge cases, and picking an approach before you start typing.</p>

<h3>2. The ability to explain and defend your code</h3>
<p>Expect "why did you choose this over a hash map" or "what breaks if the input isn't sorted" far more often than a few years ago. Practice narrating your reasoning out loud, not just solving problems silently.</p>

<h3>3. System design, even as a fresher</h3>
<p>Lightweight system design questions ("design a URL shortener," "how would you rate-limit an API") are showing up earlier in the pipeline than before, because they're hard to fake with a generated answer — they require you to make and justify trade-offs.</p>

<h3>4. Genuine project depth over project quantity</h3>
<p>Five shallow projects copied from tutorials read very differently to an interviewer than one project you can explain end-to-end — why you chose your stack, what broke in production, what you'd do differently. Pick one or two projects and go deep enough that you can defend every decision in them.</p>

<h2>A realistic 8-week prep plan</h2>
<ol>
  <li><strong>Weeks 1–3:</strong> Rebuild your DSA fundamentals by pattern (two pointers, sliding window, BFS/DFS, DP) rather than by company-tagged problem lists. Aim for understanding, not volume.</li>
  <li><strong>Weeks 4–5:</strong> Start lightweight system design — pick 5–6 classic problems (URL shortener, rate limiter, notification system, chat app) and practice explaining trade-offs out loud, not writing essays.</li>
  <li><strong>Week 6:</strong> Revisit your best 1–2 projects and prepare answers to "walk me through this," "what was the hardest bug," and "what would you change now."</li>
  <li><strong>Weeks 7–8:</strong> Run timed mock interviews with real feedback — this is where most self-study breaks down, because you can't easily catch your own communication gaps.</li>
</ol>

<h2>Common mistakes that quietly cost offers</h2>
<ul>
  <li>Jumping straight to code without asking clarifying questions first.</li>
  <li>Going silent while solving — interviewers can't evaluate reasoning they can't hear.</li>
  <li>Padding a resume with tutorial-copy projects that fall apart under two follow-up questions.</li>
  <li>Skipping mock interviews because "I understand the concepts" — understanding and performing under pressure are different skills.</li>
</ul>

<h2>FAQs</h2>
<h3>Do I need to know AI/ML to get hired at a product company now?</h3>
<p>Not unless you're applying for an ML-specific role. What you do need is comfort using AI coding tools responsibly and the judgment to catch when they're wrong — that's now assumed baseline, not a specialization.</p>
<h3>Is DSA still worth grinding in 2026?</h3>
<p>Yes, but grind for pattern recognition, not memorization. The bar for "can solve a medium problem cleanly under 30 minutes" hasn't dropped.</p>
<h3>How many mock interviews should I actually do?</h3>
<p>Most students underestimate this. Even 3–4 structured mock interviews with real feedback surface more fixable gaps than another 50 hours of solo practice.</p>

<p>If you want to test where you actually stand before a real interview, <a href="/sessions">book a mock interview</a> with an engineer who's been through this exact process, or <a href="/talk-to-mentor">talk to a mentor</a> for quick, specific advice on your resume or your prep plan.</p>
`,
  },
  {
    title: 'Web Development Roadmap 2026: Learning Full-Stack Development With AI',
    slug: 'web-development-roadmap-2026-ai',
    categorySlug: 'web-development',
    excerpt: "AI tools changed how fast you can build, but not what you need to understand to build correctly. Here's a realistic 2026 roadmap for learning web development without skipping the fundamentals.",
    tags: ['web development', 'roadmap', 'AI', 'full stack', 'learn to code'],
    authorName: 'GuideUp Team',
    authorTitle: 'Career Guidance Team, GuideUp',
    seoTitle: 'Web Development Roadmap 2026: Full-Stack + AI Skills',
    seoDescription: 'A step-by-step 2026 web development roadmap covering frontend, backend, and how to use AI tools without becoming dependent on them.',
    content: `
<p>Ask ten people how to learn web development in 2026 and you'll get ten different tech stacks. That's not the actual hard part. The hard part is that AI coding assistants can now generate a working app in minutes, which makes it tempting to skip understanding <em>why</em> the code works — and that gap shows up immediately the moment something breaks, or in your first technical interview. This roadmap is built around using AI as a tool that speeds you up, not a replacement for understanding the fundamentals.</p>

<h2>The roadmap, in order</h2>

<h3>1. Core web fundamentals (2–3 weeks)</h3>
<p>HTML, CSS, and JavaScript fundamentals — not frameworks yet. Specifically: the DOM, how the browser renders a page, JavaScript's event loop, and asynchronous code (promises, async/await). Skipping this and going straight to React is the single most common reason students plateau later — they can copy patterns but can't debug when something doesn't behave as expected.</p>

<h3>2. Git and the command line (a few days, but don't skip it)</h3>
<p>Version control isn't optional in any real job. Learn branching, merge conflicts, and how to write a commit message that isn't "fix bug."</p>

<h3>3. Frontend framework — pick one and go deep (3–4 weeks)</h3>
<p>React remains the most in-demand choice for Indian product and service companies in 2026, followed by Next.js for anyone targeting full-stack or SSR-heavy roles. Don't learn three frameworks shallowly — one framework, understood deeply (state management, component lifecycle, hooks, routing) is worth more than a shallow tour of five.</p>

<h3>4. Backend fundamentals (3–4 weeks)</h3>
<p>Node.js with Express is still the fastest path to a working full-stack skill set, especially since it shares a language with your frontend. Learn REST API design, authentication (JWT, sessions), and how to talk to a database — not just how to copy a CRUD boilerplate.</p>

<h3>5. Databases — one SQL, one NoSQL (1–2 weeks)</h3>
<p>Learn PostgreSQL (or MySQL) for relational data and MongoDB for document-based data. You don't need to master both deeply, but you need to understand <em>when</em> you'd choose one over the other — that's a question that comes up constantly in interviews.</p>

<h3>6. Build 2–3 real projects, not tutorials (ongoing)</h3>
<p>A to-do list app copied from a YouTube tutorial doesn't demonstrate anything to an employer — they've seen it a thousand times. Build something with a real constraint: a booking system with time-slot logic, a small e-commerce cart with real payment integration, or a dashboard that consumes a real public API. Depth beats breadth every time in an interview.</p>

<h2>Where AI tools actually help — and where they hurt you</h2>
<ul>
  <li><strong>Good use:</strong> Generating boilerplate, explaining an error message, suggesting a first-pass approach you then verify and understand.</li>
  <li><strong>Bad use:</strong> Pasting an entire feature request and shipping the output without reading it. You will not be able to explain that code in an interview, and you won't be able to fix it when it breaks in production.</li>
</ul>
<p>A good rule: if you can't explain a block of code to another person without looking at it, you don't understand it yet — regardless of who or what wrote it.</p>

<h2>What to add once the fundamentals are solid</h2>
<ul>
  <li>TypeScript — increasingly the default expectation, not a nice-to-have, at product-based companies.</li>
  <li>Basic deployment (Vercel, Render, or a simple Docker + cloud VM setup) so you understand what happens after "it works on my machine."</li>
  <li>Testing fundamentals — even just writing a handful of meaningful tests for your project signals seriousness to interviewers.</li>
</ul>

<h2>A realistic timeline</h2>
<p>Going from zero to job-ready full-stack developer, studying consistently, typically takes 4–6 months — not the "3 weeks" some bootcamp ads promise. Students who rush this timeline usually have to backfill fundamentals later, often during their first real job, which is a much more stressful time to learn them.</p>

<h2>FAQs</h2>
<h3>Should I learn MERN or a different stack?</h3>
<p>MERN (MongoDB, Express, React, Node) remains a strong, well-documented choice for beginners in India specifically because of how many mentors and resources exist around it. The concepts transfer to other stacks once you understand them.</p>
<h3>Is web development still worth learning with AI writing so much code?</h3>
<p>Yes — someone still has to specify what to build, verify it's correct, and fix it when it isn't. That's the actual job, and it requires understanding, not typing speed.</p>
<h3>Do I need a computer science degree to become a web developer?</h3>
<p>No, but you do need the underlying fundamentals a CS degree would have taught you — data structures, how the web works, basic algorithms. Self-taught developers who skip this often hit a ceiling around their second or third job switch.</p>

<p>If you're not sure where you stand on the fundamentals, <a href="/talk-to-mentor">talk to a mentor</a> for quick, specific feedback, or <a href="/sessions">book a mock interview</a> to test your readiness against real interview questions.</p>
`,
  },
  {
    title: 'DSA Roadmap for Placements: A Realistic 90-Day Study Plan',
    slug: 'dsa-roadmap-for-placements-90-day-plan',
    categorySlug: 'interview-preparation',
    excerpt: "Most DSA prep fails not because of lack of effort, but because of a random, unstructured problem list. Here's a 90-day plan organized by pattern, not by company tag.",
    tags: ['dsa', 'placements', 'coding interview', 'roadmap', 'data structures'],
    authorName: 'GuideUp Team',
    authorTitle: 'Career Guidance Team, GuideUp',
    seoTitle: 'DSA Roadmap for Placements: 90-Day Study Plan (2026)',
    seoDescription: 'A structured 90-day DSA preparation roadmap for placements, organized by pattern instead of random problem lists, with a realistic weekly breakdown.',
    content: `
<p>"I've solved 300 problems and I still freeze in interviews" is one of the most common things students say before a mock interview. It's almost never a knowledge problem — it's a structure problem. Solving problems randomly off a company-tagged list builds pattern-matching for problems you've seen before, not the ability to approach a new one. This roadmap fixes that by organizing prep around patterns, in the order interviewers actually escalate difficulty.</p>

<h2>Why "just solve more problems" doesn't work</h2>
<p>There's a difference between recognizing a problem you've solved before and knowing which technique to reach for on a problem you haven't. Volume without structure gets you the first skill, not the second — and interviews almost always test the second, because interviewers deliberately avoid exact LeetCode duplicates.</p>

<h2>The 90-day plan</h2>

<h3>Days 1–15: Arrays, Strings, and Two Pointers</h3>
<p>Start here because almost every later pattern builds on comfort with arrays. Cover: sliding window, two-pointer techniques, prefix sums, and basic string manipulation. Aim for 3–4 problems a day, but spend more time on the ones you get wrong than the ones you get right.</p>

<h3>Days 16–30: Hashing, Stacks, and Queues</h3>
<p>Hash maps solve a surprising fraction of "medium" problems once you recognize the pattern. Pair this with stack-based problems (valid parentheses variants, monotonic stacks) and queue-based problems (sliding window maximum, level-order traversal groundwork).</p>

<h3>Days 31–45: Trees and Binary Search Trees</h3>
<p>Recursion tends to click or not click around here — if it's not clicking, slow down instead of pushing forward. Cover traversals, height/depth problems, and BST-specific properties (in-order traversal gives sorted output, etc.).</p>

<h3>Days 46–60: Graphs (BFS/DFS) and Backtracking</h3>
<p>This is where most students start to feel behind — graphs feel like a big jump from trees. Budget extra time here specifically. Cover BFS/DFS traversal, connected components, topological sort, and classic backtracking problems (permutations, subsets, N-Queens style problems).</p>

<h3>Days 61–75: Dynamic Programming</h3>
<p>Don't start DP by memorizing solutions — start by identifying the recursive relation and drawing the recursion tree by hand for small inputs. Cover 1D DP (climbing stairs, house robber patterns), 2D DP (grid paths, edit distance), and knapsack-style problems.</p>

<h3>Days 76–90: Mixed practice, timed mocks, and weak-area review</h3>
<p>Stop learning new patterns. Spend this window on timed practice (aim for the actual interview time limit, usually 30–45 minutes per problem) and revisit whichever pattern from the earlier weeks felt shakiest. This is also the window to do real mock interviews — solo practice cannot simulate the pressure of explaining your thinking to another person in real time.</p>

<h2>How many problems is "enough"?</h2>
<p>There's no magic number, but as a reference point: most students who clear product-based company interviews have solved somewhere between 200–350 problems <em>with understanding</em> — not 800 solved by copying editorial solutions. Quality of understanding matters far more than the count.</p>

<h2>Common mistakes in DSA prep</h2>
<ul>
  <li>Reading the editorial the moment a problem feels hard, instead of struggling with it for at least 25–30 minutes first.</li>
  <li>Skipping revision — patterns fade if you don't revisit them 2–3 weeks after first learning them.</li>
  <li>Never practicing explaining your approach out loud before coding.</li>
  <li>Ignoring time and space complexity analysis until an interviewer asks and you're caught off guard.</li>
</ul>

<h2>FAQs</h2>
<h3>Should I learn DP before graphs, since the plan puts graphs first?</h3>
<p>This order is deliberate — DP is easier to learn once you're comfortable with recursion from trees and graphs. Learning it earlier usually means relearning it later anyway.</p>
<h3>What if I only have 30 days, not 90?</h3>
<p>Compress the plan proportionally, but don't skip the mock interview phase — it's the highest-leverage 20% of prep for most students, even under time pressure.</p>
<h3>Is competitive programming (Codeforces, etc.) necessary for placements?</h3>
<p>Not required for most product-based company interviews, though it sharpens speed and pattern recognition as a side effect. Prioritize interview-style problems first.</p>

<p>Once you've been through a pattern or two, the fastest way to find your real gaps is a live mock interview. <a href="/sessions">Book a DSA mock interview</a> with a working engineer, or <a href="/talk-to-mentor">talk to a mentor</a> if you just need a quick sanity check on your plan.</p>
`,
  },
  {
    title: 'System Design Interviews for Freshers: A Beginner-Friendly Roadmap',
    slug: 'system-design-interviews-for-freshers',
    categorySlug: 'interview-preparation',
    excerpt: "System design questions used to be reserved for senior engineers. Not anymore. Here's how to prepare for lightweight system design rounds as a fresher, without getting overwhelmed.",
    tags: ['system design', 'interview preparation', 'freshers', 'placements'],
    authorName: 'GuideUp Team',
    authorTitle: 'Career Guidance Team, GuideUp',
    seoTitle: 'System Design for Freshers: Beginner Interview Guide',
    seoDescription: 'A beginner-friendly system design roadmap for freshers — what interviewers actually expect at entry level, and how to prepare without getting overwhelmed.',
    content: `
<p>The first time a fresher hears "design a URL shortener" in an interview, the instinct is panic — system design sounds like something for engineers with five years of production experience. It isn't, at least not at the level you're actually being tested on. Entry-level system design rounds check for structured thinking and awareness of trade-offs, not the ability to design Netflix's actual infrastructure. This guide covers what's realistic to prepare as a fresher.</p>

<h2>Why freshers are getting system design questions now</h2>
<p>Two things pushed this down the seniority ladder: AI tools make it easy to generate correct-looking code, which pushed interviewers toward questions that test judgment instead — and companies increasingly want early signal on whether a candidate can think about a problem at a system level, even if they can't implement the whole thing yet.</p>

<h2>What interviewers actually expect from a fresher</h2>
<p>Not a fully scalable, fault-tolerant, globally distributed system. What they're checking for:</p>
<ul>
  <li>Can you clarify requirements before diving in (how many users, read-heavy or write-heavy, what's the core feature)?</li>
  <li>Can you propose a simple, reasonable first design?</li>
  <li>Can you identify at least one bottleneck and suggest an improvement?</li>
  <li>Can you explain your reasoning instead of just naming buzzwords (caching, load balancer, sharding) without knowing when to use them?</li>
</ul>
<p>Naming "we'll use Redis for caching" without being able to explain <em>what</em> you'd cache and why is a common way this goes wrong — buzzword-dropping without understanding is easy to spot.</p>

<h2>The fundamentals to learn first</h2>
<h3>1. Client-server basics</h3>
<p>How a request actually travels from a browser to a server and back — DNS, HTTP, what a load balancer does, and the very basic idea of horizontal vs. vertical scaling.</p>

<h3>2. Databases at a conceptual level</h3>
<p>SQL vs. NoSQL trade-offs, what an index does and why it speeds up reads, and the very basic idea of replication (multiple copies of your data for reliability and read speed).</p>

<h3>3. Caching</h3>
<p>What a cache is, why it helps, and the classic problem of cache invalidation ("there are only two hard things in computer science..."). You don't need to implement Redis — you need to explain when you'd reach for a cache and what you'd cache.</p>

<h3>4. APIs and basic architecture patterns</h3>
<p>REST fundamentals, the rough idea of a monolith vs. microservices, and message queues at a conceptual level (why you'd decouple two services with a queue instead of a direct call).</p>

<h2>A simple framework to answer any entry-level system design question</h2>
<ol>
  <li><strong>Clarify requirements</strong> — ask about scale, core features, and what's explicitly out of scope. Don't skip this; it shows structured thinking immediately.</li>
  <li><strong>Propose a basic design</strong> — client, server, database, in the simplest form that would actually work.</li>
  <li><strong>Identify the bottleneck</strong> — what breaks first as usage grows? Usually the database or a single server instance.</li>
  <li><strong>Propose one or two improvements</strong> — caching, a load balancer, splitting a service — and explain the trade-off each one introduces.</li>
</ol>
<p>That's genuinely enough structure to handle most fresher-level system design questions. You don't need to memorize twenty different architecture diagrams.</p>

<h2>Practice problems to start with</h2>
<ul>
  <li>Design a URL shortener</li>
  <li>Design a simple rate limiter</li>
  <li>Design a basic notification system</li>
  <li>Design a to-do list app that syncs across devices</li>
</ul>
<p>Notice these are all small in scope — that's intentional. Master the framework on small problems before attempting anything that requires deep infrastructure knowledge you won't have yet as a fresher.</p>

<h2>Common mistakes</h2>
<ul>
  <li>Jumping straight to "microservices and Kafka" for a problem that needs neither, just to sound advanced.</li>
  <li>Not asking clarifying questions and designing for the wrong scale entirely.</li>
  <li>Treating it as a monologue instead of a conversation — good candidates check in with the interviewer as they go.</li>
</ul>

<h2>FAQs</h2>
<h3>Do I need to know Kubernetes or Docker for a fresher system design round?</h3>
<p>No. Those are implementation details far beyond what's expected at entry level. Conceptual understanding of scaling and trade-offs matters far more.</p>
<h3>How long should I spend preparing system design as a fresher?</h3>
<p>2–3 weeks of focused study on fundamentals, alongside your DSA prep, is realistic for most entry-level interviews. It doesn't need to dominate your prep time.</p>
<h3>What's the biggest difference between fresher and senior system design rounds?</h3>
<p>Depth and scale. Seniors are expected to handle ambiguous, large-scale trade-offs from experience. Freshers are expected to show structured thinking on a small, well-scoped problem.</p>

<p>If lightweight system design still feels shaky, a short conversation can clear up more than another week of solo reading. <a href="/talk-to-mentor">Talk to a mentor</a> for quick guidance, or <a href="/sessions">book a system design mock interview</a> to practice the real format.</p>
`,
  },
];

async function main() {
  await connectDB();

  const categoryIdBySlug = {};
  for (const cat of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: cat },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryIdBySlug[cat.slug] = doc._id;
    console.log(`[category] ${doc.name} -> ${doc._id}`);
  }

  // findOneAndUpdate bypasses pre('save') hooks (readingTimeMinutes calc,
  // publishedAt-on-publish), so create/update through .save() instead.
  let upserted = 0;
  for (const art of ARTICLES) {
    const { categorySlug, ...fields } = art;
    let doc = await Article.findOne({ slug: fields.slug });

    if (doc) {
      Object.assign(doc, fields, { categoryId: categoryIdBySlug[categorySlug], status: 'published' });
    } else {
      doc = new Article({ ...fields, categoryId: categoryIdBySlug[categorySlug], status: 'published' });
    }

    await doc.save();
    upserted += 1;
    console.log(`[article] ${doc.title} -> /blog/${doc.slug} (readingTime: ${doc.readingTimeMinutes}m, publishedAt: ${doc.publishedAt?.toISOString()})`);
  }

  console.log(`\nDone. Upserted ${upserted} articles across ${CATEGORIES.length} categories.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
