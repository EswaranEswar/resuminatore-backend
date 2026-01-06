import { TemplateType } from '@app/shared';

export const INITIAL_TEMPLATES: Partial<TemplateType>[] = [
  {
    name: 'Professional Elite',
    description: 'Sophisticated left sidebar design with elegant typography.',
    category: 'classic',
    thumbnailUrl: '/templates/thumbnails/professional-elite.png',
    isPremium: false,
    styles: {
      primaryColor: '#1a2332',
      secondaryColor: '#2d3e50',
      accentColor: '#3b82f6',
      fontFamily: "'Georgia', 'Garamond', serif",
      headingFont: "'Calibri', 'Arial', sans-serif",
      layout: 'sidebar-left',
      sidebarWidth: '35%',
      spacing: 'normal',
    },
    sampleData: {},
    htmlStructure:
      '<div class="resume-container">Professional Elite Structure</div>',
    cssStyles: '.resume { font-family: Georgia; }',
  },
  {
    name: 'Modern Executive',
    description: 'Premium two-column design with contemporary aesthetics.',
    category: 'modern',
    thumbnailUrl: '/templates/thumbnails/modern-executive.png',
    isPremium: true,
    styles: {
      primaryColor: '#0f172a',
      secondaryColor: '#1e293b',
      accentColor: '#8b5cf6',
      fontFamily: "'Roboto', 'Lato', sans-serif",
      headingFont: "'Helvetica', 'Arial', sans-serif",
      layout: 'two-column',
      sidebarWidth: '40%',
      spacing: 'relaxed',
    },
    sampleData: {},
    htmlStructure:
      '<div class="resume-container">Modern Executive Structure</div>',
    cssStyles: '.resume { font-family: Roboto; }',
  },
  {
    name: 'Creative Bold',
    description: 'Eye-catching right sidebar layout with vibrant accents.',
    category: 'creative',
    thumbnailUrl: '/templates/thumbnails/creative-bold.png',
    isPremium: false,
    styles: {
      primaryColor: '#1e1b4b',
      secondaryColor: '#312e81',
      accentColor: '#ec4899',
      fontFamily: "'Open Sans', sans-serif",
      headingFont: "'Montserrat', sans-serif",
      layout: 'sidebar-right',
      sidebarWidth: '38%',
      spacing: 'normal',
    },
    sampleData: {},
    htmlStructure:
      '<div class="resume-container">Creative Bold Structure</div>',
    cssStyles: '.resume { font-family: Open Sans; }',
  },
  {
    name: 'Technical Pro',
    description: 'Clean two-column technical layout optimized for developers.',
    category: 'modern',
    thumbnailUrl: '/templates/thumbnails/technical-pro.png',
    isPremium: false,
    styles: {
      primaryColor: '#0c4a6e',
      secondaryColor: '#075985',
      accentColor: '#06b6d4',
      fontFamily: "'Helvetica', 'Arial', sans-serif",
      headingFont: "'Roboto', 'Calibri', sans-serif",
      layout: 'two-column',
      sidebarWidth: '35%',
      spacing: 'compact',
    },
    sampleData: {},
    htmlStructure:
      '<div class="resume-container">Technical Pro Structure</div>',
    cssStyles: '.resume { font-family: Helvetica; }',
  },
  {
    name: 'Classic Elegant',
    description:
      'Timeless design with traditional typography. Perfect for consulting and law.',
    category: 'classic',
    thumbnailUrl: '/templates/thumbnails/classic-elegant.png',
    isPremium: true,
    styles: {
      primaryColor: '#1c1917',
      secondaryColor: '#44403c',
      accentColor: '#92400e',
      fontFamily: "'Times New Roman', 'Georgia', serif",
      headingFont: "'Arial', 'Helvetica', sans-serif",
      layout: 'sidebar-left',
      sidebarWidth: '33%',
      spacing: 'relaxed',
    },
    sampleData: {},
    htmlStructure:
      '<div class="resume-container">Classic Elegant Structure</div>',
    cssStyles: '.resume { font-family: "Times New Roman"; }',
  },
  {
    name: 'Classic Professional',
    description:
      'Clean and straightforward professional layout suitable for all industries.',
    category: 'classic',
    thumbnailUrl: '/templates/thumbnails/classic-professional.png',
    isPremium: false,
    styles: {
      primaryColor: '#27272a',
      secondaryColor: '#52525b',
      accentColor: '#0ea5e9',
      fontFamily: "'Arial', 'Helvetica', sans-serif",
      headingFont: "'Roboto', sans-serif",
      layout: 'single-column', // Guessing single column for a 'classic professional' feel
      sidebarWidth: '0%',
      spacing: 'normal',
    },
    sampleData: {},
    htmlStructure:
      '<div class="resume-container">Classic Professional Structure</div>',
    cssStyles: '.resume { font-family: Arial; }',
  },
  {
  name: 'Financial Analyst Pro',
  description: 'Professional right sidebar layout with clean typography and structured sections.',
  category: 'professional',
  thumbnailUrl: '/templates/thumbnails/financial-analyst.png',
  isPremium: false,
  styles: {
    primaryColor: '#1e293b',      // Dark slate gray (header background)
    secondaryColor: '#334155',    // Slate gray (sidebar)
    accentColor: '#0ea5e9',       // Blue accent (for highlights)
    fontFamily: "'Inter', 'Open Sans', sans-serif",
    headingFont: "'Inter', sans-serif",
    layout: 'sidebar-right',
    sidebarWidth: '35%',
    spacing: 'compact',
  },
  sampleData: {},
  htmlStructure: `
    <div class="resume-container flex h-[1123px] bg-white text-gray-800">
      <!-- Main Content (65%) -->
      <div class="flex-1 p-12 pr-0">
        <header class="mb-12">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">{{personalInfo.name}}</h1>
          <p class="text-lg text-gray-600">{{personalInfo.email}} • {{personalInfo.phone}}</p>
        </header>
        
        <section class="mb-12">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 border-b-4 border-blue-500 pb-2">Summary</h2>
          <p class="text-lg leading-relaxed">{{summary}}</p>
        </section>
        
        <section class="mb-12">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 border-b-4 border-blue-500 pb-2">Experience</h2>
          {{#each experience}}
            <div class="mb-6">
              <h3 class="text-xl font-semibold mb-1">{{title}} - {{company}}</h3>
              <p class="text-blue-600 font-medium mb-2">{{duration}}</p>
              <p>{{description}}</p>
            </div>
          {{/each}}
        </section>
        
        <section>
          <h2 class="text-2xl font-bold mb-6 text-gray-900 border-b-4 border-blue-500 pb-2">Education</h2>
          {{#each education}}
            <div class="mb-4">
              <h3 class="text-lg font-semibold">{{degree}}, {{field}}</h3>
              <p class="text-gray-600">{{school}} • {{duration}}</p>
            </div>
          {{/each}}
        </section>
      </div>
      
      <!-- Sidebar (35%) -->
      <div class="w-[35%] bg-slate-100 p-12 pt-16">
        <section class="mb-10">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 border-b-4 border-blue-500 pb-2">Technical Skills</h2>
          <div class="grid grid-cols-2 gap-2 text-sm">
            {{#each skills}}
              <span class="bg-white px-3 py-1 rounded-full text-xs font-medium">{{this}}</span>
            {{/each}}
          </div>
        </section>
        
        <section class="mb-10">
          <h2 class="text-2xl font-bold mb-6 text-gray-900 border-b-4 border-blue-500 pb-2">Languages</h2>
          <ul class="space-y-1 text-sm">
            {{#each languages}}
              <li>• {{this}}</li>
            {{/each}}
          </ul>
        </section>
        
        <section>
          <h2 class="text-2xl font-bold mb-6 text-gray-900 border-b-4 border-blue-500 pb-2">Awards</h2>
          <ul class="space-y-1 text-sm">
            {{#each awards}}
              <li>• {{this}}</li>
            {{/each}}
          </ul>
        </section>
      </div>
    </div>
  `,
  cssStyles: `
    .resume-container {
      font-family: 'Inter', 'Open Sans', sans-serif;
      max-width: 210mm;
      margin: 0 auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
    }
    h1, h2, h3 { font-weight: 700; }
    h1 { font-size: 2.5rem; line-height: 1.1; }
    h2 { font-size: 1.5rem; }
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; }
    @media print { box-shadow: none; }
  `
}
];
