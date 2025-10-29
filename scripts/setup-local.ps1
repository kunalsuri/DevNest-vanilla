#!/usr/bin/env pwsh

Write-Host ""
Write-Host "Setting up DevNest for local development..." -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    $nodeVersionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($nodeVersionNumber -lt 18) {
        Write-Host "❌ Node.js version $nodeVersion detected. Please upgrade to Node.js v18 or later." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v18 or later." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host ""
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Cyan
    if (Test-Path .env.local.example) {
        Copy-Item .env.local.example .env
        Write-Host "✅ .env file created from template" -ForegroundColor Green
        Write-Host "⚠️  Please edit .env file with your actual database URL and session secret" -ForegroundColor Yellow
        Write-Host "📋 Required variables: DATABASE_URL, SESSION_SECRET" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 Example DATABASE_URL: postgresql://username:password@localhost:5432/devnest_db" -ForegroundColor Gray
    } else {
        Write-Host "❌ Failed to create .env file. .env.local.example not found." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Function to kill processes on port 5000
function Kill-ServerOnPort {
    Write-Host ""
    Write-Host "🔍 Checking for existing server on port 5000..." -ForegroundColor Cyan
    
    try {
        $processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
        
        if ($processes) {
            Write-Host "🛑 Found existing server processes. Killing them..." -ForegroundColor Yellow
            foreach ($pid in $processes) {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 2
            Write-Host "✅ Server processes terminated" -ForegroundColor Green
        } else {
            Write-Host "✅ No existing server found on port 5000" -ForegroundColor Green
        }
    } catch {
        Write-Host "✅ No existing server found on port 5000" -ForegroundColor Green
    }
}

# Function to start the development server
function Start-DevServer {
    Write-Host ""
    Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
    
    # Kill any existing server first
    Kill-ServerOnPort
    
    Write-Host ""
    Write-Host "� Ensuring dist directory exists..." -ForegroundColor Cyan
    if (-not (Test-Path "dist")) {
        New-Item -ItemType Directory -Path "dist" -Force | Out-Null
    }
    
    Write-Host "�🔄 Building client with latest changes..." -ForegroundColor Cyan
    npx vite build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Client build failed. Please check for errors above." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Client built successfully" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🔨 Building server bundle..." -ForegroundColor Cyan
    
    # Build server using esbuild directly
    $esbuildScript = @"
import { build } from 'esbuild';

async function buildServer() {
  try {
    const result = await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: 'dist/server.js',
      minify: true,
      treeShaking: true,
      external: [
        'express',
        'ws',
        'bcryptjs',
        'jsonwebtoken',
        'cookie-parser',
        'express-session',
        'connect-pg-simple',
        'drizzle-orm',
        '@neondatabase/serverless',
        'multer',
        'zod',
        'nanoid',
        '@babel/*',
        'lightningcss',
        'esbuild',
        'vite',
        '@vitejs/*',
        '@replit/*',
        'autoprefixer',
        'postcss',
        'tailwindcss',
        'tsx',
        'typescript',
        'vitest',
        'bufferutil'
      ],
      target: 'node18',
      sourcemap: process.env.NODE_ENV === 'development',
      logLevel: 'info'
    });
    console.log('✅ Server bundle created successfully');
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

buildServer();
"@
    
    $esbuildScript | Out-File -FilePath "dist/build-temp.mjs" -Encoding UTF8 -Force
    node dist/build-temp.mjs
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Server build failed. Please check for errors above." -ForegroundColor Red
        Remove-Item "dist/build-temp.mjs" -ErrorAction SilentlyContinue
        exit 1
    }
    
    Remove-Item "dist/build-temp.mjs" -ErrorAction SilentlyContinue
    Write-Host "✅ Server built successfully" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🎯 Starting server..." -ForegroundColor Cyan
    Write-Host "📡 Server will be available at: http://localhost:5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    
    # Set environment variable and start server
    $env:NODE_ENV = "development"
    npx tsx server/index.ts
}

Write-Host ""
Write-Host "🚀 Setup complete! Starting development server..." -ForegroundColor Green
Start-DevServer
Write-Host ""
