// ═══════════════════════════════════════════
//  新時代のWebライティング — Reader Script
// ═══════════════════════════════════════════

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
      btn.textContent = s.title.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      btn.addEventListener('click', () => {
        const idx = SECTIONS.findIndex(x => x.title === s.title && x.chapter === ch.chapter);
        if (idx >= 0) openSection(idx);
      });
      chDiv.appendChild(btn);
    });

    list.appendChild(chDiv);
  });
}

// ─ 節を開く ─
function openSection(idx) {
  if (idx < 0 || idx >= SECTIONS.length) return;
  currentIndex = idx;
  const s = SECTIONS[idx];

  document.getElementById('reader-breadcrumb').textContent = s.chapter;
  document.getElementById('reader-title').innerHTML = s.title;
  document.getElementById('reader-body').innerHTML = s.body;

  document.getElementById('btn-prev').disabled = (idx === 0);
  document.getElementById('btn-next').disabled = (idx === SECTIONS.length - 1);

  showPage('page-reader');
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

  // ログアウトボタン
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (typeof logout === 'function') logout();
    });
  }

  // リーダーのボタン
  document.getElementById('btn-prev').addEventListener('click', () => openSection(currentIndex - 1));
  document.getElementById('btn-next').addEventListener('click', () => openSection(currentIndex + 1));
  document.getElementById('btn-toc-reader').addEventListener('click', () => showPage('page-toc'));

  // 起動時は表紙を表示
  showPage('page-cover');

  console.log('App initialized. Total sections:', SECTIONS.length);
});
