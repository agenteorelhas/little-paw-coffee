# 🐾☕ Little Paw Coffee (Café Little Paw)

[![CI/CD](https://github.com/agenteorelhas/little-paw-coffee/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/agenteorelhas/little-paw-coffee/actions/workflows/ci-cd.yml)
[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)

🌐 **Site publicado (GitHub Pages):** https://agenteorelhas.github.io/little-paw-coffee/

Site estático da **Little Paw Coffee**, cafeteria fictícia da comunidade furry. Feito somente com **HTML5, CSS e JavaScript puro** — sem frameworks e sem etapa de build (o Node.js é usado apenas para rodar os testes automatizados).

- Idioma principal: **português do Brasil (PT-BR)**, com botão para alternar para **inglês (EN)**.
- Carrinho **fictício**: gera um código de retirada no balcão. **Não há meios de pagamento e nenhum dado de cartão é solicitado.**
- Privacidade por padrão (**LGPD — Lei nº 13.709/2018**): todos os dados ficam no navegador do visitante (localStorage/sessionStorage). Nada é enviado a servidores.

## Como executar

Por causa da Política de Segurança de Conteúdo (CSP), sirva os arquivos por HTTP em vez de abri-los com `file://`:

```bash
cd little-paw-coffee
python3 -m http.server 8080
# Abra http://localhost:8080 no navegador
```

### Rodando os testes

Requer Node.js 18 ou superior (sem dependências externas — usa o `node:test` nativo):

```bash
npm test
```

Os testes verificam que o `index.html` existe, possui `<title>` e que todos os arquivos CSS/JS referenciados pelas páginas existem.

Em produção, use qualquer servidor estático (Apache já lê o `.htaccess` com os cabeçalhos de segurança). Use HTTPS para habilitar a Web Crypto API fora do localhost.

## Páginas

| Arquivo | Página |
|---|---|
| `index.html` | Página inicial: hero, Sobre Nós e Destaques |
| `cardapio.html` | Cardápio temático (13 itens em 4 categorias) |
| `galeria.html` | Galeria de Arte Furry com Modo Admin (upload/exclusão) |
| `eventos.html` | Eventos da comunidade com inscrição (RSVP) |
| `carrinho.html` | Carrinho, resumo com taxa de serviço de 10% e código de retirada |
| `privacidade.html` | Política de Privacidade (LGPD), exportação/eliminação de dados e formulário do titular |

## Estrutura de arquivos

```
little-paw-coffee/
├── index.html, cardapio.html, galeria.html, eventos.html, carrinho.html, privacidade.html
├── .htaccess                 # Cabeçalhos de segurança (Apache)
├── assets/
│   ├── css/
│   │   ├── main.css          # Design system, componentes e responsividade
│   │   ├── accessibility.css # Foco, skip link, sr-only, movimento reduzido, alto contraste
│   │   └── admin.css         # Painel do administrador da galeria
│   ├── images/               # Logo, banner, artes da galeria e fotos do cardápio
│   └── js/
│       ├── security.js       # InputSanitizer, FormValidator, SafeStorage, anti-clickjacking
│       ├── i18n.js           # Todas as traduções PT-BR/EN + applyLanguage(lang)
│       ├── lgpd.js           # ConsentManager (banner, aceite/recusa, canStore)
│       ├── data.js           # Catálogo, eventos e acervo inicial da galeria
│       ├── cart.js           # Classe Cart (add, remove, updateQty, getTotal, clear)
│       ├── layout.js         # Cabeçalho/rodapé compartilhados (NAV_ITEMS)
│       ├── gallery.js        # GalleryManager (SHA-256, upload, exclusão)
│       ├── main.js           # Inicialização, toasts, diálogos, menu móvel
│       └── pages/            # Scripts específicos de cada página
└── database/
    ├── schema.sql            # Esquema relacional (SQLite/MySQL)
    └── seed.sql              # Dados de exemplo
```

## Como adicionar uma página nova

1. Copie uma página existente (por exemplo, `eventos.html`) e altere `data-page` e `data-title-key` no `<body>`.
2. Inclua a página em `NAV_ITEMS` no arquivo `assets/js/layout.js`.
3. Adicione as chaves de texto em **ambos** os idiomas em `assets/js/i18n.js`.
4. Se precisar de lógica própria, crie `assets/js/pages/nova-pagina.js` e escute o evento `lpc:ready`.

## Modo Admin da galeria

- Senha padrão: `littlepaw2024` (**altere-a no primeiro acesso**, pelo próprio painel).
- A senha é armazenada somente como **hash SHA-256 com sal** (Web Crypto API); a senha em texto puro não aparece no código.
- 5 tentativas erradas bloqueiam o login por 5 minutos; a sessão expira após 30 minutos de inatividade.
- Imagens enviadas são validadas (tipo MIME + assinatura binária, até 5 MB), redimensionadas e reprocessadas em canvas, o que **remove metadados (EXIF/GPS)**.

> ⚠️ Limitação conhecida: em um site 100% estático, a autenticação acontece no navegador e serve como barreira de conveniência. Para uso real, mova a autenticação e o armazenamento das imagens para um servidor (o esquema `database/schema.sql` já prevê as tabelas `sessoes_admin` e `galeria_arte`).

## Segurança e LGPD

- **CSP** restritiva em todas as páginas (sem scripts/estilos inline, sem `eval`, sem origens externas).
- `Referrer-Policy: no-referrer`, `Permissions-Policy` bloqueando câmera, microfone e geolocalização, `X-Content-Type-Options: nosniff` e `X-Frame-Options: DENY` (via `.htaccess`, com proteção extra em JavaScript).
- Nenhum `innerHTML` com dados do usuário: todo conteúdo dinâmico é criado com `textContent`/DOM.
- Todas as entradas são sanitizadas e validadas (tamanho máximo, tipo, bloqueio de scripts).
- O carrinho guarda apenas `{id, quantidade}`; os preços sempre vêm do catálogo confiável.
- Banner de consentimento: dados **essenciais** (consentimento, carrinho, sessão admin) e **não essenciais** (idioma, inscrições em eventos — só gravados com aceite).
- Página de privacidade com download dos dados (portabilidade) e eliminação total com um clique.

## Banco de dados

`database/schema.sql` define 9 tabelas — `clientes`, `itens_cardapio`, `pedidos`, `itens_pedido`, `eventos`, `inscricoes_eventos`, `galeria_arte`, `sessoes_admin` e `cookies_consentimento` — com chaves primárias e estrangeiras, restrições `CHECK`, índices e comentários de cardinalidade.

```bash
sqlite3 littlepaw.db "PRAGMA foreign_keys=ON;" ".read database/schema.sql" ".read database/seed.sql"
```

## Acessibilidade

WCAG 2.1 AA: contraste mínimo de 4,5:1, paleta laranja/azul/marrom amigável a daltônicos, foco visível (3px laranja), link “Pular para o conteúdo”, HTML semântico, `aria-label` em botões de ícone, suporte a `prefers-reduced-motion` e alto contraste, e layout responsivo a partir de 320px.

## Fluxo de trabalho no GitHub (atividade "GitHub na prática")

Este repositório segue um fluxo profissional de desenvolvimento com integração e entrega contínuas (CI/CD):

1. **Issue** — cada mudança começa com uma issue descrevendo o problema ou a melhoria (ex.: `#1`).
2. **Branch** — o trabalho é feito em uma branch separada a partir da `main` (ex.: `feature/nova-cor-principal`), sem mexer direto na branch principal.
3. **Pull Request** — a branch é enviada e um PR é aberto para a `main`, com `Closes #1` na descrição para fechar a issue automaticamente no merge.
4. **GitHub Actions** — o workflow [`CI/CD`](.github/workflows/ci-cd.yml) roda o job `test` (`npm test`) em todo push e pull request; o PR só deve ser aceito com os testes passando.
5. **Merge** — após a revisão e os testes verdes, o PR é mesclado na `main` e a branch de feature é excluída.
6. **GitHub Pages** — a cada push na `main`, os jobs `build` (gera o artefato `_site`) e `deploy` publicam o site automaticamente em https://agenteorelhas.github.io/little-paw-coffee/ (Pages com origem "GitHub Actions").
7. **Ruleset** — a regra `proteger-main` protege a branch principal: exige pull request e a aprovação do status check `test` antes do merge, e bloqueia exclusão e force push.
8. **Release** — versões estáveis são marcadas com tags e publicadas como releases (ex.: `v1.0.0`).

## Licença

Distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).
