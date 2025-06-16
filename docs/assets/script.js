// MCP Security Documentation JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    let currentSection = 'overview';
    
    // Initialize
    showSection('overview');
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        performSearch(query);
    });
    
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            
            if (sectionId) {
                showSection(sectionId);
                updateActiveNavLink(this);
                
                // Clear search when navigating
                searchInput.value = '';
                clearSearchHighlights();
            }
        });
    });
    
    function showSection(sectionId) {
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
        currentSection = sectionId;
    }
    
    function updateActiveNavLink(activeLink) {
        navLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }
    
    function performSearch(query) {
        if (!query) {
            clearSearchHighlights();
            return;
        }
        
        clearSearchHighlights();
        
        let found = false;
        sections.forEach(section => {
            const textContent = section.textContent.toLowerCase();
            if (textContent.includes(query)) {
                highlightMatches(section, query);
                if (!found) {
                    // Show first matching section
                    showSection(section.id);
                    updateActiveNavLinkBySection(section.id);
                    found = true;
                }
            }
        });
    }
    
    function highlightMatches(element, query) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip code blocks and other elements where highlighting might break functionality
                    const parent = node.parentElement;
                    if (parent.closest('.code-block, .copy-btn, .nav-link')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.toLowerCase().includes(query)) {
                textNodes.push(node);
            }
        }
        
        textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            const text = textNode.textContent;
            const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
            const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
            
            if (highlightedText !== text) {
                const wrapper = document.createElement('span');
                wrapper.innerHTML = highlightedText;
                parent.replaceChild(wrapper, textNode);
            }
        });
    }
    
    function clearSearchHighlights() {
        const highlights = document.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
        
        // Remove empty wrapper spans
        const wrappers = document.querySelectorAll('span:empty');
        wrappers.forEach(wrapper => {
            if (wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
        });
    }
    
    function updateActiveNavLinkBySection(sectionId) {
        navLinks.forEach(link => {
            if (link.dataset.section === sectionId) {
                updateActiveNavLink(link);
            }
        });
    }
    
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Smooth scrolling for anchor links
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
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        // Escape key clears search
        if (e.key === 'Escape') {
            searchInput.value = '';
            clearSearchHighlights();
            searchInput.blur();
        }
        
        // Ctrl/Cmd + K focuses search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Arrow keys for navigation when search is focused
        if (searchInput === document.activeElement) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const currentIndex = Array.from(navLinks).findIndex(link => link.classList.contains('active'));
                let nextIndex;
                
                if (e.key === 'ArrowDown') {
                    nextIndex = currentIndex < navLinks.length - 1 ? currentIndex + 1 : 0;
                } else {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : navLinks.length - 1;
                }
                
                navLinks[nextIndex].click();
            }
        }
    });
    
    // Add search shortcut hint
    searchInput.placeholder = 'Search documentation... (Ctrl+K)';
    
    // Handle browser back/forward
    window.addEventListener('popstate', function(e) {
        const hash = window.location.hash.slice(1);
        if (hash && document.getElementById(hash)) {
            showSection(hash);
            updateActiveNavLinkBySection(hash);
        }
    });
    
    // Update URL when section changes
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const sectionId = this.dataset.section;
            if (sectionId) {
                history.pushState(null, null, `#${sectionId}`);
            }
        });
    });
    
    // Initialize from URL hash
    const initialHash = window.location.hash.slice(1);
    if (initialHash && document.getElementById(initialHash)) {
        showSection(initialHash);
        updateActiveNavLinkBySection(initialHash);
    }
});

// Copy code functionality
function copyCode(button) {
    const codeBlock = button.closest('.code-block').querySelector('code');
    const text = codeBlock.textContent;
    
    // Use modern clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function() {
            showCopySuccess(button);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            fallbackCopyText(text, button);
        });
    } else {
        fallbackCopyText(text, button);
    }
}

function fallbackCopyText(text, button) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess(button);
    } catch (err) {
        console.error('Fallback copy failed: ', err);
        showCopyError(button);
    } finally {
        textArea.remove();
    }
}

function showCopySuccess(button) {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = '#10b981';
    
    setTimeout(function() {
        button.textContent = originalText;
        button.style.background = '#3b82f6';
    }, 2000);
}

function showCopyError(button) {
    const originalText = button.textContent;
    button.textContent = 'Copy failed';
    button.style.background = '#ef4444';
    
    setTimeout(function() {
        button.textContent = originalText;
        button.style.background = '#3b82f6';
    }, 2000);
}

// Analytics and tracking (placeholder for future implementation)
function trackPageView(section) {
    // Add analytics tracking here if needed
    console.log(`Viewed section: ${section}`);
}

function trackSearch(query) {
    // Add search analytics here if needed
    console.log(`Searched for: ${query}`);
}

// Performance optimization: Lazy loading for large content
function observeCodeBlocks() {
    if ('IntersectionObserver' in window) {
        const codeBlocks = document.querySelectorAll('.code-block');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add syntax highlighting or other enhancements here
                    entry.target.classList.add('loaded');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '50px' });
        
        codeBlocks.forEach(block => observer.observe(block));
    }
}

// Initialize performance optimizations
document.addEventListener('DOMContentLoaded', observeCodeBlocks);