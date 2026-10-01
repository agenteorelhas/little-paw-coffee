-- =============================================================================
-- Little Paw Coffee — Esquema do banco de dados (schema.sql)
-- SQL padrão compatível com SQLite 3.35+ e MySQL 8+ (InnoDB, utf8mb4).
-- O site atual é estático (dados em localStorage); este esquema define a
-- estrutura para uma futura versão com servidor, espelhando os mesmos dados.
--
-- Princípios LGPD aplicados:
--   * Minimização: somente dados necessários (nenhum dado de cartão/pagamento).
--   * Senhas armazenadas apenas como hash + sal (nunca em texto puro).
--   * Registro de consentimento com data, versão e status.
--   * Exclusão em cascata/anonimização ao eliminar o titular (art. 18, VI).
--
-- Cardinalidades (resumo):
--   clientes            1 : N  pedidos
--   pedidos             1 : N  itens_pedido
--   itens_cardapio      1 : N  itens_pedido      (pedidos N : N itens_cardapio)
--   clientes            1 : N  inscricoes_eventos
--   eventos             1 : N  inscricoes_eventos (clientes N : N eventos)
--   clientes            1 : N  cookies_consentimento (0..N; anônimo permitido)
--   sessoes_admin       1 : N  galeria_arte      (sessão que publicou a arte)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. clientes — titulares de dados (cadastro mínimo)
-- -----------------------------------------------------------------------------
CREATE TABLE clientes (
    id_cliente        INTEGER      NOT NULL PRIMARY KEY,
    nome_exibicao     VARCHAR(80)  NOT NULL,              -- nome ou apelido furry
    email             VARCHAR(254) NOT NULL,
    idioma_preferido  VARCHAR(5)   NOT NULL DEFAULT 'pt-BR',
    criado_em         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em     TIMESTAMP    NULL,
    anonimizado       SMALLINT     NOT NULL DEFAULT 0,   -- 1 = dados anonimizados (LGPD art. 18, IV)
    CONSTRAINT uq_clientes_email UNIQUE (email),
    CONSTRAINT ck_clientes_idioma CHECK (idioma_preferido IN ('pt-BR', 'en')),
    CONSTRAINT ck_clientes_anonimizado CHECK (anonimizado IN (0, 1))
);

-- -----------------------------------------------------------------------------
-- 2. itens_cardapio — catálogo temático (preço em centavos, evita arredondamento)
-- -----------------------------------------------------------------------------
CREATE TABLE itens_cardapio (
    id_item           VARCHAR(64)  NOT NULL PRIMARY KEY,  -- ex.: 'paw-brownie'
    nome_pt           VARCHAR(80)  NOT NULL,
    nome_en           VARCHAR(80)  NOT NULL,
    descricao_pt      VARCHAR(300) NOT NULL,
    descricao_en      VARCHAR(300) NOT NULL,
    categoria         VARCHAR(20)  NOT NULL,
    preco_centavos    INTEGER      NOT NULL,
    imagem_url        VARCHAR(255) NULL,
    emoji             VARCHAR(16)  NULL,
    vegano            SMALLINT     NOT NULL DEFAULT 0,
    disponivel        SMALLINT     NOT NULL DEFAULT 1,
    CONSTRAINT ck_itens_categoria CHECK (categoria IN ('hot', 'cold', 'snacks', 'desserts')),
    CONSTRAINT ck_itens_preco CHECK (preco_centavos > 0),
    CONSTRAINT ck_itens_vegano CHECK (vegano IN (0, 1)),
    CONSTRAINT ck_itens_disponivel CHECK (disponivel IN (0, 1))
);

-- -----------------------------------------------------------------------------
-- 3. pedidos — pedido fictício para retirada no balcão
--    1 cliente : N pedidos (id_cliente opcional: pedido anônimo é permitido)
--    NÃO existem colunas de pagamento ou cartão — por design.
-- -----------------------------------------------------------------------------
CREATE TABLE pedidos (
    id_pedido             INTEGER     NOT NULL PRIMARY KEY,
    id_cliente            INTEGER     NULL,
    codigo_retirada       CHAR(4)     NOT NULL,
    subtotal_centavos     INTEGER     NOT NULL,
    taxa_servico_centavos INTEGER     NOT NULL,   -- 10% do subtotal
    total_centavos        INTEGER     NOT NULL,
    status                VARCHAR(20) NOT NULL DEFAULT 'registrado',
    criado_em             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedidos_cliente FOREIGN KEY (id_cliente)
        REFERENCES clientes (id_cliente) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT ck_pedidos_status CHECK (status IN ('registrado', 'preparando', 'pronto', 'retirado', 'cancelado')),
    CONSTRAINT ck_pedidos_valores CHECK (subtotal_centavos >= 0 AND taxa_servico_centavos >= 0
                                         AND total_centavos = subtotal_centavos + taxa_servico_centavos)
);

-- -----------------------------------------------------------------------------
-- 4. itens_pedido — tabela associativa (pedidos N : N itens_cardapio)
--    1 pedido : N itens_pedido | 1 item_cardapio : N itens_pedido
-- -----------------------------------------------------------------------------
CREATE TABLE itens_pedido (
    id_pedido               INTEGER     NOT NULL,
    id_item                 VARCHAR(64) NOT NULL,
    quantidade              INTEGER     NOT NULL,
    preco_unitario_centavos INTEGER     NOT NULL,  -- preço congelado no momento do pedido
    PRIMARY KEY (id_pedido, id_item),
    CONSTRAINT fk_itens_pedido_pedido FOREIGN KEY (id_pedido)
        REFERENCES pedidos (id_pedido) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_itens_pedido_item FOREIGN KEY (id_item)
        REFERENCES itens_cardapio (id_item) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_itens_pedido_qtd CHECK (quantidade BETWEEN 1 AND 20),
    CONSTRAINT ck_itens_pedido_preco CHECK (preco_unitario_centavos > 0)
);

-- -----------------------------------------------------------------------------
-- 5. eventos — eventos da comunidade
-- -----------------------------------------------------------------------------
CREATE TABLE eventos (
    id_evento        VARCHAR(64)  NOT NULL PRIMARY KEY,   -- ex.: 'arte-furry'
    nome_pt          VARCHAR(100) NOT NULL,
    nome_en          VARCHAR(100) NOT NULL,
    descricao_pt     VARCHAR(500) NOT NULL,
    descricao_en     VARCHAR(500) NOT NULL,
    data_evento      DATE         NOT NULL,
    hora_inicio      TIME         NOT NULL,
    hora_fim         TIME         NOT NULL,
    preco_centavos   INTEGER      NOT NULL DEFAULT 0,     -- 0 = gratuito
    vagas            INTEGER      NOT NULL,
    icone            VARCHAR(16)  NULL,
    CONSTRAINT ck_eventos_preco CHECK (preco_centavos >= 0),
    CONSTRAINT ck_eventos_vagas CHECK (vagas > 0)
);

-- -----------------------------------------------------------------------------
-- 6. inscricoes_eventos — RSVP (clientes N : N eventos)
--    1 cliente : N inscrições | 1 evento : N inscrições
-- -----------------------------------------------------------------------------
CREATE TABLE inscricoes_eventos (
    id_inscricao        INTEGER     NOT NULL PRIMARY KEY,
    id_cliente          INTEGER     NOT NULL,
    id_evento           VARCHAR(64) NOT NULL,
    consentimento_em    TIMESTAMP   NOT NULL,              -- LGPD art. 7º, I
    status              VARCHAR(20) NOT NULL DEFAULT 'confirmada',
    criado_em           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inscricoes_cliente FOREIGN KEY (id_cliente)
        REFERENCES clientes (id_cliente) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inscricoes_evento FOREIGN KEY (id_evento)
        REFERENCES eventos (id_evento) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_inscricao_cliente_evento UNIQUE (id_cliente, id_evento),
    CONSTRAINT ck_inscricoes_status CHECK (status IN ('confirmada', 'cancelada', 'presente'))
);

-- -----------------------------------------------------------------------------
-- 7. sessoes_admin — sessões da administração (senha somente como hash + sal)
-- -----------------------------------------------------------------------------
CREATE TABLE sessoes_admin (
    id_sessao          INTEGER      NOT NULL PRIMARY KEY,
    token_hash         CHAR(64)     NOT NULL,     -- SHA-256 do token (o token nunca é salvo)
    criado_em          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em          TIMESTAMP    NOT NULL,     -- 30 minutos de inatividade
    encerrada          SMALLINT     NOT NULL DEFAULT 0,
    tentativas_falhas  INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT uq_sessoes_token UNIQUE (token_hash),
    CONSTRAINT ck_sessoes_encerrada CHECK (encerrada IN (0, 1))
);

-- -----------------------------------------------------------------------------
-- 8. galeria_arte — obras exibidas na galeria
--    1 sessao_admin : N obras (NULL para o acervo original)
-- -----------------------------------------------------------------------------
CREATE TABLE galeria_arte (
    id_arte         VARCHAR(64)  NOT NULL PRIMARY KEY,
    titulo          VARCHAR(80)  NOT NULL,
    artista         VARCHAR(60)  NOT NULL,
    descricao       VARCHAR(300) NULL,
    texto_alt       VARCHAR(200) NOT NULL,       -- acessibilidade (WCAG 1.1.1)
    caminho_imagem  VARCHAR(255) NOT NULL,       -- arquivo reprocessado, sem EXIF
    tipo_mime       VARCHAR(20)  NOT NULL DEFAULT 'image/jpeg',
    visivel         SMALLINT     NOT NULL DEFAULT 1,
    id_sessao       INTEGER      NULL,
    publicado_em    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_galeria_sessao FOREIGN KEY (id_sessao)
        REFERENCES sessoes_admin (id_sessao) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT ck_galeria_mime CHECK (tipo_mime IN ('image/jpeg', 'image/png', 'image/webp')),
    CONSTRAINT ck_galeria_visivel CHECK (visivel IN (0, 1))
);

-- -----------------------------------------------------------------------------
-- 9. cookies_consentimento — registro de consentimento LGPD
--    1 cliente : N registros (id_cliente NULL = visitante anônimo)
-- -----------------------------------------------------------------------------
CREATE TABLE cookies_consentimento (
    id_consentimento   INTEGER     NOT NULL PRIMARY KEY,
    id_cliente         INTEGER     NULL,
    identificador_anon CHAR(36)    NULL,          -- UUID aleatório, sem IP
    versao_politica    INTEGER     NOT NULL,
    status             VARCHAR(10) NOT NULL,
    essenciais         SMALLINT    NOT NULL DEFAULT 1,
    preferencias       SMALLINT    NOT NULL DEFAULT 0,
    registrado_em      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_consentimento_cliente FOREIGN KEY (id_cliente)
        REFERENCES clientes (id_cliente) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_consentimento_status CHECK (status IN ('accepted', 'declined')),
    CONSTRAINT ck_consentimento_flags CHECK (essenciais = 1 AND preferencias IN (0, 1))
);

-- -----------------------------------------------------------------------------
-- ALTER TABLE — evolução do esquema (colunas adicionadas após a versão 1)
-- -----------------------------------------------------------------------------
-- Compatível com SQLite e MySQL: coluna de auditoria adicionada posteriormente.
ALTER TABLE pedidos ADD COLUMN observacao VARCHAR(200) NULL;
ALTER TABLE clientes ADD COLUMN consentimento_marketing SMALLINT NOT NULL DEFAULT 0;

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------
CREATE INDEX idx_pedidos_cliente        ON pedidos (id_cliente);
CREATE INDEX idx_pedidos_criado_em      ON pedidos (criado_em);
CREATE INDEX idx_pedidos_codigo         ON pedidos (codigo_retirada, status);
CREATE INDEX idx_itens_pedido_item      ON itens_pedido (id_item);
CREATE INDEX idx_itens_cardapio_cat     ON itens_cardapio (categoria, disponivel);
CREATE INDEX idx_eventos_data           ON eventos (data_evento);
CREATE INDEX idx_inscricoes_evento      ON inscricoes_eventos (id_evento, status);
CREATE INDEX idx_galeria_visivel        ON galeria_arte (visivel, publicado_em);
CREATE INDEX idx_galeria_sessao         ON galeria_arte (id_sessao);
CREATE INDEX idx_sessoes_expira         ON sessoes_admin (expira_em);
CREATE INDEX idx_consentimento_cliente  ON cookies_consentimento (id_cliente);
CREATE INDEX idx_consentimento_anon     ON cookies_consentimento (identificador_anon);
