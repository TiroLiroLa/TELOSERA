CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE Usuario (
    id_usuario serial PRIMARY KEY,
    tipo_usuario char(1) NOT NULL,
    email varchar(50) NOT NULL,
    senha varchar(60) NOT NULL,
    data_cadastro timestamptz DEFAULT NOW(),
    ultimo_login timestamptz,
    ativo bool DEFAULT true,
    telefone varchar(15),
    cpf varchar(11) NOT NULL,
    nome varchar(255) NOT NULL,
    fk_id_ender int
);

CREATE TABLE Area_atuacao (
    id_area serial PRIMARY KEY,
    nome varchar(255) NOT NULL,
    descricao text,
    fk_id_area_pai int
);

CREATE TABLE Servico (
    id_servico serial PRIMARY KEY,
    nome varchar(255) NOT NULL,
    descricao text
);

CREATE TABLE Anuncio (
    id_anuncio serial PRIMARY KEY,
    status bool DEFAULT true,
    data_servico date,
    titulo varchar(255) NOT NULL,
    descricao text,
    local geometry(point, 4326),
    data_publicacao timestamptz DEFAULT NOW(),
    tipo char(1) NOT NULL,
    fk_id_usuario int NOT NULL,
    fk_Area_id_area int NOT NULL,
    fk_id_servico int NOT NULL
);

CREATE TABLE Regiao_atuacao (
    id_regiao serial PRIMARY KEY,
    local geometry(point, 4326) NOT NULL,
    raio varchar(5) NOT NULL
);

CREATE TABLE Avaliacao (
    id_avaliacao serial PRIMARY KEY,
    data_avaliacao timestamptz DEFAULT NOW(),
    comentario text,
    tipo_avaliacao char(1) NOT NULL,
    fk_id_confirmacao int NOT NULL,
    fk_id_avaliador int NOT NULL,
    fk_id_avaliado int NOT NULL
);

CREATE TABLE Avaliacao_contratante (
    clareza_demanda smallint,
    pagamento smallint,
    estrutura_local smallint,
    fk_id_avaliacao int PRIMARY KEY
);

CREATE TABLE Avaliacao_prestador (
    satisfacao smallint,
    pontualidade smallint,
    fk_id_avaliacao int PRIMARY KEY
);

CREATE TABLE Confirmacao (
    id_confirmacao serial PRIMARY KEY,
    data_confirmacao timestamptz DEFAULT NOW(),
    fk_id_usuario int NOT NULL
);

CREATE TABLE Candidato_Candidata (
    data_candidatura timestamptz DEFAULT NOW(),
    fk_id_usuario int NOT NULL,
    fk_id_anuncio int NOT NULL,
    PRIMARY KEY (fk_id_usuario, fk_id_anuncio)
);

CREATE TABLE Reclamacao (
    id_reclamacao serial PRIMARY KEY,
    descricao text NOT NULL,
    data_reclamacao timestamptz DEFAULT NOW(),
    fk_id_usuario int NOT NULL
);

CREATE TABLE Endereco (
    id_ender serial PRIMARY KEY,
    rua text,
    numero varchar(8),
    complemento text,
    cidade text,
    estado char(2),
    cep varchar(8)
);

CREATE TABLE Atua (
    fk_id_regiao int NOT NULL,
    fk_id_usuario int NOT NULL,
    PRIMARY KEY (fk_id_regiao, fk_id_usuario)
);

CREATE TABLE Usuario_area (
    fk_id_usuario int NOT NULL,
    fk_id_area int NOT NULL,
    PRIMARY KEY (fk_id_usuario, fk_id_area)
);

CREATE TABLE Servico_area (
    fk_id_area int NOT NULL,
    fk_id_servico int NOT NULL,
    PRIMARY KEY (fk_id_area, fk_id_servico)
);

CREATE TABLE Profissional_servico (
    fk_id_usuario int NOT NULL,
    fk_id_servico int NOT NULL,
    PRIMARY KEY (fk_id_usuario, fk_id_servico)
);

ALTER TABLE Usuario
    ADD CONSTRAINT uq_usuario_email UNIQUE (email),
    ADD CONSTRAINT uq_usuario_cpf UNIQUE (cpf),
    ADD CONSTRAINT ck_tipo_usuario CHECK (tipo_usuario IN ('P', 'E')),
    ADD CONSTRAINT ck_formato_email CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$');

ALTER TABLE Anuncio
    ADD CONSTRAINT ck_tipo_anuncio CHECK (tipo IN ('O', 'S')),
    ADD CONSTRAINT ck_data_servico_valida CHECK (data_servico >= CURRENT_DATE);

ALTER TABLE Avaliacao
    ADD CONSTRAINT ck_tipo_avaliacao CHECK (tipo_avaliacao IN ('P', 'C'));

ALTER TABLE Avaliacao_contratante
    ADD CONSTRAINT ck_clareza_demanda CHECK (clareza_demanda BETWEEN 1 AND 5),
    ADD CONSTRAINT ck_pagamento CHECK (pagamento BETWEEN 1 AND 5),
    ADD CONSTRAINT ck_estrutura_local CHECK (estrutura_local BETWEEN 1 AND 5);

ALTER TABLE Avaliacao_prestador
    ADD CONSTRAINT ck_satisfacao CHECK (satisfacao BETWEEN 1 AND 5),
    ADD CONSTRAINT ck_pontualidade CHECK (pontualidade BETWEEN 1 AND 5);

CREATE OR REPLACE FUNCTION hash_senha()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.senha IS NOT NULL AND NEW.senha <> '' THEN
        NEW.senha := crypt(NEW.senha, gen_salt('bf'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION impedir_auto_avaliacao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fk_id_avaliador = NEW.fk_id_avaliado THEN
        RAISE EXCEPTION 'Um usuário não pode avaliar a si mesmo.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verificar_tipo_avaliacao_prestador()
RETURNS TRIGGER AS $$
DECLARE
    tipo_base CHAR(1);
BEGIN
    SELECT tipo_avaliacao INTO tipo_base FROM Avaliacao WHERE id_avaliacao = NEW.fk_id_avaliacao;
    IF tipo_base <> 'P' THEN
        RAISE EXCEPTION 'Tipo de avaliação inconsistente: Apenas avaliações do tipo "P" (Prestador) podem ser inseridas aqui.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verificar_tipo_avaliacao_contratante()
RETURNS TRIGGER AS $$
DECLARE
    tipo_base CHAR(1);
BEGIN
    SELECT tipo_avaliacao INTO tipo_base FROM Avaliacao WHERE id_avaliacao = NEW.fk_id_avaliacao;
    IF tipo_base <> 'C' THEN
        RAISE EXCEPTION 'Tipo de avaliação inconsistente: Apenas avaliações do tipo "C" (Contratante) podem ser inseridas aqui.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hash_senha
BEFORE INSERT OR UPDATE ON Usuario
FOR EACH ROW
EXECUTE FUNCTION hash_senha();

CREATE TRIGGER trigger_impedir_auto_avaliacao
BEFORE INSERT ON Avaliacao
FOR EACH ROW
EXECUTE FUNCTION impedir_auto_avaliacao();

CREATE TRIGGER trigger_verificar_tipo_prestador
BEFORE INSERT ON Avaliacao_prestador
FOR EACH ROW
EXECUTE FUNCTION verificar_tipo_avaliacao_prestador();

CREATE TRIGGER trigger_verificar_tipo_contratante
BEFORE INSERT ON Avaliacao_contratante
FOR EACH ROW
EXECUTE FUNCTION verificar_tipo_avaliacao_contratante();

ALTER TABLE Usuario ADD CONSTRAINT FK_Usuario_2
    FOREIGN KEY (fk_id_ender)
    REFERENCES Endereco (id_ender)
    ON DELETE SET NULL;
 
ALTER TABLE Area_atuacao ADD CONSTRAINT FK_Area_atuacao_2
    FOREIGN KEY (fk_id_area_pai)
    REFERENCES Area_atuacao (id_area);
 
ALTER TABLE Anuncio ADD CONSTRAINT FK_Anuncio_2
    FOREIGN KEY (fk_id_usuario)
    REFERENCES Usuario (id_usuario)
    ON DELETE CASCADE;
 
ALTER TABLE Anuncio ADD CONSTRAINT FK_Anuncio_3
    FOREIGN KEY (fk_Area_id_area)
    REFERENCES Area_atuacao (id_area)
    ON DELETE RESTRICT;
 
ALTER TABLE Anuncio ADD CONSTRAINT FK_Anuncio_4
    FOREIGN KEY (fk_id_servico)
    REFERENCES Servico (id_servico)
    ON DELETE RESTRICT;
 
ALTER TABLE Avaliacao ADD CONSTRAINT FK_Avaliacao_2
    FOREIGN KEY (fk_id_confirmacao)
    REFERENCES Confirmacao (id_confirmacao)
    ON DELETE CASCADE;
 
ALTER TABLE Avaliacao ADD CONSTRAINT FK_Avaliacao_3
    FOREIGN KEY (fk_id_avaliador)
    REFERENCES Usuario (id_usuario)
    ON DELETE CASCADE;
	
ALTER TABLE Avaliacao ADD CONSTRAINT FK_Avaliacao_4
    FOREIGN KEY (fk_id_avaliado)
    REFERENCES Usuario (id_usuario)
    ON DELETE CASCADE;
 
ALTER TABLE Avaliacao_contratante ADD CONSTRAINT FK_Avaliacao_contratante_2
    FOREIGN KEY (fk_id_avaliacao)
    REFERENCES Avaliacao (id_avaliacao)
    ON DELETE CASCADE;
 
ALTER TABLE Avaliacao_prestador ADD CONSTRAINT FK_Avaliacao_prestador_2
    FOREIGN KEY (fk_id_avaliacao)
    REFERENCES Avaliacao (id_avaliacao)
    ON DELETE CASCADE;
 
ALTER TABLE Confirmacao ADD CONSTRAINT FK_Confirmacao_2
    FOREIGN KEY (fk_id_usuario)
    REFERENCES Usuario (id_usuario)
    ON DELETE CASCADE;
 
ALTER TABLE Candidato_Candidata ADD CONSTRAINT FK_Candidato_Candidata_1
    FOREIGN KEY (fk_id_usuario)
    REFERENCES Usuario (id_usuario)
    ON DELETE CASCADE;
 
ALTER TABLE Candidato_Candidata ADD CONSTRAINT FK_Candidato_Candidata_2
    FOREIGN KEY (fk_id_anuncio)
    REFERENCES Anuncio (id_anuncio)
    ON DELETE CASCADE;
 
ALTER TABLE Reclamacao ADD CONSTRAINT FK_Reclamacao_2
    FOREIGN KEY (fk_id_usuario)
    REFERENCES Usuario (id_usuario)
    ON DELETE CASCADE;
 
ALTER TABLE Atua ADD CONSTRAINT FK_Atua_1
    FOREIGN KEY (fk_id_regiao)
    REFERENCES Regiao_atuacao (id_regiao)
    ON DELETE CASCADE;
 
ALTER TABLE Atua ADD CONSTRAINT FK_Atua_2
    FOREIGN KEY (fk_id_usuario)
    REFERENCES Usuario (id_usuario)
    ON DELETE CASCADE;
 
ALTER TABLE Usuario_area ADD CONSTRAINT FK_Usuario_area_1
    FOREIGN KEY (fk_id_usuario)
    REFERENCES Usuario (id_usuario)
    ON DELETE CASCADE;
 
ALTER TABLE Usuario_area ADD CONSTRAINT FK_Usuario_area_2
    FOREIGN KEY (fk_id_area)
    REFERENCES Area_atuacao (id_area)
    ON DELETE CASCADE;
 
ALTER TABLE Servico_area ADD CONSTRAINT FK_Servico_area_1
    FOREIGN KEY (fk_id_area)
    REFERENCES Area_atuacao (id_area)
    ON DELETE CASCADE;
 
ALTER TABLE Servico_area ADD CONSTRAINT FK_Servico_area_2
    FOREIGN KEY (fk_id_servico)
    REFERENCES Servico (id_servico)
    ON DELETE CASCADE;
 
ALTER TABLE Profissional_servico ADD CONSTRAINT FK_Profissional_servico_1
    FOREIGN KEY (fk_id_usuario)
    REFERENCES Usuario (id_usuario)
    ON DELETE CASCADE;
 
ALTER TABLE Profissional_servico ADD CONSTRAINT FK_Profissional_servico_2
    FOREIGN KEY (fk_id_servico)
    REFERENCES Servico (id_servico)
    ON DELETE CASCADE;
