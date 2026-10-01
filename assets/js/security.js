/**
 * Little Paw Coffee — security.js
 * Sanitização de entradas, validação de formulários, armazenamento seguro
 * e proteção contra clickjacking. Nenhum dado é enviado a servidores.
 */
'use strict';

/* Proteção anti-clickjacking (complementa X-Frame-Options do .htaccess). */
(function frameGuard() {
  try {
    if (window.top !== window.self) {
      window.top.location.replace(window.self.location.href);
    }
  } catch (e) {
    // Moldura de outra origem: esconde o conteúdo.
    document.documentElement.classList.add('is-framed');
  }
})();

const InputSanitizer = {
  /** Remove caracteres de controle, sinais < > e limita o tamanho. */
  text(value, maxLength = 200) {
    if (typeof value !== 'string') return '';
    return value
      .normalize('NFC')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E]/g, '')
      .replace(/[<>]/g, '')
      .replace(/\s{3,}/g, '  ')
      .trim()
      .slice(0, maxLength);
  },
  /** Texto de linha única. */
  line(value, maxLength = 120) {
    return this.text(String(value || '').replace(/[\r\n\t]+/g, ' '), maxLength);
  },
  email(value) {
    return this.line(value, 254).toLowerCase();
  },
  isEmail(value) {
    return /^[^\s@"'<>()\\,;:]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(value);
  },
  /** Aceita apenas identificadores simples [a-z0-9-_]. */
  id(value) {
    return typeof value === 'string' && /^[a-z0-9_-]{1,64}$/i.test(value) ? value : null;
  },
  int(value, min, max) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return null;
    return Math.min(max, Math.max(min, n));
  }
};

/**
 * Validação declarativa: cada campo usa atributos HTML (required, maxlength,
 * type=email, minlength) e as mensagens vêm do i18n.
 */
const FormValidator = {
  validate(form) {
    let firstInvalid = null;
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach((field) => {
      if (field.type === 'file' || field.type === 'submit' || field.disabled) return;
      const errorKey = this.check(field);
      this.showError(field, errorKey);
      if (errorKey && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  },
  check(field) {
    const raw = field.type === 'checkbox' ? field.checked : String(field.value || '');
    if (field.required) {
      if (field.type === 'checkbox' && !raw) return 'val.consent';
      if (field.type !== 'checkbox' && raw.trim() === '') return 'val.required';
    }
    if (field.type === 'checkbox') return null;
    const value = raw.trim();
    if (!value) return null;
    const max = Number(field.getAttribute('maxlength')) || 0;
    const min = Number(field.getAttribute('minlength')) || 0;
    if (max && value.length > max) return 'val.tooLong';
    if (min && value.length < min) return 'val.tooShort';
    if (field.type === 'email' && !InputSanitizer.isEmail(value)) return 'val.email';
    if (/<\s*\/?\s*script|javascript:|on\w+\s*=/i.test(value)) return 'val.unsafe';
    return null;
  },
  showError(field, errorKey) {
    const id = field.id ? field.id + '-error' : null;
    let box = id ? document.getElementById(id) : null;
    if (!box && id) {
      box = document.createElement('p');
      box.id = id;
      box.className = 'field-error';
      box.setAttribute('role', 'alert');
      field.closest('.form-field, .form-check')?.appendChild(box);
      const described = (field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      if (!described.includes(id)) described.push(id);
      field.setAttribute('aria-describedby', described.join(' '));
    }
    if (errorKey) {
      field.setAttribute('aria-invalid', 'true');
      if (box) {
        box.dataset.i18n = errorKey;
        box.textContent = window.I18n ? I18n.t(errorKey) : errorKey;
      }
    } else {
      field.removeAttribute('aria-invalid');
      if (box) {
        delete box.dataset.i18n;
        box.textContent = '';
      }
    }
  }
};

/** Acesso a localStorage com try/catch e JSON seguro. */
const SafeStorage = {
  get(key, fallback = null, storage = window.localStorage) {
    try {
      const raw = storage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value, storage = window.localStorage) {
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[Little Paw] Falha ao salvar', key, e && e.name);
      return false;
    }
  },
  remove(key, storage = window.localStorage) {
    try { storage.removeItem(key); } catch (e) { /* ignorado */ }
  }
};

/** Utilitário para criar elementos sem innerHTML. */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === null || v === undefined || v === false) return;
    if (k === 'text') node.textContent = v;
    else if (k === 'className') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

/** Comparação em tempo constante para hashes hexadecimais. */
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

window.InputSanitizer = InputSanitizer;
window.FormValidator = FormValidator;
window.SafeStorage = SafeStorage;
window.el = el;
window.constantTimeEqual = constantTimeEqual;
window.sha256Hex = sha256Hex;
