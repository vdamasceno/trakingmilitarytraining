// utils/dateFormatter.js

/**
 * Formata um objeto Date (geralmente vindo do driver 'pg' como UTC)
 * para uma string AAAA-MM-DD, ignorando a conversão de fuso horário.
 * @param {Date | string | null} dateInput 
 * @returns {string | null}
 */
function formatUTCDateString(dateInput) {
  if (!dateInput) return null;

  try {
    const dataUTC = new Date(dateInput);
    // getUTCFullYear, getUTCMonth, getUTCDate pegam a data "real"
    // independentemente do fuso horário local.
    const ano = dataUTC.getUTCFullYear();
    const mes = (dataUTC.getUTCMonth() + 1).toString().padStart(2, '0');
    const dia = dataUTC.getUTCDate().toString().padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  } catch (e) {
    console.error("Erro ao formatar data:", dateInput, e);
    return null;
  }
}
module.exports = { formatUTCDateString };