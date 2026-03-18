// ============================================================
// Asset Extractor — SVG, images, fonts, icons
// ============================================================

import { ICON_FONT_PREFIXES, GOOGLE_FONTS_PATTERN } from '@/shared/constants';
import type { AssetInfo } from '@/shared/types';

/**
 * Extract all assets referenced by or contained in an element.
 */
export function extractAssets(element: Element): AssetInfo[] {
  const assets: AssetInfo[] = [];

  // SVG
  if (element.tagName.toLowerCase() === 'svg') {
    assets.push(extractSVG(element));
  } else {
    // Check for inline SVG children
    const svgs = element.querySelectorAll('svg');
    for (const svg of svgs) {
      assets.push(extractSVG(svg));
    }
  }

  // Images
  if (element.tagName.toLowerCase() === 'img') {
    assets.push(extractImage(element as HTMLImageElement));
  } else {
    const images = element.querySelectorAll('img');
    for (const img of images) {
      assets.push(extractImage(img));
    }
  }

  // Background images
  const bgImage = getComputedStyle(element).backgroundImage;
  if (bgImage && bgImage !== 'none') {
    assets.push({
      type: 'background-image',
      value: bgImage,
      meta: {
        backgroundSize: getComputedStyle(element).backgroundSize,
        backgroundPosition: getComputedStyle(element).backgroundPosition,
      },
    });
  }

  // Icon fonts
  const iconAsset = detectIconFont(element);
  if (iconAsset) assets.push(iconAsset);

  return assets;
}

function extractSVG(svg: Element): AssetInfo {
  // Resolve <use> references
  const uses = svg.querySelectorAll('use');
  for (const use of uses) {
    const href = use.getAttribute('href') || use.getAttribute('xlink:href');
    if (href && href.startsWith('#')) {
      const referenced = document.querySelector(href);
      if (referenced) {
        const clone = referenced.cloneNode(true) as Element;
        use.replaceWith(clone);
      }
    }
  }

  const serialized = new XMLSerializer().serializeToString(svg);
  const viewBox = svg.getAttribute('viewBox') || '';
  const width = svg.getAttribute('width') || getComputedStyle(svg).width;
  const height = svg.getAttribute('height') || getComputedStyle(svg).height;

  return {
    type: 'svg',
    value: serialized,
    meta: { viewBox, width, height },
  };
}

function extractImage(img: HTMLImageElement): AssetInfo {
  const rect = img.getBoundingClientRect();
  return {
    type: 'image',
    value: img.src,
    meta: {
      alt: img.alt || '',
      srcset: img.srcset || '',
      sizes: img.sizes || '',
      naturalWidth: String(img.naturalWidth),
      naturalHeight: String(img.naturalHeight),
      displayWidth: String(Math.round(rect.width)),
      displayHeight: String(Math.round(rect.height)),
      loading: img.loading || '',
    },
  };
}

function detectIconFont(element: Element): AssetInfo | null {
  const classes = element.className;
  if (typeof classes !== 'string') return null;

  for (const prefix of ICON_FONT_PREFIXES) {
    if (classes.includes(prefix)) {
      return {
        type: 'icon-font',
        value: classes,
        meta: {
          library: prefix.replace(/-$/, '').replace(/ $/, ''),
          textContent: element.textContent?.trim() || '',
        },
      };
    }
  }

  return null;
}

/**
 * Extract font information from an element
 */
export function extractFontInfo(element: Element): {
  family: string;
  size: string;
  weight: string;
  lineHeight: string;
  letterSpacing: string;
  isGoogleFont: boolean;
} {
  const computed = getComputedStyle(element);

  // Check if any Google Fonts are loaded
  let isGoogleFont = false;
  try {
    for (const sheet of document.styleSheets) {
      if (sheet.href && GOOGLE_FONTS_PATTERN.test(sheet.href)) {
        isGoogleFont = true;
        break;
      }
    }
  } catch {
    // Cross-origin
  }

  // Also check link elements
  if (!isGoogleFont) {
    const links = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    isGoogleFont = links.length > 0;
  }

  return {
    family: computed.fontFamily,
    size: computed.fontSize,
    weight: computed.fontWeight,
    lineHeight: computed.lineHeight,
    letterSpacing: computed.letterSpacing !== 'normal' ? computed.letterSpacing : '',
    isGoogleFont,
  };
}
