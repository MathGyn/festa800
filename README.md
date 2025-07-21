# Festa 800 | 2025 Time Machine 🎉

Website interativo da Festa 800 com criador de cards Time Traveler integrado e componente MagicBento para uma experiência futurística.

## ✨ Recursos

- **Website principal** - Experiência interativa com componente MagicBento
- **Card Creator** - Gerador de cards Time Traveler com efeitos holográficos
- **Remoção automática de fundo** - Usando API remove.bg
- **Vídeos em alta qualidade** - Renderização com Remotion

## 🚀 Tecnologias

- **Frontend**: Vanilla JS, Vite, Three.js, GSAP
- **Backend**: Express.js, Multer
- **Vídeo**: Remotion, React
- **API externa**: remove.bg
- **Magic Bento** - Componente interativo com efeitos visuais

## ⚡ Instalação e Execução

```bash
# Instalar dependências
npm install

# Executa tanto o site (porta 3000) quanto o servidor Remotion (porta 3001)
npm run dev:full

# Comandos individuais
npm run dev              # Apenas o site
npm run remotion:server  # Apenas o servidor Remotion
npm run build           # Build para produção
npm run preview         # Preview da build
```

## 📁 Estrutura do projeto

```
festa800/
├── src/
│   └── remotion/           # Componentes Remotion para geração de vídeo
│       ├── ProfileCardVideo.tsx
│       └── Root.tsx
├── server/
│   ├── remotion-server.js  # Servidor Express para renderização
│   ├── bg-card.jpg         # Assets do card
│   └── card-details.png
├── uploads/                # Upload temporário de imagens
├── output/                 # Vídeos renderizados (temporário)
└── index.html             # Página principal
```

## 🎨 Card Creator

O criador de cards Time Traveler permite:
- Upload de foto (remoção automática de fundo)
- Inserção do nome do usuário
- Geração de vídeo MP4 com:
  - Efeitos holográficos
  - Animações 3D
  - Gradientes dinâmicos
  - Duração de 10 segundos

## 🎨 Componente MagicBento

O MagicBento foi integrado ao projeto com as seguintes características:

### Configuração Padrão
```jsx
<MagicBento 
  textAutoHide={true}
  enableStars={true}
  enableSpotlight={true}
  enableBorderGlow={true}
  enableTilt={true}
  enableMagnetism={true}
  clickEffect={true}
  spotlightRadius={300}
  particleCount={12}
  glowColor="132, 0, 255"
/>
```

### Propriedades Disponíveis

- `textAutoHide` - Auto-ocultação de texto longo
- `enableStars` - Partículas animadas nos cards
- `enableSpotlight` - Efeito de spotlight global
- `enableBorderGlow` - Brilho nas bordas dos cards
- `enableTilt` - Efeito de inclinação 3D
- `enableMagnetism` - Efeito magnético do mouse
- `clickEffect` - Efeito ripple ao clicar
- `spotlightRadius` - Raio do spotlight (padrão: 300px)
- `particleCount` - Quantidade de partículas (padrão: 12)
- `glowColor` - Cor do brilho em RGB (padrão: "132, 0, 255")

## 🎯 Personalização

### Conteúdo dos Cards

Os cards são configurados no arquivo `MagicBento.jsx`:

```javascript
const cardData = [
  {
    color: "linear-gradient(135deg, #060010 0%, #1a0f2e 100%)",
    title: "Open Bar Premium",
    description: "Bebidas ilimitadas de alta qualidade",
    label: "ALL NIGHT",
  },
  // ... mais cards
];
```

### Estilos CSS

Os estilos estão em:
- `MagicBento.css` - Estilos específicos do componente
- `style.css` - Estilos gerais do projeto

## 📱 Responsivo

O componente se adapta automaticamente para dispositivos móveis, desabilitando animações complexas em telas menores que 768px.

## 🎪 Tema Festa 800

O MagicBento foi personalizado com o tema da Festa 800:
- Cores roxas (#8400FF) e gradientes escuros
- Conteúdo relacionado à festa eletrônica
- Integração com o design temporal/futurístico
- Seção "Temporal Features" no site

## 🌐 Deploy

O projeto está pronto para deploy em qualquer plataforma que suporte sites estáticos (Vercel, Netlify, GitHub Pages, etc.).

---

**Festa 800** - Bending Spacetime since 2015 🚀 