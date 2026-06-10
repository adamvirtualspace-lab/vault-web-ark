"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
const ws_1 = require("ws");
const DEFAULT_SETTINGS = {
    port: 8080,
    token: 'change-me-to-something-secure'
};
class VaultWebArkPlugin extends obsidian_1.Plugin {
    settings;
    wss = null;
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new VaultWebArkSettingTab(this.app));
        this.startWebSocketServer();
        console.log('Vault Web Ark: Loaded and server starting...');
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadSettings());
    }
    async saveSettings() {
        await this.saveSettings(this.settings);
    }
    startWebSocketServer() {
        if (this.wss)
            return;
        try {
            this.wss = new ws_1.WebSocketServer({ port: this.settings.port });
            this.wss.on('connection', (ws, req) => {
                const url = new URL(req.url || 'http://localhost', 'http://localhost');
                const token = url.searchParams.get('token');
                if (token !== this.settings.token) {
                    console.warn('Vault Web Ark: Unauthorized connection attempt');
                    ws.close(1008, 'Unauthorized');
                    return;
                }
                console.log('Vault Web Ark: Client connected');
                ws.on('message', (message) => {
                    this.handleClientMessage(ws, message);
                });
            });
            console.log(`Vault Web Ark: Server listening on port ${this.settings.port}`);
        }
        catch (e) {
            console.error('Vault Web Ark: Failed to start WebSocket server', e);
        }
    }
    handleClientMessage(ws, message) {
        try {
            const data = JSON.parse(message.toString());
            console.log('Vault Web Ark: Received', data);
            // Simple Echo for Phase 1
            ws.send(JSON.stringify({ type: 'ack', payload: 'Message received' }));
        }
        catch (e) {
            console.error('Vault Web Ark: Failed to parse message', e);
        }
    }
    onunload() {
        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
    }
}
exports.default = VaultWebArkPlugin;
class VaultWebArkSettingTab extends obsidian_1.PluginSettingTab {
    plugin;
    constructor(app) {
        super(app);
        this.plugin = this.app.plugins.plugins['vault-web-ark'];
    }
    displayHalt() {
        // Standard Obsidian setting tab implementation
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        new obsidian_1.Setting(containerEl)
            .setName('Server Port')
            .setDesc('The port the WebSocket server will listen on')
            .addText(text => text
            .setValue(String(this.plugin.settings.port))
            .onChange(async (value) => {
            this.plugin.settings.port = parseInt(value) || 8080;
            await this.plugin.saveSettings();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Access Token')
            .setDesc('Token required for clients to connect')
            .addText(text => text
            .setValue(this.plugin.settings.token)
            .onChange(async (value) => {
            this.plugin.settings.token = value;
            await this.plugin.saveSettings();
        }));
    }
}
