// middleware/adminMiddleware.js

// Este middleware deve ser usado *DEPOIS* do authMiddleware
function adminMiddleware(req, res, next) {

  // O authMiddleware já colocou 'req.usuario' para nós
  const nivel = req.usuario.nivel_acesso;

  if (nivel === 'gerencial') {
    // É gerente, pode passar
    next();
  } else {
    // Não é gerente
    // 403: Forbidden (Proibido). Ele está logado, mas não tem permissão.
    return res.status(403).json({ message: "Acesso restrito a usuários gerenciais." });
  }
}

module.exports = adminMiddleware;