/**
 * Sistema Avançado de Bloqueio de Anúncios e Pop-ups
 * Bloqueia propagandas, pop-ups e redirecionamentos não autorizados
 */

export class AdBlocker {
  private blockedAttempts: number = 0;
  
  constructor() {
    this.init();
  }
  
  /**
   * Inicializa todos os bloqueios
   */
  init() {
    this.blockPopups();
    this.blockRedirects();
    this.blockExternalLinks();
    this.blockIframePopups();
    this.preventContextMenu();
    this.blockKeyboardShortcuts();
    
    console.log('🛡️ AdBlocker ativado - Proteção contra anúncios ativa');
  }
  
  /**
   * Bloqueia window.open (pop-ups)
   */
  private blockPopups() {
    const originalOpen = window.open;
    
    window.open = (...args) => {
      const url = args[0]?.toString() || '';
      const trustedDomains = [window.location.hostname];
      
      // Se for um domínio confiável, pode permitir
      if (trustedDomains.some(domain => url.includes(domain))) {
        console.log('✅ Pop-up permitido (domínio confiável):', url);
        return originalOpen.apply(window, args);
      }
      
      // Bloquear
      this.blockedAttempts++;
      console.log(`🚫 Pop-up bloqueado #${this.blockedAttempts}:`, url);
      return null;
    };
  }
  
  /**
   * Bloqueia redirecionamentos automáticos
   */
  private blockRedirects() {
    // Intercepta tentativas de redirecionamento via location.href
    let originalHref = window.location.href;
    
    // Monitora mudanças no location.href via setInterval
    const checkInterval = setInterval(() => {
      if (window.location.href !== originalHref) {
        const newUrl = window.location.href;
        if (!this.isAllowedUrl(newUrl)) {
          console.log('🚫 Redirecionamento suspeito detectado:', newUrl);
          this.blockedAttempts++;
          // Volta para URL original
          window.history.replaceState(null, '', originalHref);
        } else {
          originalHref = newUrl;
        }
      }
    }, 100);
    
    // Limpa interval quando a página for fechada
    window.addEventListener('beforeunload', () => {
      clearInterval(checkInterval);
    });
  }
  
  /**
   * Bloqueia cliques em links externos suspeitos
   */
  private blockExternalLinks() {
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        const href = link.getAttribute('href') || '';
        const targetAttr = link.getAttribute('target');
        
        // Bloqueia links com target="_blank" para domínios externos
        if (targetAttr === '_blank' && !this.isAllowedUrl(href)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('🚫 Link externo bloqueado:', href);
          this.blockedAttempts++;
          return false;
        }
        
        // Bloqueia links suspeitos (ads, trackers, etc)
        if (this.isSuspiciousUrl(href)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('🚫 Link suspeito bloqueado (propaganda):', href);
          this.blockedAttempts++;
          return false;
        }
        
        // Link permitido
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          console.log('✅ Link permitido:', href);
        }
      }
    }, true); // Use capture phase
  }
  
  /**
   * Bloqueia pop-ups gerados por iframes
   */
  private blockIframePopups() {
    // Monitora iframes adicionados dinamicamente
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IFRAME') {
            const iframe = node as HTMLIFrameElement;
            
            // Adiciona sandbox para limitar capacidades do iframe
            if (!iframe.hasAttribute('sandbox')) {
              iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            }
            
            // Remove iframes de propaganda conhecidos
            if (this.isAdFrame(iframe)) {
              console.log('🚫 Iframe de propaganda removido:', iframe.src);
              iframe.remove();
              this.blockedAttempts++;
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Previne menu de contexto (botão direito) para dificultar abuso
   */
  private preventContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      
      // Permite contexto em inputs/textareas
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Bloqueia em iframes e elementos suspeitos
      if (target.tagName === 'IFRAME' || target.closest('.ad-container')) {
        e.preventDefault();
        return false;
      }
    });
  }
  
  /**
   * Bloqueia atalhos de teclado que podem abrir popups
   */
  private blockKeyboardShortcuts() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      // Bloqueia Ctrl+Enter, Shift+Enter em links suspeitos
      if ((e.ctrlKey || e.shiftKey || e.metaKey) && e.key === 'Enter' && link) {
        if (!this.isAllowedUrl(link.href)) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🚫 Atalho de teclado bloqueado');
          this.blockedAttempts++;
          return false;
        }
      }
    });
    
    // Bloqueia Ctrl/Shift + Click
    document.addEventListener('mousedown', (e: MouseEvent) => {
      if ((e.ctrlKey || e.shiftKey || e.metaKey)) {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        
        if (link && !this.isAllowedUrl(link.href)) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🚫 Ctrl/Shift+Click bloqueado');
          this.blockedAttempts++;
          return false;
        }
      }
    }, true);
  }
  
  /**
   * Verifica se URL é permitida (domínio atual ou confiável)
   */
  private isAllowedUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url, window.location.origin);
      const allowedDomains = [
        window.location.hostname,
        'vidsrc.xyz',
        'vidsrc.me',
        'vidsrc.to',
        'vidsrc.net',
        'vidsrc-embed.ru',
        'vidsrc.in',
        'vidsrc.cc',
        'pro.vidsrc.me',
        'embed.su',
        'vidsrc.stream',
        'localhost'
      ];
      
      const isAllowed = allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
      
      if (!isAllowed) {
        console.log('❌ URL não está na lista de permitidos:', urlObj.hostname);
      }
      
      return isAllowed;
    } catch {
      console.log('❌ URL inválida:', url);
      return false;
    }
  }
  
  /**
   * Verifica se URL é suspeita (propaganda)
   */
  private isSuspiciousUrl(url: string): boolean {
    if (!url) return false;
    
    const suspiciousPatterns = [
      /ads?[.-]/i,
      /advert/i,
      /banner/i,
      /popup/i,
      /click/i,
      /tracker/i,
      /analytics/i,
      /doubleclick/i,
      /googlesyndication/i,
      /googleadservices/i,
      /outbrain/i,
      /taboola/i,
      /propeller/i,
      /popcash/i,
      /popads/i,
      /admaven/i,
      /adsterra/i,
      /clickadu/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(url));
  }
  
  /**
   * Verifica se iframe é de propaganda
   */
  private isAdFrame(iframe: HTMLIFrameElement): boolean {
    const src = iframe.src || '';
    const id = iframe.id || '';
    const className = iframe.className || '';
    
    const adPatterns = [
      /ads?[.-]/i,
      /advert/i,
      /banner/i,
      /sponsor/i,
      /promo/i
    ];
    
    return adPatterns.some(pattern => 
      pattern.test(src) || pattern.test(id) || pattern.test(className)
    );
  }
  
  /**
   * Obtém estatísticas de bloqueios
   */
  getStats() {
    return {
      blockedAttempts: this.blockedAttempts,
      isActive: true
    };
  }
  
  /**
   * Reseta contador de bloqueios
   */
  resetStats() {
    this.blockedAttempts = 0;
  }
  
  /**
   * Desativa o AdBlocker (se necessário)
   */
  destroy() {
    console.log('🛡️ AdBlocker desativado');
    // Nota: Alguns bloqueios não podem ser revertidos sem recarregar a página
  }
}

// Instância global do AdBlocker
let adBlockerInstance: AdBlocker | null = null;

/**
 * Inicializa o AdBlocker
 */
export function initAdBlocker(): AdBlocker {
  if (!adBlockerInstance) {
    adBlockerInstance = new AdBlocker();
  }
  return adBlockerInstance;
}

/**
 * Obtém instância do AdBlocker
 */
export function getAdBlocker(): AdBlocker | null {
  return adBlockerInstance;
}

/**
 * Hook React para usar AdBlocker
 */
export function useAdBlocker() {
  if (typeof window !== 'undefined' && !adBlockerInstance) {
    adBlockerInstance = initAdBlocker();
  }
  return adBlockerInstance;
}
