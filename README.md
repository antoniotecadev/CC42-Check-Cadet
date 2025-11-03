# Check Cadet - CC42

<div align="center">

![Check Cadet Logo](https://img.shields.io/badge/Check%20Cadet-CC42-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-green?style=for-the-badge&logo=expo)
![License](https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey.svg?style=for-the-badge)

**Solução Digital Integrada para Gestão de Presença e Refeições na Escola 42**

</div>

---

## Sobre o Projeto

**Check Cadet** é uma aplicação multiplataforma desenvolvida especificamente para a comunidade da Escola 42, proporcionando uma solução completa e digitalizada para gestão de presenças em eventos, subscrições de refeições e localização de estudantes no campus. Através de tecnologias modernas como leitura de **QR Code** e integração com sistemas em tempo real, a aplicação oferece uma experiência rápida, eficiente e segura para estudantes e staff.

## Funcionalidades Principais

### Para Estudantes

#### 1. **Gestão de Eventos e Presença**
- Visualização de eventos disponíveis organizados por curso
- Marcação de presença através de QR Code gerado dinamicamente
- Histórico de eventos participados
- Notificações em tempo real sobre novos eventos
- Geração de QR Code pessoal para check-in rápido

#### 2. **Sistema de Refeições**
- Visualização do cardápio diário organizado por tipo de refeição (pequeno-almoço, almoço, jantar)
- Subscrição digital às refeições via QR Code
- Suporte para primeira e segunda porção
- Notificações push sobre disponibilidade de refeições
- Sistema de avaliação das refeições (rating)
- Visualização detalhada dos componentes nutricionais:
  - Carboidratos (arroz, massas, funge, batatas, pães)
  - Proteínas, leguminosas e vegetais
- Histórico de refeições subscritas
- Indicador visual de status de subscrição

#### 3. **Localização no Campus**
- Visualização em tempo real da localização de outros estudantes
- Registro manual de localização no campus
- Mapa interativo com overlay visual das localizações
- Sistema de lembretes diários para atualização de localização
- Indicador de confiabilidade baseado na frequência de atualização
- Pesquisa de estudantes por nome ou login

#### 4. **Sistema de Mensagens**
- Recepção de mensagens e comunicados oficiais
- Organização por curso (42Cursus, C Piscine, etc.)
- Histórico de mensagens recebidas

#### 5. **Autenticação e Perfil**
- Login seguro via OAuth 2.0 integrado com a API da 42
- Sincronização automática de dados do perfil
- Integração com sistema de coalitions
- Visualização de informações pessoais e acadêmicas

### Para Staff/Administradores

#### 1. **Gestão de Eventos**
- Criação e edição de eventos
- Geração de QR Codes para eventos
- Visualização da lista completa de participantes
- Marcação de início/encerramento de eventos
- Exportação de listas de presença em PDF
- Impressão e compartilhamento de relatórios
- Sincronização com Firebase Realtime Database
- Controle de check-in e check-out

#### 2. **Gestão de Refeições**
- Criação e edição de refeições
- Upload de imagens (integração com Cloudinary)
- Configuração de quantidade disponível
- Controle de status (ativo/bloqueado)
- Envio de notificações push sobre refeições
- Visualização de estatísticas de subscrições
- Exportação de listas de subscritos (PDF)
- Gestão de múltiplos cursos simultaneamente

#### 3. **Gestão de Subscrições**
- Scanner integrado de QR Code (câmera frontal e traseira)
- Verificação automática de subscrições duplicadas
- Indicadores visuais de status (subscrito/não subscrito)
- Controle de primeira e segunda porção
- Pesquisa rápida de estudantes
- Scroll infinito para grandes listas

#### 4. **Sistema de Notificações**
- Envio de notificações push via Firebase Cloud Messaging
- Sistema de tópicos por curso e campus
- Notificações de refeições disponíveis
- Alertas de eventos importantes

## Tecnologias Utilizadas

### Core Framework
- **Framework**: React Native com Expo SDK ~54.0
- **Linguagem**: TypeScript
- **Roteamento**: Expo Router (file-based routing)
- **Navegação**: React Navigation (Bottom Tabs)

### Recursos Nativos (Expo Managed)
- **Câmera**: expo-camera para captura e QR Code scanning
- **Notificações**: expo-notifications
- **Autenticação**: expo-auth-session (OAuth 2.0)
- **Armazenamento Seguro**: expo-secure-store
- **Impressão**: expo-print para geração de PDFs
- **Haptics**: expo-haptics para feedback tátil
- **Localização**: expo-localization para i18n
- **Compartilhamento**: expo-sharing para exportação de arquivos

### Backend & Cloud
- **Firebase Realtime Database**: Armazenamento de dados em tempo real
- **Firebase Cloud Messaging**: Sistema de notificações push
- **Firebase Authentication**: Autenticação com a API da 42
- **Cloudinary**: Upload e gestão de imagens (via API)
- **API REST**: Integração com backend da Escola 42 (Axios)

### Bibliotecas Principais
- **react-native-qrcode-svg**: Geração de QR Codes
- **expo-image**: Carregamento otimizado de imagens
- **@shopify/flash-list**: Listas de alta performance
- **react-native-reanimated**: Animações fluidas
- **react-native-gesture-handler**: Gestos nativos
- **i18n-js**: Internacionalização (Português, Inglês, Francês, Espanhol)

### Segurança
- **AES Encryption**: Criptografia de dados sensíveis (crypto-js)
- **OAuth 2.0**: Autenticação segura via expo-auth-session
- **JWT**: Tokens seguros (jwt-simple, jsrsasign)
- **Secure Storage**: Armazenamento criptografado nativo

### Ferramentas de Desenvolvimento
- **EAS CLI**: Build e deployment gerenciado
- **TypeScript**: Tipagem estática
- **ESLint**: Linting de código
- **Metro**: Bundler otimizado

## Interface e Experiência do Usuário

- **Design Moderno**: Interface seguindo Material Design e iOS Human Interface Guidelines
- **Modo Escuro**: Suporte completo a tema claro e escuro
- **Multilíngue**: Suporte para Português, Inglês, Francês e Espanhol
- **Personalização**: Cores dinâmicas baseadas em coalitions
- **Performance**: Flash Lists para scroll infinito e carregamento progressivo
- **Sincronização**: Dados em tempo real via Firebase
- **Animações Fluidas**: React Native Reanimated para UX premium
- **Feedback Háptico**: Vibração contextual para ações importantes

## Segurança e Privacidade

- Autenticação via OAuth 2.0
- Criptografia AES para dados sensíveis
- Validação de QR Codes com timestamp
- Controle de permissões por tipo de usuário (estudante/staff)
- Comunicação segura HTTPS
- Armazenamento local criptografado (expo-secure-store)
- Tokens JWT com assinatura digital

## Arquitetura

O projeto segue o padrão **Component-Based Architecture** com:
- **Context API**: Gerenciamento de estado global (LanguageContext, ColorCoalitionContext)
- **Custom Hooks**: Lógica reutilizável (useLogin42, useUsers, useFetchUser, etc.)
- **Repository Pattern**: Abstração de fontes de dados (Firebase, API REST)
- **File-based Routing**: Navegação via Expo Router
- **Services Layer**: Serviços especializados (notificações, autenticação, API)

## Funcionalidades Técnicas Avançadas

- **Firebase Integration**: Realtime Database, Cloud Messaging e Authentication
- **QR Code Technology**: Geração e leitura nativa
- **PDF Generation**: Criação dinâmica de documentos com expo-print
- **Push Notifications**: Sistema completo de notificações local e remota
- **Offline Support**: AsyncStorage para cache local
- **Camera Processing**: Scanning de QR Code em tempo real
- **i18n**: Sistema completo de internacionalização
- **OAuth 2.0**: Integração com API da 42 via expo-auth-session
- **Image Optimization**: expo-image com cache inteligente
- **Background Tasks**: Notificações locais agendadas

## Estrutura do Projeto

```
ios-cc/
├── api/                            # Serverless functions (Vercel)
│   ├── 42-proxy.js                # Proxy para API da 42
│   ├── loginWithIntra42Code.js    # Autenticação OAuth
│   └── notifications.js           # Notificações push
├── app/                           # Telas (Expo Router)
│   ├── (tabs)/                    # Navegação em abas
│   │   ├── index.tsx             # Home
│   │   ├── cursus.tsx            # Gestão de cursos
│   │   └── manual_location.tsx   # Localização manual
│   ├── event_details.tsx         # Detalhes de eventos
│   ├── event_users.tsx           # Participantes de eventos
│   ├── events_meals.tsx          # Eventos e refeições
│   ├── meal_details.tsx          # Detalhes de refeições
│   ├── meal_users.tsx            # Subscritos de refeições
│   ├── meals.tsx                 # Lista de refeições
│   ├── messages.tsx              # Mensagens
│   ├── qr_code.tsx               # Geração de QR Code
│   ├── qr_code_scanner.tsx       # Scanner de QR Code
│   ├── login.tsx                 # Autenticação
│   └── _layout.tsx               # Layout root
├── components/                    # Componentes reutilizáveis
│   ├── ui/                       # Componentes de UI
│   │   ├── EventItem.tsx
│   │   ├── MealItem.tsx
│   │   ├── MessageItem.tsx
│   │   ├── FloatActionButton.tsx
│   │   ├── CreateMealModal.tsx
│   │   └── ...
│   ├── ColorCoalitionContext.tsx
│   └── ThemedView.tsx
├── contexts/                      # Context API
│   └── LanguageContext.tsx
├── hooks/                         # Custom Hooks
│   ├── useLogin42.ts
│   ├── useFetchUser.ts
│   ├── useUsers.ts
│   ├── useCreateMeal.ts
│   ├── useFirebaseNotificationListener.ts
│   └── storage/
├── repository/                    # Data Layer
│   ├── eventRepository.ts
│   ├── mealRepository.ts
│   ├── userRepository.ts
│   └── manualLocationRepository.ts
├── services/                      # Business Logic
│   ├── api.ts                    # Cliente API REST
│   ├── authenticateWithFirebase.ts
│   ├── FirebaseNotification.ts
│   ├── ExpoNotificationService.ts
│   ├── LocalNotificationService.ts
│   └── messageService.ts
├── model/                         # Modelos de dados
│   ├── Event.ts
│   ├── Meal.ts
│   ├── Message.ts
│   └── Notification.ts
├── utility/                       # Utilitários
│   ├── AESUtil.ts
│   ├── DateUtil.ts
│   ├── HTMLUtil.ts
│   ├── ImageUtil.ts
│   └── QRCodeUtil.ts
├── i18n/                          # Internacionalização
│   ├── index.ts
│   └── locales/
├── constants/                     # Constantes
│   ├── Colors.ts
│   ├── cursusOptions.ts
│   ├── mealOptions.ts
│   └── schoolLocations.ts
├── assets/                        # Assets estáticos
│   ├── fonts/
│   └── images/
└── firebaseConfig.ts             # Configuração Firebase
```

## Instalação e Execução

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Expo CLI
- Expo Go (para testes em dispositivos físicos)
- Android Studio ou Xcode (para emuladores)

### Passos

1. **Instalar dependências**

   ```bash
   npm install
   ```

2. **Configurar Firebase**
   
   Crie o arquivo `firebaseConfig.ts` com suas credenciais:
   ```typescript
   export const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-auth-domain",
     databaseURL: "your-database-url",
     projectId: "your-project-id",
     storageBucket: "your-storage-bucket",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

3. **Iniciar o servidor de desenvolvimento**

   ```bash
   npm start
   # ou
   npx expo start
   ```

4. **Executar em plataforma específica**

   ```bash
   npm run android    # Android
   npm run ios        # iOS
   npm run web        # Web
   ```

## Casos de Uso

### Estudante Comum:
1. Fazer login com credenciais da 42
2. Visualizar eventos disponíveis
3. Gerar QR Code pessoal
4. Marcar presença em eventos
5. Subscrever refeições
6. Atualizar localização no campus
7. Receber notificações de refeições

### Staff/Administrador:
1. Criar novos eventos
2. Gerar QR Code do evento
3. Escanear QR Codes de estudantes
4. Exportar lista de presença
5. Criar e gerir refeições
6. Enviar notificações
7. Visualizar estatísticas

## Diferenciais

- **Multiplataforma**: iOS, Android e Web com uma única base de código
- **Offline First**: Funciona sem conexão com sincronização posterior
- **Tempo Real**: Atualizações instantâneas via Firebase
- **Escalável**: Suporte para múltiplos campus e cursos
- **Multilíngue**: Interface em 4 idiomas
- **Acessível**: Design inclusivo e responsivo
- **Performance**: Flash Lists e otimizações nativas
- **Expo Managed**: Desenvolvimento rápido sem configuração nativa complexa

## Comandos Úteis

```bash
# Desenvolvimento
npm start                # Inicia o servidor Expo
npm run android         # Abre no Android
npm run ios             # Abre no iOS
npm run web             # Abre no navegador

# Qualidade de Código
npm run lint            # Executa ESLint

# Build e Deploy
eas build --platform android    # Build Android via EAS
eas build --platform ios        # Build iOS via EAS
eas submit                      # Submit para stores
```

## Licença

Este projeto **Check Cadet - CC42** © 2024 está licenciado sob a licença [Creative Commons Atribuição-NãoComercial-SemDerivações 4.0 Internacional (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/).

![Licença CC BY-NC-ND 4.0](https://licensebuttons.net/l/by-nc-nd/4.0/88x31.png)

### Restrições:
- ❌ **Uso Comercial Proibido**: Não pode ser usado para fins comerciais
- ❌ **Sem Derivações**: Não pode criar obras derivadas
- ✅ **Atribuição Obrigatória**: Deve dar crédito apropriado ao autor

---

<div align="center">

**Desenvolvido especialmente para a comunidade 42 Luanda**

*Check Cadet - Tornando a gestão acadêmica mais eficiente e digital*

</div>
