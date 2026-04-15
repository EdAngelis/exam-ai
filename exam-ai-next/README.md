# Exame IA Project

This project is designed to demonstrate the capabilities of an AI system for auto-generating exams from a subject given by the user.

## Como rodar o projeto

1. Crie um arquivo `.env.local` e coloque nele as variáveis de ambiente do arquivo `.example.env.local`.

2. Criar um Google ID e um Google Secret:

   - Acesse o [Google Cloud Console](https://console.cloud.google.com/).
   - Crie um novo projeto ou selecione um projeto existente.
   - No menu de navegação, vá para "APIs e Serviços" > "Credenciais".
   - Clique em "Criar credenciais" e selecione "ID do cliente OAuth".
   - Configure a tela de consentimento OAuth, se ainda não tiver feito isso.
   - Escolha o tipo de aplicativo apropriado e preencha os detalhes necessários.
   - Após criar, você verá seu Google ID e Google Secret. Copie-os e adicione ao seu arquivo `.env.local`.
   - Vá na credencial que criou e adicione [http://localhost:3000] em Authorized JavaScript origins, e [http://localhost:3000/api/auth/callback/google] para Authorized redirect URIs.

3. Instalar dependências:

    ```bash
    npm install
    ```

4. Iniciar projeto:

    ```bash
    npm run dev
    ```

## Git Flow

- Iniciar uma nova Feature:

    ```sh
    git checkout develop
    git pull origin develop
    git checkout -b feature/nova-feature
    ```

- Depois que acabar a task:

    ```sh
    git commit -m "Add nova feature"
    git push origin feature/nova-feature
    ```

- Abra um Pull Request de `feature/nova-feature` → `develop`.

## Commit

Tipos de commit:

- `feat`: Adição de nova funcionalidade
- `fix`: Correção de bugs
- `docs`: Alterações na documentação
- `style`: Alterações que não afetam o significado do código (espaços em branco, formatação, etc.)
- `refactor`: Alterações no código que não corrigem bugs nem adicionam funcionalidades
- `test`: Adição ou correção de testes
- `chore`: Alterações em tarefas de build ou ferramentas auxiliares

Exemplo de título de commit:

```sh
git commit -m "feat: add user authentication"
```

IMPORTANT!!!
**Antes de dá commit rodar npm run build para vê se está gerando algum erro no build.**
**Usar Prettier on save para manter o código padronizado.**

## Definition of Done

- [ ] Clean Code
- [ ] Atomic Design [Saiba mais](https://medium.com/rd-shipit/como-criar-componentes-react-com-uma-arquitetura-escal%C3%A1vel-usando-atomic-design-74a67aaf47e0)
- [ ] Responsividade
- [ ] Sem bugs

## Estilização

- Utilizamos css como um module
- Cores e Fontes devem ser configurados globalmente em global.css

## License

This project is licensed under the MIT License.
