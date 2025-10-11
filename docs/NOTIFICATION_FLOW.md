# 📱 Fluxo de Notificação de Localização

## 🎯 Objetivo
Quando um estudante procura outro estudante e clica no botão "🔔 Notificar", o estudante procurado recebe uma notificação push. Ao clicar na notificação, o app abre e oferece a opção de atualizar a localização.

---

## 🔄 Fluxo Completo

### 1️⃣ **Estudante A procura Estudante B**
```typescript
// manual_location.tsx - Tela de Localização Manual
1. Estudante A digita o login do Estudante B (ex: "andre")
2. App busca localização do Estudante B na API 42 e Firebase
3. Mostra card com:
   - Avatar e nome do estudante
   - Localização actual (ex: "Cluster 1")
   - Confiabilidade (baseada no tempo)
   - Botão "🔔 Notificar"
```

### 2️⃣ **Estudante A clica em "🔔 Notificar"**
```typescript
// manual_location.tsx - função notifyStudent()
const notifyStudent = async () => {
    // 1. Valida se tem push token
    if (!selectedStudent || !studentLocation?.pushToken) {
        showError("Erro", "Erro ao enviar notificação");
        return;
    }

    // 2. Busca nome de quem está procurando
    const myDisplayName = await getItem("displayname");

    // 3. Envia notificação
    await sendExpoNotificationToUser(studentLocation.pushToken, {
        title: "📣 Alguém está à sua procura!",
        body: "Um estudante está a tentar encontrar-te. Verifica a tua localização actual.",
        data: {
            type: "location_search",              // ⚠️ IMPORTANTE: Identifica o tipo
            searchedBy: myDisplayName || "Um estudante"
        },
        image: "https://via.placeholder.com/150"
    });

    // 4. Mostra confirmação
    showSuccess("🔔 Notificação Enviada", "André foi notificado!");
};
```

### 3️⃣ **Estudante B recebe a notificação**
```
📱 Notificação Push:
┌────────────────────────────────────┐
│ 📣 Alguém está à sua procura!      │
│ Um estudante está a tentar         │
│ encontrar-te. Verifica a tua       │
│ localização actual.                │
└────────────────────────────────────┘
```

### 4️⃣ **Estudante B clica na notificação**
```typescript
// _layout.tsx - função redirect()

// Detecta o clique (app aberto ou fechado)
Notifications.addNotificationResponseReceivedListener((response) => {
    redirect(response.notification);
});

// Função redirect analisa o tipo
async function redirect(notification: Notifications.Notification) {
    const { data } = notification.request.content;
    
    if (data.type === "location_search") {
        // Mostra Alert com confirmação
        Alert.alert(
            "📍 Actualizar Localização?",
            "João está à tua procura. Queres actualizar a tua localização agora?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Ir para Localização",
                    onPress: () => router.push("/(tabs)/manual_location")
                }
            ]
        );
    }
}
```

### 5️⃣ **Estudante B escolhe uma opção**

**Opção A: Clica em "Cancelar"**
- Alert fecha
- Estudante fica na tela actual

**Opção B: Clica em "Ir para Localização"**
- App navega para `/(tabs)/manual_location`
- Estudante vê o mapa interactivo
- Pode tocar em uma área para actualizar sua localização
- Sistema salva no Firebase com timestamp actualizado

---

## 🗂️ Estrutura de Dados

### Notificação Enviada
```typescript
{
    title: "📣 Alguém está à sua procura!",
    body: "Um estudante está a tentar encontrar-te...",
    data: {
        type: "location_search",        // Tipo da notificação
        searchedBy: "João Silva"        // Nome de quem procura
    },
    image: "https://via.placeholder.com/150"
}
```

### Push Token no Firebase
```
campus/{campusId}/cursus/{cursusId}/user_locations/{userId}
{
    "areaId": "cluster_1",
    "areaName": "Cluster 1",
    "displayName": "André Silva",
    "pushToken": "ExponentPushToken[...]",  // ⚠️ IMPORTANTE
    "lastUpdated": 1728654321000
}
```

---

## 📍 Rotas e Navegação

### Estrutura de Rotas
```
app/
  ├── _layout.tsx                    ← Handler de notificações
  ├── (tabs)/
  │   ├── _layout.tsx               ← Tab Navigator
  │   └── manual_location.tsx       ← Tela de localização
```

### Navegação ao Clicar
```typescript
// De qualquer tela → Tela de Localização
router.push("/(tabs)/manual_location");

// Resultado: Abre a aba "Localização" com o mapa interactivo
```

---

## 🎨 UI/UX

### 1. Card do Estudante Encontrado
```
┌─────────────────────────────────────────────┐
│ [👤] André Silva                     [🔔][✖]│
│      @andre                                  │
│      📍 Cluster 1                            │
│      🟢 Muito Confiável • há 3 minutos       │
└─────────────────────────────────────────────┘
```

### 2. Alert de Confirmação (ao clicar na notificação)
```
┌──────────────────────────────────────┐
│  📍 Actualizar Localização?          │
│                                      │
│  João está à tua procura. Queres     │
│  actualizar a tua localização agora? │
│                                      │
│  [Cancelar]  [Ir para Localização]   │
└──────────────────────────────────────┘
```

### 3. Mapa Interactivo (após navegação)
```
┌──────────────────────────────────────┐
│  🔍 Procurar Estudante               │
│  [Digite o user...]         [🔍]     │
├──────────────────────────────────────┤
│  📍 Toca numa área para registar     │
│     a tua localização                │
├──────────────────────────────────────┤
│                                      │
│    [Mapa com áreas clicáveis]        │
│                                      │
└──────────────────────────────────────┘
```

---

## 🔐 Validações e Segurança

### Antes de Enviar Notificação
```typescript
✅ Verifica se estudante foi encontrado
✅ Verifica se tem localização registada
✅ Verifica se tem push token válido
✅ Mostra loading durante envio
✅ Trata erros de rede
```

### Ao Receber Notificação
```typescript
✅ Valida que data.type === "location_search"
✅ Valida que userId e campusId existem
✅ Mostra alert de confirmação (não abre directo)
✅ Permite cancelar
```

---

## 🌍 Internacionalização (i18n)

### Português (Angola)
```json
{
  "location": {
    "notifyStudent": "🔔 Notificar",
    "notifyStudentTitle": "🔔 Notificação Enviada",
    "notifyStudentSuccess": "{{name}} foi notificado que está a ser procurado!",
    "someoneIsLookingForYou": "📣 Alguém está à sua procura!",
    "someoneIsLookingBody": "Um estudante está a tentar encontrar-te. Verifica a tua localização actual.",
    "updateLocationPromptTitle": "📍 Actualizar Localização?",
    "updateLocationPromptMessage": "{{name}} está à tua procura. Queres actualizar a tua localização agora?",
    "goToLocationScreen": "Ir para Localização"
  }
}
```

### English
```json
{
  "location": {
    "notifyStudent": "🔔 Notify",
    "notifyStudentTitle": "🔔 Notification Sent",
    "notifyStudentSuccess": "{{name}} has been notified that they are being searched for!",
    "someoneIsLookingForYou": "📣 Someone is looking for you!",
    "someoneIsLookingBody": "A student is trying to find you. Check your current location.",
    "updateLocationPromptTitle": "📍 Update Location?",
    "updateLocationPromptMessage": "{{name}} is looking for you. Do you want to update your location now?",
    "goToLocationScreen": "Go to Location"
  }
}
```

---

## 🧪 Testes

### Cenário 1: App Aberto (Foreground)
```
1. Estudante B tem app aberto
2. Estudante A envia notificação
3. ✅ Banner aparece no topo
4. ✅ Estudante B clica
5. ✅ Alert aparece
6. ✅ Clica "Ir para Localização"
7. ✅ Navega para mapa
```

### Cenário 2: App em Background
```
1. Estudante B tem app minimizado
2. Estudante A envia notificação
3. ✅ Notificação aparece na barra
4. ✅ Estudante B clica
5. ✅ App abre
6. ✅ Alert aparece
7. ✅ Navega para mapa
```

### Cenário 3: App Fechado
```
1. Estudante B tem app totalmente fechado
2. Estudante A envia notificação
3. ✅ Notificação aparece na barra
4. ✅ Estudante B clica
5. ✅ App abre do zero
6. ✅ Após splash, alert aparece
7. ✅ Navega para mapa
```

### Cenário 4: Sem Push Token
```
1. Estudante A procura Estudante B
2. Estudante B nunca registou localização
3. ✅ Botão "🔔 Notificar" NÃO aparece
4. ✅ Mostra apenas "Sem Localização"
```

---

## 🐛 Tratamento de Erros

### Erro: Push Token Inválido
```typescript
❌ Problema: Token expirado ou inválido
✅ Solução: Expo retorna erro, mostramos "Erro ao enviar notificação"
```

### Erro: Permissões Negadas
```typescript
❌ Problema: Usuário negou permissões de notificação
✅ Solução: Notificação não chega, mas não quebra o app
```

### Erro: Rede Offline
```typescript
❌ Problema: Sem conexão ao enviar
✅ Solução: Axios retorna erro, catch mostra alert
```

---

## 📊 Métricas e Logging

### Console Logs
```typescript
// Quando notificação é clicada (app aberto)
console.log("🟡 Notificação clicada (listener ativo):", {
    type: "location_search",
    searchedBy: "João Silva"
});

// Quando app é reaberto pela notificação
console.log("🔵 App reaberto pela notificação:", {
    type: "location_search",
    searchedBy: "João Silva"
});

// Quando notificação é enviada
console.log("📤 Notificação enviada para:", pushToken);
```

---

## 🚀 Melhorias Futuras

### 1. Resposta Automática
```typescript
// Quando Estudante B actualiza localização, notifica Estudante A
"João actualizou a sua localização! Ele está em: Cluster 2"
```

### 2. Histórico de Procuras
```typescript
// Salvar quem procurou quem
{
    searchedUserId: "123",
    searchedBy: "456",
    timestamp: 1728654321000
}
```

### 3. Notificação In-App
```typescript
// Banner dentro do app (sem push)
<Toast>
    📣 Alguém está à tua procura!
</Toast>
```

### 4. Estatísticas
```typescript
// Contar quantas vezes cada estudante foi procurado
{
    userId: "123",
    timesSearched: 5,
    lastSearchedAt: 1728654321000
}
```

---

## 📚 Referências

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Router Navigation](https://docs.expo.dev/router/introduction/)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [React Native Alert](https://reactnative.dev/docs/alert)

---

## ✅ Checklist de Implementação

- [x] Função `sendExpoNotificationToUser()` criada
- [x] Interface `UserLocationDocument` com `pushToken`
- [x] Botão "🔔 Notificar" no card do estudante
- [x] Estado `isSendingNotification` para loading
- [x] Função `notifyStudent()` completa
- [x] Handler de notificação em `_layout.tsx`
- [x] Alert de confirmação ao clicar
- [x] Navegação para tela de localização
- [x] Traduções PT-Angola e EN
- [x] Validação de push token
- [x] Tratamento de erros
- [x] Suporte app aberto/background/fechado

---

## 🎓 Conclusão

O fluxo está completo e funcional! O sistema permite que estudantes encontrem outros estudantes e os notifiquem de forma simples e intuitiva. A experiência é fluida, com confirmações apropriadas e navegação directa para a tela de actualização de localização.

**Autor:** António Teca Dev  
**Data:** 11 de Outubro de 2025  
**Projecto:** CC42 - Check Cadet
