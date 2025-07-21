#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor Remotion para Festa 800...');

// Start Remotion server
const remotionServer = spawn('node', ['server/remotion-server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

remotionServer.on('close', (code) => {
  console.log(`Servidor Remotion encerrado com código ${code}`);
});

remotionServer.on('error', (err) => {
  console.error('Erro ao iniciar servidor Remotion:', err);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor Remotion...');
  remotionServer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando servidor Remotion...');
  remotionServer.kill('SIGTERM');
  process.exit(0);
});