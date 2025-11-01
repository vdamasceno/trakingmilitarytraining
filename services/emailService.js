// services/emailService.js
const nodemailer = require('nodemailer');

// Variável para guardar nossa "conta de teste"
let testAccount = null;
let transporter = null;

/**
 * Inicializa o serviço de e-mail.
 * Cria uma conta de teste no Ethereal Mail e configura o transporter.
 */
async function initializeEmailService() {
  try {
    // Cria uma conta de teste no Ethereal
    testAccount = await nodemailer.createTestAccount();

    console.log('********************************************************');
    console.log('*** SERVIÇO DE E-MAIL (ETHEREAL) INICIADO ***');
    console.log('*** Usuário de Teste: %s', testAccount.user);
    console.log('*** Senha de Teste: %s', testAccount.pass);
    console.log('********************************************************');

    // Configura o "transporter" do Nodemailer para usar o Ethereal
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // Usuário gerado pelo Ethereal
        pass: testAccount.pass, // Senha gerada pelo Ethereal
      },
    });

    return true;

  } catch (error) {
    console.error("Falha ao inicializar o serviço de e-mail Ethereal:", error);
    return false;
  }
}

/**
 * Envia um e-mail de lembrete de TFM.
 * @param {string} toEmail - E-mail do destinatário.
 * @param {string} toName - Nome do destinatário.
 */
async function sendTfmReminder(toEmail, toName) {
  if (!transporter) {
    console.error("Serviço de e-mail não inicializado. E-mail não enviado.");
    return;
  }

  // O link para o frontend (ajuste se seu link for diferente)
  const frontendUrl = 'http://localhost:5173/tfm'; // Link para a aba TFM

  // Conteúdo do e-mail
  const mailOptions = {
    from: '"Tracking TFM" <sistema@tfm-track.com>', // Remetente (pode ser qualquer um)
    to: toEmail, // Destinatário
    subject: '📅 Lembrete de Treino: Você registrou seu TFM hoje?', // Assunto
    text: `Olá, ${toName}!\n\n` +
          `Manter a consistência é a chave para a evolução. Não se esqueça de registrar seu Treinamento Físico Militar de hoje!\n\n` +
          `Clique aqui para registrar seu treino: ${frontendUrl}\n\n` +
          `Se você não treinou hoje, lembre-se: "A dor é passageira, mas o orgulho é para sempre!"\n\n` +
          `Atenciosamente,\nSistema TFM-Track`,
    html: `<p>Olá, <strong>${toName}</strong>!</p>` +
          `<p>Manter a consistência é a chave para a evolução. Não se esqueça de registrar seu Treinamento Físico Militar de hoje!</p>` +
          `<p><a href="${frontendUrl}" style="padding: 10px 15px; background-color: #005a9c; color: white; text-decoration: none; border-radius: 5px;">` +
          `Clique aqui para registrar seu treino` +
          `</a></p>` +
          `<p><em>Se você não treinou hoje, lembre-se: "A dor é passageira, mas o orgulho é para sempre!"</em></p>` +
          `<p>Atenciosamente,<br>Sistema TFM-Track</p>`,
  };

  try {
    // Envia o e-mail
    let info = await transporter.sendMail(mailOptions);

    console.log(`E-mail de lembrete enviado para: ${toEmail}`);

    // --- IMPORTANTE ---
    // Loga o link de visualização do Ethereal no console
    console.log(`*** LINK DE VISUALIZAÇÃO DO E-MAIL: ${nodemailer.getTestMessageUrl(info)} ***`);
    // --- FIM IMPORTANTE ---

  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${toEmail}:`, error);
  }
}

// Exporta as funções que serão usadas por outros arquivos
module.exports = {
  initializeEmailService,
  sendTfmReminder
};