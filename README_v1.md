<h1 align="center">
🗺️ Rover: Planejador Inteligente de Itinerários ✈️
</h1>

<p align="center">
<strong>
<i>Desbrave o mundo sem perder o rumo</i>
</strong>
</p>

<p align="center">
O <strong>Rover</strong> é uma aplicação mobile que inova o planejamento turístico, combinando a precisão da <i>Teoria dos Grafos</i> com a adaptabilidade da <i>Inteligência Artificial</i> para gerar roteiros de viagem eficientes, dinâmicos e personalizados para cada usuário
</p>

## 📖 Indice

* [📖 Escopo do Projeto](-escopo-do-projeto)
* [🚀 Como Executar o Projeto](-como-executar-o-projeto)
* [🏗️ Estrutura Inicial do Projeto](-estrutura-inicial-do-projeto)
* [🎨 Desenvolvimento de Marca e Design](-desenvolvimento-de-marca-e-design)
* [💡 Ideia de Venda](-ideia-de-venda)
* [👥 Equipe](-equipe)

## 📖 Escopo do Projeto

### Problema

Planejar roteiros de viagem consome muito tempo e gera roteiros estáticos e ineficientes. Cruzar mapas e guias para descobrir a melhor ordem das atrações é frustrante, e o planejamento não resiste a imprevistos reais (como chuva ou trânsito)

### Público-Alvo

Turistas, viajantes solo, casais e famílias que buscam otimizar o tempo de suas viagens sem abrir mão da flexibilidade

### Proposta de Valor

Criação de rotas turísticas otimizadas por distância e tempo, com capacidade de recálculo dinâmico e adaptação inteligente via assistente virtual durante a viagem

## 🚀 Como Executar o Projeto

1. **Clone** o Respositório:

    ```bash
        git clone https://github.com/L-A-N-E/App-Mobile-Rover
    ```

2. Entre na pasta do **Projeto**:

    ```bash
        cd App-Mobile-Rover
    ```

3. Entre na pasta do **Front-End** :

    ```bash
        cd mobile
    ```

4. **Rode** o aplicativo:
    ```bash
        npm install
        npx expo start
    ```

### 🤖 IA local (Llama) — Backend

O chatbot e as sugestões de locais usam o **Llama 3.2** rodando no seu computador via [Ollama](https://ollama.com). O app funciona sem o backend (com respostas simuladas), mas para usar a IA de verdade:

1. Instale o **Ollama** e baixe o modelo:

    ```bash
        ollama pull llama3.2:3b
    ```

2. Em outro terminal, rode a **API**:

    ```bash
        cd backend
        npm install
        npm start
    ```

3. Abra o app pelo Expo Go **na mesma rede Wi-Fi** do computador. O app descobre o IP do PC automaticamente (o mesmo usado pelo Expo). Se precisar, defina manualmente em `mobile/.env`: `EXPO_PUBLIC_API_URL=http://SEU_IP:3333`.

| OBS: no Windows, permita o Node.js no Firewall (rede privada) quando ele pedir, senão o celular não alcança a porta 3333. Configurações do modelo ficam em `backend/.env` (veja `backend/.env.example`). Com pouca memória de vídeo, feche apps pesados (emulador, Figma) para a IA responder mais rápido.

| Endpoint | Descrição |
| :--- | :--- |
| `GET /api/health` | Status do Ollama e do modelo |
| `POST /api/chat` | Chat com streaming (NDJSON), usando o roteiro como contexto |
| `POST /api/chat/warmup` | Pré-carrega o contexto da viagem para a 1ª resposta ser rápida |
| `POST /api/suggestions` | Sugestões de lugares reais, conferidas no OpenStreetMap |

### 🌦️ Previsão do tempo e alertas

O app consulta a [Open-Meteo](https://open-meteo.com) (gratuita, sem chave de API) para a cidade e as datas de cada viagem. A previsão por hora é cruzada com o roteiro: atividades **ao ar livre** com chuva, tempestade, neve, calor extremo, frio intenso ou ventos fortes no horário da visita ficam destacadas, com sugestão de troca por um local coberto próximo. Quando isso acontece, o Rover envia uma **notificação local** avisando que a programação precisa ser alterada (uma vez por dia afetado; dá para desligar em Perfil → Alertas de clima).

| OBS: a previsão cobre até ~14 dias à frente; para viagens mais distantes, o app mostra a partir de quando ela fica disponível. As notificações são verificadas ao abrir o app e ao voltar para ele.

## 🏗️ Estrutura Inicial do Projeto

A organização prioriza a separação de responsabilidades entre interface mobile e lógica da API (será feita posteiormente).

```
rover/
├── mobile/                  # Frontend Mobile
│   ├── src/
│   │   ├── components/      # Botões, Cards, Modais
│   │   ├── screens/         # Home, Viagens, Chatbot, Perfil
│   │   ├── navigation/      # React Navigation (Tabs)
│   │   └── tokens/          # Variáveis de Cores e Tipografia
│   ├── App.js
│   └── package.json
│
└── backend/                 # API Node/Express + Llama (Ollama)
    ├── src/
    │   ├── routes/          # /api/chat e /api/suggestions
    │   ├── prompts.ts       # Instruções enviadas ao modelo
    │   ├── ollama.ts        # Cliente do Ollama
    │   └── geocode.ts       # Coordenadas reais (OpenStreetMap)
    └── package.json
```

## 🎨 Desenvolvimento de Marca e Design

### Identidade Visual e Logo

* **Nome**: Rover (Remete à exploração, descoberta e movimentação eficiente)

* **Logo Conceitual**:
  <img width="100%" alt="Group 0" src="https://github.com/user-attachments/assets/0d206f4d-d93c-4d19-b856-2ca3749bef67" />

### Paleta de Cores e Tipografia
<img width="100%" alt="Group 1" src="https://github.com/user-attachments/assets/b0bdebfa-707e-431e-8dbd-52a3b1d79bc9" />

<img width="100%" alt="Group 2" src="https://github.com/user-attachments/assets/7af29304-94d7-47c8-aa1a-58af3a77b15b" />

<img width="100%" alt="Group 3" src="https://github.com/user-attachments/assets/17b2c506-437e-436b-852a-e0ba89c4dbb1" />


### Telas Conceituais

<img width="100%" alt="Group 4" src="https://github.com/user-attachments/assets/e83f27e9-da05-4390-b652-fcec93515537" />

## 💡 Ideia de Venda

### Modelo de Negócio

O **Rover** opera num modelo **Freemium**:

* **Versão Free**: Permite ao usuário gerar rotas de 1 dia (Day Trip), selecionando os locais manualmente, otimizadas pelo algoritmo de grafos.

* **Versão Premium (Assinatura)**: Habilita roteiros de múltiplos dias gerados por IA com base no perfil do viajante (família, casal, etc) e libera o Chatbot Contextual para alterações dinâmicas no meio da viagem.

### Diferencial Competitivo

O grande diferencial do **Rover** é a sua capacidade de adaptação em tempo real. Em vez de entregar um planejamento estático que perde a utilidade diante de imprevistos, o **Rover cria, otimiza e recalcula o itinerário completo de forma dinâmica**. Se começar a chover no meio da tarde, por exemplo, o Chatbot contextual compreende a situação, sugere locais fechados na região, substitui as atrações no roteiro e recalcula a rota mais rápida instantaneamente.

## 👥 Equipe

| Nome | RM | Papel |
| :--- | :--- | :--- |
| **Alice Santos Bulhões** | `RM554499` | **Product Owner (PO)** (Escopo, Documentação e Priorização) |
| **Eduardo Oliveira Cardoso Madid** | `RM556349` | **Backend** (API, Cybersegurança, Documentação da API) |
| **Nicolas Haubricht Hainfellner** | `RM556259` | **Desenvolvedor Frontend** (React Native, Expo, Navegação) |
| **Guilherme da Cunha Melo** | `RM555310` | **UI/UX Designer** (Identidade visual, prototipação no Figma) |
| **Matheus Gushi Morioka** | `RM556935` | **Quality Assurance (QA)** (Testes, validação de fluxo e revisão) |
