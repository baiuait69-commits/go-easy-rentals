# Garantir acesso ao painel de gestão

## Estado atual (verificado)
- A conta `nichoolson668@gmail.com` existe na base de dados e já tem a função `admin` atribuída.
- As permissões de leitura da função foram corrigidas anteriormente.

## O que fazer

1. **Testar o login real** com as credenciais da conta através do sistema de autenticação, para confirmar que a palavra-passe está correta e a sessão é criada.
2. **Se a palavra-passe falhar**: redefinir a palavra-passe da conta para a indicada pelo utilizador e confirmar o email, garantindo entrada imediata.
3. **Validar o acesso ao painel**: abrir a página de login do gestor no navegador de teste, entrar com a conta e confirmar que o Dashboard abre sem a mensagem "Esta conta não tem acesso ao painel de gestão".
4. **Confirmar ao utilizador** que o acesso está ativo e indicar os passos: ir a "Login do gestor", inserir email e palavra-passe, entrar no painel.

## Notas técnicas
- A verificação usa o fluxo real de autenticação (não apenas a base de dados), para apanhar problemas de palavra-passe ou sessão.
- Nenhuma alteração de estrutura da base de dados é necessária — a função `admin` já está atribuída.
