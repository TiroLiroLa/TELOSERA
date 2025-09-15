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
    fk_id_servico int NOT NULL,
    fk_id_cidade int NOT NULL
);

CREATE TABLE Regiao_atuacao (
    id_regiao serial PRIMARY KEY,
    local geometry(point, 4326) NOT NULL,
    raio varchar(5) NOT NULL,
    fk_id_cidade INT NOT NULL
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
    fk_id_cidade int,
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

CREATE TABLE Pais (
    id_pais serial PRIMARY KEY,
    nome varchar(100) NOT NULL UNIQUE,
    sigla char(2) NOT NULL UNIQUE
);

CREATE TABLE Estado (
    id_estado serial PRIMARY KEY,
    nome varchar(100) NOT NULL,
    uf char(2) NOT NULL,
    fk_id_pais int NOT NULL,
    CONSTRAINT uq_estado_uf_pais UNIQUE (uf, fk_id_pais),
    CONSTRAINT fk_estado_pais FOREIGN KEY (fk_id_pais) REFERENCES Pais (id_pais)
);

CREATE TABLE Cidade (
    id_cidade serial PRIMARY KEY,
    nome varchar(255) NOT NULL,
    fk_id_estado int NOT NULL,
    CONSTRAINT fk_cidade_estado FOREIGN KEY (fk_id_estado) REFERENCES Estado (id_estado)
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

ALTER TABLE Anuncio ADD CONSTRAINT FK_Anuncio_Cidade
    FOREIGN KEY (fk_id_cidade)
    REFERENCES Cidade (id_cidade)
    ON DELETE SET NULL;

ALTER TABLE Endereco ADD CONSTRAINT FK_Endereco_Cidade
    FOREIGN KEY (fk_id_cidade)
    REFERENCES Cidade (id_cidade)
    ON DELETE RESTRICT;

ALTER TABLE Regiao_atuacao
    ADD CONSTRAINT FK_RegiaoAtuacao_Cidade
    FOREIGN KEY (fk_id_cidade)
    REFERENCES Cidade (id_cidade)
    ON DELETE CASCADE;

INSERT INTO Pais (nome, sigla) VALUES ('Brasil', 'BR');

INSERT INTO Estado (nome, uf, fk_id_pais) VALUES
('Acre', 'AC', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Alagoas', 'AL', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Amapá', 'AP', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Amazonas', 'AM', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Bahia', 'BA', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Ceará', 'CE', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Distrito Federal', 'DF', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Espírito Santo', 'ES', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Goiás', 'GO', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Maranhão', 'MA', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Mato Grosso', 'MT', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Mato Grosso do Sul', 'MS', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Minas Gerais', 'MG', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Pará', 'PA', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Paraíba', 'PB', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Paraná', 'PR', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Pernambuco', 'PE', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Piauí', 'PI', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Rio de Janeiro', 'RJ', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Rio Grande do Norte', 'RN', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Rio Grande do Sul', 'RS', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Rondônia', 'RO', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Roraima', 'RR', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Santa Catarina', 'SC', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('São Paulo', 'SP', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Sergipe', 'SE', (SELECT id_pais FROM Pais WHERE sigla = 'BR')),
('Tocantins', 'TO', (SELECT id_pais FROM Pais WHERE sigla = 'BR'));

-- Acre (AC)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Rio Branco', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Cruzeiro do Sul', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Sena Madureira', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Tarauacá', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Feijó', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Brasiléia', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Senador Guiomard', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Plácido de Castro', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Xapuri', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Mâncio Lima', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Epitaciolândia', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Porto Acre', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Rodrigues Alves', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Marechal Thaumaturgo', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Jordão', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Porto Walter', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Acrelândia', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Bujari', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Capixaba', (SELECT id_estado FROM Estado WHERE uf = 'AC')),
('Assis Brasil', (SELECT id_estado FROM Estado WHERE uf = 'AC'));

-- Alagoas (AL)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Maceió', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Arapiraca', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Rio Largo', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Palmeira dos Índios', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Penedo', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('União dos Palmares', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('São Miguel dos Campos', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Marechal Deodoro', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Coruripe', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Delmiro Gouveia', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Campo Alegre', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Atalaia', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Girau do Ponciano', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Pilar', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Santana do Ipanema', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('São Luís do Quitunde', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Maragogi', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('São Sebastião', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Murici', (SELECT id_estado FROM Estado WHERE uf = 'AL')),
('Boca da Mata', (SELECT id_estado FROM Estado WHERE uf = 'AL'));

-- Amapá (AP)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Macapá', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Santana', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Laranjal do Jari', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Oiapoque', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Mazagão', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Porto Grande', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Tartarugalzinho', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Pedra Branca do Amapari', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Vitória do Jari', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Calçoene', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Amapá', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Ferreira Gomes', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Cutias', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Itaubal', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Serra do Navio', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Pracuúba', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Pedra Branca', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Lourenço', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Vila Nova', (SELECT id_estado FROM Estado WHERE uf = 'AP')),
('Sucuriju', (SELECT id_estado FROM Estado WHERE uf = 'AP'));

-- Amazonas (AM)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Manaus', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Parintins', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Itacoatiara', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Manacapuru', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Coari', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Tabatinga', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Maués', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Tefé', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Manicoré', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Humaitá', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Iranduba', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Lábrea', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('São Gabriel da Cachoeira', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Benjamin Constant', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Borba', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Autazes', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('São Paulo de Olivença', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Careiro', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Nova Olinda do Norte', (SELECT id_estado FROM Estado WHERE uf = 'AM')),
('Presidente Figueiredo', (SELECT id_estado FROM Estado WHERE uf = 'AM'));

-- Bahia (BA)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Salvador', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Feira de Santana', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Vitória da Conquista', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Camaçari', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Juazeiro', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Itabuna', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Lauro de Freitas', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Ilhéus', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Jequié', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Teixeira de Freitas', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Barreiras', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Porto Seguro', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Simões Filho', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Paulo Afonso', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Eunápolis', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Santo Antônio de Jesus', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Valença', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Alagoinhas', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Luís Eduardo Magalhães', (SELECT id_estado FROM Estado WHERE uf = 'BA')),
('Candeias', (SELECT id_estado FROM Estado WHERE uf = 'BA'));

-- Ceará (CE)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Fortaleza', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Caucaia', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Juazeiro do Norte', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Maracanaú', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Sobral', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Crato', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Itapipoca', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Maranguape', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Iguatu', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Quixadá', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Pacatuba', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Aquiraz', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Quixeramobim', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Canindé', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Russas', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Crateús', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Tianguá', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Aracati', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Cascavel', (SELECT id_estado FROM Estado WHERE uf = 'CE')),
('Pacajus', (SELECT id_estado FROM Estado WHERE uf = 'CE'));

-- Distrito Federal (DF)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Ceilândia', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Samambaia', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Taguatinga', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Plano Piloto', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Planaltina', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Águas Claras', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Recanto das Emas', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Gama', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Guará', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Santa Maria', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Sobradinho II', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('São Sebastião', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Vicente Pires', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Itapoã', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Sobradinho', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Sudoeste/Octogonal', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Brazlândia', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Riacho Fundo II', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Paranoá', (SELECT id_estado FROM Estado WHERE uf = 'DF')),
('Riacho Fundo', (SELECT id_estado FROM Estado WHERE uf = 'DF'));

-- Espírito Santo (ES)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Serra', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Vila Velha', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Cariacica', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Vitória', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Cachoeiro de Itapemirim', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Linhares', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('São Mateus', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Guarapari', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Colatina', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Aracruz', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Viana', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Nova Venécia', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Barra de São Francisco', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Marataízes', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('São Gabriel da Palha', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Itapemirim', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Castelo', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Alegre', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Domingos Martins', (SELECT id_estado FROM Estado WHERE uf = 'ES')),
('Iúna', (SELECT id_estado FROM Estado WHERE uf = 'ES'));

-- Goiás (GO)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Goiânia', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Aparecida de Goiânia', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Anápolis', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Rio Verde', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Águas Lindas de Goiás', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Luziânia', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Valparaíso de Goiás', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Trindade', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Formosa', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Novo Gama', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Senador Canedo', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Itumbiara', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Catalão', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Jataí', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Santo Antônio do Descoberto', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Planaltina', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Caldas Novas', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Goianésia', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Cidade Ocidental', (SELECT id_estado FROM Estado WHERE uf = 'GO')),
('Mineiros', (SELECT id_estado FROM Estado WHERE uf = 'GO'));

-- Maranhão (MA)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('São Luís', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Imperatriz', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('São José de Ribamar', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Timon', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Caxias', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Codó', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Paço do Lumiar', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Açailândia', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Bacabal', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Balsas', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Santa Inês', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Barra do Corda', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Pinheiro', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Chapadinha', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Santa Luzia', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Grajaú', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Itapecuru Mirim', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Coroatá', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Viana', (SELECT id_estado FROM Estado WHERE uf = 'MA')),
('Zé Doca', (SELECT id_estado FROM Estado WHERE uf = 'MA'));

-- Mato Grosso (MT)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Cuiabá', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Várzea Grande', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Rondonópolis', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Sinop', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Tangará da Serra', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Cáceres', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Sorriso', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Lucas do Rio Verde', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Primavera do Leste', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Barra do Garças', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Alta Floresta', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Pontes e Lacerda', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Nova Mutum', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Juína', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Campo Verde', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Colniza', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Guarantã do Norte', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Juara', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Peixoto de Azevedo', (SELECT id_estado FROM Estado WHERE uf = 'MT')),
('Colíder', (SELECT id_estado FROM Estado WHERE uf = 'MT'));

-- Mato Grosso do Sul (MS)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Campo Grande', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Dourados', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Três Lagoas', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Corumbá', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Ponta Porã', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Naviraí', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Nova Andradina', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Aquidauana', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Sidrolândia', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Maracaju', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Coxim', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Rio Brilhante', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Amambai', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Caarapó', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Paranaíba', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Ivinhema', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Bonito', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Jardim', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Aparecida do Taboado', (SELECT id_estado FROM Estado WHERE uf = 'MS')),
('Chapadão do Sul', (SELECT id_estado FROM Estado WHERE uf = 'MS'));

-- Minas Gerais (MG)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Belo Horizonte', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Uberlândia', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Contagem', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Juiz de Fora', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Betim', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Montes Claros', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Ribeirão das Neves', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Uberaba', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Governador Valadares', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Ipatinga', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Sete Lagoas', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Divinópolis', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Santa Luzia', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Ibirité', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Poços de Caldas', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Patos de Minas', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Pouso Alegre', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Teófilo Otoni', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Varginha', (SELECT id_estado FROM Estado WHERE uf = 'MG')),
('Conselheiro Lafaiete', (SELECT id_estado FROM Estado WHERE uf = 'MG'));

-- Pará (PA)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Belém', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Ananindeua', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Santarém', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Marabá', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Parauapebas', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Castanhal', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Abaetetuba', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Cametá', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Marituba', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Bragança', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('São Félix do Xingu', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Barcarena', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Itaituba', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Tucuruí', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Paragominas', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Breves', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Moju', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Oriximiná', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Altamira', (SELECT id_estado FROM Estado WHERE uf = 'PA')),
('Tailândia', (SELECT id_estado FROM Estado WHERE uf = 'PA'));

-- Paraíba (PB)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('João Pessoa', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Campina Grande', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Santa Rita', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Patos', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Bayeux', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Sousa', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Cabedelo', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Cajazeiras', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Guarabira', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Sapé', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Mamanguape', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Queimadas', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('São Bento', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Monteiro', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Itabaiana', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Esperança', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Pombal', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Catolé do Rocha', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Alagoa Grande', (SELECT id_estado FROM Estado WHERE uf = 'PB')),
('Pedras de Fogo', (SELECT id_estado FROM Estado WHERE uf = 'PB'));

-- Paraná (PR)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Curitiba', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Londrina', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Maringá', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Ponta Grossa', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Cascavel', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('São José dos Pinhais', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Foz do Iguaçu', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Colombo', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Guarapuava', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Paranaguá', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Araucária', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Toledo', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Apucarana', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Campo Largo', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Pinhais', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Arapongas', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Almirante Tamandaré', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Piraquara', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Umuarama', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Cambé', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('São Mateus do Sul', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('São João do Triunfo', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Boa Ventura de São Roque', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Palmeira', (SELECT id_estado FROM Estado WHERE uf = 'PR')),
('Antônio Olinto', (SELECT id_estado FROM Estado WHERE uf = 'PR'));

-- Pernambuco (PE)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Recife', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Jaboatão dos Guararapes', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Olinda', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Caruaru', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Petrolina', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Paulista', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Cabo de Santo Agostinho', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Camaragibe', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Garanhuns', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Vitória de Santo Antão', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Igarassu', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('São Lourenço da Mata', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Santa Cruz do Capibaribe', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Abreu e Lima', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Ipojuca', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Serra Talhada', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Araripina', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Gravatá', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Carpina', (SELECT id_estado FROM Estado WHERE uf = 'PE')),
('Goiana', (SELECT id_estado FROM Estado WHERE uf = 'PE'));

-- Piauí (PI)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Teresina', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Parnaíba', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Picos', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Piripiri', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Floriano', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Barras', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Campo Maior', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('União', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Altos', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Esperantina', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('José de Freitas', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Pedro II', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Oeiras', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('São Raimundo Nonato', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Miguel Alves', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Luís Correia', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Piracuruca', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Cocal', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Batalha', (SELECT id_estado FROM Estado WHERE uf = 'PI')),
('Corrente', (SELECT id_estado FROM Estado WHERE uf = 'PI'));

-- Rio de Janeiro (RJ)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Rio de Janeiro', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('São Gonçalo', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Duque de Caxias', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Nova Iguaçu', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Niterói', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Belford Roxo', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Campos dos Goytacazes', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('São João de Meriti', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Petrópolis', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Volta Redonda', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Macaé', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Magé', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Itaboraí', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Cabo Frio', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Angra dos Reis', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Nova Friburgo', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Barra Mansa', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Teresópolis', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Mesquita', (SELECT id_estado FROM Estado WHERE uf = 'RJ')),
('Rio das Ostras', (SELECT id_estado FROM Estado WHERE uf = 'RJ'));

-- Rio Grande do Norte (RN)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Natal', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Mossoró', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Parnamirim', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('São Gonçalo do Amarante', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Macaíba', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Ceará-Mirim', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Caicó', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Assú', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Currais Novos', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('São José de Mipibu', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Santa Cruz', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Pau dos Ferros', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('João Câmara', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Apodi', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Touros', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Canguaretama', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Nova Cruz', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Macau', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Extremoz', (SELECT id_estado FROM Estado WHERE uf = 'RN')),
('Baraúna', (SELECT id_estado FROM Estado WHERE uf = 'RN'));

-- Rio Grande do Sul (RS)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Porto Alegre', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Caxias do Sul', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Canoas', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Pelotas', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Santa Maria', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Gravataí', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Viamão', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Novo Hamburgo', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('São Leopoldo', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Rio Grande', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Alvorada', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Passo Fundo', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Sapucaia do Sul', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Uruguaiana', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Santa Cruz do Sul', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Cachoeirinha', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Bagé', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Bento Gonçalves', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Erechim', (SELECT id_estado FROM Estado WHERE uf = 'RS')),
('Guaíba', (SELECT id_estado FROM Estado WHERE uf = 'RS'));

-- Rondônia (RO)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Porto Velho', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Ji-Paraná', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Ariquemes', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Cacoal', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Vilhena', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Jaru', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Rolim de Moura', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Ouro Preto do Oeste', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Pimenta Bueno', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Guajará-Mirim', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Buritis', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Machadinho d''Oeste', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Espigão d''Oeste', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Nova Mamoré', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Candeias do Jamari', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Cujubim', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('São Miguel do Guaporé', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Alta Floresta d''Oeste', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Presidente Médici', (SELECT id_estado FROM Estado WHERE uf = 'RO')),
('Alto Paraíso', (SELECT id_estado FROM Estado WHERE uf = 'RO'));

-- Roraima (RR)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Boa Vista', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Rorainópolis', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Caracaraí', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Cantá', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Pacaraima', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Mucajaí', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Alto Alegre', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Amajari', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Iracema', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Bonfim', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Normandia', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Uiramutã', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Caroebe', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('São João da Baliza', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('São Luiz', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Iracema', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Cantá', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Palmeiras', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Tepequém', (SELECT id_estado FROM Estado WHERE uf = 'RR')),
('Santa Maria do Boiaçu', (SELECT id_estado FROM Estado WHERE uf = 'RR'));

-- Santa Catarina (SC)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Joinville', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Florianópolis', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Blumenau', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('São José', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Itajaí', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Chapecó', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Palhoça', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Criciúma', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Jaraguá do Sul', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Lages', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Brusque', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Itapema', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Balneário Camboriú', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Tubarão', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('São Bento do Sul', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Camboriú', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Navegantes', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Caçador', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Concórdia', (SELECT id_estado FROM Estado WHERE uf = 'SC')),
('Rio do Sul', (SELECT id_estado FROM Estado WHERE uf = 'SC'));

-- São Paulo (SP)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('São Paulo', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Guarulhos', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Campinas', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('São Bernardo do Campo', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Santo André', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Osasco', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('São José dos Campos', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Sorocaba', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Ribeirão Preto', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Santos', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Mauá', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('São José do Rio Preto', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Mogi das Cruzes', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Diadema', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Jundiaí', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Piracicaba', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Carapicuíba', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Bauru', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Itaquaquecetuba', (SELECT id_estado FROM Estado WHERE uf = 'SP')),
('Franca', (SELECT id_estado FROM Estado WHERE uf = 'SP'));

-- Sergipe (SE)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Aracaju', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Nossa Senhora do Socorro', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Lagarto', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Itabaiana', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('São Cristóvão', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Estância', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Tobias Barreto', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Itabaianinha', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Simão Dias', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Nossa Senhora da Glória', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Poço Redondo', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Capela', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Itaporanga d''Ajuda', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Propriá', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Porto da Folha', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Laranjeiras', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Boquim', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Nossa Senhora das Dores', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Poço Verde', (SELECT id_estado FROM Estado WHERE uf = 'SE')),
('Umbaúba', (SELECT id_estado FROM Estado WHERE uf = 'SE'));

-- Tocantins (TO)
INSERT INTO Cidade (nome, fk_id_estado) VALUES
('Palmas', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Araguaína', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Gurupi', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Porto Nacional', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Paraíso do Tocantins', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Araguatins', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Colinas do Tocantins', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Guaraí', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Tocantinópolis', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Dianópolis', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Miranorte', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Formoso do Araguaia', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Augustinópolis', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Taguatinga', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Miracema do Tocantins', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Pedro Afonso', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Peixe', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Natividade', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Xambioá', (SELECT id_estado FROM Estado WHERE uf = 'TO')),
('Goiatins', (SELECT id_estado FROM Estado WHERE uf = 'TO'));

INSERT INTO Area_atuacao (nome, descricao) VALUES
('Redes Ópticas (FTTx)', 'Planejamento, instalação e manutenção de redes de fibra óptica até o cliente final (Fiber to the x).'),
('Infraestrutura de Sites (Torres)', 'Construção civil, montagem e manutenção de torres de telecomunicações e infraestrutura de suporte.'),
('Redes de Rádio Frequência (RF)', 'Instalação e alinhamento de antenas, rádios micro-ondas, e sistemas de comunicação sem fio.'),
('Cabeamento Estruturado', 'Projetos e implementação de sistemas de cabeamento para dados, voz e vídeo em ambientes corporativos.'),
('Segurança Eletrônica (CFTV/Alarmes)', 'Instalação e configuração de sistemas de câmeras de vigilância e alarmes integrados à rede.'),
('Redes Corporativas (LAN/WAN)', 'Configuração de switches, roteadores e firewalls para redes locais e de longa distância.'),
('VoIP e Telefonia IP', 'Implementação de sistemas de telefonia baseados em protocolo de internet e PABX IP.'),
('Manutenção de Data Centers', 'Suporte à infraestrutura física de data centers, incluindo racks, climatização e energia.'),
('Sistemas de Energia para Telecom', 'Instalação e manutenção de retificadores, bancos de baterias e geradores para sites de telecom.'),
('Documentação e As-Built de Projetos', 'Elaboração de documentação técnica, diagramas e relatórios de "como construído" para projetos de rede.');

INSERT INTO Servico (nome, descricao) VALUES
('Lançamento de Cabo Óptico', 'Lançamento aéreo ou subterrâneo de cabos de fibra óptica em postes ou dutos.'),
('Fusão de Fibra Óptica', 'Realização de emendas em fibras ópticas utilizando máquina de fusão para garantir baixa perda de sinal.'),
('Instalação de CTO e Splitters', 'Montagem de Caixas de Terminação Óptica e instalação de divisores de sinal (splitters) na rede.'),
('Ativação de Cliente Final (Instalação)', 'Instalação de modem (ONU/ONT), configuração de Wi-Fi e testes de conectividade na casa do cliente.'),
('Vistoria Técnica de Viabilidade', 'Análise de campo para verificar a viabilidade técnica de uma nova instalação ou projeto.'),
('Manutenção Preventiva de Site', 'Inspeção periódica e manutenção de torres, sistemas de energia e equipamentos em um site de telecom.'),
('Manutenção Corretiva Emergencial', 'Atendimento rápido para solucionar falhas e interrupções inesperadas na rede.'),
('Certificação de Rede de Dados', 'Teste e validação de pontos de rede com equipamentos certificadores (ex: Fluke) para garantir conformidade com padrões.'),
('Configuração de Equipamentos de Rede', 'Configuração lógica de roteadores, switches ou outros dispositivos de rede conforme projeto.'),
('Ajudante Geral de Campo', 'Suporte em atividades gerais de campo, como organização de ferramentas, auxílio no lançamento de cabos e apoio à equipe técnica.');