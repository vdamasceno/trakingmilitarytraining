// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Nosso "porteiro"
function authMiddleware(req, res, next) {
  // 1. Pegar o token do header da requisição
  // O formato esperado é: "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    // 401: Não autorizado (nem tentou enviar o token)
    return res.status(401).json({ message: "Acesso negado. Nenhum token fornecido." });
  }

  // O header vem "Bearer <token>", queremos só o token
  const token = authHeader.split(' ')[1]; 

  if (!token) {
    // 401: Token mal formatado
    return res.status(401).json({ message: "Acesso negado. Token mal formatado." });
  }

  try {
    // 2. Verificar se o token é válido
    const secret = process.env.JWT_SECRET;
    
    // jwt.verify vai decodificar o token. Se for inválido (errado ou expirado), ele dará um erro.
    const decoded = jwt.verify(token, secret);

    // 3. Se o token é válido, ANEXAMOS os dados do usuário na requisição (req)
    // Assim, nossas rotas saberão QUEM é o usuário logado
    req.usuario = decoded; // Isso terá { usuario_id, nivel_acesso }

    // 4. Deixar a requisição continuar para a rota final
    next(); 

  } catch (error) {
    // 403: Proibido (O token foi enviado, mas não é válido ou expirou)
    console.error("Erro na verificação do token:", error.message);
    res.status(403).json({ message: "Token inválido ou expirado." });
  }
}

module.exports = authMiddleware;