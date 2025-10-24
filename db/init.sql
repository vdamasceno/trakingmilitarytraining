-- db/init.sql
-- Script para criar todas as tabelas

-- Limpa tabelas existentes (se estiver recriando)
DROP TABLE IF EXISTS LogTFM;
DROP TABLE IF EXISTS LogTACF;
DROP TABLE IF EXISTS Exercicio;
DROP TABLE IF EXISTS Usuario;
DROP TABLE IF EXISTS OrganizacaoMilitar;

-- Tabela 1: OrganizacaoMilitar
CREATE TABLE OrganizacaoMilitar (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    sigla VARCHAR(50) NOT NULL,
    grupo VARCHAR(100)
);

-- Tabela 2: Usuario
CREATE TABLE Usuario (
    id SERIAL PRIMARY KEY,
    saram VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    posto VARCHAR(50),
    data_nascimento DATE,
    sexo VARCHAR(20),
    organizacao_id INT,
    nivel_acesso VARCHAR(50) DEFAULT 'usuario' NOT NULL, -- 'usuario' ou 'gerencial'
    
    -- Chave estrangeira ligando Usuario à OrganizacaoMilitar
    FOREIGN KEY (organizacao_id) REFERENCES OrganizacaoMilitar(id)
);

-- Tabela 3: LogTACF (Resultados do TAF)
CREATE TABLE LogTACF (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    data_teste DATE NOT NULL,
    cooper_distancia INT, -- Distância em metros
    abdominal_reps INT, -- Repetições
    flexao_reps INT, -- Repetições
    barra_reps INT, -- Repetições
    
    -- Chave estrangeira ligando ao usuário
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
);

-- Tabela 4: Exercicio (Tipos de TFM)
CREATE TABLE Exercicio (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    -- JSONB é poderoso: armazena os campos que o frontend deve pedir
    campos_necessarios JSONB
);

-- Tabela 5: LogTFM (Treinamento Físico Militar)
CREATE TABLE LogTFM (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    exercicio_id INT NOT NULL,
    data_treino TIMESTAMP NOT NULL,
    percepcao_intensidade INT, -- Ex: 1 a 10
    
    -- JSONB para os detalhes flexíveis (distância, tempo, pace, etc.)
    detalhes_treino JSONB,
    
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (exercicio_id) REFERENCES Exercicio(id)
);

-- Inserindo dados iniciais (Exemplos de OMs e Exercícios)

INSERT INTO OrganizacaoMilitar (nome, sigla, grupo) VALUES
('Base Aérea de Santa Cruz', 'BASC', 'GUARNAE-RJ'),
('Base Aérea dos Afonsos', 'BAAF', 'GUARNAE-RJ'),
('Terceiro Comando Aéreo Regional', 'III COMAR', 'GUARNAE-RJ');

INSERT INTO Exercicio (nome, campos_necessarios) VALUES
('Corrida', '["distancia_km", "tempo_min", "pace_min_km", "fc_media_bpm"]'),
('Natação', '["distancia_m", "tempo_min", "ritmo_100m", "fc_media_bpm"]'),
('HIT', '["tempo_estimulo_s", "tempo_recuperacao_s", "numero_sessoes", "fc_media_bpm"]'),
('Bike Ergométrica', '["distancia_km", "tempo_min", "fc_media_bpm"]'),
('Musculação', '["grupo_muscular", "duracao_min"]');