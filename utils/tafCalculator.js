// utils/tafCalculator.js

/**
 * Calcula a idade em anos completos em uma data específica.
 * @param {Date | string} birthDate - Data de nascimento.
 * @param {Date | string} testDate - Data do teste.
 * @returns {number} Idade em anos.
 */
function calculateAge(birthDate, testDate) {
  const birth = new Date(birthDate);
  const test = new Date(testDate);
  let age = test.getFullYear() - birth.getFullYear();
  const monthDiff = test.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && test.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Define a faixa etária conforme as tabelas da ICA 54-1 (Anexo H).
 * @param {number} age - Idade em anos.
 * @returns {string} String representando a faixa etária (ex: '30-39').
 */
function getAgeGroup(age) {
  if (age <= 29) return '<=29';
  if (age >= 30 && age <= 39) return '30-39';
  if (age >= 40 && age <= 49) return '40-49';
  if (age >= 50 && age <= 59) return '50-59';
  if (age >= 60) return '>=60';
  return null; // Idade inválida
}

/**
 * Calcula a menção para um teste específico do TAF.
 * Baseado na ICA 54-1 (2011), Anexo H.
 * @param {'cooper' | 'abdominal' | 'flexao'} testType - Tipo de teste.
 * @param {'M' | 'F'} sex - Sexo ('M' para Masculino, 'F' para Feminino).
 * @param {number} age - Idade na data do teste.
 * @param {number | null} result - Resultado (metros ou repetições). Null se não realizado.
 * @returns {string | null} Menção ('MAB', 'ABN', 'NOR', 'ACN', 'MAC') ou null.
 */
function getMencao(testType, sex, age, result) {
  if (result === null || result === undefined || isNaN(result) || result < 0) {
    return null; // Não realizado ou inválido
  }

  const ageGroup = getAgeGroup(age);
  if (!ageGroup) return null; // Idade inválida

  // Tabelas da ICA 54-1, Anexo H (pg 54-58)
  // Estrutura: [limite_MAB, limite_ABN, limite_NOR, limite_ACN] -> >= limite_ACN+1 é MAC
  const tables = {
    'M': { // Masculino
      'cooper': { // OIC 05 [cite: 1181]
        '<=29':  [1880, 2070, 2590, 2830],
        '30-39': [1800, 2040, 2490, 2720],
        '40-49': [1740, 1950, 2410, 2660],
        '50-59': [1550, 1810, 2270, 2540],
        '>=60':  [1280, 1570, 2070, 2490]
      },
      'abdominal': { // OIC 04 [cite: 1177]
        '<=29':  [20, 29, 41, 49],
        '30-39': [14, 22, 34, 42],
        '40-49': [9,  18, 30, 36],
        '50-59': [7,  14, 25, 34],
        '>=60':  [2,   8, 21, 26]
      },
      'flexao': { // OIC 03 [cite: 1174]
        '<=29':  [9,  17, 34, 48],
        '30-39': [5,  13, 27, 36],
        '40-49': [4,   9, 21, 30],
        '50-59': [2,   6, 17, 28],
        '>=60':  [1,   5, 16, 25]
      }
    },
    'F': { // Feminino
      'cooper': { // OIC 10 [cite: 1207]
        '<=29':  [1420, 1730, 2120, 2330],
        '30-39': [1410, 1640, 2060, 2240],
        '40-49': [1330, 1540, 1960, 2160],
        '50-59': [1280, 1450, 1850, 2090],
        '>=60':  [1200, 1350, 1710, 1900]
      },
      'abdominal': { // OIC 09 [cite: 1202]
        '<=29':  [11, 21, 34, 43],
        '30-39': [6,  15, 27, 34],
        '40-49': [0,   9, 23, 28], // MAB é 0 [cite: 1202]
        '50-59': [0,   4, 17, 26], // MAB é 0 [cite: 1202]
        '>=60':  [0,   3, 15, 20]  // MAB é 0 [cite: 1202]
      },
      'flexao': { // OIC 08 [cite: 1199]
        '<=29':  [2,  10, 25, 37],
        '30-39': [1,   9, 24, 36],
        '40-49': [1,   6, 22, 32],
        '50-59': [0,   6, 17, 30], // MAB é 0 [cite: 1199]
        '>=60':  [0,   3, 15, 29]  // MAB é 0 [cite: 1199]
      }
    }
  };

  const limits = tables[sex]?.[testType]?.[ageGroup];
  if (!limits) return null; // Tabela não encontrada

  // A lógica de comparação com os limites da ICA
  if (result <= limits[0]) return 'MAB';
  if (result <= limits[1]) return 'ABN';
  if (result <= limits[2]) return 'NOR';
  if (result <= limits[3]) return 'ACN';
  return 'MAC';
}

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
  calculateAge,
  getMencao
};