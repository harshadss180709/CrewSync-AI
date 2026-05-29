// ============================================================
//  CrewSync AI — Production Seed Script
//  Run: node seed.js
//  Run (keep existing data): node seed.js --no-clear
// ============================================================
import mongoose from "mongoose";
import bcrypt   from "bcryptjs";
import dotenv   from "dotenv";
dotenv.config();

// ── Models ────────────────────────────────────────────────
import User         from "./models/User.js";
import Project      from "./models/Project.js";
import Task         from "./models/Task.js";
import Payment      from "./models/Payment.js";
import Contribution from "./models/Contribution.js";
import Notification from "./models/Notification.js";
import Message      from "./models/Message.js";
import Review       from "./models/Review.js";
import Analytics    from "./models/Analytics.js";

// ── Helpers ───────────────────────────────────────────────
const pick   = (arr)        => arr[Math.floor(Math.random() * arr.length)];
const rand   = (min, max)   => Math.floor(Math.random() * (max - min + 1)) + min;
const randF  = (min, max)   => parseFloat((Math.random() * (max - min) + min).toFixed(1));
const days   = (n)          => new Date(Date.now() + n * 86_400_000);
const ago    = (n)          => new Date(Date.now() - n * 86_400_000);
const hash   = (pw)         => bcrypt.hash(pw, 12);
const sample = (arr, n)     => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

// ── Password ──────────────────────────────────────────────
const DEMO_PASS = await hash("Demo@123");

// ─────────────────────────────────────────────────────────
//  1. USER DATA
// ─────────────────────────────────────────────────────────

const FREELANCER_DATA = [
  // ── Design ──────────────────────────────────────────
  {
    name: "Aanya Sharma",
    email: "aanya@crewsync.ai",
    bio: "UI/UX designer with 5 years of experience crafting clean, accessible interfaces for SaaS products and mobile apps. Figma expert.",
    location: "Bangalore, India",
    skills: ["UI/UX Design","Figma","Graphic Design","Prototyping","Design Systems","Adobe XD"],
    specialtyTags: ["SaaS","Mobile","B2B"],
    hourlyRate: 45,
    availability: "available",
    averageRating: 4.9,
    reliabilityScore: 97,
    totalEarnings: 42000,
    completedProjects: 18,
    social: { linkedin: "linkedin.com/in/aanya-sharma", behance: "behance.net/aanya" },
  },
  {
    name: "Marcus Rivera",
    email: "marcus@crewsync.ai",
    bio: "Motion graphics and video editor with a background in advertising. Specialist in brand films, explainer videos, and social media content.",
    location: "Miami, USA",
    skills: ["Video Editing","Motion Graphics","After Effects","Premiere Pro","3D Animation","Color Grading"],
    specialtyTags: ["Brand Films","Social Media","Advertising"],
    hourlyRate: 75,
    availability: "available",
    averageRating: 4.8,
    reliabilityScore: 94,
    totalEarnings: 87000,
    completedProjects: 31,
    social: { linkedin: "linkedin.com/in/marcusrivera" },
  },
  {
    name: "Priya Nair",
    email: "priya@crewsync.ai",
    bio: "Full-stack developer specialising in React and Node.js. Built 20+ production SaaS apps. Passionate about clean code and fast deployments.",
    location: "Kochi, India",
    skills: ["Web Development","React","Node.js","TypeScript","MongoDB","REST APIs","AWS"],
    specialtyTags: ["SaaS","Startups","Full-stack"],
    hourlyRate: 60,
    availability: "available",
    averageRating: 4.7,
    reliabilityScore: 96,
    totalEarnings: 63000,
    completedProjects: 24,
    social: { github: "github.com/priyanair", linkedin: "linkedin.com/in/priyanair" },
  },
  {
    name: "Liam O'Connor",
    email: "liam@crewsync.ai",
    bio: "Music producer and audio engineer with credits on Spotify-charting tracks. Specialises in indie pop, hip-hop beats, and podcast audio production.",
    location: "Dublin, Ireland",
    skills: ["Music Production","Audio Engineering","Mixing","Mastering","Sound Design","Podcast Editing"],
    specialtyTags: ["Indie","Hip-Hop","Podcast"],
    hourlyRate: 80,
    availability: "available",
    averageRating: 4.9,
    reliabilityScore: 99,
    totalEarnings: 95000,
    completedProjects: 42,
    social: { linkedin: "linkedin.com/in/liamoconnor", spotify: "open.spotify.com/artist/liam" },
  },
  {
    name: "Zara Ahmed",
    email: "zara@crewsync.ai",
    bio: "Brand identity designer and illustrator. Created logos and visual systems for 50+ startups globally. Adobe Illustrator wizard.",
    location: "Dubai, UAE",
    skills: ["Graphic Design","Logo Design","Brand Identity","Illustration","Adobe Illustrator","Print Design"],
    specialtyTags: ["Startups","Brand","Illustration"],
    hourlyRate: 55,
    availability: "available",
    averageRating: 4.8,
    reliabilityScore: 95,
    totalEarnings: 51000,
    completedProjects: 27,
    social: { behance: "behance.net/zaraahmed", instagram: "instagram.com/zaradesigns" },
  },
  {
    name: "Ethan Park",
    email: "ethan@crewsync.ai",
    bio: "3D animator and VFX artist. Expert in Blender and Cinema 4D. Created product animations for e-commerce brands and game studios.",
    location: "Seoul, South Korea",
    skills: ["3D Animation","Blender","Cinema 4D","VFX","Product Visualisation","Motion Graphics"],
    specialtyTags: ["E-commerce","Games","Product"],
    hourlyRate: 70,
    availability: "busy",
    averageRating: 4.6,
    reliabilityScore: 88,
    totalEarnings: 74000,
    completedProjects: 22,
    social: { linkedin: "linkedin.com/in/ethanpark3d" },
  },
  {
    name: "Olivia Chen",
    email: "olivia@crewsync.ai",
    bio: "Content strategist and copywriter. SEO-optimised content for B2B SaaS companies. 7 years at leading digital marketing agencies.",
    location: "Toronto, Canada",
    skills: ["Copywriting","Content Creation","SEO","Content Strategy","Email Marketing","Blog Writing"],
    specialtyTags: ["B2B SaaS","SEO","Thought Leadership"],
    hourlyRate: 50,
    availability: "available",
    averageRating: 4.7,
    reliabilityScore: 93,
    totalEarnings: 39000,
    completedProjects: 35,
    social: { linkedin: "linkedin.com/in/oliviachen", github: "github.com/oliviachen" },
  },
  {
    name: "Raj Patel",
    email: "raj@crewsync.ai",
    bio: "Mobile developer with 6 years building iOS and Android apps. 3M+ combined app downloads. Flutter and React Native specialist.",
    location: "Ahmedabad, India",
    skills: ["Mobile Development","Flutter","React Native","iOS","Android","Firebase","UX Design"],
    specialtyTags: ["Consumer Apps","Fintech","Health"],
    hourlyRate: 65,
    availability: "available",
    averageRating: 4.8,
    reliabilityScore: 97,
    totalEarnings: 82000,
    completedProjects: 29,
    social: { github: "github.com/rajpatel", linkedin: "linkedin.com/in/rajpatel" },
  },
  {
    name: "Sofia Mendes",
    email: "sofia@crewsync.ai",
    bio: "Photographer and photo editor. Commercial, product, and lifestyle photographer. Available for on-site shoots across Europe.",
    location: "Lisbon, Portugal",
    skills: ["Photography","Photo Editing","Lightroom","Photoshop","Product Photography","Lifestyle Photography"],
    specialtyTags: ["E-commerce","Fashion","Lifestyle"],
    hourlyRate: 90,
    availability: "available",
    averageRating: 4.9,
    reliabilityScore: 98,
    totalEarnings: 67000,
    completedProjects: 19,
    social: { instagram: "instagram.com/sofiamendesphoto", behance: "behance.net/sofiamendes" },
  },
  {
    name: "Jake Williams",
    email: "jake@crewsync.ai",
    bio: "DevOps engineer and cloud architect. AWS certified. Reduced infrastructure costs by 40% for multiple startups through smart cloud design.",
    location: "Austin, USA",
    skills: ["DevOps","AWS","Docker","Kubernetes","CI/CD","Terraform","Python"],
    specialtyTags: ["Cloud","Infrastructure","Startups"],
    hourlyRate: 110,
    availability: "available",
    averageRating: 4.8,
    reliabilityScore: 96,
    totalEarnings: 138000,
    completedProjects: 15,
    social: { github: "github.com/jakewilliams", linkedin: "linkedin.com/in/jakewilliams" },
  },
  {
    name: "Mei Lin",
    email: "mei@crewsync.ai",
    bio: "UI animator and micro-interaction designer. Brings interfaces to life with purposeful animations. Framer Motion and GSAP expert.",
    location: "Singapore",
    skills: ["UI/UX Design","Animation","Framer Motion","GSAP","Figma","CSS","React"],
    specialtyTags: ["Web Apps","Micro-interactions","Consumer"],
    hourlyRate: 55,
    availability: "available",
    averageRating: 4.7,
    reliabilityScore: 91,
    totalEarnings: 44000,
    completedProjects: 21,
    social: { dribbble: "dribbble.com/meilin", linkedin: "linkedin.com/in/meilin" },
  },
  {
    name: "Daniel Osei",
    email: "daniel@crewsync.ai",
    bio: "Data scientist and ML engineer. Built recommendation engines, fraud detection models, and NLP pipelines for fintech and e-commerce.",
    location: "Accra, Ghana",
    skills: ["Data Science","Machine Learning","Python","TensorFlow","NLP","Data Visualisation","SQL"],
    specialtyTags: ["Fintech","E-commerce","AI/ML"],
    hourlyRate: 85,
    availability: "available",
    averageRating: 4.6,
    reliabilityScore: 90,
    totalEarnings: 91000,
    completedProjects: 16,
    social: { github: "github.com/danielosei", linkedin: "linkedin.com/in/danielosei" },
  },
  {
    name: "Isabella Torres",
    email: "isabella@crewsync.ai",
    bio: "Social media strategist and content creator. Grew multiple brand accounts to 100K+ followers. Expert in Instagram Reels and TikTok strategy.",
    location: "Barcelona, Spain",
    skills: ["Social Media","Content Creation","Video Editing","Copywriting","Photography","Influencer Marketing"],
    specialtyTags: ["DTC Brands","Fashion","Lifestyle"],
    hourlyRate: 40,
    availability: "available",
    averageRating: 4.5,
    reliabilityScore: 87,
    totalEarnings: 28000,
    completedProjects: 32,
    social: { instagram: "instagram.com/isabellatorres", linkedin: "linkedin.com/in/isabellatorres" },
  },
  {
    name: "Noah Kim",
    email: "noah@crewsync.ai",
    bio: "Blockchain developer and smart contract auditor. Solidity expert. Worked on DeFi protocols with $50M+ TVL. Rust for Solana.",
    location: "Seoul, South Korea",
    skills: ["Blockchain","Solidity","Web3","Smart Contracts","React","Node.js","Rust"],
    specialtyTags: ["DeFi","NFT","Web3"],
    hourlyRate: 120,
    availability: "busy",
    averageRating: 4.7,
    reliabilityScore: 89,
    totalEarnings: 163000,
    completedProjects: 12,
    social: { github: "github.com/noahkim", linkedin: "linkedin.com/in/noahkim" },
  },
  {
    name: "Ava Johnson",
    email: "ava@crewsync.ai",
    bio: "Podcast producer, editor, and show runner. Produced 500+ episodes across comedy, business, and educational formats. Audacity & Descript expert.",
    location: "Nashville, USA",
    skills: ["Podcast Editing","Audio Engineering","Sound Design","Copywriting","Content Strategy","Descript"],
    specialtyTags: ["Comedy","Business","Education"],
    hourlyRate: 60,
    availability: "available",
    averageRating: 4.8,
    reliabilityScore: 95,
    totalEarnings: 47000,
    completedProjects: 38,
    social: { linkedin: "linkedin.com/in/avajohnson" },
  },
  {
    name: "Carlos Mendoza",
    email: "carlos@crewsync.ai",
    bio: "Full-stack Python developer specialising in Django, FastAPI, and data pipelines. Extensive experience in fintech and logistics platforms.",
    location: "Mexico City, Mexico",
    skills: ["Web Development","Python","Django","FastAPI","PostgreSQL","Redis","Docker"],
    specialtyTags: ["Fintech","Logistics","B2B"],
    hourlyRate: 55,
    availability: "available",
    averageRating: 4.6,
    reliabilityScore: 92,
    totalEarnings: 58000,
    completedProjects: 20,
    social: { github: "github.com/carlosmendoza", linkedin: "linkedin.com/in/carlosmendoza" },
  },
  {
    name: "Yuki Tanaka",
    email: "yuki@crewsync.ai",
    bio: "Game developer specialising in Unity and Unreal Engine. Created 5 published mobile games with 500K+ combined downloads.",
    location: "Tokyo, Japan",
    skills: ["Game Development","Unity","Unreal Engine","C#","3D Animation","UI/UX Design"],
    specialtyTags: ["Mobile Games","Casual","Hyper-casual"],
    hourlyRate: 70,
    availability: "available",
    averageRating: 4.7,
    reliabilityScore: 94,
    totalEarnings: 72000,
    completedProjects: 14,
    social: { github: "github.com/yukitanaka", linkedin: "linkedin.com/in/yukitanaka" },
  },
  {
    name: "Grace Okonkwo",
    email: "grace@crewsync.ai",
    bio: "Voiceover artist and video producer. Native English speaker with 8 years of professional VO work for ads, eLearning, and audiobooks.",
    location: "Lagos, Nigeria",
    skills: ["Voice Over","Video Editing","Content Creation","Podcast Editing","Copywriting","Sound Design"],
    specialtyTags: ["eLearning","Advertising","Audiobooks"],
    hourlyRate: 35,
    availability: "available",
    averageRating: 4.9,
    reliabilityScore: 98,
    totalEarnings: 33000,
    completedProjects: 45,
    social: { linkedin: "linkedin.com/in/graceokonkwo" },
  },
  {
    name: "Hassan Al-Rashid",
    email: "hassan@crewsync.ai",
    bio: "Cybersecurity consultant and penetration tester. CEH & OSCP certified. Performed 100+ security audits for banks, hospitals, and SaaS companies.",
    location: "Riyadh, Saudi Arabia",
    skills: ["Cybersecurity","Penetration Testing","DevOps","Python","Network Security","Docker","AWS"],
    specialtyTags: ["FinTech","Healthcare","SaaS"],
    hourlyRate: 130,
    availability: "available",
    averageRating: 4.8,
    reliabilityScore: 97,
    totalEarnings: 174000,
    completedProjects: 11,
    social: { linkedin: "linkedin.com/in/hassanalrashid" },
  },
  {
    name: "Nina Petrov",
    email: "nina@crewsync.ai",
    bio: "UX researcher and product designer. Specialises in user interviews, usability testing, and converting insights into actionable design decisions.",
    location: "Berlin, Germany",
    skills: ["UX Research","UI/UX Design","Figma","Prototyping","Usability Testing","Design Systems","Copywriting"],
    specialtyTags: ["Enterprise","Health Tech","EdTech"],
    hourlyRate: 65,
    availability: "available",
    averageRating: 4.7,
    reliabilityScore: 93,
    totalEarnings: 55000,
    completedProjects: 17,
    social: { linkedin: "linkedin.com/in/ninapetrov", dribbble: "dribbble.com/ninapetrov" },
  },
];

const CLIENT_DATA = [
  { name: "Harshad Sathish",    email: "client@crewsync.ai",          company: "Personal",               bio: "Demo client account for CrewSync AI." },
  { name: "Sarah Mitchell",     email: "sarah@lumenlabs.io",           company: "Lumen Labs",             bio: "Co-founder at Lumen Labs, building the next-gen analytics platform." },
  { name: "James Thornton",     email: "james@novawavemusic.com",      company: "NovaWave Music",         bio: "CEO at NovaWave Music — indie label for emerging artists." },
  { name: "Priya Kapoor",       email: "priya.k@stacksurge.co",        company: "StackSurge",             bio: "Head of Product at StackSurge — developer tooling startup." },
  { name: "Michael Adeyemi",    email: "michael@brightmindacademy.org",company: "BrightMind Academy",     bio: "Founder of BrightMind Academy — online education for African students." },
  { name: "Elena Vasquez",      email: "elena@pulsedtc.com",           company: "Pulse DTC",              bio: "Director of Marketing at Pulse — DTC skincare brand." },
  { name: "Tom Nguyen",         email: "tom@zenithgames.studio",       company: "Zenith Games Studio",    bio: "Lead producer at Zenith Games — indie mobile game studio." },
  { name: "Amara Okafor",       email: "amara@greenleafventures.vc",   company: "Greenleaf Ventures",     bio: "Partner at Greenleaf Ventures — portfolio company support." },
];

// ─────────────────────────────────────────────────────────
//  2. PROJECT DATA
// ─────────────────────────────────────────────────────────

const buildProjects = (clients, freelancers) => {
  const c  = clients;
  const fl = freelancers;

  // Helper: find freelancers by primary skill
  const bySkill = (skill, n = 2) =>
    fl.filter(f => f.skills.some(s => s.toLowerCase().includes(skill.toLowerCase())))
      .sort(() => 0.5 - Math.random())
      .slice(0, n)
      .map(f => f._id);

  return [
    // ── OPEN PROJECTS (10) ───────────────────────────────
    {
      title: "Full SaaS Dashboard UI Redesign",
      description: "Our analytics platform dashboard was built 3 years ago and looks dated. We need a complete redesign in Figma, followed by React implementation. Must support dark mode, responsive layouts, and accessibility (WCAG 2.1 AA). Deliverables include design system components, full Figma prototype, and coded React components using Tailwind CSS.",
      client: c[1]._id, projectType: "web_development",
      requiredSkills: ["UI/UX Design","Figma","React","Design Systems","TypeScript"],
      budget: 8500, timeline: "6 weeks", dueDate: days(42),
      status: "open", priority: "high", mood: "modern", style: "minimalist",
      isPublic: true, tags: ["redesign","dashboard","SaaS","React"],
      freelancers: bySkill("UI/UX", 0),
    },
    {
      title: "Brand Identity for FinTech Startup",
      description: "We're a fintech startup launching next quarter and need a full brand identity package. This includes logo design (3 concepts, 2 revision rounds), colour palette, typography guide, brand usage guidelines, and business card / letterhead templates. The brand should feel trustworthy, modern, and approachable — not stuffy like traditional banking.",
      client: c[7]._id, projectType: "graphic_design",
      requiredSkills: ["Logo Design","Brand Identity","Adobe Illustrator","Graphic Design"],
      budget: 3200, timeline: "3 weeks", dueDate: days(21),
      status: "open", priority: "high", mood: "professional", style: "clean",
      isPublic: true, tags: ["branding","fintech","logo"],
      freelancers: bySkill("Logo", 0),
    },
    {
      title: "Album Production — 8-Track Indie Pop EP",
      description: "I'm a singer-songwriter looking for a producer to co-write and produce an 8-track indie pop EP. Reference artists: Phoebe Bridgers, Clairo, Beabadoobee. I have rough voice memos for all 8 songs. Looking for someone who can produce from scratch — all instruments, mixing, and final mastering included. Stem files required at delivery.",
      client: c[2]._id, projectType: "music_production",
      requiredSkills: ["Music Production","Mixing","Mastering","Sound Design"],
      budget: 6000, timeline: "8 weeks", dueDate: days(56),
      status: "open", priority: "medium", mood: "indie", style: "alternative",
      isPublic: true, tags: ["music","indie","EP","production"],
      freelancers: bySkill("Music Production", 0),
    },
    {
      title: "React Native Fitness Tracking App",
      description: "Build a cross-platform fitness tracking app in React Native. Core features: workout logging with custom exercises, progress charts, rest timer, Apple Health & Google Fit integration, push notifications for workout reminders. The UI designs are ready in Figma. Backend will be Firebase. Need clean, testable code with 80% unit test coverage.",
      client: c[3]._id, projectType: "web_development",
      requiredSkills: ["React Native","Mobile Development","Firebase","iOS","Android"],
      budget: 12000, timeline: "10 weeks", dueDate: days(70),
      status: "open", priority: "critical", mood: "energetic", style: "bold",
      isPublic: true, tags: ["mobile","fitness","React Native","Firebase"],
      freelancers: bySkill("React Native", 0),
    },
    {
      title: "Explainer Video — AI Product Launch",
      description: "We're launching an AI writing tool and need a 90-second animated explainer video. Style: clean 2D animation, similar to Notion's marketing videos. Must include voiceover (we can provide the script), background music, and subtitles. Deliverables: final MP4 in 1080p, social media cut (30s), and all source files.",
      client: c[0]._id, projectType: "video_editing",
      requiredSkills: ["Motion Graphics","After Effects","Video Editing","Animation"],
      budget: 4500, timeline: "4 weeks", dueDate: days(28),
      status: "open", priority: "high", mood: "professional", style: "clean",
      isPublic: true, tags: ["explainer","video","motion","AI"],
      freelancers: bySkill("Motion Graphics", 0),
    },
    {
      title: "E-commerce Product Photography (50 SKUs)",
      description: "We need professional product photography for 50 skincare SKUs — white background shots (3 angles each) plus 1 lifestyle shot per product. Products will be shipped to photographer. Must be delivered as 3000×3000px PNGs, edited and clipped. We also need 5 hero banner composites for the website.",
      client: c[5]._id, projectType: "photography",
      requiredSkills: ["Photography","Photo Editing","Lightroom","Photoshop","Product Photography"],
      budget: 5500, timeline: "3 weeks", dueDate: days(21),
      status: "open", priority: "high", mood: "clean", style: "minimal",
      isPublic: true, tags: ["photography","e-commerce","product","skincare"],
      freelancers: bySkill("Photography", 0),
    },
    {
      title: "Data Pipeline & Analytics Dashboard (Python + AWS)",
      description: "Build a real-time data pipeline that ingests events from our app (Node.js backend), processes them using AWS Lambda, stores in Redshift, and visualises in a custom React dashboard. Must handle 10K events/second at peak. Include monitoring with CloudWatch and automated alerts. Full documentation required.",
      client: c[1]._id, projectType: "web_development",
      requiredSkills: ["Python","AWS","Data Science","Docker","PostgreSQL","React"],
      budget: 18000, timeline: "12 weeks", dueDate: days(84),
      status: "open", priority: "critical", mood: "technical", style: "precise",
      isPublic: false, tags: ["data","AWS","pipeline","analytics"],
      freelancers: bySkill("Data Science", 0),
    },
    {
      title: "Weekly Social Media Content Package (3 months)",
      description: "We need 3 months of pre-planned social media content for Instagram, LinkedIn, and TikTok. That's 12 posts/week across 3 platforms. Deliverables: content calendar, caption copy, 5–7 custom graphics per week, 4 short-form videos per month. Brand guidelines will be provided. Tone: friendly, educational, conversion-focused.",
      client: c[5]._id, projectType: "content_creation",
      requiredSkills: ["Social Media","Content Creation","Copywriting","Graphic Design","Video Editing"],
      budget: 4800, timeline: "12 weeks", dueDate: days(84),
      status: "open", priority: "medium", mood: "vibrant", style: "playful",
      isPublic: true, tags: ["social","content","Instagram","TikTok"],
      freelancers: bySkill("Social Media", 0),
    },
    {
      title: "Mobile Game — Casual Puzzle (Unity)",
      description: "Develop a casual puzzle game for iOS and Android using Unity. Concept: colour-matching puzzle with 100 levels, power-ups, and an energy system. Art direction: bright, flat design (assets provided). Features: level editor, in-app purchases, rewarded ads, leaderboards via GameCenter/PlayGames. We need a fully polished app store submission-ready build.",
      client: c[6]._id, projectType: "animation",
      requiredSkills: ["Game Development","Unity","C#","Mobile Development","UI/UX Design"],
      budget: 14000, timeline: "14 weeks", dueDate: days(98),
      status: "open", priority: "high", mood: "fun", style: "vibrant",
      isPublic: true, tags: ["game","Unity","mobile","casual"],
      freelancers: bySkill("Unity", 0),
    },
    {
      title: "Podcast Production — 12-Episode Business Series",
      description: "Produce a 12-episode interview-style business podcast from raw audio recordings. Each episode is 45–60 minutes. Deliverables: noise removal, levelling, intro/outro music integration, chapter markers, audiogram clips for social media, and distribution-ready MP3s. We need the first 3 episodes ready within 2 weeks.",
      client: c[4]._id, projectType: "podcast",
      requiredSkills: ["Podcast Editing","Audio Engineering","Sound Design","Content Strategy"],
      budget: 3600, timeline: "8 weeks", dueDate: days(56),
      status: "open", priority: "high", mood: "professional", style: "clean",
      isPublic: true, tags: ["podcast","audio","business","series"],
      freelancers: bySkill("Podcast", 0),
    },

    // ── IN PROGRESS PROJECTS (12) ────────────────────────
    {
      title: "Corporate Website Redesign — StackSurge",
      description: "Complete marketing website redesign for StackSurge. 8 pages including landing, product, pricing, about, blog, and docs. Built in Next.js 14 with Tailwind. Must achieve 95+ Lighthouse score, integrate HubSpot forms, and connect to CMS (Contentful). Design system to be created in Figma first.",
      client: c[3]._id, projectType: "web_development",
      requiredSkills: ["Web Development","React","UI/UX Design","Figma","TypeScript"],
      budget: 11000, timeline: "8 weeks", dueDate: days(14),
      status: "in_progress", priority: "high", mood: "professional", style: "corporate",
      isPublic: false, tags: ["website","Next.js","redesign","SaaS"],
      freelancers: [
        ...bySkill("UI/UX Design", 1),
        ...bySkill("Web Development", 1),
      ],
    },
    {
      title: "Hip-Hop Single Production + Music Video",
      description: "Produce a commercially-ready hip-hop single and direct a 4-minute music video. The track is written; need full production, mixing, and mastering. Video shoot will be in our studio in Dublin. We need a storyboard, 1-day shoot, full edit, colour grade, and YouTube/Instagram optimised cuts.",
      client: c[2]._id, projectType: "music_production",
      requiredSkills: ["Music Production","Video Editing","Mixing","Mastering","Color Grading"],
      budget: 9500, timeline: "6 weeks", dueDate: days(21),
      status: "in_progress", priority: "high", mood: "urban", style: "cinematic",
      isPublic: false, tags: ["music","hip-hop","video","production"],
      freelancers: [
        ...bySkill("Music Production", 1),
        ...bySkill("Video Editing", 1),
      ],
    },
    {
      title: "Customer Dashboard — React + Django REST",
      description: "Build a customer-facing dashboard for our logistics platform. Shows shipment tracking, invoice history, and dispute management. Frontend: React + Recharts. Backend: Django REST API. Auth: JWT. Deploy to AWS EC2 with RDS. Estimated 15 API endpoints, 8 UI views, and 3 user permission levels.",
      client: c[7]._id, projectType: "web_development",
      requiredSkills: ["Web Development","React","Python","Django","AWS","REST APIs"],
      budget: 16500, timeline: "10 weeks", dueDate: days(28),
      status: "in_progress", priority: "critical", mood: "enterprise", style: "functional",
      isPublic: false, tags: ["dashboard","React","Django","logistics"],
      freelancers: [
        ...bySkill("Web Development", 1),
        ...bySkill("Python", 1),
      ],
    },
    {
      title: "eLearning Course Production — 10 Modules",
      description: "Produce a 10-module online course for high school students on financial literacy. Each module: 8–12 minutes of video content, slides, quiz, and downloadable worksheet. We have subject matter experts who will present; need professional editing, motion graphics for data viz, and a custom intro/outro animation.",
      client: c[4]._id, projectType: "video_editing",
      requiredSkills: ["Video Editing","Motion Graphics","After Effects","Content Creation"],
      budget: 7200, timeline: "8 weeks", dueDate: days(21),
      status: "in_progress", priority: "high", mood: "educational", style: "engaging",
      isPublic: false, tags: ["eLearning","video","education","financial"],
      freelancers: [
        ...bySkill("Video Editing", 1),
        ...bySkill("Motion Graphics", 1),
      ],
    },
    {
      title: "Brand Refresh — NovaWave Music Visual Identity",
      description: "Refresh NovaWave Music's brand identity for 2025. Existing logo stays; we need updated colour palette, typography, social media templates (Instagram, YouTube thumbnail templates, story frames), merchandise designs (3 t-shirt designs, 2 hoodie designs), and updated brand guidelines document.",
      client: c[2]._id, projectType: "graphic_design",
      requiredSkills: ["Graphic Design","Brand Identity","Adobe Illustrator","Social Media","Photography"],
      budget: 4200, timeline: "4 weeks", dueDate: days(10),
      status: "in_progress", priority: "medium", mood: "creative", style: "bold",
      isPublic: false, tags: ["branding","music","social","merchandise"],
      freelancers: [
        ...bySkill("Brand Identity", 1),
        ...bySkill("Social Media", 1),
      ],
    },
    {
      title: "AI Chatbot Integration — Customer Support",
      description: "Integrate an AI-powered customer support chatbot into our SaaS platform. Use OpenAI GPT-4 with a custom knowledge base (trained on our docs). Features: intent classification, handoff to human agents, conversation history, analytics dashboard, and multi-language support (EN, ES, FR). REST API + React widget.",
      client: c[3]._id, projectType: "web_development",
      requiredSkills: ["Web Development","Python","Machine Learning","React","REST APIs","Node.js"],
      budget: 13500, timeline: "10 weeks", dueDate: days(35),
      status: "in_progress", priority: "high", mood: "technical", style: "clean",
      isPublic: false, tags: ["AI","chatbot","customer support","GPT"],
      freelancers: [
        ...bySkill("Machine Learning", 1),
        ...bySkill("Web Development", 1),
      ],
    },
    {
      title: "3D Product Animation — Skincare Bottle Reveal",
      description: "Create photorealistic 3D product reveal animations for 3 skincare products. Each animation: 15-second reveal sequence (360° spin + particle effects + text titles). Style: premium, luxurious, similar to high-end perfume ads. Deliver in 4K H.264, with and without background, for web and social media use.",
      client: c[5]._id, projectType: "animation",
      requiredSkills: ["3D Animation","Blender","Motion Graphics","Cinema 4D","Product Visualisation"],
      budget: 6800, timeline: "5 weeks", dueDate: days(14),
      status: "in_progress", priority: "high", mood: "premium", style: "luxurious",
      isPublic: false, tags: ["3D","animation","product","skincare"],
      freelancers: bySkill("3D Animation", 1),
    },
    {
      title: "Security Audit & Penetration Testing — FinTech API",
      description: "Conduct a comprehensive security audit and penetration test of our fintech REST API. Scope includes OWASP Top 10, API security checklist, authentication flows, data encryption at rest/transit, GDPR compliance review, and infrastructure security (AWS). Deliverable: detailed report with severity ratings and remediation steps.",
      client: c[7]._id, projectType: "web_development",
      requiredSkills: ["Cybersecurity","Penetration Testing","Python","AWS","DevOps"],
      budget: 9000, timeline: "4 weeks", dueDate: days(14),
      status: "in_progress", priority: "critical", mood: "technical", style: "precise",
      isPublic: false, tags: ["security","pentest","API","fintech"],
      freelancers: bySkill("Cybersecurity", 1),
    },
    {
      title: "Mobile App UX Research & Redesign",
      description: "Conduct moderated usability research (8 sessions) for our iOS health app, then redesign the onboarding and core tracking flows based on findings. Deliverables: research report with key insights, affinity mapping, annotated journey maps, updated Figma prototypes, and a component library update.",
      client: c[3]._id, projectType: "graphic_design",
      requiredSkills: ["UX Research","UI/UX Design","Figma","Prototyping","Mobile Development"],
      budget: 7500, timeline: "7 weeks", dueDate: days(21),
      status: "in_progress", priority: "high", mood: "empathetic", style: "user-centred",
      isPublic: false, tags: ["UX","research","mobile","health"],
      freelancers: bySkill("UX Research", 1),
    },
    {
      title: "Podcast Network Launch — 3 Shows Setup",
      description: "Launch a podcast network with 3 shows simultaneously: a weekly interview show, a daily news briefing, and a bi-weekly storytelling format. Deliverables: 3 custom intro/outro jingles, episode templates, podcast artwork (all sizes), RSS feed setup on 5 platforms, and 3 pilot episodes fully produced for each show.",
      client: c[4]._id, projectType: "podcast",
      requiredSkills: ["Podcast Editing","Music Production","Sound Design","Content Strategy","Graphic Design"],
      budget: 8400, timeline: "6 weeks", dueDate: days(28),
      status: "in_progress", priority: "medium", mood: "energetic", style: "professional",
      isPublic: false, tags: ["podcast","network","audio","launch"],
      freelancers: [
        ...bySkill("Podcast Editing", 1),
        ...bySkill("Graphic Design", 1),
      ],
    },
    {
      title: "NFT Collection — 5000-Piece Generative Art",
      description: "Create a 5000-piece generative PFP NFT collection. Art direction: cyberpunk anime characters with 8 trait categories, 60+ traits per category. Deliverables: base character designs, all trait assets in PNG with transparency, rarity distribution design, final generated collection using Hashlips or equivalent, and metadata JSON for IPFS.",
      client: c[7]._id, projectType: "graphic_design",
      requiredSkills: ["Illustration","Graphic Design","Blockchain","Web3","Adobe Illustrator"],
      budget: 22000, timeline: "12 weeks", dueDate: days(56),
      status: "in_progress", priority: "high", mood: "cyberpunk", style: "anime",
      isPublic: false, tags: ["NFT","generative","Web3","illustration"],
      freelancers: [
        ...bySkill("Illustration", 1),
        ...bySkill("Blockchain", 1),
      ],
    },
    {
      title: "YouTube Channel Launch — Tech Review Brand",
      description: "Launch a tech review YouTube channel from scratch. Deliverables: channel branding (logo, banner, thumbnails template), 3 fully produced pilot videos (10–15 mins each) with B-roll, graphics, lower thirds, and professional audio. Plus SEO strategy document and 3-month content calendar.",
      client: c[0]._id, projectType: "video_editing",
      requiredSkills: ["Video Editing","Graphic Design","Content Strategy","Copywriting","Motion Graphics"],
      budget: 5200, timeline: "6 weeks", dueDate: days(21),
      status: "in_progress", priority: "medium", mood: "energetic", style: "modern",
      isPublic: false, tags: ["YouTube","tech","video","channel"],
      freelancers: [
        ...bySkill("Video Editing", 1),
        ...bySkill("Graphic Design", 1),
      ],
    },

    // ── REVIEW (3) ───────────────────────────────────────
    {
      title: "E-commerce Store Development — Shopify Plus",
      description: "Build a custom Shopify Plus storefront for a premium furniture brand. Custom liquid theme, subscription bundles, 3D product viewer integration, AR try-before-you-buy feature, and custom checkout with B2B portal. Must integrate with NetSuite ERP and Klaviyo email. 50+ product pages with metafields.",
      client: c[5]._id, projectType: "web_development",
      requiredSkills: ["Web Development","UI/UX Design","Graphic Design","Figma"],
      budget: 25000, timeline: "14 weeks", dueDate: ago(7),
      status: "review", priority: "high", mood: "premium", style: "elegant",
      completionPercentage: 92,
      isPublic: false, tags: ["Shopify","e-commerce","furniture","AR"],
      freelancers: [
        ...bySkill("Web Development", 1),
        ...bySkill("UI/UX Design", 1),
      ],
    },
    {
      title: "Ambient Music EP — 6 Tracks for Meditation App",
      description: "Compose and produce a 6-track ambient/meditation music EP for integration into a wellness app. Each track 5–8 minutes. Requirements: 432 Hz tuning, no sudden sounds, therapeutic frequencies, binaural elements. Delivered as 24-bit WAV, 16-bit WAV, and MP3. Royalty-free exclusive licence.",
      client: c[4]._id, projectType: "music_production",
      requiredSkills: ["Music Production","Mixing","Mastering","Sound Design"],
      budget: 4800, timeline: "5 weeks", dueDate: ago(5),
      status: "review", priority: "medium", mood: "ambient", style: "meditative",
      completionPercentage: 95,
      isPublic: false, tags: ["ambient","music","meditation","app"],
      freelancers: bySkill("Music Production", 1),
    },
    {
      title: "Motion Brand Package — Startup Animation Kit",
      description: "Create a full motion brand package for a B2B SaaS startup: animated logo reveal (5 variants), lower thirds, transitions, slide deck animations (50 custom Keynote/PowerPoint slides), and 5 social media animation templates in After Effects and Lottie format for web use.",
      client: c[1]._id, projectType: "animation",
      requiredSkills: ["Motion Graphics","After Effects","Animation","Graphic Design","UI/UX Design"],
      budget: 5600, timeline: "5 weeks", dueDate: ago(3),
      status: "review", priority: "high", mood: "corporate", style: "sleek",
      completionPercentage: 98,
      isPublic: false, tags: ["motion","branding","After Effects","Lottie"],
      freelancers: [
        ...bySkill("Motion Graphics", 1),
        ...bySkill("Graphic Design", 1),
      ],
    },

    // ── COMPLETED (5) ────────────────────────────────────
    {
      title: "Logo & Brand Identity — Greenleaf Ventures",
      description: "Full brand identity for a pan-African venture capital firm. Logo (wordmark + symbol), business card, letterhead, pitch deck template, and brand guidelines (45-page PDF). The brand needed to feel trustworthy, innovative, and distinctly African — we used earth tones with a modern geometric symbol.",
      client: c[7]._id, projectType: "graphic_design",
      requiredSkills: ["Logo Design","Brand Identity","Graphic Design","Adobe Illustrator"],
      budget: 4500, timeline: "4 weeks", dueDate: ago(30),
      status: "completed", priority: "high", mood: "trustworthy", style: "modern",
      completionPercentage: 100,
      totalPaid: 4500,
      isPublic: true, tags: ["branding","logo","VC","Africa"],
      freelancers: bySkill("Logo Design", 1),
    },
    {
      title: "Content Marketing Strategy + 60-Article Roadmap",
      description: "Develop a 6-month content marketing strategy and produce 60 SEO-optimised articles for an EdTech SaaS. Deliverables: competitor analysis, keyword research (500 terms), editorial calendar, 60 articles (800–1500 words each), on-page SEO optimisation, and monthly performance tracking setup.",
      client: c[4]._id, projectType: "content_creation",
      requiredSkills: ["Copywriting","Content Strategy","SEO","Content Creation"],
      budget: 9000, timeline: "16 weeks", dueDate: ago(45),
      status: "completed", priority: "high", mood: "educational", style: "authoritative",
      completionPercentage: 100,
      totalPaid: 9000,
      isPublic: false, tags: ["content","SEO","strategy","EdTech"],
      freelancers: bySkill("Copywriting", 1),
    },
    {
      title: "Cloud Infrastructure Migration to AWS",
      description: "Migrate a 5-year-old monolithic application from bare metal servers to AWS ECS with Aurora RDS. Zero-downtime migration with blue-green deployment. Set up CI/CD pipeline (GitHub Actions), monitoring (Datadog), auto-scaling, backup strategy, and disaster recovery runbooks.",
      client: c[3]._id, projectType: "web_development",
      requiredSkills: ["AWS","DevOps","Docker","Terraform","CI/CD","Python"],
      budget: 21000, timeline: "10 weeks", dueDate: ago(60),
      status: "completed", priority: "critical", mood: "technical", style: "precise",
      completionPercentage: 100,
      totalPaid: 21000,
      isPublic: false, tags: ["AWS","DevOps","migration","cloud"],
      freelancers: bySkill("DevOps", 1),
    },
    {
      title: "Music Video Production — Summer Single",
      description: "Directed and produced a 3-minute music video for an indie pop single. Concept: sun-drenched road trip narrative. 2-day shoot on location in Lisbon. Includes cinematic colour grade, lyric graphic inserts, and both 16:9 YouTube and 9:16 Instagram vertical versions.",
      client: c[2]._id, projectType: "video_editing",
      requiredSkills: ["Video Editing","Photography","Color Grading","Motion Graphics"],
      budget: 7800, timeline: "5 weeks", dueDate: ago(90),
      status: "completed", priority: "high", mood: "summer", style: "cinematic",
      completionPercentage: 100,
      totalPaid: 7800,
      isPublic: true, tags: ["music video","production","indie","Lisbon"],
      freelancers: bySkill("Video Editing", 1),
    },
    {
      title: "B2B SaaS Landing Page — Conversion Optimised",
      description: "Design and build a high-converting SaaS landing page with A/B testing built in. Includes hero, features, social proof, pricing, FAQ, and CTA sections. Built in Next.js + Tailwind. Integrated with PostHog analytics, Intercom chat, and Stripe checkout. Optimised for 95+ Lighthouse score.",
      client: c[1]._id, projectType: "web_development",
      requiredSkills: ["Web Development","UI/UX Design","Figma","React","TypeScript"],
      budget: 6500, timeline: "4 weeks", dueDate: ago(21),
      status: "completed", priority: "high", mood: "conversion", style: "minimal",
      completionPercentage: 100,
      totalPaid: 6500,
      isPublic: true, tags: ["landing page","SaaS","Next.js","conversion"],
      freelancers: [
        ...bySkill("Web Development", 1),
        ...bySkill("UI/UX Design", 1),
      ],
    },
  ];
};

// ─────────────────────────────────────────────────────────
//  3. TASK TEMPLATES PER PROJECT TYPE
// ─────────────────────────────────────────────────────────

const TASK_TEMPLATES = {
  web_development: [
    { title: "Finalise technical requirements document",  priority: "high",     category: "research",     hrs: 4 },
    { title: "Create wireframes in Figma",                priority: "high",     category: "design",       hrs: 8 },
    { title: "Set up project repo and CI/CD pipeline",    priority: "medium",   category: "development",  hrs: 3 },
    { title: "Build core layout and navigation",          priority: "high",     category: "development",  hrs: 10 },
    { title: "Implement authentication flows",            priority: "critical", category: "development",  hrs: 8 },
    { title: "Develop main feature components",           priority: "high",     category: "development",  hrs: 16 },
    { title: "Write unit and integration tests",          priority: "medium",   category: "review",       hrs: 6 },
    { title: "Cross-browser / device testing",            priority: "medium",   category: "review",       hrs: 4 },
    { title: "Performance optimisation (Lighthouse)",     priority: "low",      category: "development",  hrs: 3 },
    { title: "Deploy to staging and UAT sign-off",        priority: "high",     category: "review",       hrs: 2 },
  ],
  music_production: [
    { title: "Reference track analysis and brief review", priority: "medium",   category: "research",     hrs: 2 },
    { title: "Create initial beat / arrangement sketch",  priority: "high",     category: "audio",        hrs: 6 },
    { title: "Record lead vocals (Session 1)",            priority: "high",     category: "audio",        hrs: 4 },
    { title: "Record harmonies and backing vocals",       priority: "medium",   category: "audio",        hrs: 3 },
    { title: "Produce instrumental layers",               priority: "high",     category: "audio",        hrs: 8 },
    { title: "Rough mix for client feedback",             priority: "high",     category: "review",       hrs: 4 },
    { title: "Revision round 1 — implement feedback",     priority: "medium",   category: "audio",        hrs: 3 },
    { title: "Final mix",                                 priority: "high",     category: "audio",        hrs: 5 },
    { title: "Mastering",                                 priority: "high",     category: "audio",        hrs: 3 },
    { title: "Deliver stems + final files",               priority: "medium",   category: "other",        hrs: 1 },
  ],
  video_editing: [
    { title: "Review all raw footage",                    priority: "high",     category: "review",       hrs: 4 },
    { title: "Build rough cut assembly",                  priority: "high",     category: "video",        hrs: 6 },
    { title: "Client review: rough cut feedback",         priority: "medium",   category: "review",       hrs: 2 },
    { title: "Fine cut — pacing and story",               priority: "high",     category: "video",        hrs: 5 },
    { title: "Motion graphics and title cards",           priority: "medium",   category: "design",       hrs: 6 },
    { title: "Audio mix and sound design",                priority: "high",     category: "audio",        hrs: 4 },
    { title: "Colour grade",                              priority: "high",     category: "video",        hrs: 4 },
    { title: "Review and revision round",                 priority: "medium",   category: "review",       hrs: 3 },
    { title: "Export deliverables (all formats)",         priority: "high",     category: "video",        hrs: 2 },
    { title: "Upload and share via delivery link",        priority: "low",      category: "other",        hrs: 1 },
  ],
  graphic_design: [
    { title: "Competitor and inspiration research",       priority: "medium",   category: "research",     hrs: 3 },
    { title: "Create mood board (3 directions)",          priority: "high",     category: "design",       hrs: 4 },
    { title: "Initial concept sketches",                  priority: "high",     category: "design",       hrs: 5 },
    { title: "Client presentation — concept A",           priority: "high",     category: "review",       hrs: 2 },
    { title: "Refinements based on feedback",             priority: "medium",   category: "design",       hrs: 4 },
    { title: "Develop chosen direction to full fidelity", priority: "high",     category: "design",       hrs: 8 },
    { title: "Create all required format exports",        priority: "medium",   category: "design",       hrs: 3 },
    { title: "Brand guidelines document",                 priority: "high",     category: "writing",      hrs: 5 },
    { title: "Final client review and sign-off",          priority: "medium",   category: "review",       hrs: 2 },
    { title: "Final file delivery (print + digital)",     priority: "low",      category: "other",        hrs: 1 },
  ],
  content_creation: [
    { title: "Keyword research and topic mapping",        priority: "high",     category: "research",     hrs: 6 },
    { title: "Build content calendar (3 months)",         priority: "high",     category: "writing",      hrs: 4 },
    { title: "Write month 1 content batch (20 pieces)",   priority: "high",     category: "writing",      hrs: 20 },
    { title: "Client review and feedback round 1",        priority: "medium",   category: "review",       hrs: 2 },
    { title: "Revise and publish batch 1",                priority: "medium",   category: "writing",      hrs: 5 },
    { title: "Write month 2 content batch",               priority: "high",     category: "writing",      hrs: 20 },
    { title: "SEO on-page optimisation pass",             priority: "medium",   category: "research",     hrs: 4 },
    { title: "Create supporting graphics",                priority: "low",      category: "design",       hrs: 6 },
    { title: "Performance report — month 1",              priority: "medium",   category: "research",     hrs: 2 },
    { title: "Strategy review and content plan adjustment",priority: "medium",  category: "review",       hrs: 2 },
  ],
  podcast: [
    { title: "Receive and log raw audio files",           priority: "high",     category: "audio",        hrs: 1 },
    { title: "Noise removal and cleanup",                 priority: "high",     category: "audio",        hrs: 3 },
    { title: "Structural edit (remove filler/gaps)",      priority: "high",     category: "audio",        hrs: 4 },
    { title: "Add intro and outro music",                 priority: "medium",   category: "audio",        hrs: 1 },
    { title: "Level and compress audio",                  priority: "high",     category: "audio",        hrs: 2 },
    { title: "Create audiogram clip for social",          priority: "medium",   category: "audio",        hrs: 2 },
    { title: "Client review listen-through",              priority: "medium",   category: "review",       hrs: 1 },
    { title: "Apply revisions",                           priority: "low",      category: "audio",        hrs: 1 },
    { title: "Export final MP3 + WAV",                    priority: "high",     category: "audio",        hrs: 1 },
    { title: "Upload to RSS feed",                        priority: "medium",   category: "other",        hrs: 0.5 },
  ],
  animation: [
    { title: "Script and storyboard review",              priority: "high",     category: "review",       hrs: 3 },
    { title: "Style frames and art direction approval",   priority: "high",     category: "design",       hrs: 5 },
    { title: "Asset creation (characters, backgrounds)",  priority: "high",     category: "design",       hrs: 12 },
    { title: "Animatic — timing and pacing test",         priority: "medium",   category: "video",        hrs: 4 },
    { title: "Rough animation pass",                      priority: "high",     category: "video",        hrs: 10 },
    { title: "Client review — rough animation",           priority: "medium",   category: "review",       hrs: 2 },
    { title: "Polish pass — final animation",             priority: "high",     category: "video",        hrs: 8 },
    { title: "Sound design and music sync",               priority: "high",     category: "audio",        hrs: 4 },
    { title: "Colour correction and final render",        priority: "medium",   category: "video",        hrs: 3 },
    { title: "Export deliverables (4K + social cuts)",    priority: "high",     category: "other",        hrs: 2 },
  ],
  photography: [
    { title: "Brief review and shot list creation",       priority: "high",     category: "research",     hrs: 2 },
    { title: "Studio setup and equipment check",          priority: "medium",   category: "other",        hrs: 3 },
    { title: "Products 1–15: white background shoot",     priority: "high",     category: "other",        hrs: 6 },
    { title: "Products 16–30: white background shoot",    priority: "high",     category: "other",        hrs: 6 },
    { title: "Products 31–50: white background shoot",    priority: "high",     category: "other",        hrs: 8 },
    { title: "Lifestyle hero shots (5 hero composites)",  priority: "high",     category: "design",       hrs: 4 },
    { title: "Culling and selects",                       priority: "medium",   category: "review",       hrs: 3 },
    { title: "Editing pass — exposure, WB, colour",       priority: "high",     category: "design",       hrs: 8 },
    { title: "Background removal and clipping paths",     priority: "high",     category: "design",       hrs: 6 },
    { title: "Client review and final delivery",          priority: "medium",   category: "review",       hrs: 2 },
  ],
};

// ─────────────────────────────────────────────────────────
//  4. MESSAGES
// ─────────────────────────────────────────────────────────

const MESSAGE_THREADS = {
  web_development: [
    "Hey team, just pushed the initial setup to the repo. Branch is feature/dashboard-v2 — please review and let me know if there are any issues with the stack.",
    "Reviewed the wireframes — they look solid. One suggestion: the nav bar on mobile could collapse into a hamburger at 768px instead of 1024px. Happy to discuss on a call?",
    "Great call! I'll update the breakpoints. Also, client just confirmed they want a dark mode toggle — adding that to the scope now.",
    "I've completed the auth flows. Login, register, forgot-password, and JWT refresh all working. Tests passing at 94% coverage.",
    "Colour palette is looking 🔥. Really loving the indigo accent on the charts. Good progress everyone — we're on track.",
    "Just deployed to staging: https://staging-[project].vercel.app — client is reviewing today.",
    "Client gave the thumbs up on staging! Minor feedback: the table pagination could be more prominent. I'll fix that tomorrow.",
    "Fixed pagination and also improved the filter UX on the data table. Looks much cleaner now. Lighthouse score: 97/97/100/100 🎉",
  ],
  music_production: [
    "Hey! Just listened to your voice memos — really love the vibe. This reminds me of early Clairo. I'll start on the production sketch today.",
    "Sending over 3 rough beat ideas — tell me which direction feels right to you. Track 1 is more minimal, track 3 has more texture.",
    "LOVE track 3! That chord progression in the chorus is exactly what I was imagining. Can we make the drums a bit more punchy?",
    "Done! I also added a second guitar layer in the pre-chorus — listen to how it builds. Rough vocals recorded, stems attached.",
    "The vocal take is beautiful. I've added harmonies on the chorus — listen to the 3-part stack. Let me know if you want them more subtle.",
    "This is stunning. Mixing now — sending the rough mix tomorrow morning.",
    "Rough mix is in the shared folder. It's sounding very close to done. Please give it a listen on headphones and your phone speakers.",
    "The mix sounds incredible on all devices. Ready to send to mastering?",
  ],
  video_editing: [
    "Just finished reviewing all the raw footage. Solid stuff — the b-roll from day 2 is especially beautiful.",
    "Rough cut is done. It's sitting at 4:23 — think we can tighten the middle section by about 30 seconds. Sharing via Frame.io.",
    "Great start! The pacing feels good. Just a few notes: the talking head at 1:42 runs a bit long, and let's add a bit more music energy during the transition at 2:15.",
    "Applied your notes. Also tried a different song for the outro — I think it hits harder. Check it out and let me know.",
    "The new outro track is perfect! Motion graphics are looking clean too. Just awaiting the client logo files for the end card.",
    "Logo files received. Fine cut is done. Sending to colour grade now.",
    "Colour grade is done. Really happy with the cinematic look. Audio mix is tight. Exporting final files now.",
    "All files delivered: YouTube 4K, Instagram 9:16 1080p, and TikTok optimised. 🎬 Great project!",
  ],
  default: [
    "Hi team! Really excited to start working on this project together.",
    "Thanks for having us on board. I've reviewed the brief and have a few initial thoughts — shall we jump on a quick call?",
    "Great call earlier! I've captured everything in the notes doc. Let's aim to have the first deliverable ready by end of week.",
    "First draft is in progress — looking good so far. Will share a preview tomorrow.",
    "Shared a draft in the project folder. Let me know what you think!",
    "Really happy with how this is shaping up. Client should be pleased.",
    "Round 2 revisions complete — this is looking polished.",
    "Almost done! Just final touches and we're ready to deliver.",
  ],
};

const getMessages = (type) => MESSAGE_THREADS[type] || MESSAGE_THREADS.default;

// ─────────────────────────────────────────────────────────
//  5. REVIEW COMMENTS
// ─────────────────────────────────────────────────────────

const REVIEW_COMMENTS = [
  { title: "Outstanding work — exceeded expectations", comment: "The quality of work delivered was exceptional. Communication was clear throughout, and the freelancer proactively flagged a potential scope issue early which saved us a week. Would hire again without hesitation.", rating: 5 },
  { title: "Professional and reliable throughout", comment: "Great experience. The freelancer delivered on time, the quality matched the brief exactly, and they were very responsive to feedback. The final deliverable was polished and production-ready.", rating: 5 },
  { title: "Excellent communicator, quality output", comment: "What set this freelancer apart was how well they communicated. They kept us updated daily and the final product was exactly what we envisioned. Highly recommend for any serious project.", rating: 5 },
  { title: "Strong skills, minor delays", comment: "The quality of the final delivery was excellent. There was a small delay in the middle of the project but the freelancer communicated well and made up the time. Overall a very positive experience.", rating: 4 },
  { title: "Very talented — impressive final result", comment: "Phenomenal creative work. They took the brief and elevated it beyond what we imagined. The brand identity feels premium and distinctive. Already getting compliments from our investors.", rating: 5 },
  { title: "Solid work, would hire again", comment: "Delivered everything in the brief, good quality, and communicated well. Had one round of revisions which they handled quickly. Happy with the result.", rating: 4 },
  { title: "Top-tier professionalism and quality", comment: "One of the best freelancers I've worked with on CrewSync. Every deliverable was flawless. I've already referred two colleagues to them.", rating: 5 },
  { title: "Good work with room to improve on speed", comment: "The end result is great. There were a couple of moments mid-project where turnaround time was slower than expected, but the quality makes up for it. 4 stars.", rating: 4 },
];

// ─────────────────────────────────────────────────────────
//  MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────

if (process.argv.includes("--help")) {
  console.log(`
CrewSync AI — Seed Script
─────────────────────────
Usage:
  node seed.js              Clear all data and reseed everything
  node seed.js --no-clear   Add seed data without clearing existing records
  node seed.js --help       Show this help message

What gets seeded:
  • 1 admin  + 8 client + 20 freelancer accounts  (password: Demo@123)
  • 30 projects  (10 open · 12 in_progress · 3 review · 5 completed)
  • 300 tasks     distributed across all projects
  • 20 payments   (escrow + released)
  • 32 contributions  linking freelancers to projects
  • ~112 notifications
  • ~180 messages     (realistic team conversations per project)
  • 6 reviews         (for completed projects)
  • 28 analytics      records (monthly, per user)

Demo login credentials (all passwords: Demo@123):
  admin@crewsync.ai        Admin panel
  client@crewsync.ai       Client dashboard
  freelancer@crewsync.ai   Freelancer dashboard
`);
  process.exit(0);
}

async function seed() {
  console.log("\n🌱 CrewSync AI — Seed Script Starting...\n");

  // ── Connect ──────────────────────────────────────────
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected\n");

  // ── Clear existing data ──────────────────────────────
  const noClear = process.argv.includes("--no-clear");
  if (!noClear) {
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Payment.deleteMany({}),
      Contribution.deleteMany({}),
      Notification.deleteMany({}),
      Message.deleteMany({}),
      Review.deleteMany({}),
      Analytics.deleteMany({}),
    ]);
    console.log("   Done.\n");
  }

  // ── 1. Create Admin ───────────────────────────────────
  console.log("👤 Creating admin...");
  const admin = await User.create({
    name:     "CrewSync Admin",
    email:    "admin@crewsync.ai",
    password: DEMO_PASS,
    role:     "admin",
    isVerified: true,
    bio:      "Platform administrator for CrewSync AI.",
    skills:   [],
    averageRating:    5,
    reliabilityScore: 100,
  });

  // ── 2. Create Clients ─────────────────────────────────
  console.log("🏢 Creating clients...");
  const clients = await User.insertMany(
    CLIENT_DATA.map(c => ({
      ...c,
      password:    DEMO_PASS,
      role:        "client",
      isVerified:  true,
      skills:      [],
      averageRating:    0,
      reliabilityScore: 100,
    }))
  );

  // ── 3. Create Freelancers ─────────────────────────────
  console.log("💼 Creating 20 freelancers...");
  const freelancers = await User.insertMany(
    FREELANCER_DATA.map(f => ({
      ...f,
      password:   DEMO_PASS,
      role:       "freelancer",
      isVerified: true,
    }))
  );

  // Friendly lookup: freelancer@crewsync.ai is the first freelancer
  // Update it so the demo login works
  await User.findByIdAndUpdate(freelancers[0]._id, { email: "freelancer@crewsync.ai" });
  // Keep client@crewsync.ai pointing to clients[0] — already set above

  // ── 4. Create Projects ────────────────────────────────
  console.log("📁 Creating 30 projects...");
  const projectDefs  = buildProjects(clients, freelancers);
  const createdProjects = await Project.insertMany(projectDefs);

  // ── 5. Create Tasks ───────────────────────────────────
  console.log("✅ Creating tasks...");
  const allTasks = [];

  for (const project of createdProjects) {
    const templates = TASK_TEMPLATES[project.projectType] || TASK_TEMPLATES.web_development;
    const assignees  = project.freelancers?.length ? project.freelancers : [];

    // Determine how many tasks are done based on project status
    const doneCount = project.status === "completed" ? templates.length
                    : project.status === "review"    ? Math.ceil(templates.length * 0.9)
                    : project.status === "in_progress" ? rand(3, 7)
                    : 0;

    templates.forEach((t, i) => {
      const isDone   = i < doneCount;
      const isActive = !isDone && i === doneCount;

      allTasks.push({
        project:    project._id,
        title:      t.title,
        priority:   t.priority,
        category:   t.category,
        estimatedHours: t.hrs,
        loggedHours:    isDone ? t.hrs : (isActive ? Math.round(t.hrs * 0.5) : 0),
        status:     isDone   ? "completed"
                  : isActive ? "in_progress"
                  : "todo",
        assignedTo: assignees.length ? [pick(assignees)] : [],
        createdBy:  project.client,
        dueDate:    project.dueDate,
        completedAt: isDone ? ago(rand(1, 20)) : undefined,
        position: i,
      });
    });
  }

  await Task.insertMany(allTasks);

  // ── 6. Create Contributions ───────────────────────────
  console.log("📊 Creating contributions...");
  const contributionDocs = [];

  for (const project of createdProjects) {
    if (!project.freelancers?.length) continue;

    const totalFreelancers = project.freelancers.length;
    project.freelancers.forEach((flId, idx) => {
      const baseScore = rand(40, 95);
      const isPrimary = idx === 0;

      contributionDocs.push({
        project:    project._id,
        freelancer: flId,
        contributionScore:      baseScore + (isPrimary ? 10 : 0),
        tasksCompleted:         rand(2, 8),
        filesUploaded:          rand(1, 5),
        messagesCount:          rand(5, 20),
        hoursLogged:            rand(10, 60),
        qualityScore:           rand(75, 99),
        timelinessScore:        rand(70, 98),
        collaborationScore:     rand(80, 99),
        estimatedPayment:       Math.round(project.budget / totalFreelancers * 0.9),
        actualPayment:          ["completed"].includes(project.status)
                                  ? Math.round(project.budget / totalFreelancers * 0.9)
                                  : 0,
        paymentReleased: project.status === "completed",
        joinedAt:    ago(rand(1, 60)),
        lastActiveAt:ago(rand(0, 7)),
      });
    });
  }

  await Contribution.insertMany(contributionDocs);

  // ── 7. Create Payments ────────────────────────────────
  console.log("💳 Creating payments...");
  const paymentDocs = [];

  for (const project of createdProjects) {
    if (!["completed","in_progress","review"].includes(project.status)) continue;
    if (!project.freelancers?.length) continue;

    const contributions = contributionDocs.filter(c => c.project.toString() === project._id.toString());
    const total = contributions.reduce((s, c) => s + c.contributionScore, 0);
    const splits = contributions.map(c => ({
      freelancer:        c.freelancer,
      contributionBased: true,
      percentage:        total > 0 ? parseFloat(((c.contributionScore / total) * 100).toFixed(2)) : 0,
      amount:            total > 0 ? parseFloat(((c.contributionScore / total) * project.budget * 0.5).toFixed(2)) : 0,
      released:          project.status === "completed",
      releasedAt:        project.status === "completed" ? ago(rand(1, 10)) : undefined,
    }));

    const paymentAmount = project.status === "completed"
      ? project.budget
      : Math.round(project.budget * 0.5);

    paymentDocs.push({
      project:       project._id,
      payer:         project.client,
      amount:        paymentAmount,
      currency:      "USD",
      type:          "milestone",
      status:        project.status === "completed" ? "released" : "in_escrow",
      paymentMethod: pick(["razorpay","card","razorpay","card"]),
      transactionId: `TXN-${Math.random().toString(36).slice(2,10).toUpperCase()}`,
      splits,
      notes:         `Milestone payment for "${project.title}"`,
      releasedAt:    project.status === "completed" ? ago(rand(1, 10)) : undefined,
      approvalHistory: [
        { action: "submitted", performedBy: project.client, timestamp: ago(rand(15, 45)) },
        ...(project.status !== "open" ? [{ action: "approved", performedBy: project.client, timestamp: ago(rand(5, 14)) }] : []),
        ...(project.status === "completed" ? [{ action: "released", performedBy: project.client, timestamp: ago(rand(1, 5)) }] : []),
      ],
    });
  }

  await Payment.insertMany(paymentDocs);

  // ── 8. Create Messages ────────────────────────────────
  console.log("💬 Creating messages...");
  const messageDocs = [];

  for (const project of createdProjects) {
    if (!project.freelancers?.length) continue;

    const allParticipants = [project.client, ...project.freelancers];
    const threadMessages  = getMessages(project.projectType);

    threadMessages.forEach((content, i) => {
      const sender = i === 0 ? project.client : pick(project.freelancers);
      messageDocs.push({
        project: project._id,
        sender,
        type:    "text",
        content,
        createdAt: ago(rand(1, 30) - i * 0.5),
        readBy: allParticipants
          .filter(() => Math.random() > 0.2)
          .map(u => ({ user: u, readAt: ago(rand(0, 2)) })),
      });
    });

    // Add a system message for project start
    messageDocs.push({
      project:  project._id,
      sender:   admin._id,
      type:     "system",
      content:  `Project "${project.title}" has been created. Team has been notified.`,
      createdAt: ago(rand(30, 60)),
    });
  }

  await Message.insertMany(messageDocs);

  // ── 9. Create Notifications ───────────────────────────
  console.log("🔔 Creating notifications...");
  const notifDocs = [];

  for (const project of createdProjects) {
    // Project invite for each freelancer
    for (const flId of (project.freelancers || [])) {
      notifDocs.push({
        recipient: flId,
        sender:    project.client,
        type:      "project_invite",
        title:     "You've been invited to a project",
        message:   `You've been invited to join "${project.title}". Check the project for details.`,
        link:      `/projects/${project._id}`,
        isRead:    Math.random() > 0.3,
        priority:  "high",
      });
    }

    // Payment notification
    if (["in_progress","review","completed"].includes(project.status) && project.freelancers?.length) {
      notifDocs.push({
        recipient: pick(project.freelancers),
        sender:    project.client,
        type:      "payment_received",
        title:     "Payment placed in escrow",
        message:   `A payment of $${Math.round(project.budget * 0.5).toLocaleString()} has been placed in escrow for "${project.title}".`,
        link:      `/payments`,
        isRead:    Math.random() > 0.4,
        priority:  "high",
      });
    }

    // Deadline reminder for in-progress projects
    if (project.status === "in_progress") {
      notifDocs.push({
        recipient: project.client,
        sender:    admin._id,
        type:      "deadline_reminder",
        title:     "Project deadline approaching",
        message:   `"${project.title}" is due in ${Math.max(1, Math.round((new Date(project.dueDate) - Date.now()) / 86_400_000))} days.`,
        link:      `/projects/${project._id}`,
        isRead:    false,
        priority:  "normal",
      });
    }

    // AI suggestion
    if (Math.random() > 0.6 && project.freelancers?.length) {
      notifDocs.push({
        recipient: project.client,
        sender:    admin._id,
        type:      "ai_suggestion",
        title:     "AI Team Allocation Ready",
        message:   `Gemini AI has analysed your project requirements for "${project.title}" and has 3 freelancer recommendations ready.`,
        link:      `/freelancers`,
        isRead:    Math.random() > 0.5,
        priority:  "normal",
      });
    }

    // Milestone completed
    if (["review","completed"].includes(project.status)) {
      notifDocs.push({
        recipient: project.client,
        sender:    project.freelancers?.[0] || admin._id,
        type:      "milestone_completed",
        title:     "Milestone marked complete",
        message:   `A milestone on "${project.title}" has been marked complete and is awaiting your approval.`,
        link:      `/projects/${project._id}`,
        isRead:    project.status === "completed",
        priority:  "high",
      });
    }
  }

  // Global welcome notification for all users
  const allUsers = [admin, ...clients, ...freelancers];
  allUsers.forEach(u => {
    notifDocs.push({
      recipient: u._id,
      sender:    admin._id,
      type:      "system",
      title:     "Welcome to CrewSync AI 🎉",
      message:   "Your account is set up and ready. Explore projects, discover freelancers, and let AI match your team.",
      link:      "/dashboard",
      isRead:    Math.random() > 0.5,
      priority:  "normal",
    });
  });

  await Notification.insertMany(notifDocs);

  // ── 10. Create Reviews ────────────────────────────────
  console.log("⭐ Creating reviews...");
  const reviewDocs = [];
  const completedProjects = createdProjects.filter(p => p.status === "completed");

  for (const project of completedProjects) {
    if (!project.freelancers?.length) continue;

    for (const flId of project.freelancers) {
      const r = pick(REVIEW_COMMENTS);
      const m = rand(3, 5);
      reviewDocs.push({
        project:  project._id,
        reviewer: project.client,
        reviewee: flId,
        rating:   r.rating,
        title:    r.title,
        comment:  r.comment,
        metrics: {
          communication:  rand(m, 5),
          quality:        rand(m, 5),
          timeliness:     rand(Math.max(3, m - 1), 5),
          professionalism:rand(m, 5),
        },
        isPublic:    true,
        helpfulVotes: rand(0, 12),
      });
    }
  }

  await Review.insertMany(reviewDocs);

  // ── 11. Create Analytics ──────────────────────────────
  console.log("📈 Creating analytics records...");
  const analyticsDocs = [];

  // Monthly analytics for each freelancer (last 6 months)
  for (const fl of freelancers) {
    const months   = 6;
    const flPays   = paymentDocs.filter(p =>
      p.splits?.some(s => s.freelancer?.toString() === fl._id.toString())
    );
    const monthlyEarnings = Array.from({ length: months }, (_, i) => ({
      date:     ago(30 * (months - i)),
      amount:   rand(500, 5000),
      projects: rand(1, 3),
    }));

    analyticsDocs.push({
      user:   fl._id,
      period: "monthly",
      date:   new Date(),
      freelancer: {
        earningsThisPeriod:  rand(800, 6000),
        tasksCompleted:      rand(4, 18),
        hoursLogged:         rand(20, 120),
        activeProjects:      rand(1, 4),
        onTimeDeliveryRate:  randF(82, 100),
        clientSatisfaction:  randF(4.0, 5.0),
        responseTime:        randF(0.5, 4.0),
        contributionScore:   rand(70, 99),
      },
      earningsHistory: monthlyEarnings,
    });
  }

  // Monthly analytics for each client (last 6 months)
  for (const cl of clients) {
    const clProjects = createdProjects.filter(p => p.client.toString() === cl._id.toString());
    analyticsDocs.push({
      user:   cl._id,
      period: "monthly",
      date:   new Date(),
      client: {
        totalSpent:          clProjects.reduce((s, p) => s + (p.totalPaid || 0), 0),
        activeProjects:      clProjects.filter(p => p.status === "in_progress").length,
        completedProjects:   clProjects.filter(p => p.status === "completed").length,
        teamProductivity:    randF(75, 98),
        avgProjectDuration:  rand(21, 84),
        delayedProjects:     rand(0, 2),
        avgFreelancerRating: randF(4.2, 5.0),
      },
      earningsHistory: Array.from({ length: 6 }, (_, i) => ({
        date:     ago(30 * (6 - i)),
        amount:   rand(2000, 20000),
        projects: rand(1, 3),
      })),
    });
  }

  await Analytics.insertMany(analyticsDocs);

  // ── 12. Update User stats post-seed ───────────────────
  console.log("🔄 Updating user stats...");

  // Update freelancer ratings from reviews
  for (const fl of freelancers) {
    const flReviews = reviewDocs.filter(r => r.reviewee?.toString() === fl._id.toString());
    if (!flReviews.length) continue;
    const avg = flReviews.reduce((s, r) => s + r.rating, 0) / flReviews.length;
    await User.findByIdAndUpdate(fl._id, {
      averageRating: parseFloat(avg.toFixed(1)),
      totalReviews:  flReviews.length,
    });
  }

  // ── Summary ───────────────────────────────────────────
  const counts = {
    users:         await User.countDocuments(),
    projects:      await Project.countDocuments(),
    tasks:         await Task.countDocuments(),
    payments:      await Payment.countDocuments(),
    contributions: await Contribution.countDocuments(),
    notifications: await Notification.countDocuments(),
    messages:      await Message.countDocuments(),
    reviews:       await Review.countDocuments(),
    analytics:     await Analytics.countDocuments(),
  };

  console.log("\n" + "═".repeat(50));
  console.log("🎉  SEED COMPLETE");
  console.log("═".repeat(50));
  console.log(`  👥  Users          : ${counts.users}  (1 admin · ${CLIENT_DATA.length} clients · ${FREELANCER_DATA.length} freelancers)`);
  console.log(`  📁  Projects       : ${counts.projects}`);
  console.log(`  ✅  Tasks          : ${counts.tasks}`);
  console.log(`  💳  Payments       : ${counts.payments}`);
  console.log(`  📊  Contributions  : ${counts.contributions}`);
  console.log(`  🔔  Notifications  : ${counts.notifications}`);
  console.log(`  💬  Messages       : ${counts.messages}`);
  console.log(`  ⭐  Reviews        : ${counts.reviews}`);
  console.log(`  📈  Analytics      : ${counts.analytics}`);
  console.log("═".repeat(50));
  console.log("\n📌  Demo login credentials (all passwords: Demo@123)");
  console.log("   admin@crewsync.ai       → Admin panel");
  console.log("   client@crewsync.ai      → Client dashboard (Harshad Sathish)");
  console.log("   freelancer@crewsync.ai  → Freelancer dashboard (Aanya Sharma)");
  console.log("\n📌  Other demo accounts (password: Demo@123)");
  console.log("   sarah@lumenlabs.io               → Client (Lumen Labs)");
  console.log("   james@novawavemusic.com           → Client (NovaWave Music)");
  console.log("   marcus@crewsync.ai               → Freelancer (Video Editor)");
  console.log("   liam@crewsync.ai                 → Freelancer (Music Producer)");
  console.log("   priya@crewsync.ai                → Freelancer (Full-stack Dev)");
  console.log("═".repeat(50) + "\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error("\n❌ Seed failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
