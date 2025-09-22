/**
 * CDP Injector Script
 * 
 * This script is injected into web pages to provide CDP runtime signal collection
 * functionality directly in the page context. It's separate from the preload script
 * because it needs to run in the page's context to access DOM elements properly.
 */

(function() {
  'use strict';

  // Avoid multiple injections
  if (window.TweaqCDP) {
    return;
  }

  /**
   * Generates a simple hash for text content
   */
  function simpleHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Resolves a relative URL against a base URL
   */
  function resolveUrl(baseUrl, relativeUrl) {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return relativeUrl;
    }
  }

  /**
   * Collects snapshot information for a DOM element
   */
  function collectNodeSnapshot(element) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }

    const classes = Array.from(element.classList);
    
    // Get ARIA role and accessible name
    const role = element.getAttribute('role') || undefined;
    const accessibleName = element.getAttribute('aria-label') || 
                           element.getAttribute('aria-labelledby') || 
                           element.getAttribute('title') || 
                           undefined;

    // Get inner text and create hash
    const innerText = element.textContent || '';
    const innerTextHash = simpleHash(innerText);

    // Get bounding rectangle
    const rect = element.getBoundingClientRect();
    const boundingRect = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    };

    return {
      tagName: element.tagName.toLowerCase(),
      attributes,
      classes,
      role,
      accessibleName,
      innerTextHash,
      boundingRect
    };
  }

  /**
   * Fetches and parses a source map from a URL
   */
  async function fetchSourceMap(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch source map: ${url} (${response.status})`);
        return null;
      }
      
      const text = await response.text();
      
      // Try to parse as JSON source map
      try {
        const sourceMap = JSON.parse(text);
        return {
          source: text,
          url,
          mappings: sourceMap.mappings,
          sourcesContent: sourceMap.sourcesContent,
          sources: sourceMap.sources
        };
      } catch (parseError) {
        console.warn(`Failed to parse source map JSON: ${url}`, parseError);
        return {
          source: text,
          url
        };
      }
    } catch (error) {
      console.warn(`Error fetching source map: ${url}`, error);
      return null;
    }
  }

  /**
   * Extracts source map URLs from script elements and fetches them
   */
  async function collectSourceMaps() {
    const sourceMaps = [];
    const baseUrl = window.location.href;
    
    // Find all script elements
    const scripts = document.querySelectorAll('script[src]');
    
    for (const script of scripts) {
      const scriptSrc = script.src;
      if (!scriptSrc) continue;
      
      try {
        // Fetch the script content to look for sourceMappingURL
        const response = await fetch(scriptSrc);
        if (!response.ok) continue;
        
        const scriptContent = await response.text();
        
        // Look for sourceMappingURL comment
        const sourceMapUrlMatch = scriptContent.match(/\/\/[@#]\s*sourceMappingURL=(.+)/);
        if (sourceMapUrlMatch) {
          const sourceMapUrl = sourceMapUrlMatch[1].trim();
          const resolvedUrl = resolveUrl(scriptSrc, sourceMapUrl);
          
          console.log(`Found source map URL: ${resolvedUrl} (from ${scriptSrc})`);
          
          const sourceMapInfo = await fetchSourceMap(resolvedUrl);
          if (sourceMapInfo) {
            sourceMaps.push(sourceMapInfo);
          }
        }
      } catch (error) {
        console.warn(`Error processing script: ${scriptSrc}`, error);
      }
    }
    
    // Also check for inline source maps
    const inlineScripts = document.querySelectorAll('script:not([src])');
    for (const script of inlineScripts) {
      const scriptContent = script.textContent || '';
      const sourceMapUrlMatch = scriptContent.match(/\/\/[@#]\s*sourceMappingURL=(.+)/);
      if (sourceMapUrlMatch) {
        const sourceMapUrl = sourceMapUrlMatch[1].trim();
        
        // Handle data URLs (inline source maps)
        if (sourceMapUrl.startsWith('data:')) {
          try {
            const base64Data = sourceMapUrl.split(',')[1];
            const decodedData = atob(base64Data);
            const sourceMap = JSON.parse(decodedData);
            
            sourceMaps.push({
              source: decodedData,
              url: 'data:application/json;base64,' + base64Data,
              mappings: sourceMap.mappings,
              sourcesContent: sourceMap.sourcesContent,
              sources: sourceMap.sources
            });
          } catch (error) {
            console.warn('Error parsing inline source map:', error);
          }
        } else {
          // Handle relative URLs
          const resolvedUrl = resolveUrl(baseUrl, sourceMapUrl);
          console.log(`Found inline source map URL: ${resolvedUrl}`);
          
          const sourceMapInfo = await fetchSourceMap(resolvedUrl);
          if (sourceMapInfo) {
            sourceMaps.push(sourceMapInfo);
          }
        }
      }
    }
    
    return sourceMaps;
  }

  /**
   * Gets the currently selected element or element under cursor
   */
  function getSelectedElement() {
    // Try to get selected element from various sources
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      if (container.nodeType === Node.ELEMENT_NODE) {
        return container;
      } else if (container.parentElement) {
        return container.parentElement;
      }
    }
    
    // Fallback to document.activeElement
    if (document.activeElement && document.activeElement !== document.body) {
      return document.activeElement;
    }
    
    return null;
  }

  /**
   * Main function to collect runtime signals for a selected element
   */
  async function collectRuntimeSignals(element) {
    const signals = {
      sourcemaps: []
    };
    
    // Use provided element or try to get selected element
    const targetElement = element || getSelectedElement();
    
    // Collect node snapshot if element is available
    if (targetElement) {
      signals.nodeSnapshot = collectNodeSnapshot(targetElement);
    }
    
    // Collect source maps
    try {
      signals.sourcemaps = await collectSourceMaps();
    } catch (error) {
      console.error('Error collecting source maps:', error);
    }
    
    return signals;
  }

  /**
   * Gets element at specific coordinates (useful for click-to-select)
   */
  function getElementAt(x, y) {
    return document.elementFromPoint(x, y);
  }

  // Expose the CDP API
  window.TweaqCDP = {
    collectRuntimeSignals,
    getSelectedElement,
    getElementAt,
    collectNodeSnapshot,
    collectSourceMaps
  };

  // Log that CDP injector is ready
  console.log('TweaqCDP injector loaded');

})();
