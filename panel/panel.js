(() => {
  'use strict';
  const OWNER = 'Edgajuman';
  const CONTROL = 'AKScreen-Control';
  const BUILDS = 'AKScreen-Builds';
  // This is a convenience lock for the public static page. GitHub token permissions
  // provide the actual access control to the private repository.
  const PASSWORD_HASH = '30ee82905985cde18ebe0e6c163f9ccd22dc744940140eeb08d8e5986d47f6d7';
  const API = 'https://api.github.com';
  const STORE = 'aks-control-token-v1';
  const $ = id => document.getElementById(id);
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  let token = '';
  let feed = { notices: [], withdrawn: [] };
  let selected = null;
  let attachments = [];
  let dirty = false;

  function setStatus(message, error = false) {
    $('status').textContent = message;
    $('status').className = error ? 'error' : '';
  }
  const bytesToB64 = input => {
    const bytes = new Uint8Array(input);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  };
  const b64ToBytes = value => Uint8Array.from(atob(value.replace(/\s/g, '')), c => c.charCodeAt(0));
  async function sha(value) {
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value)))]
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  async function deriveKey(password, salt) {
    const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, material,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function api(path, options = {}) {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      let message = '';
      try { message = (await response.json()).message || ''; } catch { /* GitHub may return plain text. */ }
      throw new Error(`GitHub (${response.status})${message ? `: ${message}` : ''}`);
    }
    return response.status === 204 ? null : response.json();
  }
  async function validateToken(value) {
    token = value;
    const user = await api('/user');
    if (user.login !== OWNER) throw new Error(`La cuenta conectada es ${user.login}; se requiere ${OWNER}.`);
    const repository = await api(`/repos/${OWNER}/${CONTROL}`);
    if (repository.permissions && !repository.permissions.admin && !repository.permissions.push) {
      throw new Error('La cuenta no tiene escritura en AKScreen-Control.');
    }
  }
  async function saveEncryptedToken(password, value) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(value));
    localStorage.setItem(STORE, JSON.stringify({ salt: bytesToB64(salt), iv: bytesToB64(iv), encrypted: bytesToB64(encrypted) }));
  }
  async function readEncryptedToken(password) {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (!saved) return '';
    try {
      const key = await deriveKey(password, b64ToBytes(saved.salt));
      return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(saved.iv) }, key, b64ToBytes(saved.encrypted)));
    } catch { return ''; }
  }
  $('forget').onclick = () => {
    localStorage.removeItem(STORE);
    $('token').value = '';
    $('password').value = '';
    $('login-error').textContent = 'Credencial guardada eliminada.';
  };
  $('login').onsubmit = async event => {
    event.preventDefault();
    $('connect').disabled = true;
    $('login-error').textContent = 'Comprobando acceso…';
    const password = $('password').value;
    try {
      if (await sha(password) !== PASSWORD_HASH) throw new Error('Clave incorrecta.');
      const credential = $('token').value.trim() || await readEncryptedToken(password);
      if (!credential) throw new Error('Pega un token de GitHub válido.');
      await validateToken(credential);
      if ($('remember').checked) await saveEncryptedToken(password, credential);
      $('gate').hidden = true;
      $('app').hidden = false;
      await loadFeed();
      setStatus('Conectado como Edgajuman.');
    } catch (error) {
      token = '';
      $('app').hidden = true;
      $('gate').hidden = false;
      $('login-error').textContent = error.message;
    } finally { $('connect').disabled = false; }
  };
  function revokePreviews() {
    for (const item of attachments) if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }
  $('lock').onclick = () => {
    token = '';
    revokePreviews();
    feed = { notices: [], withdrawn: [] };
    attachments = [];
    $('app').hidden = true;
    $('gate').hidden = false;
    $('password').value = '';
    $('token').value = '';
    $('login-error').textContent = '';
  };
  async function loadFeed() {
    setStatus('Cargando avisos privados…');
    const result = await api(`/repos/${OWNER}/${CONTROL}/contents/feed.json?ref=main`);
    feed = JSON.parse(dec.decode(b64ToBytes(result.content)));
    feed.notices ||= [];
    feed.withdrawn ||= [];
    renderList();
    setStatus(`Cargadas ${feed.notices.length} publicaciones.`);
  }
  function renderList() {
    const query = $('search').value.toLowerCase();
    const list = $('list');
    list.replaceChildren();
    for (const notice of [...feed.notices].sort((a, b) => (b.date || '').localeCompare(a.date || ''))) {
      if (query && !`${notice.title} ${notice.id} ${notice.category}`.toLowerCase().includes(query)) continue;
      const button = document.createElement('button');
      button.className = notice.id === selected ? 'selected' : '';
      const title = document.createElement('span');
      title.textContent = notice.title || notice.id;
      const meta = document.createElement('small');
      meta.textContent = `${notice.category || 'anuncio'} · ${notice.published ? 'Publicado' : 'Borrador'}${feed.withdrawn.includes(notice.id) ? ' · Retirado' : ''}`;
      button.append(title, meta);
      button.onclick = () => openNotice(notice.id);
      list.append(button);
    }
  }
  const slug = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'anuncio';
  function markDirty() { dirty = true; }
  for (const id of ['title', 'notice-id', 'category', 'date', 'min-app', 'max-app', 'expires', 'markdown']) {
    $(id).addEventListener('input', () => {
      markDirty();
      if (id === 'title' && !selected) $('notice-id').value = slug($('title').value);
      if (id === 'markdown' && !$('preview').hidden) renderPreview();
    });
  }
  for (const input of document.querySelectorAll('.actions-select input')) input.addEventListener('change', markDirty);
  $('search').oninput = renderList;
  function clearEditor() {
    revokePreviews();
    attachments = [];
  }
  async function openNotice(id) {
    if (dirty && !confirm('Hay cambios sin guardar. ¿Descartarlos y abrir otro aviso?')) return;
    clearEditor();
    selected = id;
    const notice = feed.notices.find(item => item.id === id);
    if (!notice) return;
    attachments = (notice.media || []).map(item => ({ ...item, existing: true, name: item.path.split('/').pop() }));
    $('title').value = notice.title || '';
    $('notice-id').value = notice.id;
    $('notice-id').readOnly = true;
    $('category').value = notice.category || 'announcement';
    $('date').value = notice.date || new Date().toISOString().slice(0, 10);
    $('min-app').value = notice.min_app || '';
    $('max-app').value = notice.max_app || '';
    $('expires').value = notice.expires ? new Date(notice.expires * 1000).toISOString().slice(0, 16) : '';
    $('heading').textContent = notice.title || notice.id;
    $('revision').textContent = `Revisión ${notice.revision || 1} · ${notice.published ? 'Publicado' : 'Borrador'}`;
    for (const checkbox of document.querySelectorAll('.actions-select input')) checkbox.checked = (notice.actions || []).some(action => action.kind === checkbox.value);
    const path = notice.markdown_file || `notices/${notice.id}.md`;
    try {
      const file = await api(`/repos/${OWNER}/${CONTROL}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=main`);
      $('markdown').value = dec.decode(b64ToBytes(file.content));
    } catch { $('markdown').value = notice.markdown || ''; }
    renderMedia();
    renderList();
    dirty = false;
    $('withdraw').hidden = !notice.published;
    showEditTab();
  }
  function fresh() {
    if (dirty && !confirm('Hay cambios sin guardar. ¿Descartarlos?')) return;
    clearEditor();
    selected = null;
    $('title').value = '';
    $('notice-id').value = '';
    $('notice-id').readOnly = false;
    $('category').value = 'announcement';
    $('date').value = new Date().toISOString().slice(0, 10);
    $('min-app').value = '2.3.0';
    $('max-app').value = '';
    $('expires').value = '';
    $('markdown').value = '';
    $('heading').textContent = 'Nueva publicación';
    $('revision').textContent = 'Borrador';
    $('withdraw').hidden = true;
    for (const checkbox of document.querySelectorAll('.actions-select input')) checkbox.checked = false;
    renderMedia();
    renderList();
    dirty = false;
    showEditTab();
  }
  $('new').onclick = fresh;
  function cleanName(value) {
    return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9._-]/g, '-').slice(-100) || 'media.bin';
  }
  $('files').onchange = event => {
    let addedMarkdown = '';
    for (const file of event.target.files) {
      if (!/\.(png|jpe?g|webp|gif|mp4|webm|mov)$/i.test(file.name)) { setStatus(`Formato no admitido: ${file.name}`, true); continue; }
      if (file.size > 15 * 1024 * 1024) { setStatus(`Cada archivo debe pesar menos de 15 MB: ${file.name}`, true); continue; }
      if (attachments.length >= 16) { setStatus('Una publicación admite hasta 16 adjuntos.', true); continue; }
      if (attachments.filter(item => item.file).reduce((sum, item) => sum + item.file.size, 0) + file.size > 50 * 1024 * 1024) {
        setStatus('El total de adjuntos nuevos no puede superar 50 MB.', true); continue;
      }
      const kind = /\.(mp4|webm|mov)$/i.test(file.name) ? 'video' : /\.gif$/i.test(file.name) ? 'gif' : 'image';
      const name = cleanName(file.name);
      if (attachments.some(item => item.name === name)) { setStatus(`Ya existe un adjunto llamado ${name}; cambia el nombre y vuelve a intentarlo.`, true); continue; }
      attachments.push({ file, path: '', kind, name, originalName: file.name, existing: false });
      addedMarkdown += kind === 'video' ? `\n[Reproducir ${name}](${name})\n` : `\n![${name}](${name})\n`;
    }
    event.target.value = '';
    if (addedMarkdown) { $('markdown').value += addedMarkdown; markDirty(); }
    renderMedia();
    if (!$('preview').hidden) renderPreview();
  };
  function removeReference(value) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    $('markdown').value = $('markdown').value.replace(new RegExp(`!?\\[[^\\]]*\\]\\(${escaped}\\)`, 'g'), '');
  }
  function renderMedia() {
    const root = $('media-list');
    root.replaceChildren();
    attachments.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'media-row';
      const label = document.createElement('span');
      label.textContent = `${item.originalName || item.name} · ${item.kind}${item.existing ? ' · guardado' : ' · pendiente'}`;
      const remove = document.createElement('button');
      remove.className = 'secondary';
      remove.textContent = 'Quitar';
      remove.onclick = () => {
        removeReference(item.path || item.name);
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        attachments.splice(index, 1);
        renderMedia();
        markDirty();
      };
      row.append(label, remove);
      root.append(row);
    });
  }
  function mediaType(path) {
    const extension = path.toLowerCase().split('.').pop();
    return ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' })[extension] || 'application/octet-stream';
  }
  async function loadSavedPreview(item, target) {
    try {
      setStatus(`Cargando vista previa de ${item.name}…`);
      const path = item.path.split('/').map(encodeURIComponent).join('/');
      const blobInfo = await api(`/repos/${OWNER}/${CONTROL}/contents/${path}?ref=main`);
      if (blobInfo.size > 8 * 1024 * 1024) throw new Error('Adjunto demasiado grande para la vista previa del navegador.');
      let content = blobInfo.content;
      if (!content) content = (await api(`/repos/${OWNER}/${CONTROL}/git/blobs/${blobInfo.sha}`)).content;
      item.previewUrl = URL.createObjectURL(new Blob([b64ToBytes(content)], { type: mediaType(item.path) }));
      renderPreview();
      setStatus('Vista previa cargada.');
    } catch (error) { target.textContent = error.message; setStatus(error.message, true); }
  }
  function appendInline(parent, text) {
    const syntax = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|`([^`]+)`/g;
    let cursor = 0;
    let match;
    while ((match = syntax.exec(text))) {
      parent.append(document.createTextNode(text.slice(cursor, match.index)));
      if (match[1] !== undefined) {
        const item = attachments.find(candidate => candidate.path === match[2] || candidate.name === match[2]);
        if (item) {
          if (item.file && !item.previewUrl) item.previewUrl = URL.createObjectURL(item.file);
          if (item.previewUrl) {
            if (item.kind === 'video') {
              const video = document.createElement('video');
              video.controls = true; video.muted = true; video.playsInline = true; video.src = item.previewUrl;
              video.setAttribute('aria-label', match[1] || item.name);
              parent.append(video);
            } else {
              const image = document.createElement('img');
              image.src = item.previewUrl; image.alt = match[1]; parent.append(image);
            }
          } else {
            const load = document.createElement('button');
            load.type = 'button'; load.className = 'preview-load'; load.textContent = `Cargar vista previa: ${item.name}`;
            load.onclick = () => loadSavedPreview(item, load);
            parent.append(load);
          }
        } else parent.append(document.createTextNode(match[1]));
      } else if (match[3] !== undefined) {
        const item = attachments.find(candidate => candidate.path === match[4] || candidate.name === match[4]);
        if (item?.kind === 'video') {
          if (item.file && !item.previewUrl) item.previewUrl = URL.createObjectURL(item.file);
          if (item.previewUrl) {
            const video = document.createElement('video');
            video.controls = true; video.muted = true; video.playsInline = true; video.src = item.previewUrl;
            video.setAttribute('aria-label', match[3]); parent.append(video);
          } else {
            const load = document.createElement('button');
            load.type = 'button'; load.className = 'preview-load'; load.textContent = `Cargar video: ${item.name}`;
            load.onclick = () => loadSavedPreview(item, load); parent.append(load);
          }
        } else {
          let address;
          try { address = new URL(match[4]); } catch { address = null; }
          if (address?.protocol === 'https:') {
            const link = document.createElement('a'); link.href = address.href; link.target = '_blank';
            link.rel = 'noopener noreferrer'; link.textContent = match[3]; parent.append(link);
          } else parent.append(document.createTextNode(match[3]));
        }
      } else if (match[5] !== undefined) {
        const strong = document.createElement('strong'); strong.textContent = match[5]; parent.append(strong);
      } else {
        const code = document.createElement('code'); code.textContent = match[6]; parent.append(code);
      }
      cursor = syntax.lastIndex;
    }
    parent.append(document.createTextNode(text.slice(cursor)));
  }
  function renderPreview() {
    const root = $('preview');
    root.replaceChildren();
    let list = null;
    for (const line of $('markdown').value.split(/\r?\n/)) {
      if (!line.trim()) { list = null; continue; }
      const heading = /^(#{1,3})\s+(.*)$/.exec(line);
      if (heading) {
        list = null;
        const element = document.createElement(`h${heading[1].length}`); appendInline(element, heading[2]); root.append(element); continue;
      }
      if (/^>\s?/.test(line)) {
        list = null;
        const quote = document.createElement('blockquote'); appendInline(quote, line.replace(/^>\s?/, '')); root.append(quote); continue;
      }
      if (/^[-*]\s+/.test(line)) {
        if (!list) { list = document.createElement('ul'); root.append(list); }
        const entry = document.createElement('li'); appendInline(entry, line.replace(/^[-*]\s+/, '')); list.append(entry); continue;
      }
      list = null;
      const paragraph = document.createElement('p'); appendInline(paragraph, line); root.append(paragraph);
    }
  }
  function showEditTab() {
    $('markdown').hidden = false; $('preview').hidden = true;
    $('tab-edit').classList.add('active'); $('tab-preview').classList.remove('active');
  }
  $('tab-edit').onclick = showEditTab;
  $('tab-preview').onclick = () => {
    renderPreview(); $('markdown').hidden = true; $('preview').hidden = false;
    $('tab-preview').classList.add('active'); $('tab-edit').classList.remove('active');
  };
  function encodePath(path) { return path.split('/').map(encodeURIComponent).join('/'); }
  async function createBlob(content) {
    return api(`/repos/${OWNER}/${CONTROL}/git/blobs`, {
      method: 'POST', body: JSON.stringify({ content, encoding: 'base64' })
    });
  }
  async function writeCommit(files, message) {
    const reference = await api(`/repos/${OWNER}/${CONTROL}/git/ref/heads/main`);
    const parent = await api(`/repos/${OWNER}/${CONTROL}/git/commits/${reference.object.sha}`);
    const tree = await api(`/repos/${OWNER}/${CONTROL}/git/trees`, {
      method: 'POST', body: JSON.stringify({ base_tree: parent.tree.sha,
        tree: [...files].map(([path, sha]) => ({ path, mode: '100644', type: 'blob', sha })) })
    });
    const commit = await api(`/repos/${OWNER}/${CONTROL}/git/commits`, {
      method: 'POST', body: JSON.stringify({ message, tree: tree.sha, parents: [reference.object.sha] })
    });
    await api(`/repos/${OWNER}/${CONTROL}/git/refs/heads/main`, {
      method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false })
    });
    return commit.sha;
  }
  async function dispatchContent() {
    await api(`/repos/${OWNER}/${BUILDS}/actions/workflows/content.yml/dispatches`, {
      method: 'POST', body: JSON.stringify({ ref: 'main' })
    });
  }
  async function save(publish) {
    const id = $('notice-id').value.trim();
    const title = $('title').value.trim();
    const category = $('category').value;
    if (!/^[a-z0-9][a-z0-9._-]{0,95}$/.test(id) || id.includes('..')) throw new Error('El ID usa minúsculas, números, punto, guion o guion bajo.');
    if (!title) throw new Error('Escribe un título.');
    if (!/^(announcement|update|security|tutorial|promotion)$/.test(category)) throw new Error('Categoría no válida.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test($('date').value)) throw new Error('Elige una fecha válida.');
    const previous = feed.notices.find(item => item.id === id);
    const revision = (previous?.revision || 0) + 1;
    const markdownPath = previous?.markdown_file || `notices/${id}.md`;
    const files = new Map();
    for (const item of attachments) {
      if (item.file) {
        const path = `media/${id}/${revision}-${crypto.randomUUID()}/${cleanName(item.file.name)}`;
        const created = await createBlob(bytesToB64(await item.file.arrayBuffer()));
        files.set(path, created.sha);
        item.path = path;
      }
      if (!item.path.startsWith('media/') || item.path.split('/').includes('..')) throw new Error('La ruta de un adjunto no es válida.');
    }
    let markdown = $('markdown').value;
    for (const item of attachments.filter(entry => entry.file)) markdown = markdown.replaceAll(`](${item.name})`, `](${item.path})`);
    if (enc.encode(markdown).length > 60000) throw new Error('El texto supera el límite de 60 KB.');
    const declaredMedia = new Set(attachments.map(item => item.path));
    for (const match of markdown.matchAll(/\]\((media\/[^)]+)\)/g)) {
      if (!declaredMedia.has(match[1])) throw new Error(`El adjunto ${match[1]} no está en la lista de medios; vuelve a añadirlo o quita su enlace.`);
    }
    const actions = [...document.querySelectorAll('.actions-select input:checked')].map(input => ({
      label: ({ versions: 'Ver versiones', extensions: 'Abrir extensiones', themes: 'Ver temas' })[input.value], kind: input.value
    }));
    const notice = {
      id, revision, title, category, date: $('date').value, published: publish,
      markdown_file: markdownPath, media: attachments.map(item => ({ path: item.path, kind: item.kind })), actions
    };
    if ($('min-app').value.trim()) notice.min_app = $('min-app').value.trim();
    if ($('max-app').value.trim()) notice.max_app = $('max-app').value.trim();
    if ($('expires').value) notice.expires = Math.floor(new Date($('expires').value).getTime() / 1000);
    const next = {
      ...feed,
      withdrawn: publish ? feed.withdrawn.filter(withdrawnId => withdrawnId !== id) : feed.withdrawn,
      notices: [...feed.notices.filter(item => item.id !== id), notice]
    };
    files.set('feed.json', (await createBlob(bytesToB64(enc.encode(JSON.stringify(next, null, 2) + '\n')))).sha);
    files.set(markdownPath, (await createBlob(bytesToB64(enc.encode(markdown)))).sha);
    const sha = await writeCommit(files, `${publish ? 'Publish' : 'Save draft'} AK Screen notice: ${title}`);
    feed = next; selected = id; $('notice-id').readOnly = true; dirty = false;
    for (const item of attachments) { item.file = null; item.existing = true; }
    renderList(); $('heading').textContent = title;
    $('revision').textContent = `Revisión ${revision} · ${publish ? 'Publicado' : 'Borrador'}`;
    $('withdraw').hidden = !publish;
    setStatus(`${publish ? 'Aviso guardado para publicación' : 'Borrador guardado'} en AKScreen-Control (${sha.slice(0, 7)}).`);
    if (publish) {
      try { await dispatchContent(); setStatus('Aviso guardado. Sincronización firmada iniciada; consulta el estado abajo.'); }
      catch (error) { setStatus(`El aviso quedó guardado, pero no se inició la sincronización: ${error.message}. Pulsa “Sincronizar ahora”.`, true); }
    }
  }
  $('draft').onclick = async () => { try { await save(false); } catch (error) { setStatus(error.message, true); } };
  $('publish').onclick = async () => {
    if (!confirm('¿Publicar este aviso? El texto y los adjuntos se harán públicos en el canal firmado de AK Screen.')) return;
    $('publish').disabled = true;
    try { await save(true); } catch (error) { setStatus(error.message, true); }
    finally { $('publish').disabled = false; }
  };
  $('withdraw').onclick = async () => {
    if (!selected || !confirm('¿Retirar este aviso del canal de AK Screen?')) return;
    try {
      const notice = feed.notices.find(item => item.id === selected);
      const next = {
        ...feed,
        withdrawn: [...new Set([...feed.withdrawn, selected])],
        notices: feed.notices.map(item => item.id === selected ? { ...item, published: false, revision: (item.revision || 0) + 1 } : item)
      };
      await writeCommit(new Map([['feed.json', (await createBlob(bytesToB64(enc.encode(JSON.stringify(next, null, 2) + '\n')))).sha]]), `Withdraw AK Screen notice: ${notice.title}`);
      feed = next; renderList(); $('revision').textContent = 'Retirado'; $('withdraw').hidden = true;
      try { await dispatchContent(); setStatus('Aviso retirado y sincronización firmada iniciada.'); }
      catch (error) { setStatus(`Retiro guardado, pero falta sincronizar: ${error.message}. Pulsa “Sincronizar ahora”.`, true); }
    } catch (error) { setStatus(error.message, true); }
  };
  $('dispatch').onclick = async () => {
    $('dispatch').disabled = true;
    try { await dispatchContent(); setStatus('Sincronización firmada iniciada. La app recibirá el contenido cuando termine la validación.'); }
    catch (error) { setStatus(error.message, true); }
    finally { $('dispatch').disabled = false; }
  };
  $('refresh').onclick = () => loadFeed().catch(error => setStatus(error.message, true));
  $('markdown').addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      event.preventDefault(); const area = event.target; area.setRangeText('  ', area.selectionStart, area.selectionEnd, 'end');
      area.dispatchEvent(new Event('input'));
    }
  });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
})();
