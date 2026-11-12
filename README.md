# Ordem VTT — escudo do mestre

## Funcionalidades
- Cadastro/login por e-mail e senha; confirmação de e-mail respeitada.
- Campanhas privadas por usuário, com nome e resumo editáveis.
- NPCs com ocupação, aparência, papel na história, desejo e vínculos.
- Locais associados aos NPCs e anotações de sessão.
- Busca, filtro por local, arquivamento e restauração.

## Configuração
Use NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY). Nunca use uma service-role key no navegador.
Execute supabase/migrations/20261108_gm_workspace.sql uma única vez no projeto Supabase. O script cria as tabelas gm_campaigns e gm_entries; não altera tabelas legadas. No editor de consultas da Vercel, que aceita apenas uma instrução, envolva o conteúdo entre BEGIN/COMMIT em um bloco DO $migration$ BEGIN ... END; $migration$.
Configure o endereço de produção em Authentication > URL Configuration e permita o retorno para /login.

## Desenvolvimento e validação
npm ci
npm run dev
npm run lint
npm run build

Dados são protegidos por RLS no banco, além dos filtros da interface. As relações entre NPC e local devem pertencer à mesma campanha e ao mesmo dono. O arquivamento é reversível. Edições concorrentes de registros são detectadas por updated_at.

O painel é privado do mestre. Fichas de jogadores, inventário, rolagens compartilhadas e mapas ficam para uma etapa posterior. Os componentes legados de atributos e dados permanecem no repositório.
