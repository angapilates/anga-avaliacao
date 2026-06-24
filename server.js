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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: 'Erro ao conectar com a IA.' } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
