export interface Link {
  label: string
  href: string
}

export interface ScrollEntry {
  title: string
  subtitle?: string
  period?: string
  body: string
  bullets?: string[]
  tags?: string[]
  links?: Link[]
}

export type ScrollId = 'quests' | 'powers' | 'campaigns' | 'summon'

export interface Scroll {
  id: ScrollId
  numeral: string
  title: string
  tagline: string
  entries: ScrollEntry[]
}

export const PROFILE = {
  name: 'Abdul Rehman',
  alias: 'Pablo',
  title: 'Full-Stack Developer',
  location: 'Islamabad, Pakistan',
  summary:
    'I build complete, production-ready web applications from front to back: React and Vite interfaces, Node.js/Express APIs, Supabase and Firebase backends, LLM features on strict token budgets, and geospatial features with Leaflet and PostGIS.',
  cvUrl: `${import.meta.env.BASE_URL}cv/Pablo-CV.pdf`,
}

export const SCROLLS: Scroll[] = [
  {
    id: 'quests',
    numeral: 'I',
    title: 'Scroll of Quests',
    tagline: 'Products forged and shipped',
    entries: [
      {
        title: 'SafeApply.AI',
        subtitle: 'Hiring trust platform for job seekers, recruiters & freelancers',
        period: 'Private beta',
        body: 'A multi-role hiring platform for job seekers, recruiters, freelancers and clients, built as a TypeScript monorepo (pnpm workspaces, Turborepo) with a React 19 frontend and an Express 5 REST API on Supabase PostgreSQL.',
        bullets: [
          'Integrated LLM features (Groq, gpt-oss-120b) for CV parsing, CV-to-job matching and bullet rewriting, engineered to run within a free-tier limit of 8,000 tokens per minute through per-task token budgets and low reasoning effort',
          'Designed a line-index CV parser where the model returns only section line ranges and the text is copied verbatim in code, cutting AI output around 10x and preventing invented content; a rule-based parser takes over on rate limits, timeouts or invalid JSON',
          'Built company research reports that pull news, GitHub engineering activity and repeat job postings from third-party APIs in parallel, with per-source fallbacks so one failing source never breaks a report',
          'Implemented JWT authentication with httpOnly SameSite=Strict refresh cookies, strict role-based portal isolation enforced on both client and server, ownership checks on every mutation, and Row-Level Security',
          'Engineered distributed rate limiting for serverless using Upstash Redis with atomic Lua scripts and HMAC-hashed keys, with automatic in-memory fallback when Redis is unavailable',
          'Hardened the API with CSRF origin checks, Helmet security headers, Joi validation and secure uploads (PDF/DOCX only, size caps, zip-bomb detection measuring real inflated size)',
          'Built a freelance workflow (proposals, contracts, invoices, payments, disputes) and recruiter tools (company verification, hiring teams, public hiring record, embeddable website badge)',
          'Added an AI cost guard that logs the estimated cost of every call to a monthly ledger and automatically pauses or stops AI usage at soft and hard spending limits',
          'Deployed the frontend and API on one origin as a Vercel serverless function, with a secret-protected cron endpoint for scheduled jobs; resolved production issues including bundling failures, serverless routing and environment overrides',
          'Wrote 60 automated tests with Vitest and Supertest covering authentication, rate limiting, uploads and scheduled jobs',
          'Status: in private beta testing. Repository: private (available on request)',
        ],
        tags: [
          'TypeScript',
          'React 19',
          'Express 5',
          'Supabase',
          'PostgreSQL',
          'Groq',
          'Upstash Redis',
          'pnpm Workspaces',
          'Turborepo',
          'Vitest',
          'Supertest',
          'Vercel',
        ],
      },
      {
        title: 'Chai, Charger & Channay',
        subtitle: 'Spot & workspace discovery platform',
        body: 'A full-stack location-aware discovery platform with geospatial search and proximity filtering.',
        bullets: [
          'Engineered custom stored procedures (RPCs) for optimized database queries and real-time data retrieval',
          'Enforced user-scoped data access via authentication and Row-Level Security (RLS) policies',
          'Developed an interactive map UI featuring real-time clustering and dynamic location markers',
          'Optimized query performance using indexed geospatial columns and efficient client-side state management',
          'Deployed to production via a modern build pipeline with custom routing configuration',
          'Implemented full-text search and category filtering at the database level',
        ],
        tags: ['React', 'Vite', 'Leaflet', 'Supabase', 'PostgreSQL', 'PostGIS', 'RLS', 'Vercel'],
        links: [
          { label: 'Live', href: 'https://chai-charger-channay.vercel.app/' },
          { label: 'GitHub', href: 'https://github.com/abdulrehmanakapablo/chai-charger-channay' },
        ],
      },
      {
        title: 'Personal Finance Tracker',
        subtitle: 'Expense + task management',
        body: 'A full-stack personal finance tracker with interconnected expense and task management modules.',
        bullets: [
          'Designed a cross-module automation where marking a task complete instantly records it as an expense',
          'Architected a NoSQL data model to handle dynamic, schema-flexible financial records efficiently',
          'Implemented real-time data synchronization ensuring the UI reflects database changes without page reload',
          'Secured the application with cloud-based authentication and granular user-level data access rules',
          'Built a clean, responsive dashboard consolidating financial summaries and pending tasks in one view',
          'Deployed to production with a modern build pipeline and configured custom client-side routing',
        ],
        tags: ['React', 'Firebase', 'NoSQL', 'Firebase Auth', 'Vercel'],
        links: [
          { label: 'Live', href: 'https://personal-finance-tracker-f1se.vercel.app/' },
          { label: 'GitHub', href: 'https://github.com/abdulrehmanakapablo/personal-finance-tracker' },
        ],
      },
    ],
  },
  {
    id: 'powers',
    numeral: 'II',
    title: 'Scroll of Powers',
    tagline: 'Weapons of the craft',
    entries: [
      {
        title: 'Professional Summary',
        body: 'I build complete, production-ready web applications from front to back. My foundation covers core web technologies HTML, CSS, JavaScript and TypeScript paired with modern frameworks like React and Vite for fast, component-driven UIs. I design responsive, polished interfaces using Tailwind CSS/Bootstrap and handle client-side navigation with React Router. On the server I build REST APIs with Node.js and Express, secured with JWT authentication, rate limiting and input validation, and I integrate LLM features into real products while keeping them within strict token and cost budgets. For maps and geospatial features, I work with Leaflet and PostGIS. On the backend and database side, I use Supabase for relational data with real-time capabilities and Firebase for NoSQL, authentication, and cloud storage. I manage all my projects with Git for clean version control and use VS Code as my primary development environment, while using Linux as my primary operating system.',
      },
      {
        title: 'Languages',
        body: 'The core tongues.',
        tags: ['JavaScript (ES6+)', 'TypeScript', 'SQL', 'HTML5', 'CSS3'],
      },
      {
        title: 'Frontend',
        body: 'Fast, component-driven, responsive and accessible interfaces.',
        tags: [
          'React 19',
          'React Router DOM',
          'Vite',
          'Tailwind CSS v4',
          'Bootstrap',
          'Framer Motion',
          'Zustand',
          'TanStack Query',
          'Axios',
          'Leaflet',
          'Responsive UI',
          'Accessibility',
        ],
      },
      {
        title: 'Backend',
        body: 'REST APIs, authentication, access control and scheduled work.',
        tags: [
          'Node.js',
          'Express.js',
          'REST API Design',
          'JWT Auth (Access/Refresh Tokens, httpOnly Cookies)',
          'Role-Based Access Control',
          'Joi Validation',
          'Multer File Uploads',
          'bcrypt',
          'Cron/Scheduled Jobs',
          'Third-Party API Integration',
        ],
      },
      {
        title: 'Databases',
        body: 'Relational, NoSQL, geospatial and caching layers.',
        tags: [
          'PostgreSQL',
          'Supabase (Auth, Storage, RPCs)',
          'Row-Level Security (RLS)',
          'PostGIS',
          'MySQL',
          'Firebase',
          'NoSQL',
          'Redis (Upstash)',
        ],
      },
      {
        title: 'AI / LLM',
        body: 'LLM features in real products, kept inside token and cost budgets.',
        tags: [
          'Groq API',
          'LLM Integration',
          'Prompt Engineering',
          'Structured JSON Output and Repair',
          'Token Budgeting',
          'Rate-Limit and Fallback Handling',
          'AI Cost Control',
        ],
      },
      {
        title: 'Security',
        body: 'Hardened APIs and isolated user data.',
        tags: [
          'OWASP Practices',
          'CSRF/Origin Checks',
          'CORS',
          'Helmet Security Headers',
          'Distributed Rate Limiting',
          'Secure File Upload Validation',
          'Session and Data Isolation',
        ],
      },
      {
        title: 'Testing',
        body: 'Automated coverage for the parts that break.',
        tags: ['Vitest', 'Supertest', 'Unit Testing', 'Integration Testing', 'Test Environment Isolation'],
      },
      {
        title: 'DevOps & Tools',
        body: 'Monorepos, serverless deploys and production debugging on a Linux-first workflow.',
        tags: [
          'Git',
          'GitHub',
          'pnpm Workspaces',
          'Turborepo (Monorepo)',
          'Vercel (Serverless Functions, Rewrites, Env Config)',
          'Sentry',
          'Production Debugging',
          'VS Code',
          'Linux',
        ],
      },
    ],
  },
  {
    id: 'campaigns',
    numeral: 'III',
    title: 'Scroll of Campaigns',
    tagline: 'Battles fought for others',
    entries: [
      {
        title: 'Full-Stack Developer',
        subtitle: 'Freelance',
        period: 'Mar 2026 – Present',
        body: 'Took on small freelance projects to apply and strengthen real-world development skills.',
        bullets: [
          'Built and styled frontend interfaces using React and Tailwind CSS based on client requirements',
          'Deployed projects independently to Vercel and maintained version history using Git',
          'Handled client communication, revisions, and debugging end-to-end without team support',
          'Integrated Supabase and Firebase backends to add authentication and data persistence to client projects',
          'Converted static designs and mockups into fully functional, responsive web pages',
          'Tested and debugged cross-browser layout issues and fixed broken functionality post-deployment',
          'Documented project structure and handed off clean, readable code to clients upon completion',
        ],
        tags: ['React', 'Tailwind CSS', 'Supabase', 'Firebase', 'Vercel', 'Git'],
      },
      {
        title: 'Operations Manager',
        subtitle: 'Raasta (formerly Pinkfly)',
        period: 'Nov 2025 – Mar 2026',
        body: 'Managed end-to-end daily operations, optimizing ground logistics workflows and service execution to ensure high operational efficiency and service reliability.',
        bullets: [
          'Streamlined operational processes and resource allocation, reducing fulfillment turnaround times and cutting down overhead bottlenecks',
          'Collaborated closely with cross-functional teams to integrate ground operational feedback into core system workflows, automating tracking and improving overall service delivery',
        ],
      },
      {
        title: 'Operations Manager ',
        subtitle: 'BinKhalid Constructors',
        period: 'Apr 2024 – Oct 2025',
        body: 'Oversaw site operations and execution, managing project timelines, site supervisors, and sub-contractors to consistently deliver construction projects on schedule and within budget.',
        bullets: [
          'Optimized resource allocation and material procurement, streamlining supply chain logistics to reduce raw material wastage and prevent project downtime',
          'Negotiated vendor and subcontractor contracts, managing cost estimations and procurement pipelines to maximize profit margins without compromising structural quality',
          'Acted as the key operational liaison between clients, project architects, structural engineers, and site crews to ensure blueprint alignment and smooth milestone delivery',
        ],
      },
      {
        title: 'Software Frontend Intern',
        subtitle: 'ElAbd Technologies',
        period: 'Jan 2024 – Apr 2024',
        body: 'Developed and maintained responsive, reusable UI components using React.js and modern CSS frameworks, ensuring clean component architecture and high visual fidelity.',
        bullets: [
          'Translated Figma wireframes and mockups into functional, accessible frontend code with strict adherence to design specifications across mobile and desktop interfaces',
          'Optimized web application performance and cross-browser compatibility, resolving UI layout bugs and improving page render speeds',
        ],
        tags: ['React.js', 'CSS', 'Figma'],
      },
    ],
  },
  {
    id: 'summon',
    numeral: 'IV',
    title: 'Scroll of Summoning',
    tagline: 'Call upon the developer',
    entries: [
      {
        title: 'Summon Pablo',
        body: `${PROFILE.location} · Got a mission? Let's build it.`,
        links: [
          { label: 'Email', href: 'mailto:abdulrehmanmughal2034@gmail.com' },
          { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abdur-rehman-ab9131427' },
          { label: 'GitHub', href: 'https://github.com/abdulrehmanakapablo' },
          { label: 'Portfolio', href: 'https://abdulrehmanakapablo.github.io/my-portfolio-website./' },
          { label: 'Download CV', href: PROFILE.cvUrl },
        ],
      },
    ],
  },
]

/** Hidden intel documents found in the house. Keys match LEVEL.pickups[].ref */
export const INTEL: Record<string, { title: string; text: string }> = {
  stack: {
    title: 'Intercepted: Loadout',
    text: 'Target runs React 19 and Vite up front, Node.js/Express behind, Supabase and Firebase underneath, and Groq LLMs on an 8,000 tokens-per-minute leash. Considered armed and full-stack.',
  },
  database: {
    title: 'Intercepted: Schema Notes',
    text: 'Target writes PostGIS queries, RPCs and Row-Level Security policies, and rate-limits with atomic Lua scripts on Upstash Redis. Do not engage near a database.',
  },
  shipping: {
    title: 'Intercepted: Deployment Log',
    text: 'Target ships to production, not just localhost: serverless Vercel deploys, cron jobs, Sentry monitoring and 60 automated tests. Multiple live deployments confirmed.',
  },
}
