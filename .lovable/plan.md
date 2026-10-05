# Verificação (KYC) e antifraude — O MEU CARRO

O pedido é grande, por isso dividimos em fases. Este plano cobre a **Fase 1** completa e deixa as fases seguintes marcadas.

## Fase 1 — o que vai ser construído agora

### 1. Níveis de confiança do cliente
Conta criada → telefone verificado → identidade verificada → pagamento validado → **pode reservar**.
- Página "Verificação" no perfil com barra de progresso dos passos.
- Dados: nome completo, data de nascimento, morada, contacto de emergência, BI/Passaporte (número + foto frente/verso), selfie.
- O botão "Reservar" fica bloqueado com mensagem clara até a identidade estar aprovada.

### 2. KYC do fornecedor
- Escolha: pessoa singular ou empresa.
- Singular: BI, NIF, selfie, morada, dados bancários (IBAN).
- Empresa: denominação social, NIF, certidão comercial, alvará, representante legal + BI, contacto empresarial, IBAN em nome da empresa.
- Só fornecedores aprovados podem publicar anúncios.

### 3. Titularidade e dados do bem (no formulário de anúncio)
- Pergunta "É o proprietário?" → Sim: documento de propriedade. Não: qualidade (representante, empresa proprietária, procurador, gestor autorizado, outro) + documento de autorização.
- Veículos: matrícula, VIN/chassis, quilometragem, seguro, inspecção.
- Máquinas: número de série, horas de utilização, operador incluído, condições.
- 6 fotografias obrigatórias (frente, traseira, laterais, interior, painel) + foto com **código temporário** mostrado na app.
- O mesmo VIN/nº de série/matrícula noutra conta gera alerta e envia para análise.

### 4. Antifraude
- Aviso fixo: "Nunca efectue pagamentos directamente ao fornecedor fora da plataforma…".
- Detecção de frases suspeitas (WhatsApp, transferência, "fora da plataforma") nas descrições e comentários → alerta.
- **Risk Score interno** (verde/amarelo/vermelho) calculado com: idade da conta, verificações, valor da reserva, alterações recentes, alertas. Alto risco → reserva fica "em análise manual".
- Detecção de contas relacionadas: mesmo documento, telefone, IBAN, VIN ou morada.

### 5. Reputação
Selo "FORNECEDOR VERIFICADO" no anúncio: identidade, documentação, bem verificado, nº de transações concluídas, % de reservas concluídas, tempo na plataforma.
Texto em destaque: **"VERIFICADO não significa confiável em qualquer circunstância. Significa que a plataforma confirmou determinados dados e documentos."**

### 6. Painel de fraude do gestor
- Fila de verificações (clientes, fornecedores, bens) com ver documentos, aprovar/rejeitar com motivo.
- Lista de alertas, contas relacionadas e reservas em análise.
- Histórico de todas as alterações de dados críticos; alterar IBAN, BI ou titular volta a exigir aprovação.

### 7. Pagamento retido na plataforma
Novos estados: pagamento pendente → pago (retido) → entregue → cliente confirma recepção → fornecedor liberado. Métodos registados: Multicaixa Express, **pagamento por referência**, cartão.

## Fases seguintes (precisam de serviços externos)
- **OTP por SMS/WhatsApp**: requer um fornecedor de SMS (ex.: Twilio) — vou pedir a chave quando chegarmos lá. Até lá o passo "telefone" fica marcado como pendente/validado pelo gestor.
- **Pagamentos reais por referência / Multicaixa**: requer contrato com um operador (ex.: ProxyPay/EMIS). Na Fase 1 a referência é gerada e confirmada manualmente pelo gestor.
- Prova de vida automática, chat interno, 2FA, registo de dispositivo/IP.

## Detalhes técnicos
- Novas tabelas: `verificacoes_identidade`, `kyc_fornecedor`, `documentos` (bucket privado de armazenamento), `bens_identificacao` (VIN/série/matrícula com índice), `alertas_fraude`, `historico_alteracoes`, `pagamentos`; colunas novas em `anuncios` e `reservas` (risco, estado de pagamento).
- RLS: dono vê os seus; gestores (admin/suporte) vêem tudo via `private.has_role`. Documentos em bucket privado com URLs assinadas.
- Triggers: bloquear reserva sem identidade aprovada; bloquear publicação sem KYC; calcular risco; detectar duplicados e frases suspeitas; registar alterações críticas e repor estado "pendente".
