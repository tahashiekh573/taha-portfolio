import type { SiteContent } from "@/lib/types";

/**
 * Initial portfolio content. It is used directly when no database is configured
 * and as the fallback for any section that has not been edited in the admin panel.
 * Everything here comes from information Muhammad Taha supplied or from his public
 * GitHub repositories. Do not add claims that cannot be backed up.
 */
export const siteSeed: SiteContent = {
  profile: {
    name: "Muhammad Taha",
    greeting: "Hello, I'm",
    titles: [
      "Software Engineer",
      "AI/ML Engineer",
      "AI Agent Developer",
      "Full Stack Developer",
      "Jira & JSM Specialist",
    ],
    intro:
      "A Software Engineer and AI/ML Engineer specializing in intelligent AI agents, automation, backend systems, full-stack development, and enterprise workflow solutions. I build practical, scalable applications that solve real-world problems.",
    location: "Lahore, Punjab, Pakistan",
    email: "tahasajjad678@gmail.com",
    phone: "+923299422715",
    phoneDisplay: "+92 329 9422715",
    github: "https://github.com/tahashiekh573",
    githubUsername: "tahashiekh573",
    linkedin: "https://www.linkedin.com/in/taha-sajjad-95720a375",
    whatsapp: "923299422715",
    whatsappMessage:
      "Hello Taha, I visited your portfolio and would like to discuss a project or opportunity.",
    photoUrl: "/images/profile.jpg",
    photoPosition: "50% 22%",
    photoAlt: "Portrait of Muhammad Taha",
    availability: "open",
    availabilityText: "Open to new opportunities",
    techBadges: ["Python", "FastAPI", "LangGraph", "Next.js", "Jira & JSM"],
  },

  about: {
    headline: "Transforming ideas into intelligent, scalable software.",
    paragraphs: [
      "I'm a Computer Science graduate from the University of the Punjab (BSCS, 2021–2025) who builds software at the point where AI meets real operational work. My projects range from multi-agent systems that administer Jira, JSM and Confluence through official REST APIs, to computer-vision pipelines and browser-based AR applications.",
      "Professionally I work across software engineering, Jira and Jira Service Management, and AI-driven automation: configuring service desks, workflows, SLAs and automation rules, integrating systems through REST APIs, and testing enterprise applications.",
      "On the AI side I work with Python, FastAPI, LangGraph, LLM APIs and classic machine learning. I care about the unglamorous parts that make AI usable in production: validation, approval steps, verification of results, tests and clear documentation of limitations.",
      "I also build full-stack and backend applications with React, Next.js, Spring Boot and SQL databases. Whatever the stack, the goal is the same: practical software that solves a concrete problem and keeps working as it grows.",
    ],
    focusAreas: [
      {
        title: "AI Agents & LLM Apps",
        description:
          "Multi-agent workflows with LangGraph, planning, approval and verification steps, and LLM integrations with Gemini, OpenAI and Ollama.",
        icon: "bot",
      },
      {
        title: "Machine Learning",
        description:
          "Classification, clustering, forecasting and recommendation models with scikit-learn, evaluated honestly and shipped as Streamlit apps or APIs.",
        icon: "brain",
      },
      {
        title: "Backend & Full Stack",
        description:
          "REST APIs with FastAPI, Spring Boot and Node.js, and modern front ends with React, Next.js and TypeScript.",
        icon: "server",
      },
      {
        title: "Jira & JSM Automation",
        description:
          "Service desk setup, workflows, SLAs, automation rules, dashboards, JQL and REST API integrations for ITSM teams.",
        icon: "workflow",
      },
      {
        title: "Computer Vision",
        description:
          "YOLOv8 detection and tracking, OCR, MediaPipe face and hand tracking, and OpenCV-based applications.",
        icon: "scan",
      },
      {
        title: "Quality & Testing",
        description:
          "Automated tests, API testing with Postman, Playwright and Selenium, and QA for enterprise applications.",
        icon: "shield",
      },
    ],
    highlights: [
      { label: "Degree", value: "BSCS, University of the Punjab" },
      { label: "Focus", value: "AI agents & automation" },
      { label: "Enterprise platform", value: "Jira Software & JSM" },
      { label: "Based in", value: "Lahore, Pakistan" },
    ],
  },

  experience: [
    {
      id: "abacus",
      company: "Abacus Consulting",
      location: "Lahore, Pakistan",
      role: "Software Engineering · Jira & JSM · AI & Automation",
      summary:
        "Work across Jira and Jira Service Management administration, ITSM configuration, integrations and quality assurance for enterprise applications.",
      points: [
        "Jira and Jira Service Management administration",
        "Service desk configuration and ITSM setup",
        "Custom workflows, SLAs and automation rules",
        "Dashboards and reports for service teams",
        "REST API integrations",
        "Enterprise application QA and testing",
      ],
      tech: ["Jira Software", "Jira Service Management", "JQL", "Jira Automation", "REST APIs"],
      published: true,
    },
    {
      id: "auspify",
      company: "Auspify Technologies",
      role: "AI/ML Engineering",
      summary: "AI and machine learning engineering work.",
      points: [
        "AI agents and intelligent automation",
        "Machine learning applications",
        "LLM integrations and RAG-based applications",
        "Python backend development",
      ],
      tech: ["Python", "LLMs", "RAG", "Machine Learning"],
      published: true,
    },
    {
      id: "cmit",
      company: "CMIT Internship — Government of Punjab / PITB",
      location: "Hosted at Abacus Consulting, Lahore",
      role: "Intern",
      type: "Internship",
      summary:
        "Internship under the Government of Punjab / PITB CMIT programme, hosted at Abacus Consulting, with exposure to software development and enterprise tooling.",
      points: [
        "Software development within an enterprise consulting environment",
        "Exposure to enterprise tooling, including the Atlassian platform",
      ],
      tech: [],
      published: true,
    },
    {
      id: "xictek",
      company: "XICTEK Systems",
      role: "To be confirmed",
      summary:
        "Hidden until the role, dates and responsibilities are confirmed from employment or internship documentation.",
      points: [],
      tech: [],
      published: false,
    },
  ],

  education: [
    {
      id: "bscs",
      degree: "Bachelor of Science in Computer Science (BSCS)",
      institution: "University of the Punjab",
      location: "Lahore, Pakistan",
      period: "2021 – 2025",
      subjects: [
        "Data Structures and Algorithms",
        "Object-Oriented Programming",
        "Database Management Systems",
        "Software Engineering",
        "Artificial Intelligence",
        "Machine Learning",
        "Web Development",
        "Computer Networks",
      ],
      finalProject: { title: "The Expert Labour Platform", projectSlug: "expert-labour-platform" },
    },
  ],

  skills: [
    {
      id: "languages",
      name: "Programming Languages",
      icon: "code",
      skills: ["Python", "Java", "JavaScript", "TypeScript", "C", "C#"],
    },
    {
      id: "ai-ml",
      name: "AI / Machine Learning",
      icon: "brain",
      skills: [
        "Machine Learning",
        "Deep Learning",
        "NLP",
        "LLMs",
        "AI Agents",
        "Prompt Engineering",
        "Scikit-learn",
        "PyTorch",
        "TensorFlow",
        "Hugging Face",
      ],
    },
    {
      id: "ai-infra",
      name: "AI Frameworks & Infrastructure",
      icon: "cpu",
      skills: [
        "LangChain",
        "LangGraph",
        "RAG",
        "Embeddings",
        "FAISS",
        "Pinecone",
        "Qdrant",
        "OpenAI API",
        "Gemini API",
        "Ollama",
        "MCP",
        "n8n",
      ],
    },
    {
      id: "backend",
      name: "Backend Development",
      icon: "server",
      skills: [
        "FastAPI",
        "Spring Boot",
        "Node.js",
        "Express.js",
        "REST APIs",
        "JWT Authentication",
        "SQLAlchemy",
      ],
    },
    {
      id: "frontend",
      name: "Frontend Development",
      icon: "layout",
      skills: ["React", "Next.js", "HTML5", "CSS3", "Tailwind CSS", "Bootstrap"],
    },
    {
      id: "databases",
      name: "Databases",
      icon: "database",
      skills: ["MySQL", "MongoDB", "SQLite", "Redis"],
    },
    {
      id: "testing",
      name: "Automation & Testing",
      icon: "test",
      skills: ["Playwright", "Selenium", "Postman", "PyAutoGUI", "API Testing", "Test Cases"],
    },
    {
      id: "enterprise",
      name: "Enterprise Platforms",
      icon: "workflow",
      skills: [
        "Jira Software",
        "Jira Service Management",
        "Confluence",
        "JQL",
        "ITSM",
        "SLA Management",
        "Jira Automation",
        "EazyBI",
      ],
    },
    {
      id: "tools",
      name: "Development Tools",
      icon: "wrench",
      skills: ["Git", "GitHub", "VS Code", "IntelliJ IDEA", "Maven", "Vercel"],
    },
  ],

  // Certifications stay hidden (verified: false) until their exact title and
  // completion status are confirmed in the admin panel.
  certifications: [
    {
      id: "google-cyber",
      title: "Google Cybersecurity Professional Certificate",
      issuer: "Google",
      verified: false,
      notes: "Confirm exact title and completion before publishing.",
    },
    {
      id: "ibm-ds",
      title: "IBM Data Science Professional Certificate",
      issuer: "IBM",
      verified: false,
      notes: "Confirm exact title and completion before publishing.",
    },
    {
      id: "navttc-web",
      title: "Web Development",
      issuer: "NAVTTC",
      verified: false,
      notes: "Confirm exact title and completion before publishing.",
    },
    {
      id: "wordpress",
      title: "WordPress Training",
      issuer: "To be confirmed",
      verified: false,
      notes: "Confirm issuer, exact title and completion before publishing.",
    },
    {
      id: "hp-life-ai",
      title: "HP LIFE — AI-related training",
      issuer: "HP LIFE",
      verified: false,
      notes: "Confirm the exact course title before publishing.",
    },
    {
      id: "sql",
      title: "SQL / MySQL Training",
      issuer: "To be confirmed",
      verified: false,
      notes: "Confirm issuer, exact title and completion before publishing.",
    },
  ],

  resume: {
    fileName: "Muhammad-Taha-Resume.pdf",
  },

  settings: {
    seoTitle: "Muhammad Taha | AI/ML Engineer & Software Developer",
    seoDescription:
      "Explore the portfolio of Muhammad Taha, a Software Engineer and AI/ML Engineer specializing in AI agents, intelligent automation, full-stack applications, backend systems, and enterprise solutions.",
    siteUrl: "",
    keywords: [
      "Muhammad Taha",
      "AI/ML Engineer",
      "Software Engineer",
      "AI Agent Developer",
      "Jira Service Management",
      "Lahore",
      "Pakistan",
      "FastAPI",
      "LangGraph",
      "Next.js",
    ],
    showGithubStats: true,
    contactFormEnabled: true,
    sendConfirmationEmail: false,
    accent: "blue-purple",
  },
};
