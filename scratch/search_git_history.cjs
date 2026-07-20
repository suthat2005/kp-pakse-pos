const { spawn } = require('child_process');
const readline = require('readline');

console.log("=== SCANNING GIT LOG FOR PASSCODE CHANGES ===");

const gitLog = spawn('git', ['log', '-p', '--', 'db_shared.json']);

const rl = readline.createInterface({
  input: gitLog.stdout,
  terminal: false
});

let currentCommit = '';
rl.on('line', (line) => {
  if (line.startsWith('commit ')) {
    currentCommit = line;
  }
  if (line.includes('"passcode"') && (line.startsWith('+') || line.startsWith('-'))) {
    console.log(`${currentCommit}: ${line.trim()}`);
  }
  if (line.includes('"password"') && (line.startsWith('+') || line.startsWith('-'))) {
    console.log(`${currentCommit}: ${line.trim()}`);
  }
});

gitLog.on('close', (code) => {
  console.log(`Finished scanning git history. Exit code: ${code}`);
});
