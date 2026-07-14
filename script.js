// ═══════════════════════════════════════════
//  新時代のWebライティング — Reader Script
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//  読了進捗（localStorageで端末に保存）
// ═══════════════════════════════════════════

const PROGRESS_KEY = 'webWritingProgress';

function sectionKey(chapter, title) {
  return chapter + '::' + title;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(Array.from(_progress)));
  } catch (e) {
    // 保存できない環境（プライベートブラウズ等）では静かに諦める
  }
}

let _progress = loadProgress();

function isSectionRead(chapter, title) {
  return _progress.has(sectionKey(chapter, title));
}

function setSectionRead(chapter, title, read) {
  const key = sectionKey(chapter, title);
  if (read) _progress.add(key);
  else _progress.delete(key);
  saveProgress();
  buildTOC();
  updateCoverProgress();
}

function updateCoverProgress() {
  const el = document.getElementById('cover-progress');
  if (!el) return;
  const total = SECTIONS.length;
  const readCount = SECTIONS.filter(s => isSectionRead(s.chapter, s.title)).length;
  if (readCount === 0) {
    el.style.display = 'none';
    return;
  }
  const percent = Math.round((readCount / total) * 100);
  el.textContent = `これまでの進捗：${readCount} / ${total} 節（${percent}%）`;
  el.style.display = '';
}

let currentIndex = 0;

// ─ ページ切り替え ─
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => {
    p.style.display = (p.id === id) ? '' : 'none';
  });
  window.scrollTo(0, 0);
}

// ─ 目次を生成 ─
function buildTOC() {
  const list = document.getElementById('toc-list');
  list.innerHTML = '';

  const total = SECTIONS.length;
  const readCount = SECTIONS.filter(s => isSectionRead(s.chapter, s.title)).length;
  const percent = total ? Math.round((readCount / total) * 100) : 0;

  const summary = document.createElement('div');
  summary.className = 'toc-progress-summary';
  summary.innerHTML =
    '<div class="toc-progress-text">' + readCount + ' / ' + total + ' 節を読了（' + percent + '%）</div>' +
    '<div class="toc-progress-bar"><div class="toc-progress-fill" style="width:' + percent + '%"></div></div>';
  list.appendChild(summary);

  BOOK.forEach(ch => {
    const chDiv = document.createElement('div');
    chDiv.className = 'toc-chapter';

    const chTitle = document.createElement('div');
    chTitle.className = 'toc-chapter-title';
    chTitle.textContent = ch.chapter;
    chDiv.appendChild(chTitle);

    ch.sections.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'toc-section';
      if (isSectionRead(ch.chapter, s.title)) btn.classList.add('is-read');

      const label = document.createElement('span');
      label.className = 'toc-section-label';
      label.textContent = s.title.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      const check = document.createElement('span');
      check.className = 'toc-section-check';
      check.textContent = isSectionRead(ch.chapter, s.title) ? '✓' : '';

      btn.appendChild(label);
      btn.appendChild(check);

      btn.addEventListener('click', () => {
        const idx = SECTIONS.findIndex(x => x.title === s.title && x.chapter === ch.chapter);
        if (idx >= 0) openSection(idx);
      });
      chDiv.appendChild(btn);
    });

    list.appendChild(chDiv);
  });
}

let _introToken = 0;

// ─ 節を開く ─
function openSection(idx) {
  if (idx < 0 || idx >= SECTIONS.length) return;
  currentIndex = idx;
  const s = SECTIONS[idx];
  _introToken++;
  const myToken = _introToken;

  document.getElementById('reader-breadcrumb').textContent = s.chapter;
  document.getElementById('btn-prev').disabled = (idx === 0);
  document.getElementById('btn-next').disabled = (idx === SECTIONS.length - 1);

  const readCheckbox = document.getElementById('read-checkbox');
  if (readCheckbox) readCheckbox.checked = isSectionRead(s.chapter, s.title);

  clearAllTimers();
  showPage('page-reader');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (shouldAnimate(s) && !reduceMotion) {
    runSpecialIntro(s, myToken);
  } else {
    // 読了済みの通常節、またはモーション低減設定時：アニメーションなし、即時表示
    const titleEl = document.getElementById('reader-title');
    const navEl = document.querySelector('.reader-nav');
    const readWrapEl = document.getElementById('read-toggle-wrap');
    titleEl.classList.remove('fade-in-target', 'is-visible');
    if (navEl) navEl.classList.remove('fade-in-target', 'is-visible');
    if (readWrapEl) readWrapEl.classList.remove('fade-in-target', 'is-visible');
    titleEl.innerHTML = s.title;
    document.getElementById('reader-body').innerHTML = s.body;
  }
}

// ═══════════════════════════════════════════
//  特別演出（まえがき・13-6「おわりに」は常時、それ以外は未読了の節のみ）
//  タイトル→挿絵→本文タイピング→図解 の順で演出
// ═══════════════════════════════════════════

function isSpecialSection(s) {
  return s.chapter === 'まえがき' || s.title.indexOf('13-6') === 0;
}

// アニメーションを再生するかどうかの判定：
// ・まえがき／おわりには常に再生
// ・それ以外の節は「まだ読了チェックが入っていない」場合のみ再生
function shouldAnimate(s) {
  if (isSpecialSection(s)) return true;
  return !isSectionRead(s.chapter, s.title);
}

let _timers = [];
function clearAllTimers() {
  _timers.forEach(t => clearTimeout(t));
  _timers = [];
}
function wait(ms) {
  return new Promise(resolve => {
    const t = setTimeout(resolve, ms);
    _timers.push(t);
  });
}

// 要素が画面に入るまで待つ（ワンスクリーンで切れる場合、スクロールされるまで再開しない）
function waitForVisible(el) {
  return new Promise(resolve => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) { resolve(); return; }
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        resolve();
      }
    }, { threshold: 0.01 });
    obs.observe(el);
  });
}

// HTML（タグ混じり）を、タグは即時・文字は1文字ずつタイピング表示する
function typeHTML(el, html, charDelay, periodPause, stillActive) {
  return new Promise(resolve => {
    const tokens = html.split(/(<[^>]+>)/g).filter(t => t.length > 0);
    let ti = 0, ci = 0, chars = [];
    let out = '';

    function next() {
      if (stillActive && !stillActive()) { resolve(); return; }
      if (ti >= tokens.length) { resolve(); return; }
      const token = tokens[ti];

      if (token.charAt(0) === '<') {
        out += token;
        el.innerHTML = out;
        ti++;
        next();
        return;
      }

      if (ci === 0) chars = Array.from(token);

      if (ci >= chars.length) {
        ti++; ci = 0;
        next();
        return;
      }

      const ch = chars[ci];
      out += ch;
      el.innerHTML = out;
      ci++;

      let d = charDelay;
      if (ch === '。') d = periodPause;
      else if (ch === '、' || ch === '\n') d = Math.round(periodPause * 0.35);

      const t = setTimeout(next, d);
      _timers.push(t);
    }
    next();
  });
}

// <p>内に<figure>が埋め込まれている場合、figureを兄弟要素として分離する
// （本文タイピングと図解フェードインを別々に演出するための前処理）
function flattenNestedFigures(container) {
  Array.from(container.querySelectorAll('p')).forEach(p => {
    const figure = p.querySelector('figure');
    if (!figure) return;

    const fullHTML = p.innerHTML;
    const figureHTML = figure.outerHTML;
    const idx = fullHTML.indexOf(figureHTML);
    if (idx === -1) return;

    const beforeHTML = fullHTML.slice(0, idx).trim();
    const afterHTML = fullHTML.slice(idx + figureHTML.length).trim();
    const replacement = [];

    if (beforeHTML) {
      const before = document.createElement('p');
      before.className = p.className;
      before.innerHTML = beforeHTML;
      replacement.push(before);
    }
    replacement.push(figure);
    if (afterHTML) {
      const after = document.createElement('p');
      after.className = p.className;
      after.innerHTML = afterHTML;
      replacement.push(after);
    }
    replacement.forEach(node => p.parentNode.insertBefore(node, p));
    p.parentNode.removeChild(p);
  });
}

async function runSpecialIntro(s, token) {
  const titleEl = document.getElementById('reader-title');
  const bodyEl = document.getElementById('reader-body');
  const navEl = document.querySelector('.reader-nav');
  const readWrapEl = document.getElementById('read-toggle-wrap');
  const stillActive = () => token === _introToken;

  bodyEl.innerHTML = '';

  // タイトル・ナビ・読了チェックを「transitionなしで瞬時に非表示」にリセットしてから
  // アニメーションを開始する（前の節のis-visible状態が残っていると、
  // 一瞬表示されてからフェードアウトする不自然なチラつきが起きるため）
  titleEl.classList.add('no-transition');
  titleEl.classList.remove('is-visible');
  titleEl.classList.add('fade-in-target');
  titleEl.innerHTML = s.title;

  if (navEl) {
    navEl.classList.add('no-transition');
    navEl.classList.remove('is-visible');
    navEl.classList.add('fade-in-target');
  }
  if (readWrapEl) {
    readWrapEl.classList.add('no-transition');
    readWrapEl.classList.remove('is-visible');
    readWrapEl.classList.add('fade-in-target');
  }

  // 強制リフローしてから no-transition を解除（以降のフェードインは通常通りアニメーションさせる）
  void titleEl.offsetWidth;
  titleEl.classList.remove('no-transition');
  if (navEl) navEl.classList.remove('no-transition');
  if (readWrapEl) readWrapEl.classList.remove('no-transition');

  const temp = document.createElement('div');
  temp.innerHTML = s.body;
  flattenNestedFigures(temp);
  const nodes = Array.from(temp.children);

  // タイトル出現
  await wait(400);
  if (!stillActive()) return;
  titleEl.classList.add('is-visible');
  await wait(900);
  if (!stillActive()) return;

  for (const node of nodes) {
    if (!stillActive()) return;
    const tag = node.tagName.toLowerCase();

    if (tag === 'figure') {
      bodyEl.appendChild(node);
      node.classList.add('fade-in-target');
      await waitForVisible(node);
      if (!stillActive()) return;
      await wait(80);
      if (!stillActive()) return;
      node.classList.add('is-visible');
      await wait(750);
    } else if (tag === 'p') {
      const html = node.innerHTML;
      const holder = document.createElement('p');
      holder.className = node.className;
      bodyEl.appendChild(holder);
      await waitForVisible(holder);
      if (!stillActive()) return;
      await typeHTML(holder, html, 42, 480, stillActive);
      if (!stillActive()) return;
      await wait(150);
    } else if (tag === 'br') {
      // 見た目上の意味を持たない要素は演出なしでそのまま挿入
      bodyEl.appendChild(node);
    } else if (tag === 'ul' || tag === 'ol') {
      // 箇条書きは1項目ずつ、本文と同じリズムでタイピング表示する
      const listEl = document.createElement(tag);
      listEl.className = node.className;
      bodyEl.appendChild(listEl);

      const items = Array.from(node.children).filter(c => c.tagName.toLowerCase() === 'li');
      for (const li of items) {
        if (!stillActive()) return;
        const liHtml = li.innerHTML;
        const liHolder = document.createElement('li');
        liHolder.className = li.className;
        listEl.appendChild(liHolder);
        await waitForVisible(liHolder);
        if (!stillActive()) return;
        await typeHTML(liHolder, liHtml, 42, 480, stillActive);
        if (!stillActive()) return;
        await wait(200);
      }
      await wait(150);
    } else {
      // hr・h2 などはフェードインのみ
      bodyEl.appendChild(node);
      node.classList.add('fade-in-target');
      await waitForVisible(node);
      if (!stillActive()) return;
      await wait(50);
      if (!stillActive()) return;
      node.classList.add('is-visible');
      await wait(350);
    }
  }

  // 本文が最後まで表示され終わったら、読了チェックと下部ナビをフェードイン
  if (readWrapEl && stillActive()) {
    await waitForVisible(readWrapEl);
    if (!stillActive()) return;
    readWrapEl.classList.add('is-visible');
    await wait(80);
    if (!stillActive()) return;
  }
  if (navEl && stillActive()) {
    await waitForVisible(navEl);
    if (!stillActive()) return;
    await wait(80);
    if (!stillActive()) return;
    navEl.classList.add('is-visible');
  }
}

// ─ 初期化 ─
document.addEventListener('DOMContentLoaded', () => {
  buildTOC();

  // ヘッダーボタン
  document.getElementById('btn-toc').addEventListener('click', () => showPage('page-toc'));
  document.getElementById('btn-home').addEventListener('click', () => showPage('page-cover'));

  // 表紙のボタン
  document.getElementById('btn-start').addEventListener('click', () => openSection(0));
  document.getElementById('btn-toc-cover').addEventListener('click', () => showPage('page-toc'));

  // インストールボタン
  const installBtn = document.getElementById('btn-install');
  if (installBtn) {
    installBtn.addEventListener('click', () => {
      if (typeof openInstallGuide === 'function') openInstallGuide();
    });
  }

  // インストールガイドの閉じるボタン
  const installClose = document.getElementById('install-close');
  if (installClose) {
    installClose.addEventListener('click', () => {
      if (typeof closeInstallGuide === 'function') closeInstallGuide();
    });
  }
  // オーバーレイの外側クリックで閉じる
  const installOverlay = document.getElementById('install-overlay');
  if (installOverlay) {
    installOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        if (typeof closeInstallGuide === 'function') closeInstallGuide();
      }
    });
  }

  // ログアウトボタン
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (typeof logout === 'function') logout();
    });
  }

  // 著者についてボタン
  const authorBtn = document.getElementById('btn-author');
  const authorOverlay = document.getElementById('author-overlay');
  const authorClose = document.getElementById('author-close');
  if (authorBtn && authorOverlay) {
    authorBtn.addEventListener('click', () => {
      authorOverlay.style.display = 'flex';
    });
  }
  if (authorClose && authorOverlay) {
    authorClose.addEventListener('click', () => {
      authorOverlay.style.display = 'none';
    });
  }
  if (authorOverlay) {
    authorOverlay.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        authorOverlay.style.display = 'none';
      }
    });
  }

  // リーダーのボタン
  document.getElementById('btn-prev').addEventListener('click', () => openSection(currentIndex - 1));
  document.getElementById('btn-next').addEventListener('click', () => openSection(currentIndex + 1));
  document.getElementById('btn-toc-reader').addEventListener('click', () => showPage('page-toc'));

  // 読了チェックボックス
  const readCheckboxEl = document.getElementById('read-checkbox');
  if (readCheckboxEl) {
    readCheckboxEl.addEventListener('change', () => {
      const s = SECTIONS[currentIndex];
      if (s) setSectionRead(s.chapter, s.title, readCheckboxEl.checked);
    });
  }

  // 図解ライトボックス（タップで拡大表示）
  const figureLightbox = document.getElementById('figure-lightbox');
  const figureLightboxImg = document.getElementById('figure-lightbox-img');
  const figureLightboxClose = document.getElementById('figure-lightbox-close');

  document.addEventListener('click', (e) => {
    const img = e.target.closest('.section-figure img');
    if (!img || !figureLightbox || !figureLightboxImg) return;
    figureLightboxImg.src = img.src;
    figureLightboxImg.alt = img.alt || '';
    figureLightbox.classList.add('is-open');
  });

  function closeFigureLightbox() {
    if (!figureLightbox) return;
    figureLightbox.classList.remove('is-open');
    figureLightboxImg.src = '';
  }

  if (figureLightboxClose) {
    figureLightboxClose.addEventListener('click', closeFigureLightbox);
  }
  if (figureLightbox) {
    figureLightbox.addEventListener('click', (e) => {
      if (e.target === figureLightbox || e.target === figureLightboxImg) {
        closeFigureLightbox();
      }
    });
  }

  // 起動時は表紙を表示
  showPage('page-cover');
  updateCoverProgress();

  console.log('App initialized. Total sections:', SECTIONS.length);
});
