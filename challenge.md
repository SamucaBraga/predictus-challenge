# Challenge

## Requisitos técnicos

- **Frontend:** Next.js
- **Backend:** Nest.js
- **Banco de Dados:** PostgreSQL (utilizar TypeORM)
- **Node.js:** versão 20+
- **ESLint** para ajuste automático de indentação no código
- **Teste unitário** (opcional) com Jest

## Objetivo

Construir um fluxo de cadastro dividido em etapas sequenciais, onde:

- A cada etapa concluída, os dados devem ser persistidos no banco de dados.
- Se o usuário abandonar o processo, deve ir substituindo o registro novamente. Se ficar sem concluir o fluxo, deve-se enviar MFA (código de verificação por e-mail para o usuário, pelo Resend ou SendGrid), e ao abandonar o fluxo deve-se enviar um e-mail convidando a continuar o cadastro.
- O sistema deve armazenar informações importantes para geração de relatório, como: em que momento iniciou, em que momento finalizou e qual a última atualização.
- Ao finalizar todas as etapas, o usuário deve visualizar uma mensagem de sucesso de cadastro concluído.

## Fluxo (Step by Step)

1. **Identificação** → Nome e E-mail
2. **Documento** → CPF ou CNPJ
3. **Contato** → Telefone (somente celular)
4. **Endereço** → CEP (consulta automática via provider, preenchendo os demais campos), todos os campos que compõem um endereço
5. **Revisão e Conclusão** → Tela com todos os dados + botão "Concluir cadastro" exibindo mensagem de sucesso

## Sobre a Arquitetura

### Separação de responsabilidades

Toda a regra de negócio deve ser implementada exclusivamente no backend. O frontend deve apenas consumir os serviços.

### Reuso e componentização no frontend

Os elementos de interface (inputs, botões, formulários, etc.) devem ser componentes e reutilizados em todas as etapas.

### Experiência mobile-first

O fluxo deve ser pensado desde o início para funcionar de forma fluida em dispositivos móveis.

### Abstração de fornecedores externos

Qualquer integração com APIs externas (ex.: consulta de CEP) deve ser feita através de interfaces/providers, garantindo que a troca de fornecedor não impacte regras de negócio nem a lógica central do sistema.

### Persistência incremental

Cada etapa deve atualizar o cadastro parcial do usuário no banco, mantendo campos já preenchidos mesmo em caso de abandono.

### Testes unitários

Devem cobrir os principais fluxos no backend (serviços e regras).

## Fornecedores externos

- **Consulta de CEP (gratuito):** [viacep.com.br](https://viacep.com.br/)
- **Envio de e-mail (gratuito):** [resend.com](https://resend.com/login) ou [sendgrid.com](https://sendgrid.com)
