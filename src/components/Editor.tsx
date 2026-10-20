import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type CSSProperties } from 'react';
import { copy } from '../lib/i18n';
import { DEVICES, type Device, type DeviceId } from '../lib/devices';
import { drawPhone } from '../lib/phone';
import { inkFor } from '../lib/template-design';
import { AI_DIRECTIONS } from '../lib/ai-art';
import { DEFAULT_DESIGN, MAX_BATCH_BYTES, MAX_FILE_BYTES, MAX_PIXELS, MAX_SHOTS, abortIfNeeded, filename, isSupportedFile, move, slug, validColor, palette, type Design, type Lang, type Output, type Platform, type Shot, type Style } from '../lib/project';
import { CaptionOverflow, renderComposition } from '../lib/render';
import { downloadBlob, encodePng, makeZip } from '../lib/export';

function Icon({ name, size = 20 }: { name: 'upload' | 'arrow' | 'download' | 'spark' | 'image' | 'check' | 'lock'; size?: number }) {
  const paths = { upload: 'M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5', arrow: 'M4 12h16m-6-6 6 6-6 6', download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', spark: 'm12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z', image: 'M3 3h18v18H3ZM3 17l6-6 4 4 3-3 5 5M16 7h.01', check: 'm5 12 4 4L19 6', lock: 'M6 10h12v11H6ZM8 10V6a4 4 0 0 1 8 0v4' };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
function DeviceThumbnail({ device }: { device: Device }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    const image = new Image(); image.src = '/demo-screen.svg';
    void image.decode().then(() => {
      if (!alive || !ref.current) return;
      const canvas = ref.current; canvas.width = 140; canvas.height = 292;
      const ctx = canvas.getContext('2d')!;
      const scale = Math.min(124 / device.width, 270 / device.height);
      drawPhone(ctx, image, 390, 844, device, false, (140 - device.width * scale) / 2, 7, scale);
    }).catch(() => {});
    return () => { alive = false; if (ref.current) ref.current.width = ref.current.height = 0; };
  }, [device]);
  return <canvas ref={ref} width="140" height="292" aria-hidden="true" />;
}
function LivePreview({ shot, design, platform, lang }: { shot?: Shot; design: Design; platform: Platform; lang: Lang }) {
  const [src, setSrc] = useState(''); const [overflow, setOverflow] = useState(false); const t = copy[lang];
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      const image = new Image(); image.src = shot?.url || '/demo-screen.svg';
      try {
        await image.decode();
        const canvas = await renderComposition({ image, sourceWidth: shot?.width || 390, sourceHeight: shot?.height || 844, caption: shot?.caption ?? t.sampleCaption, platform, design, previewWidth: 390 });
        if (alive) { setSrc(canvas.toDataURL('image/png')); setOverflow(false); }
        canvas.width = canvas.height = 0;
      } catch (error) { if (alive) setOverflow(error instanceof CaptionOverflow); }
    }, 120);
    return () => { alive = false; clearTimeout(timer); };
  }, [shot, design, platform, t.sampleCaption]);
  return <div className="live-image">{src && <img src={src} alt={shot ? `${t.preview}: ${shot.file.name}` : t.previewEmpty} />}{overflow && <p className="preview-error" role="status">{t.textTooLong}</p>}</div>;
}

export default function Editor({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [shots, setShots] = useState<Shot[]>([]); const [design, setDesign] = useState<Design>({ ...DEFAULT_DESIGN });
  const [outputs, setOutputs] = useState<Output[]>([]); const [archive, setArchive] = useState<Blob>();
  const [busy, setBusy] = useState(false); const [adding, setAdding] = useState(false); const [error, setError] = useState('');
  const [notice, setNotice] = useState(''); const [status, setStatus] = useState(''); const [progress, setProgress] = useState<number>();
  const [active, setActive] = useState(0); const [previewPlatform, setPreviewPlatform] = useState<Platform>('Android');
  const [dragging, setDragging] = useState(false); const [aiFailed, setAiFailed] = useState(false);
  const [backgroundPreview, setBackgroundPreview] = useState('');
  const backgroundUrl = useRef('');
  const [aiDiagnostic, setAiDiagnostic] = useState('');
  const [gpuAvailable, setGpuAvailable] = useState(true); const input = useRef<HTMLInputElement>(null);
  const replacement = useRef<number | undefined>(undefined); const controller = useRef<AbortController | undefined>(undefined);
  const outputRef = useRef<Output[]>([]); const shotRef = useRef<Shot[]>([]); const mounted = useRef(true);
  const locked = busy || adding;
  const brand = palette(design);
  useEffect(() => {
    mounted.current = true;
    setGpuAvailable(Boolean(navigator.gpu && typeof navigator.storage?.getDirectory === 'function' && window.isSecureContext));
    return () => {
      mounted.current = false; controller.current?.abort();
      if (backgroundUrl.current) URL.revokeObjectURL(backgroundUrl.current);
      shotRef.current.forEach(s => URL.revokeObjectURL(s.url)); outputRef.current.forEach(o => URL.revokeObjectURL(o.url));
    };
  }, []);
  function invalidate() {
    if (backgroundUrl.current) URL.revokeObjectURL(backgroundUrl.current);
    backgroundUrl.current = ''; setBackgroundPreview('');
    outputRef.current.forEach(o => URL.revokeObjectURL(o.url)); outputRef.current = []; setOutputs([]); setArchive(undefined);
    setError(''); setNotice(''); setAiFailed(false); setAiDiagnostic('');
  }
  function update(next: Partial<Design>) { invalidate(); setDesign(old => ({ ...old, ...next })); }
  function updateShots(next: Shot[]) { shotRef.current = next; setShots(next); }
  function reorder(from: number, to: number) { if (locked) return; invalidate(); updateShots(move(shots, from, to)); setActive(to); }
  async function addFiles(files: File[], replaceAt?: number) {
    if (locked || !files.length) return;
    setAdding(true); invalidate(); const next = [...shots]; let rejected = false;
    try {
      for (const file of files) {
        const replacing = replaceAt !== undefined;
        const currentBytes = next.reduce((sum, s, i) => sum + (replacing && i === replaceAt ? 0 : s.file.size), 0);
        if ((!replacing && next.length >= MAX_SHOTS) || !isSupportedFile(file.type) || file.size > MAX_FILE_BYTES || currentBytes + file.size > MAX_BATCH_BYTES) { rejected = true; continue; }
        try {
          const bitmap = await createImageBitmap(file);
          const width = bitmap.width, height = bitmap.height; bitmap.close();
          if (!width || !height || width * height > MAX_PIXELS) { rejected = true; continue; }
          const shot: Shot = { id: crypto.randomUUID(), file, url: URL.createObjectURL(file), width, height, caption: replacing ? next[replaceAt!].caption : '' };
          if (replacing) { URL.revokeObjectURL(next[replaceAt!].url); next[replaceAt!] = shot; break; }
          next.push(shot);
        } catch { rejected = true; }
      }
      updateShots(next); setActive(Math.min(active, Math.max(0, next.length - 1))); if (rejected) setError(t.uploadError);
    } finally { setAdding(false); }
  }
  function onInput(event: ChangeEvent<HTMLInputElement>) { const files = [...(event.target.files || [])]; const at = replacement.current; replacement.current = undefined; event.target.value = ''; void addFiles(files, at); }
  function choose(at?: number) { replacement.current = at; if (input.current) { input.current.multiple = at === undefined; input.current.click(); } }
  function remove(index: number) { invalidate(); URL.revokeObjectURL(shots[index].url); updateShots(shots.filter((_, i) => i !== index)); setActive(0); }
  function drop(event: DragEvent) { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length) void addFiles([...event.dataTransfer.files]); }
  async function example() {
    if (locked) return;
    try { const response = await fetch('/demo-screen.svg'); const svg = await response.blob(); const image = new Image(); const url = URL.createObjectURL(svg); image.src = url; await image.decode(); const c = document.createElement('canvas'); c.width = 390; c.height = 844; c.getContext('2d')!.drawImage(image, 0, 0); URL.revokeObjectURL(url); const blob = await new Promise<Blob | null>(resolve => c.toBlob(resolve, 'image/png')); if (blob) { await addFiles([new File([blob], 'storeframe-example.png', { type: 'image/png' })]); } }
    catch { setError(t.uploadError); }
  }
  async function clearCache() {
    if (!window.confirm(t.cacheConfirm)) return;
    setAdding(true); setError('');
    try { const ai = await import('../lib/ai'); await ai.clearModelCache(); setNotice(t.cacheCleared); }
    catch { setError(t.aiError); } finally { setAdding(false); }
  }
  async function generate() {
    if (locked) return;
    if (!shots.length) { setError(t.noScreens); return; }
    if (!design.platforms.length) { setError(t.noPlatforms); return; }
    if (!validColor(design.primary) || !validColor(design.secondary)) { setError(t.colorError); return; }
    invalidate(); setBusy(true); setStatus(t.working); setProgress(undefined);
    const abort = new AbortController(); controller.current = abort; const signal = abort.signal;
    const built: Output[] = []; let background: HTMLCanvasElement | undefined;
    try {
      // Validate captions before any multi-gigabyte model download.
      for (const shot of shots) for (const platform of design.platforms) {
        const bitmap = await createImageBitmap(shot.file);
        try { const c = await renderComposition({ image: bitmap, sourceWidth: shot.width, sourceHeight: shot.height, caption: shot.caption, platform, design, previewWidth: 80 }); c.width = c.height = 0; }
        finally { bitmap.close(); }
        abortIfNeeded(signal);
      }
      if (design.useAI) {
        setStatus(t.loadingAI);
        if (!gpuAvailable) { setAiFailed(true); throw new Error('AI unavailable'); }
        try {
          const ai = await import('../lib/ai');
          background = await ai.generateBackground(shots, design, signal, event => {
              if (signal.aborted || !mounted.current) return;
              const detail = event.detail as { loaded?: number; total?: number; step?: number; steps?: number; shard?: number; shards?: number; cached?: boolean };
              if (detail.cached) setStatus(t.loadingAI);
              else if (event.stage === 'denoise') setStatus(`${t.denoise} ${detail.step || 0}/${detail.steps || 4}`);
              else if (event.stage === 'encode-reference') setStatus(t.encoding);
              else if (event.stage === 'decode') setStatus(t.decoding);
              else if (['weights', 'text-encoder', 'embeddings'].includes(event.stage)) {
                const part = detail.shards ? ` · ${detail.shard}/${detail.shards}` : '';
                const bytes = detail.total ? ` · ${Math.round((detail.loaded || 0) / 1048576)} / ${Math.round(detail.total / 1048576)} MB` : '';
                setStatus(t.downloadingModel + part + bytes);
              }
              else setStatus(t.loadingAI);
              setProgress(!detail.cached && detail.total ? detail.loaded! / detail.total : undefined);
          });
        } catch (cause) { if (!signal.aborted) { setAiFailed(true); setAiDiagnostic(String(cause).slice(0, 800)); } throw cause; }
      }
      for (let index = 0; index < shots.length; index++) {
        const shot = shots[index]; const bitmap = await createImageBitmap(shot.file);
        try {
          for (const platform of design.platforms) {
            abortIfNeeded(signal); setStatus(`${t.working} ${built.length + 1}/${shots.length * design.platforms.length}`); setProgress(built.length / (shots.length * design.platforms.length));
            const canvas = await renderComposition({ image: bitmap, sourceWidth: shot.width, sourceHeight: shot.height, caption: shot.caption, platform, design, background });
            try {
              const png = await encodePng(canvas, signal); abortIfNeeded(signal);
              const url = URL.createObjectURL(new Blob([new Uint8Array(png)], { type: 'image/png' }));
              built.push({ platform, name: filename(design.appName, index), url, png, width: canvas.width, height: canvas.height, caption: shot.caption });
            } finally { canvas.width = canvas.height = 0; }
          }
        } finally { bitmap.close(); }
      }
      abortIfNeeded(signal); setStatus(t.packing); setProgress(undefined);
      await new Promise(resolve => setTimeout(resolve, 0));
      const zip = makeZip(built); abortIfNeeded(signal);
      if (background) {
        const png = await encodePng(background, signal); abortIfNeeded(signal);
        const url = URL.createObjectURL(new Blob([new Uint8Array(png)], { type: 'image/png' }));
        backgroundUrl.current = url; setBackgroundPreview(url);
      }
      outputRef.current = built; setOutputs(built); setArchive(new Blob([new Uint8Array(zip)], { type: 'application/zip' })); setStatus('');
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }), 60);
    } catch (cause) {
      built.forEach(o => URL.revokeObjectURL(o.url));
      if (signal.aborted) setNotice(t.cancelled);
      else if (cause instanceof CaptionOverflow) setError(t.textTooLong);
      else {
        console.error('StoreFrame generation failed', cause);
        const quota = String(cause).includes('QuotaExceededError');
        setError(design.useAI && !background ? (quota ? (lang === 'es' ? 'El navegador no permite guardar el modelo completo. Libera espacio o prueba un perfil normal, fuera del modo privado. También puedes usar las plantillas sin IA.' : 'Your browser cannot store the complete model. Free some space or try a regular profile outside private mode. You can also use templates without AI.') : t.aiError) : t.exportError);
      }
    } finally { if (background) background.width = background.height = 0; controller.current = undefined; setBusy(false); setProgress(undefined); }
  }
  function cancel() { controller.current?.abort(); }
  return <>
    <input className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" multiple ref={input} onChange={onInput} tabIndex={-1} aria-label={t.choose} />
    <div className="studio-grid">
      <div className="editor-main">
        <fieldset className="settings-panel" disabled={locked}>
          <legend className="visually-hidden">{t.settings}</legend>
          <div className="panel-heading"><span className="step-number">01</span><div><h3>{t.settings}</h3><p>{t.settingsSub}</p></div></div>
          <div className="settings-grid">
            <label className="field"><span>{t.app} <small>{t.optional}</small></span><input value={design.appName} maxLength={80} placeholder={t.appPlaceholder} onChange={e => update({ appName: e.target.value })} /></label>
            <div className="field"><span id="platform-label">{t.platforms}</span><div className="platform-options" role="group" aria-labelledby="platform-label">{(['Android', 'iOS'] as const).map(p => <label key={p} className={`platform-option ${design.platforms.includes(p) ? 'selected' : ''}`}><input type="checkbox" checked={design.platforms.includes(p)} onChange={e => update({ platforms: e.target.checked ? [...design.platforms, p].sort() as Platform[] : design.platforms.filter(v => v !== p) })} /><span className="phone-icon" />{p === 'Android' ? 'Android' : 'iOS / iPhone'}<span className="option-check">{design.platforms.includes(p) && <Icon name="check" size={13} />}</span></label>)}</div></div>
          </div>
          <div className="color-group"><div className="field"><span>{t.colors} <small>{t.optional}</small></span></div><div className="color-options">{(['primary', 'secondary'] as const).map(key => <div className="color-option" key={key}><label className={`color-picker ${!design[key] ? 'unset' : ''}`} style={{ backgroundColor: design[key] || undefined }}><span className="visually-hidden">{t.chooseColor}: {t[key]}</span><input type="color" value={validColor(design[key]) && design[key] ? design[key] : key === 'primary' ? '#244d42' : '#e6ebdc'} onChange={e => update({ [key]: e.target.value })} /></label><label className="color-text"><span>{t[key]}</span><input aria-label={`${t[key]} hex`} value={design[key]} placeholder={t.noColor} maxLength={7} onChange={e => update({ [key]: e.target.value })} aria-invalid={!validColor(design[key])} spellCheck={false} /></label>{design[key] && <button type="button" className="clear-color" aria-label={`${t.clear} ${t[key]}`} onClick={() => update({ [key]: '' })}>×</button>}</div>)}</div></div>
          {!design.useAI && <div className="field"><span id="style-label">{t.style}</span><div className="style-options" style={{ '--brand-primary': brand.primary, '--brand-secondary': brand.secondary, '--brand-ink': inkFor(brand.primary), '--brand-secondary-ink': inkFor(brand.secondary) } as CSSProperties} role="group" aria-labelledby="style-label">{(['clean', 'gradient', 'editorial'] as Style[]).map(style => <button key={style} type="button" className={`style-card ${style === design.style ? 'selected' : ''}`} aria-pressed={style === design.style} onClick={() => update({ style })}><span className={`style-swatch ${style}`}><i /><b /><em /></span><span>{t[style]}{style === design.style && <Icon name="check" size={14} />}</span><small>{t[`${style}Note` as 'cleanNote']}</small></button>)}</div></div>}
          {design.useAI && <p className="ai-mode-note">{t.aiIndependent}</p>}
        </fieldset>

        <fieldset className="settings-panel device-panel" disabled={locked}>
          <legend className="visually-hidden">{t.devices}</legend>
          <div className="panel-heading"><span className="step-number">02</span><div><h3>{t.devices}</h3><p>{t.devicesSub}</p></div></div>
          {design.platforms.map(platform => <fieldset className="device-platform" key={platform}>
            <legend>{platform === 'Android' ? t.androidDevice : t.iosDevice}</legend>
            <div className="device-options">{DEVICES.filter(d => d.platform === platform).map(d => <label key={d.id} className={`device-card ${design.devices[platform] === d.id ? 'selected' : ''}`}>
              <input type="radio" name={`device-${platform}`} value={d.id} checked={design.devices[platform] === d.id} onChange={e => { update({ devices: { ...design.devices, [platform]: e.target.value as DeviceId } }); setPreviewPlatform(platform); }} />
              <DeviceThumbnail device={d} /><span>{d.name}</span>
            </label>)}</div>
          </fieldset>)}
          {!design.platforms.length && <p className="device-note">{t.noPlatforms}</p>}
          <p className="device-note">{t.deviceNote}</p>
          {design.platforms.includes('iOS') && <p className="device-note">{t.iphone18Note}</p>}
        </fieldset>

        <div className="shots-panel">
          <div className="panel-heading"><span className="step-number">03</span><div><h3>{t.shots}</h3><p>{t.shotsSub}</p></div><span className="shot-counter">{shots.length} / 8</span></div>
          {shots.length > 0 && <div className="shot-list">{shots.map((shot, index) => <article key={shot.id} className={`shot-card ${index === active ? 'active' : ''}`} draggable={!locked} onDragStart={e => e.dataTransfer.setData('text/storeframe-index', String(index))} onDragOver={e => { if (e.dataTransfer.types.includes('text/storeframe-index')) e.preventDefault(); }} onDrop={e => { if (!e.dataTransfer.types.includes('text/storeframe-index')) return; e.preventDefault(); reorder(Number(e.dataTransfer.getData('text/storeframe-index')), index); }}>
            <button type="button" className="shot-thumbnail" onClick={() => setActive(index)} aria-label={`${t.preview} ${index + 1}`}><img src={shot.url} alt={shot.file.name} /><span>{String(index + 1).padStart(2, '0')}</span></button>
            <div className="shot-content"><div className="shot-meta"><span title={shot.file.name}>{shot.file.name}</span><small>{shot.width} × {shot.height}</small></div><label><span className="visually-hidden">{t.caption} {index + 1}</span><textarea rows={2} maxLength={500} placeholder={t.captionPlaceholder} value={shot.caption} disabled={locked} onFocus={() => setActive(index)} onChange={e => { invalidate(); updateShots(shots.map((s, i) => i === index ? { ...s, caption: e.target.value } : s)); }} /></label><div className="shot-actions"><button type="button" disabled={locked || index === 0} onClick={() => reorder(index, index - 1)} aria-label={`${t.previous} ${index + 1}`}>↑</button><button type="button" disabled={locked || index === shots.length - 1} onClick={() => reorder(index, index + 1)} aria-label={`${t.next} ${index + 1}`}>↓</button><button type="button" disabled={locked} onClick={() => choose(index)}>{t.replace}</button><button type="button" disabled={locked} className="remove" onClick={() => remove(index)}>{t.remove}</button></div></div>
          </article>)}</div>}
          {shots.length < 8 && <div className={`dropzone ${dragging ? 'dragging' : ''} ${shots.length ? 'compact' : ''}`} onDragOver={e => { e.preventDefault(); if (!locked) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}><div className="upload-icon"><Icon name="upload" size={26} /></div><h4>{shots.length ? t.more : t.upload}</h4>{!shots.length && <p>{t.uploadSub}</p>}<button type="button" className="button button-outline" onClick={() => choose()} disabled={locked}>{adding ? '…' : t.choose}</button><small>{t.uploadFormats}</small></div>}
          {!shots.length && <button type="button" className="text-button demo-button" onClick={example} disabled={locked}>{t.resetDemo} <span aria-hidden="true">↗</span></button>}
        </div>

        <div className="ai-panel"><div className="ai-row"><div className="ai-glyph"><Icon name="spark" size={24} /></div><div><h3>{t.aiTitle}<span className="mini-badge">BETA</span></h3><p>{t.aiSub}</p></div><label className="switch"><input type="checkbox" checked={design.useAI} disabled={locked} onChange={e => update({ useAI: e.target.checked })} aria-label={t.aiToggle} /><span /></label></div>{design.useAI && <fieldset className="ai-art-controls" disabled={locked}>
          <legend>{t.aiDirection}</legend>
          <div className="ai-art-options">{AI_DIRECTIONS.map(direction => <button type="button" key={direction} className={`ai-art-option ${design.aiDirection === direction ? 'selected' : ''}`} aria-pressed={design.aiDirection === direction} onClick={() => update({ aiDirection: direction })}>{t[`art_${direction}`]}</button>)}</div>
          <label className="field"><span>{t.aiBrief} <small>{t.optional}</small></span><textarea rows={2} maxLength={280} placeholder={t.aiBriefPlaceholder} value={design.aiBrief} onChange={e => update({ aiBrief: e.target.value })} /></label>
          <p>{t.aiVariation}</p>
        </fieldset>}<p className="ai-details">{t.aiDetails}</p>{!gpuAvailable && <p className="compatibility">{t.aiUnsupported}</p>}<button className="text-button" type="button" onClick={clearCache} disabled={locked}>{t.clearCache}</button></div>
        <div className="generation-area">
          {error && <div className="message error" role="alert">{error}</div>}{notice && <div className="message" role="status">{notice}</div>}
          {aiFailed && aiDiagnostic && <details><summary>{lang === 'es' ? 'Detalle del error de IA' : 'AI error details'}</summary><p style={{ overflowWrap: 'anywhere' }}>{aiDiagnostic}</p></details>}
          {aiFailed && <button type="button" className="button button-outline fallback" disabled={locked} onClick={() => update({ useAI: false })}>{t.fallback}</button>}
          {busy && <div className="generation-progress" role="status" aria-live="polite"><div><span className="spinner" />{status}</div><progress max="1" value={progress} aria-label={status} /></div>}
          <div className="generate-row"><button className="button button-primary generate" type="button" disabled={locked || !shots.length || !design.platforms.length} onClick={generate}>{busy ? t.generating : t.generate}<Icon name={design.useAI ? 'spark' : 'arrow'} /></button>{busy && <button className="button button-outline" type="button" onClick={cancel}>{t.cancel}</button>}</div>
          <p className="privacy-note"><Icon name="lock" size={13} />{t.privacyShort}</p>
          {shots.length === 1 && design.platforms.includes('Android') && <p className="editor-note">{t.playMin}</p>}{design.platforms.length === 2 && <p className="editor-note">{t.sameUI}</p>}
        </div>
      </div>
      <aside className="preview-panel"><div className="preview-header"><div><span className="eyebrow">{t.preview}</span><p>{t.previewSub}</p></div><span className="live-dot" /></div><div className="preview-tabs" role="group" aria-label={t.platforms}>{(['Android', 'iOS'] as Platform[]).map(p => <button type="button" key={p} aria-pressed={previewPlatform === p} onClick={() => setPreviewPlatform(p)}>{p}</button>)}</div><LivePreview shot={shots[active]} design={design} platform={previewPlatform} lang={lang} /><div className="preview-caption"><Icon name="check" size={15} /><span>{shots.length ? t.original : t.previewEmpty}</span></div><div className="preview-spec"><span>{t.png}</span><span>{previewPlatform === 'Android' ? (shots[active]?.width > shots[active]?.height ? '1920 × 1080' : '1080 × 1920') : (shots[active]?.width > shots[active]?.height ? '2868 × 1320' : '1320 × 2868')}</span></div><p className="preview-ai-note">{design.useAI ? (lang === 'es' ? 'El fondo de IA aparecerá al generar.' : 'The AI background appears after generation.') : t.modeTemplate}</p></aside>
    </div>
    {outputs.length > 0 && <section id="results" className="results" aria-labelledby="results-title"><div className="results-heading"><div><span className="eyebrow">{outputs.length} {t.count} · PNG RGB</span><h3 id="results-title">{t.ready}</h3><p>{t.readySub}</p><span className="result-mode">{design.useAI ? t.modeAI : t.modeTemplate}</span></div><button className="button button-primary" type="button" onClick={() => archive && downloadBlob(archive, `${slug(design.appName)}_screenshots.zip`)}><Icon name="download" />{t.download}</button></div>{backgroundPreview && <details className="ai-background-result"><summary>{t.aiBackgroundResult}</summary><img src={backgroundPreview} width="512" height="512" alt={t.aiBackgroundAlt} /><p>{t.aiBackgroundExplanation}</p></details>}<div className="result-grid">{outputs.map(output => <figure key={`${output.platform}/${output.name}`}><a href={output.url} download={output.name} aria-label={`${t.download}: ${output.platform}/${output.name}`}><img src={output.url} alt={output.caption || output.name} /></a><figcaption><strong>{output.platform}</strong><span>{output.name}</span><small>{output.width} × {output.height}</small></figcaption></figure>)}</div></section>}
  </>;
}
