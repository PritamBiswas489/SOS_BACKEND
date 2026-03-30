const NS = 'api_docs_';
const ORIG_GET = localStorage.getItem.bind(localStorage);
const ORIG_SET = localStorage.setItem.bind(localStorage);
const ORIG_REM = localStorage.removeItem.bind(localStorage);

localStorage.setItem = (k, v) => ORIG_SET(k === 'authorized' ? NS + k : k, v);
localStorage.getItem = (k) => ORIG_GET(k === 'authorized' ? NS + k : k);
localStorage.removeItem = (k) => ORIG_REM(k === 'authorized' ? NS + k : k);

const poll = setInterval(() => {
  if (!window.ui) return;
  clearInterval(poll);
  try {
    const raw = ORIG_GET(NS + 'authorized');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    window.ui.authActions.authorizeWithPersistOption({
      bearerAuth: {
        name: 'bearerAuth',
        schema: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        value: parsed.bearerAuth?.value,
      },
      refreshToken: {
        name: 'refreshToken',
        schema: { type: 'apiKey', in: 'header', name: 'refreshtoken' },
        value: parsed.refreshToken?.value,
      },
    });
    console.log('[Swagger] api tokens restored');
  } catch(e) {
    console.error('[Swagger] restore failed:', e);
  }
}, 100);