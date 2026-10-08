const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Serve os arquivos do app (HTML, CSS, JS, imagens)
app.use(express.static(path.join(__dirname)));

// Rota que recebe os pedidos de IA e repassa para a Anthropic
app.post('/api/ia', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'Chave de API não configurada no servidor.' } });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: { message: 'A análise demorou demais. Tente novamente.' } });
    } else {
      res.status(500).json({ error: { message: 'Erro ao conectar com a IA.' } });
    }
  }
});

// Rota que recebe um áudio (ou um trecho dele) e devolve o texto transcrito pela Groq.
// O áudio só passa por aqui de passagem: nada é gravado no servidor.
app.post('/api/transcrever', express.raw({ type: () => true, limit: '25mb' }), async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'Chave da Groq não configurada no servidor.' } });
  }
  if (!req.body || !req.body.length) {
    return res.status(400).json({ error: { message: 'Nenhum áudio recebido.' } });
  }

  const nome = String(req.get('X-Nome-Arquivo') || 'audio.wav').replace(/[^\w.\-]/g, '') || 'audio.wav';
  const tipo = req.get('Content-Type') || 'application/octet-stream';

  try {
    const form = new FormData();
    form.append('file', new Blob([req.body], { type: tipo }), nome);
    form.append('model', 'whisper-large-v3-turbo');
    form.append('language', 'pt');
    form.append('response_format', 'json');
    form.append('temperature', '0');
    form.append('prompt', 'Anamnese de fisioterapia. Relato do paciente sobre dor, sintomas, exames, consultas médicas e tratamentos.');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.headers.get('retry-after')) res.set('Retry-After', response.headers.get('retry-after'));
      return res.status(response.status).json({ error: { message: data.error?.message || `Erro ${response.status} na transcrição.` } });
    }
    res.json({ texto: data.text || '' });
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: { message: 'A transcrição demorou demais. Tente novamente.' } });
    } else {
      res.status(500).json({ error: { message: 'Erro ao conectar com o serviço de transcrição.' } });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
