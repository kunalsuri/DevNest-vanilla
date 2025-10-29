# DevNest

A modern, full-stack web application built with React, TypeScript, and Express.js, featuring advanced observability, authentication, and developer-friendly tooling.

## Overview

DevNest is a feature-rich web application that demonstrates modern full-stack development practices. It combines a React frontend with a robust Express.js backend, implementing comprehensive logging, observability, authentication, and user management systems.

## Features

### 🚀 Core Features

- **Modern React Frontend**: Built with React 18, TypeScript, and Vite for lightning-fast development
- **Express.js Backend**: Robust server-side architecture with middleware and routing
- **JWT Authentication**: Secure authentication system with token-based access control
- **User Management**: Complete user registration, login, and profile management
- **Responsive Design**: Mobile-first design with Tailwind CSS and shadcn/ui components

### 🔍 Observability & Monitoring

- **Advanced Logging**: Multi-transport logging system with Winston
- **Request Tracing**: Comprehensive request/response tracking and metrics
- **Error Handling**: Centralized error handling with detailed logging
- **Performance Monitoring**: Request duration tracking and performance insights
- **File & Server Transport**: Flexible logging with daily rotation and server endpoints

### 🎨 UI/UX Features

- **Dark/Light Mode**: System preference detection with manual toggle
- **Modern Components**: Comprehensive UI component library using Radix UI
- **Animations**: Smooth animations with Framer Motion
- **Form Handling**: Advanced form validation with React Hook Form and Zod
- **Data Visualization**: Charts and graphs with Recharts
- **Responsive Layout**: Adaptive design for all screen sizes

### 🛠 Developer Experience

- **TypeScript**: Full type safety across frontend and backend
- **Hot Reload**: Fast development with Vite HMR
- **Code Quality**: ESLint, Prettier, and strict TypeScript configuration
- **Database Integration**: Drizzle ORM with PostgreSQL support
- **API Documentation**: Well-structured REST API endpoints
- **Testing Ready**: Testing setup with React Testing Library and Vitest

## Technology Stack

### Frontend

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Framer Motion** - Animation library
- **React Query** - Server state management
- **Wouter** - Lightweight routing
- **React Hook Form** - Form handling with validation

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Winston** - Logging library
- **JWT** - JSON Web Token authentication
- **Drizzle ORM** - Type-safe database toolkit
- **PostgreSQL** - Relational database
- **Zod** - Schema validation

### Development Tools

- **Vite** - Build tool and dev server
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing framework
- **tsx** - TypeScript execution engine

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn package manager
- PostgreSQL database (for production)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/kunalsuri/DevNest-vanilla.git
   cd DevNest-vanilla
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database**

   ```bash
   npm run db:push
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:5000`

## Usage

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run check

# Database operations
npm run db:push        # Push schema changes
npm run create-admin   # Create admin user
```

### Project Structure

```text
DevNest-vanilla/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-specific modules
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Route components
│   │   └── utils/          # Helper functions
│   └── index.html          # Entry HTML file
├── server/                 # Express.js backend
│   ├── auth/               # Authentication middleware
│   ├── routes/             # API route handlers
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
├── data/                   # Local data storage
└── docs/                   # Documentation
```

### Key Features Usage

#### Authentication

```typescript
// Use the JWT auth hook in components
import { useJWTAuth } from '@/features/auth';

function MyComponent() {
  const { user, login, logout, isLoading } = useJWTAuth();
  
  // Access user data, login/logout functions
}
```

#### Logging & Observability

```typescript
// Use the logging hook for tracking
import { useLogger } from '@/hooks/use-logger';

function MyComponent() {
  const logger = useLogger();
  
  logger.info('User action completed', { userId: user.id });
}
```

#### Theme Management

```typescript
// Toggle between light/dark modes
import { useTheme } from '@/hooks/use-theme';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  );
}
```

## API Endpoints

### Auth Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### User Management

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/preferences` - Update user preferences

### Admin

- `GET /api/admin/users` - List all users (admin only)
- `POST /api/admin/users` - Create user (admin only)

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**

   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Commit your changes**

   ```bash
   git commit -m 'Add amazing feature'
   ```

5. **Push to your branch**

   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent code formatting with Prettier
- Write meaningful commit messages
- Add tests for new functionality
- Update documentation for API changes

### Code Style

- Use TypeScript strict mode
- Prefer named exports over default exports
- Use descriptive variable names
- Follow React hooks best practices
- Implement proper error handling

## Architecture

### Frontend Architecture

- **Feature-Driven Structure**: Organized by features rather than file types
- **Custom Hooks**: Reusable logic encapsulated in custom hooks
- **Component Composition**: Modular, composable UI components
- **State Management**: React Query for server state, React Context for client state

### Backend Architecture

- **Middleware Pipeline**: Express.js middleware for cross-cutting concerns
- **Route Organization**: Feature-based route organization
- **Error Handling**: Centralized error handling middleware
- **Logging**: Structured logging with multiple transports

## Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

Required environment variables for production:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `NODE_ENV=production`

### Docker Support

```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with ❤️ using modern web technologies
- UI components powered by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide React](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

## Support

For support, questions, or feature requests:

- Open an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the examples in `/client/src/examples`

---

**Happy coding!** 🚀
