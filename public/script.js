// MasonryGallery e ProfileCardGallery são carregados via window globals
// import ShapeBlur from ./shapeBlur.js;
// import MagicBento from ./MagicBento.js;
// import MetaBalls from ./MetaBalls.js;
// import StarBorder from ./StarBorder.js;

document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loadingScreen');
    const conceptTexts = document.querySelectorAll('.concept-text');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    // Initialize Hyperspeed effect
    initHyperspeed();
    
    // Initialize ShapeBlur effect
    initShapeBlur();
    
    // Initialize MagicBento effect
    initMagicBento();
    
    // Initialize Threads effect
    initThreads();
    
    // Initialize StarBorder effect
    initStarBorder();
    
    function initShapeBlur() {
        const container = document.getElementById('shapeBlurContainer');
        if (container) {
            const shapeBlur = new ShapeBlur(container, {
                variation: 0,
                pixelRatio: window.devicePixelRatio || 1,
                shapeSize: 1.0,
                roundness: 1.0,
                borderSize: 0.03,
                circleSize: 0.4,
                circleEdge: 0.8
            });
        }
    }
    
    function initMagicBento() {
        const container = document.getElementById('magicBentoContainer');
        if (container) {
            const magicBento = new MagicBento(container, {
                textAutoHide: true,
                enableStars: false,
                enableSpotlight: true,
                enableBorderGlow: true,
                enableTilt: true,
                enableMagnetism: true,
                clickEffect: true,
                spotlightRadius: 300,
                particleCount: 12,
                glowColor: "255, 215, 0"
            });
        }
    }
    
    function initThreads() {
        const container = document.getElementById('metaBallsContainer');
        if (container) {
            const threads = new Threads(container, {
                color: [0.753, 0.749, 0.624], // #cebf9f convertido para RGB 0-1
                amplitude: 0.8, // Mais sutil como background
                distance: 0.05, // Linhas mais próximas
                enableMouseInteraction: true
            });
            console.log('✅ Threads effect inicializado com sucesso');
        }
    }
    
    function initStarBorder() {
        const button = document.getElementById('comunidadeBtn');
        if (button) {
            const starBorder = new StarBorder(button, {
                color: "#cebf9f",
                speed: "4s",
                thickness: 2
            });
        }
    }

    function hideLoadingScreen() {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 2000);
    }

    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
            
            particlesContainer.appendChild(particle);
        }
    }

    function animateYear() {
        const yearElement = document.getElementById('animated-year');
        const targetYear = 2025;
        const duration = 5000; // 5 segundos
        const startTime = performance.now();
        
        function updateYear(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            let currentYear;
            
            if (progress <= 0.6) {
                // Primeira fase: 0 até 2011 (velocidade normal)
                const phase1Progress = progress / 0.6;
                currentYear = Math.floor(phase1Progress * 2011);
            } else {
                // Segunda fase: 2011 até 2025 (desaceleração progressiva)
                const phase2Progress = (progress - 0.6) / 0.4;
                // Função de desaceleração mais suave
                const deceleratedProgress = 1 - Math.pow(1 - phase2Progress, 4);
                currentYear = 2011 + Math.floor(deceleratedProgress * (2025 - 2011));
            }
            
            yearElement.textContent = currentYear;
            
            if (progress < 1) {
                requestAnimationFrame(updateYear);
            } else {
                yearElement.textContent = targetYear;
            }
        }
        
        requestAnimationFrame(updateYear);
    }

    function rotateConceptTexts() {
        if (conceptTexts.length === 0) return;
        
        let currentIndex = 0;
        
        setInterval(() => {
            if (conceptTexts[currentIndex]) {
                conceptTexts[currentIndex].classList.remove('active');
            }
            currentIndex = (currentIndex + 1) % conceptTexts.length;
            if (conceptTexts[currentIndex]) {
                conceptTexts[currentIndex].classList.add('active');
            }
        }, 3000);
    }


    function handleSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        if (scrollIndicator) {
            scrollIndicator.addEventListener('click', () => {
                document.getElementById('historia').scrollIntoView({
                    behavior: 'smooth'
                });
            });
        }
    }

    function handleParallaxEffect() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.parallax-container');
            
            parallaxElements.forEach(element => {
                const speed = 0.5;
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    function animateOnScroll() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    
                    if (target.classList.contains('true-focus-title')) {
                        // True Focus animation
                        startTrueFocusAnimation(target);
                    } else {
                        // Regular animation
                        target.style.opacity = '1';
                        target.style.transform = 'translateY(0)';
                    }
                }
            });
        }, observerOptions);

        document.querySelectorAll('.section-title, .info-card, .dj-card, .foto-item').forEach(el => {
            if (!el.classList.contains('true-focus-title')) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            }
            observer.observe(el);
        });
    }

    function startTrueFocusAnimation() {
        const titleElement = document.querySelector('.true-focus-title');
        const words = document.querySelectorAll('.true-focus-title .focus-word');
        console.log('True Focus: encontradas', words.length, 'palavras');
        
        if (words.length === 0) {
            console.log('Nenhuma palavra encontrada para True Focus');
            return;
        }
        
        // Evita múltiplas instâncias - usar controles globais
        if (window.trueFocusControls && window.trueFocusControls.isRunning) {
            console.log('True Focus já está rodando');
            return;
        }
        
        // Registrar no sistema de controles globais
        if (window.trueFocusControls) {
            window.trueFocusControls.isRunning = true;
        }
        window.trueFocusRunning = true;
        
        // Criar o frame com cantos inferiores
        const frame = document.createElement('div');
        frame.className = 'focus-frame';
        
        // Adicionar cantos inferiores
        const bottomLeft = document.createElement('div');
        bottomLeft.className = 'bottom-left';
        frame.appendChild(bottomLeft);
        
        const bottomRight = document.createElement('div');
        bottomRight.className = 'bottom-right';
        frame.appendChild(bottomRight);
        
        titleElement.appendChild(frame);
        
        let index = 0;
        
        function cycle() {
            // Verificar se deve parar pelos controles globais
            if (window.trueFocusControls && !window.trueFocusControls.isRunning) {
                console.log('🔶 Cycle pausado pelos controles globais');
                return;
            }
            
            console.log('True Focus: focando palavra', index);
            
            // Remove active de todas
            words.forEach(word => {
                word.classList.remove('active');
                word.style.filter = 'blur(10px)';
            });
            
            // Adiciona active na atual
            const currentWord = words[index];
            currentWord.classList.add('active');
            currentWord.style.filter = 'blur(0px)';
            
            // Move o frame para a palavra atual
            frame.style.left = (currentWord.offsetLeft - 15) + 'px';
            frame.style.top = (currentWord.offsetTop - 10) + 'px';
            frame.style.width = (currentWord.offsetWidth + 30) + 'px';
            frame.style.height = (currentWord.offsetHeight + 20) + 'px';
            
            // Próxima palavra
            index = (index + 1) % words.length;
            
            // Continua apenas se não pausado
            const timeoutId = setTimeout(cycle, 1200);
            
            // Registrar o timeout nos controles globais para poder cancelar
            if (window.trueFocusControls) {
                window.trueFocusControls.intervalId = timeoutId;
            }
        }
        
        console.log('Iniciando True Focus animation...');
        // Inicia
        cycle();
    }

    function initializeTrueFocus() {
        // Múltiplos triggers para garantir que funcione
        setTimeout(startTrueFocusAnimation, 2000);
        setTimeout(startTrueFocusAnimation, 4000);
        setTimeout(startTrueFocusAnimation, 6000);
    }
    
    // Trigger adicional quando a página carrega completamente
    window.addEventListener('load', function() {
        setTimeout(startTrueFocusAnimation, 1000);
    });
    
    // Trigger quando o usuário faz scroll para a seção
    function setupScrollTrigger() {
        const trueFocusElement = document.querySelector('.true-focus-title');
        if (!trueFocusElement) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(startTrueFocusAnimation, 500);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(trueFocusElement);
    }


    function addHoverEffects() {
        const djCards = document.querySelectorAll('.dj-card');
        
        djCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        const fotoItems = document.querySelectorAll('.foto-item');
        
        fotoItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'scale(1.05) rotate(1deg)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'scale(1) rotate(0deg)';
            });
        });
    }


    function addTemporalEffects() {
        const timeCoordinates = document.querySelector('.time-coordinates span');
        if (!timeCoordinates) {
            // Elemento não existe no HTML atual - não é um erro
            return;
        }
        
        const originalText = timeCoordinates.textContent;
        
        setInterval(() => {
            const glitchText = originalText.split('').map(char => {
                return Math.random() > 0.9 ? String.fromCharCode(65 + Math.random() * 26) : char;
            }).join('');
            
            timeCoordinates.textContent = glitchText;
            
            setTimeout(() => {
                timeCoordinates.textContent = originalText;
            }, 200);
        }, 5000);
    }

    function addDynamicBackground() {
        const hero = document.querySelector('.hero');
        const overlay = document.querySelector('.video-overlay');
        
        if (!hero || !overlay) {
            // Elementos não existem ou têm nomes diferentes - não é um erro
            return;
        }
        
        let hue = 0;
        
        setInterval(() => {
            hue = (hue + 1) % 360;
            overlay.style.background = `
                radial-gradient(circle at 20% 80%, hsla(${hue}, 50%, 40%, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, hsla(${(hue + 180) % 360}, 30%, 60%, 0.05) 0%, transparent 50%)
            `;
        }, 100);
    }

    function handleTypingEffect() {
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (!heroSubtitle) {
            // Elemento não existe no HTML atual - não é um erro
            return;
        }
        
        const text = heroSubtitle.textContent;
        heroSubtitle.textContent = '';
        
        let i = 0;
        const typeInterval = setInterval(() => {
            heroSubtitle.textContent += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(typeInterval);
            }
        }, 100);
    }

    function addScrollProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: linear-gradient(90deg, #c08229, #cebf9f);
            z-index: 10001;
            transition: width 0.3s ease;
        `;
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            progressBar.style.width = scrollPercent + '%';
        });
    }

    function addCountdownEffect() {
        const badge = document.querySelector('.temporal-badge');
        const messages = [
            'TEMPORAL SHIFT: ACTIVE',
            'TIME COORDINATES: LOCKED',
            'SYSTEM STATUS: ONLINE',
            'QUANTUM FIELD: STABLE',
            'TEMPORAL MATRIX: ALIGNED'
        ];
        
        let messageIndex = 0;
        setInterval(() => {
            badge.style.opacity = '0';
            setTimeout(() => {
                badge.textContent = messages[messageIndex];
                badge.style.opacity = '1';
                messageIndex = (messageIndex + 1) % messages.length;
            }, 300);
        }, 4000);
    }

    hideLoadingScreen();
    createParticles();
    
    // Inicia animação do ano após o loading
    setTimeout(animateYear, 2500);
    
    rotateConceptTexts();
    handleSmoothScroll();
    handleParallaxEffect();
    animateOnScroll();
    addHoverEffects();
    addTemporalEffects();
    addDynamicBackground();
    initializeTrueFocus();
    setupScrollTrigger();
    
    setTimeout(handleTypingEffect, 2500);
    
    addScrollProgressBar();
    addCountdownEffect();
    
    // Inicializar Grid Distortion após um delay para garantir que o DOM esteja pronto
    setTimeout(() => {
        console.log('Tentando inicializar Grid Distortion...');
        initGridDistortion();
    }, 1000);

    // Inicializar Masonry Gallery
    initMasonryGallery();
    
    // Inicializar Profile Cards
    initProfileCards();

    console.log('🚀 Festa 800 - Time Machine Initialized');
    console.log('⏰ Temporal coordinates locked: 27.09.2025');
    console.log('🌌 Entering spacetime distortion...');
});

function initHyperspeed() {
    const container = document.getElementById('hyperspeedContainer');
    if (!container) {
        console.error('❌ Hyperspeed container não encontrado');
        return;
    }

    const hyperspeedOptions = {
        distortion: 'turbulentDistortion',
        length: 400,
        roadWidth: 10,
        islandWidth: 2,
        lanesPerRoad: 3,
        fov: 90,
        fovSpeedUp: 150,
        speedUp: 2,
        carLightsFade: 0.4,
        totalSideLightSticks: 30,
        lightPairsPerRoadWay: 50,
        colors: {
            roadColor: 0x080808,
            islandColor: 0x0a0a0a,
            background: 0x000000,
            shoulderLines: 0x2c1c00,
            brokenLines: 0x2c1c00,
            leftCars: [0xc08229, 0xcebf9f, 0xc08229],
            rightCars: [0xcebf9f, 0xc08229, 0xcebf9f],
            sticks: 0xc08229,
        }
    };

    if (window.Hyperspeed) {
        const hyperspeed = new window.Hyperspeed(container, hyperspeedOptions);
        console.log('✅ Hyperspeed effect inicializado com sucesso');
        
        // Dispose when loading is complete
        setTimeout(() => {
            hyperspeed.dispose();
        }, 3000);
    } else {
        console.error('❌ Hyperspeed class não encontrada');
    }
}

function initGridDistortion() {
    console.log('=== INIT GRID DISTORTION THREE.JS ===');
    
    const container = document.getElementById('gridDistortionContainer');
    if (!container) {
        console.error('❌ Container não encontrado');
        return;
    }
    
    console.log('✅ Container encontrado, inicializando Three.js...');
    
    // Configuration matching ReactBits
    const config = {
        grid: 25,
        mouse: 0.1,
        strength: 0.15,
        relaxation: 0.9,
        imageSrc: 'public/GREG-320.png'
    };
    
    // Three.js setup
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    // Camera setup
    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
    camera.position.z = 2;
    
    // Shaders exatos do ReactBits
    const vertexShader = `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    
    const fragmentShader = `
        uniform sampler2D uDataTexture;
        uniform sampler2D uTexture;
        uniform vec4 resolution;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            vec4 offset = texture2D(uDataTexture, vUv);
            gl_FragColor = texture2D(uTexture, uv - 0.02 * offset.rg);
        }
    `;
    
    // Uniforms
    const uniforms = {
        time: { value: 0 },
        resolution: { value: new THREE.Vector4() },
        uTexture: { value: null },
        uDataTexture: { value: null },
    };
    
    let imageAspect = 1;
    let initialData = null;
    
    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(config.imageSrc, (texture) => {
        texture.minFilter = THREE.LinearFilter;
        imageAspect = texture.image.width / texture.image.height;
        uniforms.uTexture.value = texture;
        handleResize();
        console.log('✅ Textura carregada:', config.imageSrc);
    });
    
    // Create data texture for distortion
    const size = config.grid;
    const data = new Float32Array(4 * size * size);
    for (let i = 0; i < size * size; i++) {
        data[i * 4] = Math.random() * 255 - 125;
        data[i * 4 + 1] = Math.random() * 255 - 125;
    }
    
    initialData = new Float32Array(data);
    
    const dataTexture = new THREE.DataTexture(
        data,
        size,
        size,
        THREE.RGBAFormat,
        THREE.FloatType
    );
    dataTexture.needsUpdate = true;
    uniforms.uDataTexture.value = dataTexture;
    
    // Create material and geometry
    const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms,
        vertexShader,
        fragmentShader,
    });
    
    const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);
    
    // Mouse state
    const mouseState = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };
    
    // Resize handler
    const handleResize = () => {
        const width = Math.max(container.offsetWidth, 1);
        const height = Math.max(container.offsetHeight, 1);
        
        if (width === 0 || height === 0) {
            console.warn('Container has zero size, skipping resize');
            return;
        }
        
        const containerAspect = width / height;
        renderer.setSize(width, height);
        
        const scale = Math.max(containerAspect / imageAspect, 1);
        plane.scale.set(imageAspect * scale, scale, 1);
        
        const frustumHeight = 1;
        const frustumWidth = frustumHeight * containerAspect;
        camera.left = -frustumWidth / 2;
        camera.right = frustumWidth / 2;
        camera.top = frustumHeight / 2;
        camera.bottom = -frustumHeight / 2;
        camera.updateProjectionMatrix();
        
        uniforms.resolution.value.set(width, height, 1, 1);
        console.log('Canvas resized:', width, 'x', height);
    };
    
    // Mouse events
    const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1 - (e.clientY - rect.top) / rect.height;
        mouseState.vX = x - mouseState.prevX;
        mouseState.vY = y - mouseState.prevY;
        Object.assign(mouseState, { x, y, prevX: x, prevY: y });
    };
    
    const handleMouseLeave = () => {
        dataTexture.needsUpdate = true;
        Object.assign(mouseState, { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 });
    };
    
    // Event listeners
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
        if (!window.threeJSAnimationControls.isPaused) {
            const animId = requestAnimationFrame(animate);
            window.threeJSAnimationControls.setAnimationId(animId);
        }
        uniforms.time.value += 0.05;
        
        const data = dataTexture.image.data;
        
        // Apply relaxation to all points
        for (let i = 0; i < size * size; i++) {
            data[i * 4] *= config.relaxation;
            data[i * 4 + 1] *= config.relaxation;
        }
        
        // Apply mouse distortion
        const gridMouseX = size * mouseState.x;
        const gridMouseY = size * mouseState.y;
        const maxDist = size * config.mouse;
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const distance = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2);
                if (distance < maxDist * maxDist) {
                    const index = 4 * (i + size * j);
                    const power = Math.min(maxDist / Math.sqrt(distance), 10);
                    data[index] += config.strength * 100 * mouseState.vX * power;
                    data[index + 1] -= config.strength * 100 * mouseState.vY * power;
                }
            }
        }
        
        dataTexture.needsUpdate = true;
        renderer.render(scene, camera);
    };
    
    // Initialize
    handleResize();
    animate();
    
    console.log('✅ Grid Distortion Three.js inicializado com sucesso');
    
    // Cleanup function (for potential future use)
    return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        dataTexture.dispose();
        if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
    };
}

function initMasonryGallery() {
    const container = document.getElementById('masonry-container');
    if (!container) {
        console.error('❌ Masonry container não encontrado');
        return;
    }

    const items = [
        {
            id: "1",
            img: "public/foto1.jpg",
            url: "#",
            height: 400,
        },
        {
            id: "2",
            img: "public/foto2.jpg",
            url: "#",
            height: 300,
        },
        {
            id: "3",
            img: "public/foto3.jpg",
            url: "#",
            height: 500,
        },
        {
            id: "4",
            img: "public/foto4.jpg",
            url: "#",
            height: 350,
        },
        {
            id: "5",
            img: "public/foto5.jpg",
            url: "#",
            height: 450,
        },
        {
            id: "6",
            img: "public/foto6.jpg",
            url: "#",
            height: 320,
        },
        {
            id: "7",
            img: "public/foto7.jpg",
            url: "#",
            height: 480,
        },
        {
            id: "8",
            img: "public/foto8.jpg",
            url: "#",
            height: 380,
        },
        {
            id: "9",
            img: "public/foto9.jpg",
            url: "#",
            height: 420,
        },
        {
            id: "10",
            img: "public/foto10.jpg",
            url: "#",
            height: 360,
        },
        {
            id: "11",
            img: "public/foto11.jpg",
            url: "#",
            height: 490,
        },
        {
            id: "12",
            img: "public/foto12.jpg",
            url: "#",
            height: 330,
        },
        {
            id: "13",
            img: "public/foto13.jpg",
            url: "#",
            height: 460,
        },
        {
            id: "14",
            img: "public/foto14.jpg",
            url: "#",
            height: 340,
        },
        {
            id: "15",
            img: "public/foto15.jpg",
            url: "#",
            height: 510,
        },
        {
            id: "16",
            img: "public/foto16.jpg",
            url: "#",
            height: 390,
        }
    ];

    const masonry = new window.MasonryGallery(container, {
        items: items,
        gap: 10,
        columns: {
            default: 1,
            600: 2,
            900: 4,
            1500: 5,
            1800: 6
        },
        animation: {
            duration: 0.6,
            ease: "power2.out", 
            stagger: 0.15,
            from: "bottom"
        },
        hover: {
            enabled: true,
            scale: 0.95
        }
    });

    console.log('✅ Masonry Gallery inicializado com sucesso');
}

function initProfileCards() {
    const container = document.getElementById('profile-cards-container');
    if (!container) {
        console.error('❌ Profile cards container não encontrado');
        return;
    }

    const artists = [
        {
            name: "RUFUS DU SOL",
            role: "Electronic / House",
            image: "public/artista1.png",
            handle: "rufusdusol",
            status: "Headliner",
            contactText: "Listen",
            url: "https://rufusdusol.com"
        },
        {
            name: "ANYMA",
            role: "Techno / Visual",
            image: "public/artista3.png",
            handle: "anyma",
            status: "Headliner",
            contactText: "Listen",
            url: "https://anyma.world"
        },
        {
            name: "ARTBAT",
            role: "Melodic Techno",
            image: "public/artista2.png",
            handle: "artbat",
            status: "Headliner",
            contactText: "Listen",
            url: "https://artbat.ua"
        },
        {
            name: "AMELIE LENS",
            role: "Techno",
            image: "public/artista4.png",
            handle: "amelielens",
            status: "Special",
            contactText: "Listen",
            url: "#"
        },
        {
            name: "WHOMADEWHO",
            role: "Electronic / Indie",
            image: "public/artista5.png",
            handle: "whomadewho",
            status: "Special",
            contactText: "Listen",
            url: "#"
        }
    ];

    const profileCards = new window.ProfileCardGallery(container, {
        artists: artists
    });

    console.log('✅ Profile Cards inicializados com sucesso');
}

// True Focus Control - Global controls para pausar/retomar
window.trueFocusControls = {
  isRunning: false,
  intervalId: null,
  
  pause() {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);  // Mudado para clearTimeout
      clearInterval(this.intervalId); // Limpar ambos por segurança
      this.intervalId = null;
      console.log('🔶 True Focus pausado para captura');
    }
    
    // Pausar também a instância legada
    if (window.trueFocusRunning) {
      window.trueFocusRunning = false;
    }
  },
  
  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      window.trueFocusRunning = true; // Reativar instância legada também
      this.start();
      console.log('🔶 True Focus retomado após captura');
    }
  },
  
  start() {
    if (this.isRunning) return;
    
    const titleElement = document.querySelector('.hero-title .true-focus');
    if (!titleElement) return;
    
    const words = titleElement.querySelectorAll('.word');
    if (!words.length) return;
    
    this.isRunning = true;
    let currentWordIndex = 0;
    
    this.intervalId = setInterval(() => {
      if (!this.isRunning) return;
      
      // Remove foco de todas as palavras
      words.forEach(word => word.classList.remove('focused'));
      
      // Adiciona foco à palavra atual
      words[currentWordIndex].classList.add('focused');
      console.log(`True Focus: focando palavra ${currentWordIndex}`);
      
      currentWordIndex = (currentWordIndex + 1) % words.length;
    }, 800);
  }
};

// Three.js Animation Controls - Para pausar durante captura
window.threeJSAnimationControls = {
  animationId: null,
  isPaused: false,
  
  pause() {
    this.isPaused = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    console.log('🔶 Three.js animations pausadas para captura');
  },
  
  resume() {
    this.isPaused = false;
    console.log('🔶 Three.js animations retomadas após captura');
  },
  
  setAnimationId(id) {
    this.animationId = id;
  }
};

// Funções globais para compatibilidade
window.pauseThreeJSAnimations = () => window.threeJSAnimationControls.pause();
window.resumeThreeJSAnimations = () => window.threeJSAnimationControls.resume();

// Função global para pausar TODAS as animações True Focus
window.pauseAllTrueFocus = function() {
  console.log('🔶 Pausando TODAS as animações True Focus...');
  
  let pausedItems = [];
  
  // Pausar através dos controles globais
  if (window.trueFocusControls) {
    window.trueFocusControls.pause();
    pausedItems.push('trueFocusControls');
  }
  
  // Pausar instância legada
  if (window.trueFocusRunning) {
    window.trueFocusRunning = false;
    pausedItems.push('trueFocusRunning');
  }
  
  // Limpar todos os timeouts e intervals ativos
  if (typeof window.trueFocusTimeoutId !== 'undefined') {
    clearTimeout(window.trueFocusTimeoutId);
    delete window.trueFocusTimeoutId;
    pausedItems.push('timeout');
  }
  
  if (typeof window.trueFocusIntervalId !== 'undefined') {
    clearInterval(window.trueFocusIntervalId);
    delete window.trueFocusIntervalId;
    pausedItems.push('interval');
  }
  
  // Forçar parada de qualquer elemento True Focus ativo
  const trueFocusElements = document.querySelectorAll('.true-focus-title .focus-word, .hero-title .word');
  trueFocusElements.forEach(element => {
    element.classList.remove('active', 'focused');
    element.style.filter = '';
  });
  
  // Esconder frame se existir
  const frames = document.querySelectorAll('.focus-frame');
  frames.forEach(frame => {
    frame.style.display = 'none';
  });
  
  // Pausar canvas problemáticos que possam estar causando erros WebGL
  const canvasElements = document.querySelectorAll('canvas');
  canvasElements.forEach(canvas => {
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.style.display = 'none';
      canvas.setAttribute('data-paused-for-capture', 'true');
      pausedItems.push('problemCanvas');
    }
  });
  
  console.log(`🔶 Todas as animações True Focus pausadas. Items pausados: [${pausedItems.join(', ')}]`);
};

// Função global para retomar TODAS as animações True Focus
window.resumeAllTrueFocus = function() {
  console.log('🔶 Retomando animações True Focus...');
  
  let resumedItems = [];
  
  // Mostrar frames novamente
  const frames = document.querySelectorAll('.focus-frame');
  frames.forEach(frame => {
    frame.style.display = '';
  });
  
  // Restaurar canvas que foram pausados
  const pausedCanvas = document.querySelectorAll('canvas[data-paused-for-capture]');
  pausedCanvas.forEach(canvas => {
    canvas.style.display = '';
    canvas.removeAttribute('data-paused-for-capture');
    resumedItems.push('restoredCanvas');
  });
  
  // Retomar através dos controles globais
  if (window.trueFocusControls) {
    window.trueFocusControls.resume();
    resumedItems.push('trueFocusControls');
  }
  
  // Retomar instância legada se ainda não estiver rodando
  if (!window.trueFocusRunning && window.trueFocusWords && window.trueFocusWords.length > 0) {
    window.trueFocusRunning = true;
    resumedItems.push('trueFocusRunning');
  }
  
  console.log(`🔶 Animações True Focus retomadas. Items retomados: [${resumedItems.join(', ')}]`);
};

// initTrueFocus já definida anteriormente com controles globais