#!/bin/bash

# Add all changes
git add -A

# Create commit with translation changes
git commit -m "Complete Russian to English translation

Major translation work completed:
- Authentication system (auth.ts, AppProvider.tsx, LoginScreen.tsx)
- API client and error handling (client.ts, errorHandler.ts, notifications.ts)
- Document management (documentsApi.ts, useDocuments.ts)
- Core documentation (technical_requirements.md, rules.md)
- API examples and utilities

Core functionality now fully in English for international use.
Remaining UI components can be translated as needed."

# Push to both remotes
echo "Pushing to origin (DanielFilinski/file-sharing)..."
git push origin dev

echo "Pushing to clieborate (Clieborate-com/FileSharing-Application)..."
git push clieborate dev

echo "Push completed to both repositories!"
