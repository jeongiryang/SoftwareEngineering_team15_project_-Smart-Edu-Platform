import { useEffect } from 'react';

const DEFAULT_LENS_SIZE = 256;
const DEFAULT_SCALE = 1.85;
const LENS_MARGIN = 12;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getSourceRoot(documentRef) {
  return (
    documentRef.getElementById('root') ||
    documentRef.getElementById('main') ||
    documentRef.body?.firstElementChild ||
    documentRef.body
  );
}

function removeIgnoredNodes(root) {
  root.querySelectorAll?.('[data-sagak-magnifier-ignore="true"]').forEach((node) => {
    node.remove();
  });
}

function getElementZoom(windowRef, element) {
  const rawZoom = windowRef.getComputedStyle?.(element)?.zoom;
  const parsedZoom = Number.parseFloat(rawZoom);

  return Number.isFinite(parsedZoom) && parsedZoom > 0 ? parsedZoom : 1;
}

function copyScrollPositions(source, clone) {
  const sourceNodes = [source, ...Array.from(source.querySelectorAll?.('*') || [])];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll?.('*') || [])];

  sourceNodes.forEach((node, index) => {
    const cloneNode = cloneNodes[index];

    if (!cloneNode) {
      return;
    }

    if (node.scrollTop) {
      cloneNode.scrollTop = node.scrollTop;
    }

    if (node.scrollLeft) {
      cloneNode.scrollLeft = node.scrollLeft;
    }
  });
}

function createLens(documentRef, label, lensSize) {
  const lens = documentRef.createElement('div');
  const viewport = documentRef.createElement('div');

  lens.setAttribute('data-sagak-magnifier-ignore', 'true');
  lens.setAttribute('role', 'presentation');
  lens.setAttribute('aria-label', label);
  lens.style.position = 'fixed';
  lens.style.left = '0px';
  lens.style.top = '0px';
  lens.style.width = `${lensSize}px`;
  lens.style.height = `${lensSize}px`;
  lens.style.border = '2px solid rgba(115, 201, 189, 0.95)';
  lens.style.borderRadius = '20px';
  lens.style.overflow = 'hidden';
  lens.style.pointerEvents = 'none';
  lens.style.zIndex = '10000';
  lens.style.opacity = '0';
  lens.style.background = 'rgba(255, 249, 238, 0.96)';
  lens.style.boxShadow = '0 18px 44px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(255,255,255,0.45) inset';
  lens.style.transition = 'opacity 120ms ease-out';
  lens.style.willChange = 'left, top, opacity';

  viewport.style.position = 'absolute';
  viewport.style.inset = '0';
  viewport.style.overflow = 'hidden';

  lens.appendChild(viewport);

  return { lens, viewport };
}

export default function MagnifierOverlay({
  active,
  label = 'Screen magnifier',
  lensSize = DEFAULT_LENS_SIZE,
  scale = DEFAULT_SCALE
}) {
  useEffect(() => {
    const windowRef = globalThis.window;
    const documentRef = globalThis.document;

    if (!active || !windowRef || !documentRef?.body) {
      return undefined;
    }

    const sourceRoot = getSourceRoot(documentRef);

    if (!sourceRoot) {
      return undefined;
    }

    const { lens, viewport } = createLens(documentRef, label, lensSize);
    let sourceRect = sourceRoot.getBoundingClientRect();
    let cloneRef = null;
    let pointerFrame = null;
    let refreshTimer = null;
    let sourceZoom = 1;
    let lastPointer = {
      x: Math.round(windowRef.innerWidth / 2),
      y: Math.round(windowRef.innerHeight / 2)
    };

    function refreshClone() {
      sourceRect = sourceRoot.getBoundingClientRect();
      sourceZoom = getElementZoom(windowRef, sourceRoot);

      const logicalWidth = sourceRect.width / sourceZoom;
      const logicalHeight = sourceRect.height / sourceZoom;

      const nextClone = sourceRoot.cloneNode(true);
      nextClone.removeAttribute?.('id');
      nextClone.setAttribute?.('aria-hidden', 'true');
      nextClone.style.pointerEvents = 'none';
      nextClone.style.userSelect = 'none';
      nextClone.style.width = `${logicalWidth}px`;
      nextClone.style.minHeight = `${Math.max(logicalHeight, windowRef.innerHeight / sourceZoom)}px`;
      nextClone.style.margin = '0';
      nextClone.style.transformOrigin = '0 0';
      nextClone.style.willChange = 'transform';
      nextClone.style.zoom = '1';

      copyScrollPositions(sourceRoot, nextClone);
      removeIgnoredNodes(nextClone);
      viewport.replaceChildren(nextClone);
      cloneRef = nextClone;
    }

    function updateLensPosition(clientX, clientY) {
      if (!cloneRef) {
        return;
      }

      const maxLeft = Math.max(LENS_MARGIN, windowRef.innerWidth - lensSize - LENS_MARGIN);
      const maxTop = Math.max(LENS_MARGIN, windowRef.innerHeight - lensSize - LENS_MARGIN);
      const left = clamp(clientX - lensSize / 2, LENS_MARGIN, maxLeft);
      const top = clamp(clientY - lensSize / 2, LENS_MARGIN, maxTop);
      const targetX = (clientX - sourceRect.left) / sourceZoom;
      const targetY = (clientY - sourceRect.top) / sourceZoom;
      const translateX = lensSize / 2 - targetX * scale;
      const translateY = lensSize / 2 - targetY * scale;

      lens.style.left = `${left}px`;
      lens.style.top = `${top}px`;
      lens.style.opacity = '1';
      cloneRef.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    function schedulePointerUpdate(event) {
      lastPointer = {
        x: event.clientX,
        y: event.clientY
      };

      if (pointerFrame) {
        return;
      }

      pointerFrame = windowRef.requestAnimationFrame(() => {
        pointerFrame = null;
        updateLensPosition(lastPointer.x, lastPointer.y);
      });
    }

    function scheduleRefresh() {
      windowRef.clearTimeout(refreshTimer);
      refreshTimer = windowRef.setTimeout(() => {
        refreshClone();
        updateLensPosition(lastPointer.x, lastPointer.y);
      }, 80);
    }

    refreshClone();
    documentRef.body.appendChild(lens);
    updateLensPosition(lastPointer.x, lastPointer.y);

    windowRef.addEventListener('pointermove', schedulePointerUpdate, { passive: true });
    windowRef.addEventListener('resize', scheduleRefresh);
    documentRef.addEventListener('scroll', scheduleRefresh, true);

    return () => {
      if (pointerFrame) {
        windowRef.cancelAnimationFrame(pointerFrame);
      }

      if (refreshTimer) {
        windowRef.clearTimeout(refreshTimer);
      }

      windowRef.removeEventListener('pointermove', schedulePointerUpdate);
      windowRef.removeEventListener('resize', scheduleRefresh);
      documentRef.removeEventListener('scroll', scheduleRefresh, true);
      lens.remove();
    };
  }, [active, label, lensSize, scale]);

  return null;
}
