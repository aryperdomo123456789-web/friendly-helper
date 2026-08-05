# 🚀 Plano Especialista: Compatibilidade Universal (Smart TV, Mobile, Desktop)

Este plano detalha as estratégias aplicadas para garantir que o sistema funcione com performance e fluidez em todos os dispositivos, especialmente Smart TVs de todas as marcas (LG/WebOS, Samsung/Tizen, Android TV), Celulares (iOS/Android) e Computadores.

## 📺 1. Smart TVs (Navegação Web)
Smart TVs possuem hardware limitado e navegadores que muitas vezes são versões antigas do Chromium ou WebKit.

### 1.1 Navegação Espacial (D-Pad)
- **Motor de Foco Inteligente**: Implementado em `src/lib/tv-navigation.ts`. O sistema detecta automaticamente elementos interativos e move o foco usando cálculo de proximidade euclidiana ao apertar as setas do controle remoto.
- **Feedback Visual de Alto Contraste**: Estilos `:focus-visible` em `src/styles.css` com glow de 25px-60px e escala controlada para ser visível do sofá sem causar trepidação no hardware da TV.
- **Prevenção de Zoom**: Meta-tags e CSS específicos para evitar que o navegador da TV tente dar zoom automático ou aplicar paddings fantasmas.

### 1.2 Performance de Interface
- **GPU Acceleration**: Uso de `translate3d(0,0,0)` e `backface-visibility: hidden` em todos os elementos para forçar o uso da GPU da TV, reduzindo o lag de interface.
- **Font Scaling**: Interface escala automaticamente de 16px para 18px/20px em telas grandes para garantir legibilidade à distância.

---

## 📱 2. Dispositivos Móveis (Celulares e Tablets)
- **Touch-Friendly**: Targets de clique otimizados e remoção de escalas de foco em telas touch para evitar jitter.
- **iOS Fix**: Configuração de `font-size: 16px` em inputs para prevenir o "Auto-Zoom" do iPhone ao focar em campos de texto.
- **Elastic Scroll Control**: `overscroll-behavior-y: none` aplicado para garantir que o app se comporte como um aplicativo nativo, sem "rebotar" o fundo do navegador.

---

## 🎥 3. Player de Vídeo Resiliente
O player HLS.js foi tunado para máxima estabilidade:
- **Buffer Estendido**: `backBufferLength: 60` para evitar travamentos em conexões instáveis de TVs.
- **Retentativas Agressivas**: Até 25 tentativas de download de fragmentos antes de exibir erro.
- **Proxy Handshake**: Handshake de 60s no servidor para garantir que fluxos pesados (4K/FullHD) tenham tempo de iniciar em hardwares lentos.

---

## 🛠️ 4. Deploy & Infra (aaPanel/VPS)
- **Resets CSS Legados**: Inclusão de prefixos `-webkit` para garantir que as regras funcionem em navegadores de TVs fabricadas entre 2016-2020.
- **Proxy Reverso Nginx**: Configurado para suportar streams longos e manter a conexão viva sem timeouts prematuros.

---

Este plano garante um sistema **"Battle-Tested"** pronto para produção em massa.
