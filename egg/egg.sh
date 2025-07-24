#!/bin/bash

# # Load NVM if it's not already in the environment
# export NVM_DIR="$HOME/.nvm"
# source "$NVM_DIR/nvm.sh"

# # Use correct Node version
# nvm use 22

# # Run backend (Python Flask)
# # (optional: run in background with &)
# echo "Starting Flask server..."
# python3 /home/djd5603/senior-design/egg/backend/app.py&

# # Run frontend (Vite)
# echo "Starting Vite..."
# npm run dev

/bin/sh -ec 'npm run dev &'
/bin/sh -ec 'python backend/app.py'