# Reservas reais + Assistente de IA para problemas de acesso

## Estado actual
- A tabela de reservas já foi criada na base de dados (com estados, comissão de 15%, regras de quem pode cancelar, estender e avaliar).
- As páginas ainda usam dados fictícios. Os créditos acabaram antes de ligar as páginas, por isso esta parte ainda não foi testada.

## Parte 1 — Reservas reais (por concluir)
1. **Janela "Reservar"** partilhada pelas páginas de anúncio, produto e viatura: datas de início/fim, período (hora/dia/semana/mês), método de pagamento (Multicaixa Express, cartão, transferência), resumo com total, caução e comissão. Quem não tem sessão iniciada é enviado para o login.
2. **Página "As minhas reservas"** com dados reais: separadores Activas / Histórico, cancelar (pendente ou confirmada), estender o fim (activas), avaliar com estrelas (concluídas).
3. **Pedidos recebidos** (fornecedor/empresa): aprovar, rejeitar, marcar "Em utilização" e "Concluída".
4. **Painel do gestor**: o separador Reservas passa a mostrar as reservas reais, com pesquisa e filtro por estado.
5. Corrigir os avisos de segurança da função de validação (retirar o acesso directo de visitantes e utilizadores).

## Parte 2 — Assistente de IA para problemas de acesso (novo)
1. **Nova página no painel do gestor: "Diagnóstico de acesso"** (só gestores).
   - Campo para o email da conta afectada e caixa de texto para descrever o problema.
   - Botão "Analisar".
2. **O que é analisado**, recolhido no servidor:
   - Dados da conta: existe ou não, email confirmado, última entrada, conta bloqueada, data de criação.
   - Funções atribuídas (gestor, empresa, suporte) e histórico de alterações de funções.
   - Registo próprio de tentativas de login (novo): cada tentativa no login normal e no login do gestor guarda data, email, sucesso/erro e mensagem de erro.
3. **Resposta da IA**: causa provável, passos de resolução numerados e, quando aplicável, botões de acção rápida já existentes (ex.: atribuir função de gestor).
4. Histórico das análises feitas, visível só para gestores.

## Detalhes técnicos
- Novas tabelas: `auth_tentativas` (insert por qualquer utilizador para o próprio email; leitura só admin) e `diagnosticos_acesso` (admin), com GRANTs e RLS.
- Server function `diagnosticarAcesso` com `requireSupabaseAuth` + verificação `has_role admin`; dados da conta via `supabaseAdmin.auth.admin.listUsers` carregado dentro do handler.
- IA via Lovable AI Gateway, modelo `openai/gpt-6-astra` na Responses API, em streaming, saída estruturada (causa, passos, acções); tratar erros 402/429 com mensagem clara.
- Os registos internos de autenticação do backend não são acessíveis pela app em tempo de execução; por isso é criado o registo próprio de tentativas.
- Link "Diagnóstico" adicionado à navegação do painel do gestor.
