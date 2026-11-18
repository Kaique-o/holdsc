# Hold Contábil · demonstração

Demonstração do novo digital da Hold Contábil, publicada no GitHub Pages:
**https://kaique-o.github.io/holdsc/**

> Esta pasta é **gerada** pelo `scripts/publicar.mjs` do projeto `holdsc` (código-fonte fora deste repositório).
> Não edite os arquivos aqui: a próxima publicação apaga tudo. Correções vão no código-fonte.
> Tudo tem `noindex,nofollow`: é demonstração, não o site no ar.

## O que tem aqui

| Endereço | O que é |
|---|---|
| [`/`](https://kaique-o.github.io/holdsc/) | Site oficial (27 páginas) |
| [`/campanha/`](https://kaique-o.github.io/holdsc/campanha/) | Landing dos anúncios (no celular abre em modo story; `?stories=0` desliga) |
| [`/blog/`](https://kaique-o.github.io/holdsc/blog/) | Cópia estática do blog (sem JavaScript) |
| [`/links/`](https://kaique-o.github.io/holdsc/links/) | Link na bio do Instagram |
| [`/_hub/`](https://kaique-o.github.io/holdsc/_hub/) | Hub interno com todos os links |
| `/qualquer-coisa` | 404 da Hold |

## Avaliação de UX (Filipe, 17/11/2026): o que foi feito

Nota de partida 55/100. Os 17 cards foram executados no código-fonte (o patch das 12 correções foi refeito na fonte,
porque o arquivo não chegou). Estimativa atual com a mesma régua: **cerca de 82**.

| Card | Situação |
|---|---|
| Patch das 12 correções | Feito na fonte, com 25 testes automáticos |
| Textos provisórios | Escondidos até a Hold mandar os dados (0 em 29 páginas) |
| Botão "Rastreamento" | Só aparece com `?debug=1` |
| Um formulário e dois botões | Formulário só em `pedir-proposta.html`; nas outras páginas, "Falar no WhatsApp" + "Pedir proposta" |
| GA4 e Meta Pixel | Código pronto com Consent Mode v2 e `event_id`; **faltam os IDs da Hold** |
| Blog e links | Só o WhatsApp oficial, posts vazios fora, guia da Reforma Tributária escrito |
| Domínio e Google | Modo de produção e mapa de 301 prontos; **falta decidir domínio e hospedagem** |
| Banner de cookies | Barra fina no rodapé (92 px no celular) |
| Menu do celular | Fecha com Esc, toque fora, link e troca para desktop |
| Home mais curta | 9,6 telas no celular (eram 17) |
| Campanha mais leve | Vídeo depois da capa, acento do título inteiro, sem rascunho |
| Imagens | WebP com largura e altura declaradas |
| Porta de entrada e 404 | Site oficial na raiz, hub em `/_hub/`, 404 próprio |
| Alvos de toque | 44 px no celular |
| Visual único | Tokens de cor e tipografia num arquivo só |
| "Falar comigo" | Vira "Falar com a equipe" sem número próprio da pessoa; **a Hold decide** |
| Página /conteudos | Virou atalho para o blog |

Além dos cards: planilha de fluxo de caixa de verdade (baixa na hora), guia da Reforma Tributária no blog,
o mesmo rodapé nos três sites e primeira pintura mais rápida (CSS num pacote, fontes e scripts sem travar).

## Para conferir

- Celular (375 px) e computador: menu, barra de cookies, formulário em `pedir-proposta.html#mei`, download da planilha.
- Painel de eventos: qualquer página com `?debug=1`.
- Links internos: a publicação roda uma checagem no fim e avisa se algum link quebrou.

## O que depende da Hold

CNPJ e CRC, time com nome e foto, endereço de BH, revisão jurídica da política, IDs de GTM, GA4 e Meta, domínio e
destino dos pedidos (CRM, n8n ou e-mail), revisão do guia da Reforma e da planilha, autores dos posts.
