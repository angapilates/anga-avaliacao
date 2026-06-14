const TOTAL_SECTIONS = 6;
let currentSection = 1;
let maxVisited = 1;
const photoData = {};
const testResults = {};

// ── Navigation ────────────────────────────────────────────────
function navigate(dir) {
  const next = currentSection + dir;
  if (next < 1 || next > TOTAL_SECTIONS) return;
  document.getElementById(`section${currentSection}`).classList.remove('active');
  currentSection = next;
  if (currentSection > maxVisited) maxVisited = currentSection;
  document.getElementById(`section${currentSection}`).classList.add('active');
  updateNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToSection(n) {
  if (n < 1 || n > TOTAL_SECTIONS) return;
  document.getElementById(`section${currentSection}`).classList.remove('active');
  currentSection = n;
  if (currentSection > maxVisited) maxVisited = currentSection;
  document.getElementById(`section${currentSection}`).classList.add('active');
  updateNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNav() {
  document.getElementById('sectionLabel').textContent = `Seção ${currentSection} de ${TOTAL_SECTIONS}`;

  document.querySelectorAll('.progress-seg').forEach(seg => {
    const n = parseInt(seg.dataset.section);
    seg.classList.remove('visited', 'current');
    if (n === currentSection) {
      seg.classList.add('current');
    } else if (n <= maxVisited) {
      seg.classList.add('visited');
    }
  });

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
    apiRow.style.display = (currentSection === 3 || currentSection === 4 || currentSection === 6) ? 'block' : 'none';
  }
}

// ── EVA Scale ────────────────────────────────────────────────
const EVA_DESC = ['Sem dor','Dor leve','Dor leve','Dor leve','Dor moderada','Dor moderada','Dor moderada','Dor intensa','Dor intensa','Dor intensa','Pior dor possível'];

document.addEventListener('click', e => {
  const btn = e.target.closest('.eva-btn');
  if (!btn) return;
  document.querySelectorAll('.eva-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('evaDesc').textContent = EVA_DESC[parseInt(btn.dataset.val)];
});

// ── Visceral hour info ────────────────────────────────────────
const VISCERAL_MAP = {
  '23h-1h':  'Vesícula Biliar (23h – 1h)',
  '1h-3h':   'Fígado (1h – 3h)',
  '3h-5h':   'Pulmão (3h – 5h)',
  '5h-7h':   'Intestino Grosso (5h – 7h)',
  '7h-9h':   'Estômago (7h – 9h)',
  '9h-11h':  'Baço / Pâncreas (9h – 11h)',
  '11h-13h': 'Coração (11h – 13h)',
  '13h-15h': 'Intestino Delgado (13h – 15h)',
  '15h-17h': 'Bexiga (15h – 17h)',
  '17h-19h': 'Rim (17h – 19h)',
  '19h-21h': 'Pericárdio (19h – 21h)',
  '21h-23h': 'Triplo Aquecedor (21h – 23h)',
};

document.getElementById('horarioVisceral').addEventListener('change', function () {
  const card = document.getElementById('visceralCard');
  const body = document.getElementById('visceralCardBody');
  const display = VISCERAL_MAP[this.value];
  if (display) {
    body.textContent = display;
    card.style.display = 'block';
  } else {
    card.style.display = 'none';
  }
});

// ── Body map overlay ──────────────────────────────────────────
const svgOverlay = document.getElementById('svgMapaCorporal');
if (svgOverlay) {
  svgOverlay.addEventListener('click', e => {
    if (e.target.classList.contains('body-marker')) {
      e.target.remove();
      return;
    }
    const rect = svgOverlay.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', x + '%');
    dot.setAttribute('cy', y + '%');
    dot.setAttribute('r', '6');
    dot.setAttribute('fill', '#c25609');
    dot.setAttribute('stroke', '#fff');
    dot.setAttribute('stroke-width', '1.5');
    dot.classList.add('body-marker');
    svgOverlay.appendChild(dot);
  });
}

function limparMapaCorporal() {
  document.querySelectorAll('.body-marker').forEach(m => m.remove());
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
function isHeicFile(file) {
  return /\.(heic|heif)$/i.test(file.name) ||
    file.type === 'image/heic' ||
    file.type === 'image/heif';
}

function storePhoto(key, file) {
  const reader = new FileReader();
  reader.onload = ev => {
    photoData[key] = { dataUrl: ev.target.result, base64: ev.target.result.split(',')[1], mimeType: file.type };
    const preview = document.getElementById(`preview${key}`);
    const placeholder = document.getElementById(`placeholder${key}`);
    if (preview) { preview.src = ev.target.result; preview.classList.add('visible'); }
    if (placeholder) placeholder.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

async function handlePhoto(input, key) {
  let file = input.files[0];
  if (!file) return;

  if (isHeicFile(file)) {
    showToast('Convertendo HEIC para JPEG…');
    try {
      const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.88 });
      file = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
    } catch (err) {
      showToast(`Erro ao converter HEIC: ${err.message}`);
      return;
    }
  }

  storePhoto(key, file);
}

// ── AI Photo Analysis ─────────────────────────────────────────
const VIEW_LABELS = {
  Anterior:   'Vista Anterior',
  Posterior:  'Vista Posterior',
  LateralD:   'Vista Lateral Direita',
  LateralE:   'Vista Lateral Esquerda',
  Flexao:     'Flexão Global',
  Extensao:   'Extensão Global',
  FlexaoLatD: 'Flexão Lateral Direita',
  FlexaoLatE: 'Flexão Lateral Esquerda',
  RotacaoD:   'Rotação Direita',
  RotacaoE:   'Rotação Esquerda',
};
const CHAIN_KEYS = new Set(['Flexao', 'Extensao', 'FlexaoLatD', 'FlexaoLatE', 'RotacaoD', 'RotacaoE']);

function coletarContextoClinico() {
  const v = id => (document.getElementById(id)?.value || '').trim();
  const parts = [];
  const add = (label, val) => { if (val) parts.push(`${label}: ${val}`); };
  add('Objetivo terapêutico', v('objetivo'));
  add('Queixa principal', v('queixaPrincipal'));
  add('História da doença atual', v('hda'));
  add('Diagnóstico clínico', v('diagnostico'));
  add('O que piora', v('piora'));
  add('O que melhora', v('melhora'));
  add('Antecedentes patológicos', v('app'));
  return parts.join('\n');
}

function buildPosturalPrompt(vista, ctx) {
  const ctxBlock = ctx
    ? `\nDADOS CLÍNICOS DO PACIENTE (use apenas o que foi fornecido — nunca acrescente informações ausentes):\n${ctx}\n`
    : '';
  const dir3 = ctx
    ? 'Cruze explicitamente os dados clínicos fornecidos com os achados visuais — se o paciente relata dor em determinada região e há uma alteração postural correspondente visível, conecte os dois de forma fundamentada.'
    : 'Limite a análise ao que é efetivamente visível na imagem.';

  return `Você é um fisioterapeuta especialista em análise postural. Analise esta fotografia — <strong>${vista}</strong> — seguindo rigorosamente as diretrizes abaixo.
${ctxBlock}
<strong>Tom:</strong> escreva de forma clara e direta, como para uma colega fisioterapeuta. Frases curtas e objetivas — use terminologia técnica quando for mais precisa do que uma descrição simples, mas evite jargão desnecessário.

DIRETRIZES:

1. Descreva apenas o que é efetivamente visível na imagem. Se algum achado não for claramente observável, declare isso explicitamente. Nunca invente ou presuma informações ausentes.

2. Para cada alteração identificada, estruture a análise em três partes:
   — <strong>Achado visual:</strong> descrição objetiva e precisa (ex.: anteriorização da cabeça, elevação do ombro direito, hiperlordose lombar acentuada).
   — <strong>Causas biomecânicas e musculares prováveis:</strong> quais estruturas estão provavelmente envolvidas com base no padrão observado.
   — <strong>Consequências funcionais e sintomatológicas:</strong> sobrecargas articulares, compensações em cadeia, possíveis dores e limitações decorrentes.

3. ${dir3}

4. Para cada alteração, inclua uma <strong>sugestão breve de abordagem pelo movimento</strong> (ex.: mobilização articular, fortalecimento de estabilizadores, alongamento de cadeias anteriores, reeducação respiratória) — sem detalhar exercícios específicos, pois o plano completo é gerado em outra etapa.

5. Utilize como referencial as cadeias musculares e os trilhos anatômicos. Não cite autores, livros ou obras no texto gerado.

6. <strong>Formatação:</strong> use <strong>...</strong> para negritos. Não use asteriscos (**). Estruture em tópicos claros com quebras de linha entre eles.

7. Finalize com um parágrafo de <strong>Análise</strong> integrando os principais achados desta vista.

Responda em português.`;
}

function buildChainPrompt(movimento, ctx) {
  const ctxBlock = ctx
    ? `\nDADOS CLÍNICOS DO PACIENTE (use apenas o que foi fornecido — nunca acrescente informações ausentes):\n${ctx}\n`
    : '';
  const dir3 = ctx
    ? 'Cruze explicitamente os dados clínicos fornecidos com os achados visuais — se o paciente relata dor em determinada região e há tensão ou limitação correspondente visível, conecte os dois de forma fundamentada.'
    : 'Limite a análise ao que é efetivamente visível na imagem.';

  return `Você é um fisioterapeuta especialista em cadeias musculares e trilhos anatômicos. Analise esta fotografia — <strong>${movimento}</strong> — seguindo rigorosamente as diretrizes abaixo.
${ctxBlock}
<strong>Tom:</strong> escreva de forma clara e direta, como para uma colega fisioterapeuta. Frases curtas e objetivas — use terminologia técnica quando for mais precisa do que uma descrição simples, mas evite jargão desnecessário.

DIRETRIZES:

1. Descreva apenas o que é efetivamente visível na imagem. Se algum achado não for claramente observável, declare isso explicitamente. Nunca invente ou presuma informações ausentes.

2. Para cada achado identificado, estruture a análise em quatro partes:
   — <strong>Localização exata:</strong> descreva com precisão a região anatômica onde a tensão, encurtamento, retificação ou curva excessiva é observada (ex.: retificação da lordose lombar, tensão no terço superior do trapézio direito, limitação na cadeia posterior a partir dos isquiotibiais bilateralmente).
   — <strong>Cadeias e trilhos envolvidos:</strong> identifique quais cadeias musculares e trilhos anatômicos estão manifestando tensão ou insuficiência com base no padrão observado.
   — <strong>Causas biomecânicas prováveis:</strong> mecanismos musculares e articulares geradores do padrão identificado.
   — <strong>Consequências funcionais e sintomatológicas:</strong> sobrecargas, compensações em cadeia, possíveis dores e limitações decorrentes.

3. ${dir3}

4. Para cada achado, inclua uma <strong>sugestão breve de abordagem pelo movimento</strong> — sem detalhar exercícios específicos, pois o plano completo é gerado em outra etapa.

5. Utilize como referencial as cadeias musculares e os trilhos anatômicos. Não cite autores, livros ou obras no texto gerado.

6. <strong>Formatação:</strong> use <strong>...</strong> para negritos. Não use asteriscos (**). Estruture em tópicos claros com quebras de linha entre eles.

7. Finalize com um parágrafo de <strong>Análise</strong> sobre o padrão geral de tensão identificado neste movimento.

Responda em português.`;
}

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
  const ctx    = coletarContextoClinico();
  const vista  = VIEW_LABELS[key] || key;
  const prompt = CHAIN_KEYS.has(key) ? buildChainPrompt(vista, ctx) : buildPosturalPrompt(vista, ctx);

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
        max_tokens: 4096,
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
    resultEl.contentEditable = 'true';
    resultEl.innerHTML = text.replace(/\n/g, '<br>');
  } catch (err) {
    resultEl.className = 'ai-result visible';
    resultEl.style.color = '#dc2626';
    resultEl.innerHTML = `Erro: ${err.message}`;
  }
}

// ── Coleta dados da avaliação ─────────────────────────────────
function coletarDadosAvaliacao() {
  const v   = id  => (document.getElementById(id)?.value       || '').trim();
  const txt = id  => (document.getElementById(id)?.textContent || '').trim();
  const lines = [];
  const add = (label, value) => { if (value) lines.push(`${label}: ${value}`); };

  lines.push('=== ANAMNESE ===');
  add('Paciente',              v('nomeCompleto'));
  add('Idade',                 v('idade'));
  add('Profissão',             v('profissao'));
  add('Objetivo',              v('objetivo'));
  add('Queixa principal',      v('queixaPrincipal'));
  add('HDA',                   v('hda'));
  add('Diagnóstico clínico',   v('diagnostico'));
  add('Classificação CBDF',    v('codigoCBDF'));
  add('Exames complementares', v('exames'));
  add('Antecedentes',          v('app'));
  add('Outros sintomas',       v('outrosSintomas'));
  add('Medicamentos',          v('medicamentos'));
  add('AVDs',                  v('avds'));
  add('Sono',                  v('sono'));
  add('Alimentação',           v('alimentacao'));
  add('Atividade física', document.querySelector('input[name="atividadeFisica"]:checked')?.value);
  add('Outros hábitos',        v('outrosHabitos'));

  lines.push('');
  lines.push('=== ANÁLISE DA DOR ===');
  const evaBtn = document.querySelector('.eva-btn.active');
  if (evaBtn) add('EVA', `${evaBtn.dataset.val}/10 – ${txt('evaDesc')}`);
  const nMarkers = document.querySelectorAll('.body-marker').length;
  if (nMarkers) add('Mapa corporal', `${nMarkers} ponto(s) de dor marcado(s)`);
  add('Frequência',  document.querySelector('.toggle-btn.active[data-group="frequencia"]')?.dataset.value);
  const tipos = [...document.querySelectorAll('.toggle-btn.active[data-group="tipoDor"]')].map(b => b.dataset.value).join(', ');
  add('Tipo de dor', tipos);
  add('Piora com',   v('piora'));
  add('Melhora com', v('melhora'));
  add('Horário de maior intensidade', document.querySelector('.toggle-btn.active[data-group="horario"]')?.dataset.value);
  const visVal = document.getElementById('horarioVisceral')?.value;
  if (visVal && visVal !== '' && visVal !== 'nao-se-aplica') add('Horário visceral', txt('visceralCardBody') || visVal);

  lines.push('');
  lines.push('=== ANÁLISE POSTURAL ===');
  ['Anterior', 'Posterior', 'LateralD', 'LateralE'].forEach(k => {
    const el = document.getElementById(`result${k}`);
    const t  = el?.textContent?.trim();
    if (t && el.classList.contains('visible') && !t.startsWith('Analisando')) add(`Vista ${k}`, t);
  });
  add('Observações posturais', v('obsPostural'));

  lines.push('');
  lines.push('=== CADEIAS MUSCULARES ===');
  ['Flexao','Extensao','FlexaoLatD','FlexaoLatE','RotacaoD','RotacaoE'].forEach(k => {
    const el = document.getElementById(`result${k}`);
    const t  = el?.textContent?.trim();
    if (t && el.classList.contains('visible') && !t.startsWith('Analisando')) add(k, t);
  });
  add('Observações cadeias',   v('obsCadeias'));
  add('Função diafragmática',  v('diafragma'));
  add('Transverso do abdômen', v('transverso'));

  lines.push('');
  lines.push('=== TESTES DE MOBILIDADE E ESTABILIDADE ===');
  const entries = Object.entries(testResults);
  if (entries.length) entries.forEach(([test, val]) => add(test, val));
  add('Observações dos testes', v('obsTestes'));

  return lines.join('\n');
}

// ── Gera plano de tratamento com IA ──────────────────────────
async function gerarPlanoTratamento() {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) { showToast('Insira a chave de API da Anthropic.'); return; }

  const btn     = document.getElementById('btnGerarPlano');
  const wrapper = document.getElementById('planoResultWrapper');
  const ta      = document.getElementById('planoTratamento');

  btn.disabled    = true;
  btn.textContent = 'Gerando plano…';

  const resumo = coletarDadosAvaliacao();
  const prompt = `Você é um fisioterapeuta especialista em Pilates Clínico. Com base nos dados desta avaliação fisioterapêutica, elabore um plano de tratamento estruturado.

<strong>Tom:</strong> escreva de forma clara e direta, como para uma colega fisioterapeuta. Frases curtas e objetivas — use terminologia técnica quando for mais precisa do que uma descrição simples, mas evite jargão desnecessário.

DADOS DA AVALIAÇÃO:
${resumo}

DIRETRIZES PARA O PLANO:

1. Utilize exclusivamente os dados fornecidos acima. Não presuma informações ausentes, não invente achados. Se algum dado relevante estiver ausente, indique que aquela parte da análise fica prejudicada por falta de informação.

2. Relacione cada proposta terapêutica diretamente a um achado clínico ou postural presente nos dados.

3. Estruture o plano em:
   — <strong>Objetivos terapêuticos</strong> — derivados da queixa e dos achados.
   — <strong>Fundamentação clínica</strong> — princípios biomecânicos e de cadeias musculares que embasam as escolhas.
   — <strong>Exercícios recomendados com progressão</strong> — do mais básico ao mais avançado, justificando cada etapa com base nos achados.
   — <strong>Frequência semanal e duração estimada do programa.</strong>
   — <strong>Pontos de atenção e contraindicações</strong> — derivados do diagnóstico e dos achados clínicos.

4. Finalize com uma <strong>Análise das prioridades para as primeiras sessões.</strong>

5. <strong>Formatação:</strong> use <strong>...</strong> para negritos. Não use asteriscos (**). Estruture em seções claras com quebras de linha entre elas.

Responda em português.`;

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
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro ${resp.status}`);
    }

    const data = await resp.json();
    const planText = data.content?.[0]?.text || 'Sem resposta.';
    ta.innerHTML = planText.replace(/\n/g, '<br>');
    wrapper.style.display = 'block';
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    showToast(`Erro ao gerar plano: ${err.message}`);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Gerar Plano de Tratamento com IA';
  }
}

// ── Confirm evaluation ────────────────────────────────────────
function confirmarAvaliacao() {
  const nome = document.getElementById('nomeCompleto').value.trim() || 'Paciente';
  showToast(`Avaliação de ${nome} confirmada com sucesso!`);
}

// ── Exportar avaliação como PDF ───────────────────────────────
function exportarPDF() {
  const nome = (document.getElementById('nomeCompleto')?.value || '').trim();
  const data = document.getElementById('footerData')?.value || '';

  const nomeSlug = (nome || 'paciente')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // YYYY-MM-DD → DD-MM-YYYY para o nome do arquivo
  const dataSlug = data
    ? data.split('-').reverse().join('-')
    : new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

  const tituloOriginal = document.title;
  document.title = `avaliacao-${nomeSlug}-${dataSlug}`;
  document.body.classList.add('printing');

  window.print();

  document.body.classList.remove('printing');
  document.title = tituloOriginal;
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
