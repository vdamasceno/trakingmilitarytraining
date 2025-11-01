// services/emailScheduler.js
const cron = require('node-cron');
const db = require('../db'); // Nossa conexão com o banco
const { sendTfmReminder } = require('./emailService'); // Nosso enviador de e-mail

/**
 * Inicia o agendador de lembretes do TFM.
 */
function startTfmReminderScheduler() {
  console.log("Agendador de lembretes de TFM iniciado.");

  // Esta string "0 18 * * *" é o "formato cron". Significa:
  // "No minuto 0, na hora 18, todos os dias do mês, todos os meses, todos os dias da semana."
  // Em resumo: RODAR TODO DIA ÀS 18:00 (horário do servidor)
  cron.schedule('* * * * *', async () => {
    console.log('----------------------------------------------------');
    console.log(`[${new Date().toISOString()}] Executando tarefa agendada: Verificando treinos TFM...`);

    try {
      // 1. Pega a data de HOJE (no fuso horário do servidor, ex: -03:00)
      const hoje = new Date();
      const dataHojeFormatada = hoje.toISOString().split('T')[0]; // Formato 'AAAA-MM-DD'

      // 2. Busca todos os usuários ativos
      // (Poderíamos adicionar um 'WHERE email_verificado = true' no futuro)
      const resUsuarios = await db.query("SELECT id, nome, email FROM Usuario WHERE nivel_acesso = 'usuario'");

      if (resUsuarios.rows.length === 0) {
        console.log("Nenhum usuário encontrado para verificar.");
        return;
      }

      console.log(`Encontrados ${resUsuarios.rows.length} usuários. Verificando um por um...`);

      // 3. Itera por cada usuário
      for (const usuario of resUsuarios.rows) {
        // 4. Verifica se este usuário já registrou um TFM *hoje*
        // (Usamos DATE() no PostgreSQL para ignorar a hora)
        const resTFM = await db.query(
          "SELECT 1 FROM LogTFM WHERE usuario_id = $1 AND DATE(data_treino) = $2 LIMIT 1",
          [usuario.id, dataHojeFormatada]
        );

        // 5. Se não registrou (rowCount === 0), envia o lembrete
        if (resTFM.rowCount === 0) {
          console.log(`Usuário [${usuario.nome}] NÃO registrou TFM hoje. Enviando lembrete...`);
          // Chama a função de envio de e-mail (que já lida com Ethereal)
          await sendTfmReminder(usuario.email, usuario.nome);
        } else {
          console.log(`Usuário [${usuario.nome}] JÁ registrou TFM hoje. OK.`);
        }
      }

    } catch (error) {
      console.error("Erro durante a execução da tarefa agendada de TFM:", error);
    } finally {
      console.log("Tarefa agendada de TFM concluída.");
      console.log('----------------------------------------------------');
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo" // Garante que rode no fuso de Brasília
  });
}

module.exports = {
  startTfmReminderScheduler
};