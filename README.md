# DIGITAL RESET

> A terminal interface for digital footprint maintenance and Discord message history management

## 🛠 Features
- **Exhaustive Purge**: Deep scan and removal of direct message history
- **Turbo Mode**: High-throughput engine for large histories
- **Temporal Fencing**: Filter by date range
- **Keyword Targeting**: Precise message filtering
- **Truth Mode Diagnostics**: Real time server side authentication audit

## 🔐 Setup & Authentication
To initialize the protocol, you must provide a valid `DISCORD_USER_TOKEN` in the Secrets environment.

1. Obtain your User Token from the browser network inspector (look for `Authorization` headers on discord.com)
2. Add `DISCORD_USER_TOKEN` to your Studio Secrets
3. Restart the environment to inject the credential into the runtime

## ⚠️ Known Issues: Session Persistence
In some deployment scenarios, your account may remain visible even after deleting the environment secret. This is a known behavior caused by:
1. **Aggressive Browser Caching**: The browser may serve a cached version of the identity response
2. **Cloud Propagation Delay**: It may take upto some mins for a secret deletion to be reflected in the running container's environment
3. **Local Store persistence**: Shadows of session data may reside in IndexedDB or Cookies

### Troubleshooting Persistent Login
If your account is still visible after secret removal:
- **Use the "Sign Out" button** in the sidebar
- **Perform "Emergency System Wipe"** on the error page.
- **Check Diagnostics**: If the `MASKED_TOKEN` diagnostic still shows a value, the secret is still active in the OS environment.
- **Hard Refresh**: Use `Ctrl+F5` or `Cmd+Shift+R`.

## 📜 Legal Advisory
Using self-bots or automated message deletion utilities may violate the Discord Terms of Service. This software is provided for educational and personal data maintenance purposes. Use at your own risk.

---
© 2026 All rights reserved,lol
