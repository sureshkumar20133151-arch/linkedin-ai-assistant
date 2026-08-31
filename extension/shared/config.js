/**
 * Shared Persona & Default Config
 * Loaded first in manifest content_scripts so DEFAULT_PERSONA
 * is available globally in content.js, messaging.js and any future scripts.
 * background.js uses importScripts('shared/config.js').
 */

// eslint-disable-next-line no-unused-vars
const DEFAULT_PERSONA = {
  role: "Full Stack Web Developer",
  skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "APIs", "Automation", "Web Applications"],
  services: [
    "Business Website Development",
    "Web Application Development",
    "Ecommerce Website Development",
    "API Integration",
    "Automation",
    "Custom Web Solutions"
  ],
  targetAudience: [
    "Small business owners",
    "Entrepreneurs",
    "Startups",
    "Businesses looking for websites",
    "People looking for developers"
  ],
  tone: "Professional, Natural, Helpful, Confident, Not overly promotional",
  detailedProfile: `## Developer Profile
- Location: Madurai, Tamil Nadu, India
- Development Workflow: Leverages modern AI-assisted development tools and workflows to build clean, responsive web applications faster without compromising code quality.
- Portfolio Positioning: Ambitious full-stack web developer actively expanding a freelance client portfolio with live interactive demo projects ready to show. Focused on delivering high-impact work with fast turnaround times and competitive rates.`
};
