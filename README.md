# Text Classifier

A modern web application for text classification with an interactive category management system.

## Overview

This project is a text classification frontend application built with React, TypeScript, and Vite. It features a graph-based visualization for category management using ReactFlow and integrates with Supabase for authentication and data storage. The application also utilizes OpenAI's API for text classification capabilities.

## Features

- Interactive category visualization and management
- Category hierarchy with parent-child relationships
- Search functionality for categories
- Responsive design with Tailwind CSS
- Authentication via Supabase
- Text classification powered by OpenAI

## Screenshots

### Category Management
![Category Graph Management](/public/screenshot_categories_graph.png)
*Interactive visualization for managing category hierarchies*

### Text Classification
![Text Classification](/public/screenshot_classification.png)
*Results of text classification with relationship visualization*

## Technology Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Authentication & Database**: Supabase
- **Data Visualization**: ReactFlow
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Table Management**: TanStack Table

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables by creating a `.env.local` file based on the existing template

### Development

Run the development server:

```bash
npm run dev
```

### Building for Production

Build the project:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

- `/src` - Application source code
  - `/components` - React components including CategoryGraph
  - `/types` - TypeScript type definitions
- `/public` - Static assets
- `/supabase` - Supabase-related configurations

## License

[Add license information here]

## Contributors

[Add contributor information here]
