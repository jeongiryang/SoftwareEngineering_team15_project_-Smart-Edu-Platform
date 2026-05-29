import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  getLanguageOption,
  isBetaLanguage,
  languageBetaLabel,
  languageLabel,
  normalizeLanguage,
  translateKey,
  translateTextValue
} from './translations';

const LanguageContext = createContext(null);

const originalTextNodes = new WeakMap();
const originalAttributes = new WeakMap();
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];

function getStorage() {
  try {
    return globalThis.localStorage || null;
  } catch (error) {
    return null;
  }
}

function readStoredLanguage() {
  return normalizeLanguage(getStorage()?.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE);
}

function writeStoredLanguage(language) {
  getStorage()?.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(language));
}

function hasIgnoredAncestor(node) {
  let current = node?.parentElement || node;

  while (current) {
    if (current.getAttribute?.('data-sagak-i18n-ignore') === 'true') {
      return true;
    }

    const tagName = current.tagName?.toLowerCase();

    if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function rememberAttribute(element, attributeName) {
  if (!originalAttributes.has(element)) {
    originalAttributes.set(element, {});
  }

  const attrs = originalAttributes.get(element);

  if (attrs[attributeName] === undefined) {
    attrs[attributeName] = element.getAttribute(attributeName);
  }

  return attrs[attributeName];
}

function translateElementAttributes(element, language, translateText) {
  if (element.getAttribute?.('data-sagak-i18n-ignore') === 'true') {
    return;
  }

  TRANSLATABLE_ATTRIBUTES.forEach((attributeName) => {
    if (!element.hasAttribute?.(attributeName)) {
      return;
    }

    const original = rememberAttribute(element, attributeName);

    if (!original) {
      return;
    }

    const nextValue = language === DEFAULT_LANGUAGE ? original : translateText(original);

    if (element.getAttribute(attributeName) !== nextValue) {
      element.setAttribute(attributeName, nextValue);
    }
  });
}

function translateNodeTree(root, language, translateText) {
  const documentRef = globalThis.document;

  if (!documentRef || !root) {
    return;
  }

  const NodeFilterRef = globalThis.NodeFilter;
  const NodeRef = globalThis.Node;

  if (!NodeFilterRef || !NodeRef) {
    return;
  }

  const walker = documentRef.createTreeWalker(root, NodeFilterRef.SHOW_TEXT | NodeFilterRef.SHOW_ELEMENT, {
    acceptNode(node) {
      if (hasIgnoredAncestor(node)) {
        return NodeFilterRef.FILTER_REJECT;
      }

      return NodeFilterRef.FILTER_ACCEPT;
    }
  });

  let node = walker.currentNode;

  while (node) {
    if (node.nodeType === NodeRef.TEXT_NODE) {
      if (!originalTextNodes.has(node)) {
        originalTextNodes.set(node, node.nodeValue);
      }

      const original = originalTextNodes.get(node) || '';
      const nextValue = language === DEFAULT_LANGUAGE ? original : translateText(original);

      if (node.nodeValue !== nextValue) {
        node.nodeValue = nextValue;
      }
    } else if (node.nodeType === NodeRef.ELEMENT_NODE) {
      translateElementAttributes(node, language, translateText);
    }

    node = walker.nextNode();
  }
}

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(readStoredLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    const normalized = normalizeLanguage(nextLanguage);
    writeStoredLanguage(normalized);
    setCurrentLanguage(normalized);
  }, []);

  const t = useCallback(
    (key, fallback) => translateKey(key, currentLanguage, fallback),
    [currentLanguage]
  );

  const translateText = useCallback(
    (value) => translateTextValue(value, currentLanguage),
    [currentLanguage]
  );

  useEffect(() => {
    const documentRef = globalThis.document;

    if (!documentRef) {
      return;
    }

    const option = getLanguageOption(currentLanguage);
    documentRef.documentElement.lang = option.htmlLang;

    if (documentRef.body) {
      documentRef.body.dataset.sagakLanguage = currentLanguage;
    }
  }, [currentLanguage]);

  const value = useMemo(() => ({
    currentLanguage,
    isBetaLanguage,
    languageBetaLabel,
    languageLabel,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    t,
    translateText
  }), [currentLanguage, setLanguage, t, translateText]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}

export function useWebTextLocalization(language, translateText) {
  useEffect(() => {
    const documentRef = globalThis.document;
    const MutationObserverRef = globalThis.MutationObserver;

    if (!documentRef || !MutationObserverRef) {
      return undefined;
    }

    const root = documentRef.getElementById('root') || documentRef.body;

    if (!root) {
      return undefined;
    }

    let scheduled = false;

    function applyTranslation() {
      scheduled = false;
      translateNodeTree(root, normalizeLanguage(language), translateText);
    }

    function scheduleTranslation() {
      if (scheduled) {
        return;
      }

      scheduled = true;
      globalThis.requestAnimationFrame?.(applyTranslation) || globalThis.setTimeout(applyTranslation, 0);
    }

    applyTranslation();

    const observer = new MutationObserverRef(scheduleTranslation);
    observer.observe(root, {
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [language, translateText]);
}
