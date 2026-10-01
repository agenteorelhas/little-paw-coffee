-- =============================================================================
-- Little Paw Coffee — Dados de exemplo (seed.sql)
-- Execute após schema.sql. Todos os dados são fictícios.
-- Nenhum dado de pagamento/cartão existe neste banco — por design.
-- =============================================================================

-- clientes (e-mails no domínio reservado .example — RFC 2606)
INSERT INTO clientes (id_cliente, nome_exibicao, email, idioma_preferido, criado_em) VALUES
  (1, 'Kael Lobato',   'kael.lobato@exemplo.example',   'pt-BR', '2026-09-01 10:15:00'),
  (2, 'Mel Orelhuda',  'mel.orelhuda@exemplo.example',  'pt-BR', '2026-09-03 14:02:00'),
  (3, 'Rafa Fennec',   'rafa.fennec@exemplo.example',   'en',    '2026-09-10 09:40:00'),
  (4, 'Luna Pelúcia',  'luna.pelucia@exemplo.example',  'pt-BR', '2026-09-12 17:25:00'),
  (5, 'Toby Guaxinim', 'toby.guaxinim@exemplo.example', 'en',    '2026-09-20 11:05:00');

-- itens_cardapio (preços em centavos; espelham assets/js/data.js)
INSERT INTO itens_cardapio (id_item, nome_pt, nome_en, descricao_pt, descricao_en, categoria, preco_centavos, imagem_url, emoji, vegano) VALUES
  ('latte-raposa',      'Latté da Raposa',               'Fox Latte',             'Espresso duplo com leite vaporizado, canela e espuma em formato de patinha.', 'Double espresso with steamed milk, cinnamon and paw-shaped foam.', 'hot',      1690, 'assets/images/menu-specialty-latte.png', '🦊', 0),
  ('cappuccino-gato',   'Cappuccino Orelha de Gato',     'Cat Ear Cappuccino',    'Cappuccino cremoso com cacau em duas orelhinhas de gato.',                  'Creamy cappuccino with cocoa cat ears.',                           'hot',      1490, NULL, '🐱', 0),
  ('choco-focinho',     'Choco Focinho',                 'Choco Snout',           'Chocolate quente 60% cacau com marshmallow de focinho.',                    '60% cocoa hot chocolate with a snout marshmallow.',                'hot',      1390, NULL, '🐶', 0),
  ('cha-dragao',        'Chá do Dragão Sonolento',       'Sleepy Dragon Tea',     'Camomila, maçã e mel.',                                                     'Chamomile, apple and honey.',                                      'hot',      1190, NULL, '🐉', 1),
  ('frappe-lobo',       'Frappé do Lobo',                'Wolf Frappé',           'Café gelado batido com doce de leite e chantili.',                          'Blended iced coffee with dulce de leche and cream.',               'cold',     1890, NULL, '🐺', 0),
  ('suco-pata',         'Suco Pata Fresca',              'Fresh Paw Juice',       'Laranja, maracujá e hortelã com gelo de patinha.',                          'Orange, passion fruit and mint with paw ice.',                     'cold',     1290, NULL, '🍊', 1),
  ('cold-brew-cauda',   'Cold Brew Cauda Felpuda',       'Fluffy Tail Cold Brew', 'Extração a frio de 18 horas com espuma de baunilha.',                       '18-hour cold brew with vanilla foam.',                             'cold',     1590, NULL, '🐿️', 0),
  ('sanduiche-toca',    'Sanduíche da Toca',             'Burrow Sandwich',       'Fermentação natural, queijo minas, tomate assado e pesto.',                 'Sourdough, Minas cheese, roasted tomato and pesto.',               'snacks',   2290, NULL, '🦡', 0),
  ('biscoito-patinha',  'Biscoito da Patinha',           'Little Paw Cookie',     'Biscoitos amanteigados em formato de pata (4 unidades).',                   'Paw-shaped butter cookies (4 pieces).',                            'snacks',    990, NULL, '🐾', 0),
  ('pao-queijo-bigode', 'Pão de Queijo Bigodinho',       'Whisker Cheese Bread',  'Pães de queijo com bigodinhos de gergelim (6 unidades).',                   'Cheese bread with sesame whiskers (6 pieces).',                    'snacks',   1190, NULL, '🐭', 0),
  ('paw-brownie',       'Paw Brownie',                   'Paw Brownie',           'Brownie meio amargo com almofadinhas de chocolate branco.',                 'Dark chocolate brownie with white chocolate toe beans.',           'desserts', 1450, 'assets/images/menu-paw-brownie.png', '🐾', 0),
  ('cupcake-raposa',    'Cupcake Rabo de Raposa',        'Fox Tail Cupcake',      'Cupcake de cenoura com cobertura laranja e ponta branca.',                  'Carrot cupcake with orange frosting and a white tip.',             'desserts', 1290, NULL, '🦊', 0),
  ('cheesecake-coelho', 'Cheesecake Orelhinha de Coelho','Bunny Ear Cheesecake',  'Cheesecake de frutas vermelhas com orelhinhas de biscoito.',                'Berry cheesecake with cookie bunny ears.',                         'desserts', 1690, NULL, '🐰', 0);

-- pedidos (total = subtotal + 10%)
INSERT INTO pedidos (id_pedido, id_cliente, codigo_retirada, subtotal_centavos, taxa_servico_centavos, total_centavos, status, criado_em) VALUES
  (1, 1,    '4821', 3140, 314, 3454, 'retirado',   '2026-09-15 08:42:00'),
  (2, 2,    '1937', 4670, 467, 5137, 'retirado',   '2026-09-18 16:10:00'),
  (3, NULL, '7305', 1890, 189, 2079, 'pronto',     '2026-09-30 15:22:00'),
  (4, 3,    '5562', 5070, 507, 5577, 'registrado', '2026-10-01 09:05:00');

-- itens_pedido
INSERT INTO itens_pedido (id_pedido, id_item, quantidade, preco_unitario_centavos) VALUES
  (1, 'latte-raposa',      1, 1690),
  (1, 'paw-brownie',       1, 1450),
  (2, 'cappuccino-gato',   2, 1490),
  (2, 'cheesecake-coelho', 1, 1690),
  (3, 'frappe-lobo',       1, 1890),
  (4, 'sanduiche-toca',    1, 2290),
  (4, 'cold-brew-cauda',   1, 1590),
  (4, 'pao-queijo-bigode', 1, 1190);

-- eventos (espelham assets/js/data.js)
INSERT INTO eventos (id_evento, nome_pt, nome_en, descricao_pt, descricao_en, data_evento, hora_inicio, hora_fim, preco_centavos, vagas, icone) VALUES
  ('arte-furry',          'Noite de Arte Furry',                'Furry Art Night',               'Desenho coletivo ao vivo com artistas convidados e mural colaborativo.', 'Live group drawing with guest artists and a collaborative mural.', '2026-10-17', '19:00:00', '23:00:00',    0, 40, '🎨'),
  ('degustacao-pelucias', 'Tarde de Degustação com Pelúcias',   'Plushie Tasting Afternoon',     'Cinco métodos de preparo de café ao lado da sua pelúcia favorita.',     'Five coffee brewing methods next to your favorite plushie.',      '2026-10-25', '15:00:00', '18:00:00', 3500, 25, '🧸'),
  ('encontro-comunidade', 'Encontro da Comunidade Pata & Café', 'Paw & Coffee Community Meetup', 'Encontro mensal para fursuiters e curiosos, com área de descanso.',     'Monthly meetup for fursuiters and the curious, with a lounge.',   '2026-11-07', '14:00:00', '20:00:00',    0, 80, '🐾'),
  ('workshop-latte',      'Workshop de Latte Art Temático',     'Themed Latte Art Workshop',     'Aprenda a desenhar patinhas, orelhas e focinhos na espuma do leite.',   'Learn to draw paws, ears and snouts in milk foam.',               '2026-11-21', '10:00:00', '12:30:00', 6000, 12, '☕'),
  ('sarau-uivos',         'Sarau Uivos & Cafés',                'Howls & Coffee Open Mic',       'Microfone aberto para poesias, contos e músicas da comunidade.',        'Open mic for community poems, stories and songs.',                '2026-12-05', '19:30:00', '22:30:00',    0, 50, '🎤');

-- inscricoes_eventos
INSERT INTO inscricoes_eventos (id_inscricao, id_cliente, id_evento, consentimento_em, status) VALUES
  (1, 1, 'arte-furry',          '2026-09-20 10:00:00', 'confirmada'),
  (2, 2, 'arte-furry',          '2026-09-21 12:30:00', 'confirmada'),
  (3, 2, 'workshop-latte',      '2026-09-21 12:32:00', 'confirmada'),
  (4, 4, 'degustacao-pelucias', '2026-09-25 18:45:00', 'confirmada'),
  (5, 5, 'encontro-comunidade', '2026-09-28 09:10:00', 'cancelada');

-- sessoes_admin (token_hash = SHA-256 de tokens fictícios)
INSERT INTO sessoes_admin (id_sessao, token_hash, criado_em, expira_em, encerrada, tentativas_falhas) VALUES
  (1, 'a3f1c9e2b7d4058e6f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f70', '2026-09-05 09:00:00', '2026-09-05 09:30:00', 1, 0),
  (2, 'b8e2d7c6a5f40312e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3928170f6e5d4c3', '2026-10-01 08:30:00', '2026-10-01 09:00:00', 0, 1);

-- galeria_arte (acervo original: id_sessao NULL)
INSERT INTO galeria_arte (id_arte, titulo, artista, descricao, texto_alt, caminho_imagem, tipo_mime, visivel, id_sessao) VALUES
  ('art-1', 'Uivo do Expresso',     'Kael Lobato',  'Um lobo cinzento aproveita a primeira xícara da manhã.',            'Lobo antropomórfico segurando uma xícara de café fumegante',       'assets/images/gallery-art-1.png', 'image/png', 1, NULL),
  ('art-2', 'Pincéis e Cappuccino', 'Mel Orelhuda', 'Uma coelha artista desenha entre um gole e outro de cappuccino.',  'Coelha artista desenhando em um caderno ao lado de um café',       'assets/images/gallery-art-2.png', 'image/png', 1, NULL),
  ('art-3', 'A Mesa da Matilha',    'Rafa Fennec',  'Amigos de várias espécies dividem bolos, risadas e café.',          'Grupo de personagens furry reunidos em uma mesa de cafeteria',     'assets/images/gallery-art-3.png', 'image/png', 1, NULL);

-- cookies_consentimento
INSERT INTO cookies_consentimento (id_consentimento, id_cliente, identificador_anon, versao_politica, status, essenciais, preferencias, registrado_em) VALUES
  (1, 1,    NULL,                                   1, 'accepted', 1, 1, '2026-09-01 10:14:00'),
  (2, 2,    NULL,                                   1, 'accepted', 1, 1, '2026-09-03 14:01:00'),
  (3, NULL, '6f1d2c3b-4a59-4e8f-9b7a-1c2d3e4f5a6b', 1, 'declined', 1, 0, '2026-09-30 15:20:00'),
  (4, 3,    NULL,                                   1, 'declined', 1, 0, '2026-09-10 09:39:00');
