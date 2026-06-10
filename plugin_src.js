const { Plugin, PluginSettingTab, Setting } = require('obsidian');
const http = require('http');
const path = require('path');

const DEFAULT_SETTINGS = { port: 8080, token: 'change-me' };

const MIME_TYPES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.pdf': 'application/pdf'
};

const CLIENT_HTML = [
'<!DOCTYPE html>',
'<html><head>',
'<title>Vault Web Ark</title>',
'<meta charset="utf-8">',
'<style>',
'*{margin:0;padding:0;box-sizing:border-box}',
'body{font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;background:#1e1e1e;color:#d4d4d4;height:100vh;display:flex;flex-direction:column}',
'#connect-panel{padding:20px;background:#252526;border-bottom:1px solid #333;display:flex;gap:10px;align-items:center;flex-wrap:wrap}',
'#connect-panel input{background:#3c3c3c;border:1px solid #555;color:#d4d4d4;padding:8px 12px;border-radius:4px;font-size:14px;flex:1;min-width:200px}',
'#connect-panel input:focus{outline:none;border-color:#0078d4}',
'#connect-panel button{background:#0078d4;color:#fff;border:none;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:14px}',
'#connect-panel button:hover{background:#1a8ad4}',
'#status{font-size:13px;padding:4px 12px;border-radius:4px}',
'#status.connected{background:#1b3a1b;color:#4ec94e}',
'#status.disconnected{background:#3a1b1b;color:#e74c3c}',
'#status.connecting{background:#3a3a1b;color:#d4d420}',
'#log{width:100%;padding:10px 20px;background:#111;color:#0f0;font-family:monospace;font-size:12px;max-height:120px;overflow-y:auto;display:none}',
'#main{display:flex;flex:1;overflow:hidden}',
'#sidebar{width:300px;background:#252526;border-right:1px solid #333;display:none;flex-direction:column}',
'#sidebar.visible{display:flex}',
'#sidebar-header{padding:8px 12px;display:flex;gap:6px;border-bottom:1px solid #333}',
'#sidebar-header button{background:#0e639c;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;flex:1}',
'#sidebar-header button:hover{background:#1177bb}',
'#search-box{width:100%;padding:8px 12px;background:#3c3c3c;border:none;color:#d4d4d4;font-size:13px;border-bottom:1px solid #333}',
'#search-box:focus{outline:none}',
'#file-list{padding:4px 8px;overflow-y:auto;flex:1}',
'.file-item{padding:5px 10px;cursor:pointer;border-radius:4px;font-size:13px}',
'.file-item:hover{background:#2a2d2e}',
'.file-item.active{background:#37373d;color:#fff}',
'.folder-header{padding:5px 10px;font-size:11px;text-transform:uppercase;color:#888;letter-spacing:1px;margin-top:4px}',
'#editor{flex:1;display:none;flex-direction:column}',
'#editor.visible{display:flex}',
'#editor-header{padding:12px 20px;background:#1e1e1e;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center}',
'#editor-header h3{font-size:14px;font-weight:500;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'#editor-header button{background:#0e639c;color:#fff;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:13px;margin-left:8px}',
'#editor-header button:hover{background:#1177bb}',
'#editor-header button.danger{background:#6b2020}',
'#editor-header button.danger:hover{background:#8a2a2a}',
'#editor-header button:disabled{opacity:0.5;cursor:default}',
'#editor-content{flex:1;display:flex}',
'#editor-content textarea{width:100%;height:100%;background:#1e1e1e;border:none;color:#d4d4d4;padding:20px;font-family:Consolas,Courier New,monospace;font-size:14px;line-height:1.6;resize:none}',
'#editor-content textarea:focus{outline:none}',
'#preview{width:100%;height:100%;padding:20px;overflow-y:auto;display:none;line-height:1.6}',
'#preview.visible{display:block}',
'#preview h1,#preview h2,#preview h3{color:#569cd6;margin:16px 0 8px}',
'#preview p{margin:8px 0}',
'#preview img{max-width:100%;border-radius:4px;margin:8px 0}',
'#preview code{background:#2d2d2d;padding:2px 6px;border-radius:3px;font-size:13px}',
'#preview pre{background:#2d2d2d;padding:16px;border-radius:4px;overflow-x:auto;margin:8px 0}',
'#preview blockquote{border-left:3px solid #569cd6;padding-left:16px;margin:8px 0;color:#999}',
'#preview ul,#preview ol{padding-left:24px;margin:8px 0}',
'#preview a{color:#3794ff}',
'#preview table{border-collapse:collapse;margin:8px 0}',
'#preview th,#preview td{border:1px solid #444;padding:6px 12px;text-align:left}',
'#preview th{background:#333}',
'#lightbox{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:1000;justify-content:center;align-items:center}',
'#lightbox.visible{display:flex}',
'#lightbox img{max-width:95vw;max-height:95vh;object-fit:contain;border-radius:4px}',
'#lightbox .lb-close{position:absolute;top:20px;right:30px;color:#fff;font-size:32px;cursor:pointer;opacity:0.7}',
'#lightbox .lb-close:hover{opacity:1}',
'#lightbox .lb-info{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:#ccc;font-size:13px;background:rgba(0,0,0,0.6);padding:6px 16px;border-radius:4px}',
'</style></head><body>',
'<div id="connect-panel">',
'<input type="text" id="url" value="ws://localhost:8080" placeholder="ws://host:port">',
'<input type="text" id="token" placeholder="Access Token" value="change-me">',
'<button id="connectBtn">Connect</button>',
'<span id="status" class="disconnected">Disconnected</span></div>',
'<div id="log"></div>',
'<div id="main"><div id="sidebar">',
'<div id="sidebar-header"><button onclick="newNote()">+ New</button><button onclick="refreshFiles()">Refresh</button></div>',
'<input type="text" id="search-box" placeholder="Search..." oninput="filterFiles()">',
'<div id="file-list"></div></div>',
'<div id="editor"><div id="editor-header">',
'<h3 id="file-path"></h3>',
'<div style="display:flex;align-items:center;gap:4px">',
'<button id="previewBtn" onclick="togglePreview()">Preview</button>',
'<button id="renameBtn" onclick="renameFile()">Rename</button>',
'<button class="danger" id="deleteBtn" onclick="deleteFile()">Delete</button>',
'<button id="saveBtn" onclick="saveFile()" disabled>Save</button>',
'</div></div>',
'<div id="editor-content"><textarea id="file-content" oninput="onEdit()"></textarea><div id="preview"></div></div>',
'</div></div>',
'<div id="lightbox" onclick="closeLightbox(event)"><span class="lb-close">&times;</span><img id="lightbox-img" src="" alt=""><div class="lb-info" id="lightbox-info"></div></div>',
'<script>',
'var socket=null,currentFile=null,allFiles=[],fileContents={},modified=false,previewMode=false;',
'var statusEl=document.getElementById("status");',
'var sidebarEl=document.getElementById("sidebar");',
'var editorEl=document.getElementById("editor");',
'var fileListEl=document.getElementById("file-list");',
'var filePathEl=document.getElementById("file-path");',
'var contentEl=document.getElementById("file-content");',
'var previewEl=document.getElementById("preview");',
'var saveBtnEl=document.getElementById("saveBtn");',
'var logEl=document.getElementById("log");',
'var lightboxEl=document.getElementById("lightbox");',
'var lightboxImg=document.getElementById("lightbox-img");',
'var origin=location.origin||("http://"+location.hostname+":"+(location.port||"8080"));',
'var IMG_EXTS={png:1,jpg:1,jpeg:1,gif:1,svg:1,webp:1,bmp:1,ico:1};',
'function isImg(p){return IMG_EXTS[p.split(".").pop().toLowerCase()]?true:false}',
'function setStatus(t,x){statusEl.textContent=t;statusEl.className=x?"connected":t==="Connecting..."?"connecting":"disconnected"}',
'function logMsg(m){logEl.style.display="block";var d=document.createElement("div");d.textContent="["+new Date().toLocaleTimeString()+"] "+m;logEl.appendChild(d);logEl.scrollTop=logEl.scrollHeight}',
'document.getElementById("connectBtn").onclick=function(){if(socket){socket.close();socket=null}var u=document.getElementById("url").value;var tkn=document.getElementById("token").value;var f=tkn?u+"?token="+encodeURIComponent(tkn):u;logMsg("Connecting to "+f);setStatus("Connecting...",false);try{socket=new WebSocket(f);socket.onopen=function(){logMsg("Connected");setStatus("Connected",true);sidebarEl.classList.add("visible")};socket.onmessage=function(e){var d=JSON.parse(e.data);handleMessage(d)};socket.onerror=function(){logMsg("Error")};socket.onclose=function(){logMsg("Disconnected");setStatus("Disconnected",false);sidebarEl.classList.remove("visible");editorEl.classList.remove("visible");socket=null}}catch(x){logMsg("Failed: "+x.message)}};',
'function send(m){if(socket)socket.send(JSON.stringify(m))}',
'function handleMessage(d){switch(d.type){case"ready":case"vault-changed":requestFileList();break;case"file-list":allFiles=d.payload;renderFileList(allFiles);if(currentFile&&d.payload.some(function(f){return f.path===currentFile})){if(!fileContents[currentFile]&&!isImg(currentFile)){send({type:"read-file",path:currentFile})}}else{editorEl.classList.remove("visible");currentFile=null}break;case"file-content":fileContents[d.path]=d.payload;if(d.path===currentFile)displayFile(d.path,d.payload);break;case"file-saved":case"file-created":case"file-deleted":case"file-renamed":modified=false;saveBtnEl.disabled=true;requestFileList();break}}',
'function requestFileList(){send({type:"list-files"})}',
'function refreshFiles(){requestFileList()}',
'function renderFileList(files){fileListEl.innerHTML="";var folders={};files.forEach(function(f){var dir=f.path.indexOf("/")>=0?f.path.substring(0,f.path.lastIndexOf("/")):"";if(!folders[dir])folders[dir]=[];folders[dir].push(f)});Object.keys(folders).sort().forEach(function(dir){if(dir){var h=document.createElement("div");h.className="folder-header";h.textContent=dir;fileListEl.appendChild(h)}folders[dir].forEach(function(f){var d=document.createElement("div");d.className="file-item"+(f.path===currentFile?" active":"");d.textContent=f.name;d.onclick=function(){if(isImg(f.path))showImage(f.path);else openFile(f.path)};fileListEl.appendChild(d)})})}',
'function filterFiles(){var q=document.getElementById("search-box").value.toLowerCase();renderFileList(q?allFiles.filter(function(f){return f.path.toLowerCase().indexOf(q)!==-1}):allFiles)}',
'function openFile(path){currentFile=path;modified=false;saveBtnEl.disabled=true;editorEl.classList.add("visible");filePathEl.textContent=path;if(fileContents[path])displayFile(path,fileContents[path]);else{contentEl.value="Loading...";send({type:"read-file",path:path})}}',
'function displayFile(pn,cv){contentEl.value=cv;if(previewMode)renderPreview(cv)}',
'function showImage(path){var url=origin+"/vault/"+path;logMsg("Image: "+url);lightboxImg.src=url;document.getElementById("lightbox-info").textContent=path;lightboxEl.classList.add("visible")}',
'function closeLightbox(e){if(e.target===e.currentTarget||e.target.classList.contains("lb-close")){lightboxEl.classList.remove("visible");lightboxImg.src=""}}',
'previewEl.onclick=function(e){if(e.target.tagName==="IMG"&&e.target.src.indexOf("/vault/")>=0){showImage(decodeURIComponent(e.target.src.split("/vault/")[1]))}}',
'function onEdit(){if(!currentFile)return;modified=true;saveBtnEl.disabled=false}',
'function saveFile(){if(!currentFile||!modified)return;send({type:"write-file",path:currentFile,payload:contentEl.value})}',
'function togglePreview(){previewMode=!previewMode;document.getElementById("previewBtn").textContent=previewMode?"Edit":"Preview";if(previewMode){contentEl.style.display="none";previewEl.classList.add("visible");renderPreview(contentEl.value)}else{contentEl.style.display="block";previewEl.classList.remove("visible")}}',
'function newNote(){var name=prompt("New note name:");if(!name)return;if(!name.endsWith(".md"))name+=".md";send({type:"create-file",path:name})}',
'function deleteFile(){if(!currentFile)return;if(!confirm("Delete this note?"))return;var p=currentFile;currentFile=null;editorEl.classList.remove("visible");send({type:"delete-file",path:p})}',
'function renameFile(){if(!currentFile)return;var parts=currentFile.split("/");var oldName=parts.pop();var newName=prompt("New name:",oldName);if(!newName||newName===oldName)return;var newPath=parts.length?parts.join("/")+"/"+newName:newName;send({type:"rename-file",path:currentFile,newPath:newPath})}',
'function renderPreview(md){previewEl.innerHTML=renderMarkdown(md||"")}',
'function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}',
'function renderMarkdown(md){var h=md;',
'h=h.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");',
'h=h.replace(/\`([^\`]+)\`/g,"<code>"+esc("$1")+"</code>");',
'h=h.replace(/^```([\\s\\S]*?)```$/gm,function(m,c){return"<pre><code>"+esc(c)+"</code></pre>"});',
'h=h.replace(/^### (.+)$/gm,"<h3>"+esc("$1")+"</h3>");',
'h=h.replace(/^## (.+)$/gm,"<h2>"+esc("$1")+"</h2>");',
'h=h.replace(/^# (.+)$/gm,"<h1>"+esc("$1")+"</h1>");',
'h=h.replace(/^> (.+)$/gm,"<blockquote>"+esc("$1")+"</blockquote>");',
'h=h.replace(/\\*\\*(.+?)\\*\\*/g,"<strong>"+esc("$1")+"</strong>");',
'h=h.replace(/_(.+?)_/g,"<em>"+esc("$1")+"</em>");',
'h=h.replace(/^- (.+)$/gm,"<li>"+esc("$1")+"</li>");',
'h=h.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g,function(m,t,u){if(u.match(/\\.(png|jpg|jpeg|gif|svg|webp)$/i)){var ip=u;if(ip.indexOf("://")===-1){if(ip.indexOf("/")===0)ip=ip.substring(1);var dir=currentFile?currentFile.substring(0,currentFile.lastIndexOf("/")+1):"";ip=dir+ip;ip="http://localhost:8080/vault/"+ip}return"<img src=\\""+ip+"\\" alt=\\""+esc(t)+"\\">"}return"<a href=\\""+u+"\\">"+t+"</a>"});',
'h=h.replace(/\\n\\n/g,"</p><p>");',
'h=h.replace(/\\n/g,"<br>");',
'return"<p>"+h+"</p>"}',
'</script></body></html>'
].join('\n');

module.exports = class VaultWebArkPlugin extends Plugin {
    settings = Object.assign({}, DEFAULT_SETTINGS);
    server = null;
    wss = null;
    clients = [];

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new VaultWebArkSettingTab(this.app, this));
        this.startServer();
        this.registerVaultEvents();
    }

    async loadSettings() {
        Object.assign(this.settings, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    registerVaultEvents() {
        const notify = () => {
            const msg = JSON.stringify({ type: 'vault-changed' });
            this.clients.forEach(c => { try { c.send(msg); } catch(e) {} });
        };
        this.registerEvent(this.app.vault.on('create', notify));
        this.registerEvent(this.app.vault.on('modify', notify));
        this.registerEvent(this.app.vault.on('delete', notify));
        this.registerEvent(this.app.vault.on('rename', notify));
    }

    startServer() {
        try {
            const { WebSocketServer } = require('ws');
            const vault = this.app.vault;

            const server = http.createServer((req, res) => {
                if (req.url === '/' || req.url === '/index.html') {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(CLIENT_HTML);
                    return;
                }

                // Serve vault files (images) under /vault/ path
                const vaultPrefix = '/vault/';
                if (req.url.startsWith(vaultPrefix)) {
                    const filePath = decodeURIComponent(req.url.substring(vaultPrefix.length));
                    const file = vault.getAbstractFileByPath(filePath);
                    if (file) {
                        vault.readBinary(file).then(data => {
                            const ext = path.extname(filePath).toLowerCase();
                            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                            res.writeHead(200, { 'Content-Type': contentType });
                            res.end(data);
                        }).catch(() => {
                            res.writeHead(404);
                            res.end('Not found');
                        });
                    } else {
                        res.writeHead(404);
                        res.end('Not found');
                    }
                    return;
                }

                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found');
            });

            const wss = new WebSocketServer({ server });

            wss.on('connection', (ws, req) => {
                const url = new URL(req.url, 'http://localhost');
                const token = url.searchParams.get('token');
                if (token !== this.settings.token) {
                    ws.close(1008, 'Unauthorized');
                    return;
                }

                this.clients.push(ws);
                ws.on('close', () => {
                    this.clients = this.clients.filter(c => c !== ws);
                });

                ws.on('message', async (msg) => {
                    try {
                        const data = JSON.parse(msg.toString());
                        await this.handleMessage(ws, data);
                    } catch (e) {
                        console.error('Vault Web Ark: Message error', e);
                    }
                });
                ws.send(JSON.stringify({ type: 'ready' }));
            });

            server.listen(this.settings.port, () => {
                console.log('Vault Web Ark: Server running on http://localhost:' + this.settings.port);
            });

            this.wss = wss;
            this.server = server;
        } catch (e) {
            console.error('Vault Web Ark: Server error', e);
        }
    }

    async handleMessage(ws, data) {
        const vault = this.app.vault;
        switch (data.type) {
            case 'list-files': {
                const files = vault.getFiles();
                const tree = files.map(f => ({ path: f.path, name: f.name, extension: f.extension }));
                ws.send(JSON.stringify({ type: 'file-list', payload: tree }));
                break;
            }
            case 'read-file': {
                const file = vault.getAbstractFileByPath(data.path);
                if (file) {
                    const content = await vault.read(file);
                    ws.send(JSON.stringify({ type: 'file-content', path: data.path, payload: content }));
                }
                break;
            }
            case 'write-file': {
                const file = vault.getAbstractFileByPath(data.path);
                if (file) {
                    await vault.modify(file, data.payload);
                    ws.send(JSON.stringify({ type: 'file-saved', path: data.path }));
                }
                break;
            }
            case 'create-file': {
                const dir = path.dirname(data.path);
                if (dir !== '.') {
                    const dirExists = vault.getAbstractFileByPath(dir);
                    if (!dirExists) await vault.createFolder(dir);
                }
                const file = await vault.create(data.path, '');
                ws.send(JSON.stringify({ type: 'file-created', path: file.path }));
                break;
            }
            case 'delete-file': {
                const file = vault.getAbstractFileByPath(data.path);
                if (file) {
                    await vault.delete(file, true);
                    ws.send(JSON.stringify({ type: 'file-deleted', path: data.path }));
                }
                break;
            }
            case 'rename-file': {
                const file = vault.getAbstractFileByPath(data.path);
                if (file) {
                    await vault.rename(file, data.newPath);
                    ws.send(JSON.stringify({ type: 'file-renamed', path: data.path, newPath: data.newPath }));
                }
                break;
            }
        }
    }

    onunload() {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.wss = null;
            this.clients = [];
        }
    }
};

class VaultWebArkSettingTab extends PluginSettingTab {
    constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        new Setting(containerEl).setName('Server Port').addText(t => t
            .setValue(String(this.plugin.settings.port))
            .onChange(async v => { this.plugin.settings.port = parseInt(v) || 8080; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName('Access Token').addText(t => t
            .setValue(this.plugin.settings.token)
            .onChange(async v => { this.plugin.settings.token = v; await this.plugin.saveSettings(); }));
    }
}
