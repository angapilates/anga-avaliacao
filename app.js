const TOTAL_SECTIONS = 5;
let currentSection = 1;
const photoData = {};
const testResults = {};

// ── Navigation ────────────────────────────────────────────────
function navigate(dir) {
  const next = currentSection + dir;
  if (next < 1 || next > TOTAL_SECTIONS) return;
  document.getElementById(`section${currentSection}`).classList.remove('active');
  currentSection = next;
  document.getElementById(`section${currentSection}`).classList.add('active');
  updateNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNav() {
  document.getElementById('sectionLabel').textContent = `Seção ${currentSection} de ${TOTAL_SECTIONS}`;
  document.getElementById('progressFill').style.width = `${(currentSection / TOTAL_SECTIONS) * 100}%`;

  const back = document.getElementById('btnBack');
  const next = document.getElementById('btnNext');
  back.style.display = currentSection === 1 ? 'none' : '';

  if (currentSection === TOTAL_SECTIONS) {
    next.style.display = 'none';
  } else {
    next.style.display = '';
  }

  const apiRow = document.getElementById('apiKeyRow');
  if (apiRow) {
    apiRow.style.display = (currentSection === 3 || currentSection === 4) ? 'block' : 'none';
  }
}

// ── Toggle buttons (single-select per group) ─────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('.toggle-btn');
  if (!btn) return;
  const group = btn.dataset.group;
  document.querySelectorAll(`.toggle-btn[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});

// ── Result buttons ────────────────────────────────────────────
// Tests that reveal a Tipo 1/2/3 sub-row when result is positive
const TESTS_WITH_TIPO = ['discinese'];

document.addEventListener('click', e => {
  const btn = e.target.closest('.result-btn');
  if (!btn) return;
  const test = btn.dataset.test;

  // btn-multi: toggle individual, independente dos outros
  if (btn.classList.contains('btn-multi')) {
    btn.classList.toggle('active');
    if (btn.classList.contains('active')) {
      testResults[test] = btn.dataset.val;
    } else {
      delete testResults[test];
    }
    return;
  }

  // Seleção única dentro do grupo
  document.querySelectorAll(`.result-btn[data-test="${test}"]`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  testResults[test] = btn.dataset.val;

  // Mostrar/esconder sub-linha Tipo para testes que a utilizam
  if (TESTS_WITH_TIPO.includes(test)) {
    const tipoEl = document.getElementById(`${test}-tipo`);
    if (tipoEl) {
      const isPositive = btn.dataset.val !== 'neg';
      tipoEl.classList.toggle('hidden', !isPositive);
      if (!isPositive) {
        document.querySelectorAll(`.result-btn[data-test="${test}-tipo"]`).forEach(b => b.classList.remove('active'));
        delete testResults[`${test}-tipo`];
      }
    }
  }
});

// ── Photo handling ────────────────────────────────────────────
function handlePhoto(input, key) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    photoData[key] = { dataUrl: ev.target.result, base64: ev.target.result.split(',')[1], mimeType: file.type };
    const preview = document.getElementById(`preview${key}`);
    const placeholder = document.getElementById(`placeholder${key}`);
    if (preview) {
      preview.src = ev.target.result;
      preview.classList.add('visible');
    }
    if (placeholder) placeholder.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

// ── AI Photo Analysis ─────────────────────────────────────────
const POSTURAL_PROMPT = `Você é um fisioterapeuta especialista em análise postural. Analise esta imagem do paciente e forneça:
1. Alinhamento geral (cabeça, ombros, pelve, joelhos, pés)
2. Assimetrias visíveis
3. Padrões posturais identificados
4. Possíveis compensações
Seja objetivo e use terminologia clínica. Responda em português.`;

const CHAIN_PROMPT = `Você é um fisioterapeuta especialista em cadeias musculares (Busquet/Myers). Analise este movimento e forneça:
1. Padrões de tensão identificados
2. Cadeias musculares envolvidas
3. Compensações observadas
4. Achados clínicos relevantes
Seja objetivo e use terminologia clínica. Responda em português.`;

async function analisarFoto(key) {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) {
    showToast('Insira a chave de API da Anthropic na seção 1.');
    return;
  }
  if (!photoData[key]) {
    showToast('Adicione uma foto antes de analisar.');
    return;
  }

  const resultEl = document.getElementById(`result${key}`);
  const isChain = ['Flexao', 'Extensao'].includes(key);
  const prompt = isChain ? CHAIN_PROMPT : POSTURAL_PROMPT;

  resultEl.className = 'ai-result visible loading';
  resultEl.textContent = 'Analisando com IA...';

  const { base64, mimeType } = photoData[key];

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro ${resp.status}`);
    }

    const data = await resp.json();
    const text = data.content?.[0]?.text || 'Sem resposta.';
    resultEl.className = 'ai-result visible';
    resultEl.textContent = text;
  } catch (err) {
    resultEl.className = 'ai-result visible';
    resultEl.style.color = '#dc2626';
    resultEl.textContent = `Erro: ${err.message}`;
  }
}

// ── Confirm evaluation ────────────────────────────────────────
function confirmarAvaliacao() {
  const nome = document.getElementById('nomeCompleto').value.trim() || 'Paciente';
  showToast(`Avaliação de ${nome} confirmada com sucesso!`);
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Init ──────────────────────────────────────────────────────
updateNav();
const _today = new Date();
const _yyyy = _today.getFullYear();
const _mm = String(_today.getMonth() + 1).padStart(2, '0');
const _dd = String(_today.getDate()).padStart(2, '0');
document.getElementById('footerData').value = `${_yyyy}-${_mm}-${_dd}`;
