# Vault Web Ark

**Your Vault, Shown and Editable on the web (localhost)**

- View & edit Markdown files in real time
- Image preview with light‑box support
- Create / delete / rename notes
- Secure access via token authentication

> ⚠️ This plugin is **desktop‑only** (requires the local Obsidan desktop app).

## Installation

Drop the folder into your Obsidian vault's `.obsidian/plugins` directory, then enable it from *Settings → Community plugins*.

```bash
# Example installation (manual)
cwd /path/to/your/vault/.obsidian/plugins
git clone https://github.com/<you>/vault-web-ark.git
```

## Configuration

Open **Vault Web Ark** settings in Obsidian:

| Setting      | Description |
| ------------ | ----------- |
| **Server Port** | TCP port the HTTP+WS server will listen on. Default `8080`. |
| **Access Token** | Secret token required by browsers to connect. Change it from the default "change-me" for a safer setup. |

> The plugin starts an HTTPS‑enabled Express‑style server that serves both the UI page and your vault files.

## Using the Plugin

1. Start the plugin (it auto‑starts on launch). 
2. Open any web browser tab at:

```
http://localhost:PORT
```

Replace **`PORT`** with the value from the settings, e.g. `http://localhost:8080`.
3. Log in using the *Access Token* field. 
4. The left sidebar lists all files; click to open or create new notes.

### Features

| Feature | Description |
|---------|-------------|
| **Live edit** | Every change is sent immediately over WebSocket and written back to Obsidian. |
| **Image preview** | Images in the vault are served under `/vault/…`. Clicking an image opens a light‑box. |
| **Markdown rendering** | A lightweight renderer handles headings, lists, code blocks, links & images. |
| **File operations** | Use UI buttons to create/delete/rename files; changes broadcast instantly. |
| **Vault change notifications** | When another app (e.g., mobile device) modifies the vault, all browsers receive a refresh signal automatically. |

## Development

```bash
# Clone repo into your plugins folder
git clone <repo-url> .obsidian/plugins/vault-web-ark

# Install dependencies
cd .obsidian/plugins/vault-web-ark
npm install   # installs ws and other dev deps

# Build the bundled JS for Obsidian
npm run build  # outputs main.js (default for Obsidian)

# Test from Obsidian: enable plugin, then open web UI.
```

> The project uses a small custom bundler that inlines the client templates.  If you modify `plugin_src.js`, remember to rebuild to regenerate `main.js`.

### Linting & Tests

```bash
npm run lint  # eslint
# No automated tests yet, but feel free to add jest/mocha tests.
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Browser says “Connection refused” | Ensure the port matches Obsidian's setting and no firewall blocks it. |
| Token validation fails | Verify the token in the browser URL (`?token=…`) exactly matches the one set in the settings. |
| Images not loading | Confirm the image path is correct; server logs may show 404s.

## Contributing

Pull requests welcome!  Open an issue or PR to add:

- WebSocket security enhancements
- Full markdown rendering via `marked`/`markdown‑it`
- HTTPS support and self‑signed cert helpers
- Unit tests / CI pipeline

## License

MIT © AdamVirtualSpace 2026
