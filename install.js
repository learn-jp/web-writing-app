// ═══════════════════════════════════════════
//  アプリインストールの案内
//  - デバイスとブラウザを自動判定
//  - Chrome/Edgeではワンタップインストール
//  - iOSでは手動手順のガイドを表示
// ═══════════════════════════════════════════

// beforeinstallprompt イベントを保存する変数
let deferredPrompt = null;
let isAppInstalled = false;

// PWAが既にインストールされているか判定
window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
  isAppInstalled = e.matches;
});
if (window.matchMedia('(display-mode: standalone)').matches) {
  isAppInstalled = true;
}

// Chrome/Edge/Braveのインストールプロンプトをキャプチャ
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// インストール完了時
window.addEventListener('appinstalled', () => {
  isAppInstalled = true;
  deferredPrompt = null;
  closeInstallGuide();
});

// デバイス・ブラウザ判定
function detectDevice() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid;

  // ブラウザ判定
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor) && !/Edg/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const isChromeIOS = /CriOS/.test(ua);
  const isEdgeIOS = /EdgiOS/.test(ua);
  const isFirefoxIOS = /FxiOS/.test(ua);

  return {
    isIOS,
    isAndroid,
    isMobile,
    isDesktop: !isMobile,
    isSafari,
    isChrome,
    isEdge,
    isFirefox,
    isChromeIOS,
    isEdgeIOS,
    isFirefoxIOS,
  };
}

// インストールガイドを開く
function openInstallGuide() {
  const overlay = document.getElementById('install-overlay');
  const content = document.getElementById('install-content');
  const device = detectDevice();

  // 既にインストール済みの場合
  if (isAppInstalled) {
    content.innerHTML = `
      <h2 class="install-heading">既にアプリとして起動しています</h2>
      <p class="install-text">現在、このアプリはホーム画面から起動されています。<br>
      ブラウザで開いている場合と違い、より快適に読書を楽しめます。</p>
    `;
    overlay.style.display = 'flex';
    return;
  }

  let html = '';

  // ─── ワンタップインストールが可能な場合 ───
  if (deferredPrompt) {
    html = `
      <h2 class="install-heading">アプリとして保存する</h2>
      <p class="install-text">
        このアプリを、あなたのデバイスに保存できます。<br>
        保存すると、次回からブラウザを開かずに直接起動できます。
      </p>
      <button class="install-cta" id="install-cta-btn">アプリとして保存する</button>
      <p class="install-note">ワンタップでインストールできます</p>
    `;
  }
  // ─── iOS Safari ───
  else if (device.isIOS && device.isSafari) {
    html = `
      <h2 class="install-heading">ホーム画面に追加する</h2>
      <p class="install-text">iPhoneのホーム画面にアイコンを追加できます。</p>
      <ol class="install-steps">
        <li>画面下部の <strong>「•••」ボタン</strong>をタップ</li>
        <li>メニューから <strong>共有ボタン</strong>（□↑のアイコン）をタップ</li>
        <li>メニューを下にスクロール</li>
        <li><strong>「ホーム画面に追加」</strong>をタップ</li>
        <li>右上の <strong>「追加」</strong> をタップ</li>
      </ol>
      <p class="install-note">ホーム画面に「W」のアイコンが追加されます</p>
    `;
  }
  // ─── iOS Chrome/Edge/Firefox ───
  else if (device.isIOS && (device.isChromeIOS || device.isEdgeIOS || device.isFirefoxIOS)) {
    html = `
      <h2 class="install-heading">ホーム画面に追加する</h2>
      <p class="install-text">iPhoneのホーム画面にアイコンを追加できます。</p>
      <ol class="install-steps">
        <li>アドレスバー右の <strong>共有ボタン</strong>（□↑のアイコン）をタップ</li>
        <li>メニューを下にスクロール</li>
        <li><strong>「ホーム画面に追加」</strong>をタップ</li>
        <li>右上の <strong>「追加」</strong> をタップ</li>
      </ol>
      <p class="install-note">ホーム画面に「W」のアイコンが追加されます</p>
    `;
  }
  // ─── Android Chrome/Edge/Brave ───
  else if (device.isAndroid && (device.isChrome || device.isEdge)) {
    html = `
      <h2 class="install-heading">ホーム画面に追加する</h2>
      <p class="install-text">Androidのホーム画面にアイコンを追加できます。</p>
      <ol class="install-steps">
        <li>画面右上の <strong>メニューボタン</strong>（︙）をタップ</li>
        <li><strong>「ホーム画面に追加」</strong>または<strong>「アプリをインストール」</strong>をタップ</li>
        <li>ダイアログの <strong>「追加」</strong> または <strong>「インストール」</strong> をタップ</li>
      </ol>
      <p class="install-note">ホーム画面に「W」のアイコンが追加されます</p>
    `;
  }
  // ─── デスクトップ Chrome/Edge/Brave ───
  else if (device.isDesktop && (device.isChrome || device.isEdge)) {
    html = `
      <h2 class="install-heading">アプリとして保存する</h2>
      <p class="install-text">パソコンのデスクトップにアプリとして保存できます。</p>
      <ol class="install-steps">
        <li>アドレスバーの右端にある <strong>「↓ インストール」</strong> というボタンをクリック</li>
        <li>ダイアログの <strong>「インストール」</strong> をクリック</li>
      </ol>
      <p class="install-note">
        「↓ インストール」ボタンが表示されない場合は、しばらく本書を読んでから再度お試しください。<br>
        既にインストール済みの場合は、アドレスバーに <strong>「W アプリで開く」</strong> というボタンが表示されます。
      </p>
    `;
  }
  // ─── デスクトップ Safari ───
  else if (device.isDesktop && device.isSafari) {
    html = `
      <h2 class="install-heading">Dockに追加する</h2>
      <p class="install-text">Macのdockにアプリとして追加できます（macOS Sonoma以降）。</p>
      <ol class="install-steps">
        <li>メニューバーの <strong>「ファイル」</strong> をクリック</li>
        <li><strong>「Dockに追加...」</strong> を選択</li>
        <li>ダイアログの <strong>「追加」</strong> をクリック</li>
      </ol>
      <p class="install-note">Dockに「W」のアイコンが追加されます</p>
    `;
  }
  // ─── その他（Firefox など） ───
  else {
    html = `
      <h2 class="install-heading">アプリとして保存</h2>
      <p class="install-text">
        お使いのブラウザでは、直接アプリとしての保存は対応していない可能性があります。
      </p>
      <p class="install-text">
        以下のブラウザからアクセスすると、アプリとして保存できます：
      </p>
      <ul class="install-steps">
        <li><strong>iPhone/iPad:</strong> Safari</li>
        <li><strong>Android:</strong> Chrome、Edge、Brave</li>
        <li><strong>Windows/Mac:</strong> Chrome、Edge</li>
        <li><strong>Mac:</strong> Safari（macOS Sonoma以降）</li>
      </ul>
      <p class="install-note">
        このままブラウザで読むこともできます。<br>
        ブックマークに追加して、いつでもアクセスできる状態にしておくのもおすすめです。
      </p>
    `;
  }

  content.innerHTML = html;
  overlay.style.display = 'flex';

  // ワンタップインストールボタンのイベント
  const ctaBtn = document.getElementById('install-cta-btn');
  if (ctaBtn && deferredPrompt) {
    ctaBtn.addEventListener('click', async () => {
      ctaBtn.disabled = true;
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        deferredPrompt = null;
        closeInstallGuide();
      } else {
        ctaBtn.disabled = false;
      }
    });
  }
}

// インストールガイドを閉じる
function closeInstallGuide() {
  const overlay = document.getElementById('install-overlay');
  if (overlay) overlay.style.display = 'none';
}
