# Ordem VTT — escudo do mestre

## Funcionalidades
- Cadastro/login por e-mail e senha; confirmação de e-mail respeitada.
- Campanhas privadas por usuário, com nome e resumo editáveis.
- NPCs com ocupação, aparência, papel na história, desejo e vínculos.
- Fichas de NPCs com atributos, recursos atuais/máximos, perícias, rituais, inventário e ataques.
- Soma de treino e bônus, controle de espaços e desconto de PE ao usar rituais.
- Locais associados aos NPCs e anotações de sessão.
- Busca, filtro por local, arquivamento e restauração.

## Configuração
Use NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY). Nunca use uma service-role key no navegador.
Execute supabase/migrations/20261108_gm_workspace.sql uma única vez no projeto Supabase. O script cria as tabelas gm_campaigns e gm_entries; não altera tabelas legadas. No editor de consultas da Vercel, que aceita apenas uma instrução, envolva o conteúdo entre BEGIN/COMMIT em um bloco DO $migration$ BEGIN ... END; $migration$.
Configure o endereço de produção em Authentication > URL Configuration e permita o retorno para /login.
Depois da migração inicial, execute `supabase/migrations/20261112_npc_sheets.sql` uma vez. Ela acrescenta a coluna opcional `sheet`, sem modificar os textos existentes nem as políticas de acesso.

## Desenvolvimento e validação
npm ci
npm run dev
npm run lint
npm run build

Dados são protegidos por RLS no banco, além dos filtros da interface. As relações entre NPC e local devem pertencer à mesma campanha e ao mesmo dono. O arquivamento é reversível. Edições concorrentes de registros são detectadas por updated_at.

Para abrir a ficha: NPCs → selecione um NPC → Abrir ficha. Alterações de todas as abas são gravadas juntas em Salvar ficha, com detecção de edições concorrentes. Máximos, defesa, capacidade e efeitos de itens são definidos manualmente para permitir adaptações do sistema. Rituais descontam apenas o custo em PE cadastrado; equipar itens não aplica efeitos automaticamente.

O painel é privado do mestre. Fichas de jogadores, rolagens compartilhadas e mapas ficam para uma etapa posterior. Os componentes legados de atributos e dados permanecem no repositório.
