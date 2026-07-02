// ═══════════════════════════════════════════
//  認証システム v2
//  - 初回：メール + パスワード
//  - 再ログイン：メールのみ（GAS 側でチェック）
// ═══════════════════════════════════════════

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxNxxzGmz2s0IpdCGW8tnEwsPvDAFNiqo-9DurrH60dgkJ4FGiEJrzb7D4Sc6u1EQQFTg/exec';
const APP_ID = 'web-writing';
const LS_EMAIL = 'auth_email_web_writing';           // 認証済みメール（自動ログイン用）
const LS_REGISTERED = 'once_registered_web_writing'; // 一度でも登録したか（UI切替用）

document.addEventListener('DOMContentLoaded', () => {
  const authScreen    = document.getElementById('auth-screen');
  const appMain       = document.getElementById('app-main');
  const submitBtn     = document.getElementById('auth-submit');
  const emailInput    = document.getElementById('auth-email');
  const passInput     = document.getElementById('auth-password');
  const passwordWrap  = document.getElementById('auth-password-wrap');
  const formLabel     = document.getElementById('auth-form-label');
  const errorEl       = document.getElementById('auth-error');

  if (!authScreen || !appMain) {
    console.error('Auth: 必要な要素が見つかりません');
    return;
  }

  function showApp() {
    authScreen.style.display = 'none';
    appMain.style.display = '';
  }

  function showAuth() {
    authScreen.style.display = 'flex';
    appMain.style.display = 'none';

    // 登録済みならパスワード欄を非表示、ラベルも変える
    const isRegistered = localStorage.getItem(LS_REGISTERED) === 'yes';
    if (isRegistered) {
      passwordWrap.style.display = 'none';
      formLabel.textContent = 'メールアドレスを入力してください';
    } else {
      passwordWrap.style.display = '';
      formLabel.textContent = 'メールアドレスとパスワードを入力してください';
    }
  }

  // 起動時：ログイン状態をチェック
  const savedEmail = localStorage.getItem(LS_EMAIL);
  if (savedEmail) {
    showApp();
  } else {
    showAuth();
  }

  async function signIn() {
    const email = emailInput.value.trim();
    const isRegistered = localStorage.getItem(LS_REGISTERED) === 'yes';
    const password = isRegistered ? '' : passInput.value;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = '正しいメールアドレスを入力してください';
      errorEl.style.display = 'block';
      return;
    }
    if (!isRegistered && !password) {
      errorEl.textContent = 'パスワードを入力してください';
      errorEl.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '認証中...';
    errorEl.style.display = 'none';

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ email, password, app_id: APP_ID })
      });
      const data = await res.json();

      if (data.status === 'ok') {
        localStorage.setItem(LS_EMAIL, email);
        localStorage.setItem(LS_REGISTERED, 'yes');
        showApp();
      } else {
        errorEl.textContent = data.message || '認証に失敗しました';
        errorEl.style.display = 'block';
      }
    } catch (err) {
      console.log('GAS送信エラー:', err);
      errorEl.textContent = '通信エラーが発生しました。再度お試しください';
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'はじめる';
    }
  }

  submitBtn.addEventListener('click', signIn);
  emailInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') signIn();
  });
  passInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') signIn();
  });
});

// ログアウト（他のスクリプトから呼ばれる）
// LS_EMAIL は削除するが LS_REGISTERED は残す
function logout() {
  if (confirm('ログアウトしますか？')) {
    localStorage.removeItem(LS_EMAIL);
    location.reload();
  }
}
