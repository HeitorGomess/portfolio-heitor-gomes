/* =========================================================
   Heitor Gomes — Portfólio
   Motor de rolagem: cada seção [data-scene] recebe um progresso
   de 0 a 1 enquanto está "presa" na tela. A partir dele mudamos
   variáveis CSS (escala, opacidade, posição). Sem bibliotecas.
   ========================================================= */

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ---------- Utilitários ---------- */
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  // mapeia p (0..1) dentro do intervalo [a, b] para 0..1
  const range = (p, a, b) => clamp((p - a) / (b - a));
  // suavização (começa e termina devagar)
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ---------- Ano no rodapé ---------- */
  document.getElementById('ano').textContent = new Date().getFullYear();

  /* ---------- Hero: divide o nome em letras para a animação de entrada ---------- */
  document.querySelectorAll('[data-split]').forEach(el => {
    const text = el.textContent.trim();
    el.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.style.setProperty('--i', i);
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      el.appendChild(s);
    });
  });
  // dispara a entrada depois que as fontes carregarem (evita "pulo" de fonte)
  const start = () => setTimeout(() => document.body.classList.add('is-loaded'), 50);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
  setTimeout(start, 1500); // segurança caso a fonte demore

  /* ---------- Manifesto: divide o texto em palavras ---------- */
  const KEY_WORDS = ['design,', 'marketing', 'programação', 'cliques', 'converter.', 'escolher'];
  const words = [];
  document.querySelectorAll('[data-words]').forEach(el => {
    const parts = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    parts.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'word' + (KEY_WORDS.includes(w) ? ' is-key' : '');
      s.textContent = w;
      el.appendChild(s);
      if (i < parts.length - 1) el.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  });

  /* ---------- Menu mobile ---------- */
  const nav = document.getElementById('nav');
  const toggle = nav.querySelector('.nav__toggle');
  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Cartões de projeto aparecem ao entrar na tela ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  if (reduce) return; // com "reduzir movimento" ativo, a página fica estática e legível

  /* ---------- Cenas ---------- */
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const track = document.querySelector('[data-track]');
  const servicesScene = document.querySelector('[data-scene="services"]');
  const steps = [...document.querySelectorAll('.step')];

  // A altura da seção de serviços depende da largura do trilho horizontal
  function sizeServices() {
    const extra = Math.max(0, track.scrollWidth - window.innerWidth);
    servicesScene.style.height = `${window.innerHeight + extra * 1.1}px`;
  }

  // progresso de 0 (topo da seção encostou no topo da tela) a 1 (fim da seção)
  function progressOf(el) {
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    return total <= 0 ? 0 : clamp(-r.top / total);
  }

  const handlers = {
    hero(el, p) {
      // nome cresce e desaparece; frase de posicionamento entra
      const grow = ease(range(p, 0, .55));
      el.style.setProperty('--p', p.toFixed(4));
      el.style.setProperty('--name-scale', (1 + grow * 2.4).toFixed(4));
      el.style.setProperty('--name-op', (1 - range(p, .2, .5)).toFixed(4));
      const rev = ease(range(p, .45, .75));
      el.style.setProperty('--rev-op', rev.toFixed(4));
      el.style.setProperty('--rev-y', ((1 - rev) * 40).toFixed(2));
    },

    manifesto(el, p) {
      // acende as palavras conforme rola
      const lit = Math.floor(range(p, .05, .85) * words.length);
      words.forEach((w, i) => w.classList.toggle('is-on', i < lit));
    },

    services(el, p) {
      const extra = Math.max(0, track.scrollWidth - window.innerWidth);
      track.style.setProperty('--tx', `${(-ease(range(p, .03, .97)) * extra).toFixed(1)}px`);
    },

    device(el, p) {
      // título sobe e some; navegador cresce de "janela" até tela cheia
      const g = ease(range(p, .05, .6));
      const s = .55 + g * .45;
      el.style.setProperty('--head-op', (1 - range(p, .05, .3)).toFixed(4));
      el.style.setProperty('--head-y', (-range(p, 0, .3) * 60).toFixed(2));
      el.style.setProperty('--dev-s', s.toFixed(4));
      el.style.setProperty('--dev-y', ((1 - g) * 22).toFixed(3));
      el.style.setProperty('--dev-r', ((1 - g) * 28 / s).toFixed(2));
      const f = ease(range(p, .62, .82));
      el.style.setProperty('--facts-op', f.toFixed(4));
      el.style.setProperty('--facts-y', ((1 - f) * 30).toFixed(2));
    },

    process(el, p) {
      el.style.setProperty('--p', p.toFixed(4));
      const idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
      steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    }
  };

  /* ---------- Loop: só recalcula quando houve rolagem ---------- */
  let ticking = false;
  function update() {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    root.style.setProperty('--page', (window.scrollY / max).toFixed(4));
    nav.classList.toggle('is-solid', window.scrollY > 40);

    scenes.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > window.innerHeight + 100) return; // fora da tela: ignora
      const fn = handlers[el.dataset.scene];
      if (fn) fn(el, progressOf(el));
    });
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { sizeServices(); request(); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { sizeServices(); request(); });
  sizeServices();
  update();
})();
