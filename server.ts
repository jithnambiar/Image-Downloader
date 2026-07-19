/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Polyfill __dirname and __filename safely for both ES Modules and CommonJS
let _filename = '';
let _dirname = '';

if (typeof __filename === 'string' && __filename) {
  _filename = __filename;
} else {
  try {
    const meta = Function('return import.meta')();
    if (meta && typeof meta.url === 'string') {
      _filename = fileURLToPath(meta.url);
    }
  } catch (e) {
    _filename = '';
  }
}

if (typeof __dirname !== 'undefined') {
  _dirname = __dirname;
} else if (_filename) {
  _dirname = path.dirname(_filename);
} else {
  _dirname = process.cwd();
}

/**
 * Scrapes popular platforms with intelligent extraction techniques.
 * Handles: YouTube, Twitter/X, Instagram, TikTok, Reddit, Pinterest, Facebook.
 */
async function scrapeSpecialPlatforms(targetUrl: string): Promise<{ baseUrl: string; title: string; images: any[] } | null> {
  try {
    // 1. YouTube Thumbnail Extraction
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const ytMatch = targetUrl.match(ytRegex);
    if (ytMatch) {
      const videoId = ytMatch[1];
      const images = [
        {
          id: `yt_${videoId}_max`,
          url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          proxyUrl: `/api/proxy-image?url=${encodeURIComponent(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)}`,
          filename: `youtube_${videoId}_max`,
          extension: 'jpg',
          width: 1280,
          height: 720,
          size: 0,
          mimeType: 'image/jpeg'
        },
        {
          id: `yt_${videoId}_sd`,
          url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
          proxyUrl: `/api/proxy-image?url=${encodeURIComponent(`https://img.youtube.com/vi/${videoId}/sddefault.jpg`)}`,
          filename: `youtube_${videoId}_sd`,
          extension: 'jpg',
          width: 640,
          height: 480,
          size: 0,
          mimeType: 'image/jpeg'
        },
        {
          id: `yt_${videoId}_hq`,
          url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          proxyUrl: `/api/proxy-image?url=${encodeURIComponent(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)}`,
          filename: `youtube_${videoId}_hq`,
          extension: 'jpg',
          width: 480,
          height: 360,
          size: 0,
          mimeType: 'image/jpeg'
        }
      ];
      return {
        baseUrl: targetUrl,
        title: `YouTube Video (ID: ${videoId})`,
        images
      };
    }

    // 2. Reddit JSON Extractor (highly reliable)
    const redditRegex = /reddit\.com\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)/i;
    if (redditRegex.test(targetUrl)) {
      let jsonUrl = targetUrl;
      if (jsonUrl.includes('?')) {
        jsonUrl = jsonUrl.split('?')[0];
      }
      if (jsonUrl.endsWith('/')) {
        jsonUrl = jsonUrl.slice(0, -1);
      }
      jsonUrl += '.json';

      const response = await fetch(jsonUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const postData = data?.[0]?.data?.children?.[0]?.data;
        if (postData) {
          const title = postData.title || 'Reddit Post';
          const images: any[] = [];

          // Try checking for single image URL
          const postUrl = postData.url;
          if (postUrl && /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(postUrl)) {
            const ext = postUrl.split('.').pop()?.split('?')[0] || 'jpg';
            images.push({
              id: `reddit_${postData.id}_primary`,
              url: postUrl,
              proxyUrl: `/api/proxy-image?url=${encodeURIComponent(postUrl)}`,
              filename: `reddit_${postData.id}`,
              extension: ext,
              width: postData.preview?.images?.[0]?.source?.width || 0,
              height: postData.preview?.images?.[0]?.source?.height || 0,
              size: 0,
              mimeType: `image/${ext === 'png' ? 'png' : 'jpeg'}`
            });
          }

          // Try Reddit gallery metadata
          if (postData.media_metadata) {
            Object.keys(postData.media_metadata).forEach((key, index) => {
              const item = postData.media_metadata[key];
              if (item && item.status === 'valid') {
                const imgUrl = item.s?.u || item.s?.gif;
                if (imgUrl) {
                  const cleanImgUrl = imgUrl.replace(/&amp;/g, '&');
                  images.push({
                    id: `reddit_${postData.id}_gallery_${index}`,
                    url: cleanImgUrl,
                    proxyUrl: `/api/proxy-image?url=${encodeURIComponent(cleanImgUrl)}`,
                    filename: `reddit_${postData.id}_gallery_${index + 1}`,
                    extension: 'jpg',
                    width: item.s?.x || 0,
                    height: item.s?.y || 0,
                    size: 0,
                    mimeType: 'image/jpeg'
                  });
                }
              }
            });
          }

          // Fallback to preview images
          if (images.length === 0 && postData.preview?.images) {
            postData.preview.images.forEach((imgObj: any, index: number) => {
              const srcUrl = imgObj.source?.url;
              if (srcUrl) {
                const cleanSrcUrl = srcUrl.replace(/&amp;/g, '&');
                images.push({
                  id: `reddit_${postData.id}_preview_${index}`,
                  url: cleanSrcUrl,
                  proxyUrl: `/api/proxy-image?url=${encodeURIComponent(cleanSrcUrl)}`,
                  filename: `reddit_${postData.id}_preview`,
                  extension: 'jpg',
                  width: imgObj.source?.width || 0,
                  height: imgObj.source?.height || 0,
                  size: 0,
                  mimeType: 'image/jpeg'
                });
              }
            });
          }

          if (images.length > 0) {
            return {
              baseUrl: targetUrl,
              title: `Reddit - ${title}`,
              images
            };
          }
        }
      }
    }

    // 3. Twitter / X via fxtwitter
    const twitterRegex = /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)/i;
    const twitterMatch = targetUrl.match(twitterRegex);
    if (twitterMatch) {
      const username = twitterMatch[1];
      const statusId = twitterMatch[2];

      const fxUrl = `https://fxtwitter.com/${username}/status/${statusId}`;
      const response = await fetch(fxUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });

      if (response.ok) {
        const html = await response.text();
        const images: any[] = [];
        const imageUrls = new Set<string>();

        // Find og:image meta tags
        const metaRegex = /<meta\s+[^>]*?(?:property|name)\s*=\s*["']og:image(?::\d+)?["'][^>]*?content\s*=\s*["']([^"'>]+)/gi;
        let match;
        while ((match = metaRegex.exec(html)) !== null) {
          if (match[1]) imageUrls.add(match[1]);
        }

        const metaRegexRev = /<meta\s+[^>]*?content\s*=\s*["']([^"'>]+)["'][^>]*?(?:property|name)\s*=\s*["']og:image(?::\d+)?["']/gi;
        while ((match = metaRegexRev.exec(html)) !== null) {
          if (match[1]) imageUrls.add(match[1]);
        }

        const twitterImgRegex = /<meta\s+[^>]*?(?:property|name)\s*=\s*["']twitter:image(?::\d+)?["'][^>]*?content\s*=\s*["']([^"'>]+)/gi;
        while ((match = twitterImgRegex.exec(html)) !== null) {
          if (match[1]) imageUrls.add(match[1]);
        }

        const twimgRegex = /https:\/\/pbs\.twimg\.com\/media\/[a-zA-Z0-9_-]+\?format=[a-zA-Z0-9]+&name=[a-zA-Z0-9_]+/gi;
        while ((match = twimgRegex.exec(html)) !== null) {
          imageUrls.add(match[0]);
        }

        const resolvedUrls = Array.from(imageUrls);
        resolvedUrls.forEach((url, index) => {
          const cleanUrl = url.replace(/&amp;/g, '&').trim();
          let highResUrl = cleanUrl;
          if (highResUrl.includes('pbs.twimg.com/media/')) {
            if (highResUrl.includes('&name=')) {
              highResUrl = highResUrl.replace(/&name=[a-zA-Z0-9_]+/g, '&name=large');
            } else if (highResUrl.includes('?format=')) {
              highResUrl += '&name=large';
            }
          }

          images.push({
            id: `twitter_${statusId}_${index}`,
            url: highResUrl,
            proxyUrl: `/api/proxy-image?url=${encodeURIComponent(highResUrl)}`,
            filename: `twitter_${username}_${statusId}_${index + 1}`,
            extension: cleanUrl.includes('format=png') ? 'png' : 'jpg',
            width: 0,
            height: 0,
            size: 0,
            mimeType: cleanUrl.includes('format=png') ? 'image/png' : 'image/jpeg'
          });
        });

        if (images.length > 0) {
          return {
            baseUrl: targetUrl,
            title: `Twitter / X Post by @${username}`,
            images
          };
        }
      }
    }

    // 4. Instagram Post & Reels
    const instaRegex = /(?:instagram\.com)\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i;
    const instaMatch = targetUrl.match(instaRegex);
    if (instaMatch) {
      const code = instaMatch[1];
      const images: any[] = [];

      const embedUrl = `https://www.instagram.com/p/${code}/embed/`;
      const response = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        }
      });

      if (response.ok) {
        const html = await response.text();
        const imageUrls = new Set<string>();

        const metaRegex = /<meta\s+[^>]*?(?:property|name)\s*=\s*["']og:image["'][^>]*?content\s*=\s*["']([^"'>]+)/gi;
        let match;
        while ((match = metaRegex.exec(html)) !== null) {
          if (match[1]) imageUrls.add(match[1]);
        }

        const embedImgRegex = /<img\s+[^>]*?class\s*=\s*["']EmbeddedMediaImage["'][^>]*?src\s*=\s*["']([^"'>]+)/gi;
        while ((match = embedImgRegex.exec(html)) !== null) {
          if (match[1]) imageUrls.add(match[1]);
        }

        const displayUrlRegex = /"display_url"\s*:\s*["']([^"']+)["']/gi;
        while ((match = displayUrlRegex.exec(html)) !== null) {
          if (match[1]) {
            const decoded = match[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, grp) => 
              String.fromCharCode(parseInt(grp, 16))
            );
            imageUrls.add(decoded);
          }
        }

        imageUrls.add(`https://www.instagram.com/p/${code}/media/?size=l`);

        const resolvedUrls = Array.from(imageUrls);
        resolvedUrls.forEach((url, index) => {
          const cleanUrl = url.replace(/&amp;/g, '&').trim();
          images.push({
            id: `instagram_${code}_${index}`,
            url: cleanUrl,
            proxyUrl: `/api/proxy-image?url=${encodeURIComponent(cleanUrl)}`,
            filename: `instagram_${code}_${index === 0 ? 'primary' : index}`,
            extension: 'jpg',
            width: 0,
            height: 0,
            size: 0,
            mimeType: 'image/jpeg'
          });
        });

        if (images.length > 0) {
          return {
            baseUrl: targetUrl,
            title: `Instagram Post (${code})`,
            images
          };
        }
      }

      // Fallback
      const fallbackUrl = `https://www.instagram.com/p/${code}/media/?size=l`;
      images.push({
        id: `instagram_${code}_fallback`,
        url: fallbackUrl,
        proxyUrl: `/api/proxy-image?url=${encodeURIComponent(fallbackUrl)}`,
        filename: `instagram_${code}_image`,
        extension: 'jpg',
        width: 1080,
        height: 1080,
        size: 0,
        mimeType: 'image/jpeg'
      });

      return {
        baseUrl: targetUrl,
        title: `Instagram Post (${code})`,
        images
      };
    }

    // 5. TikTok via oEmbed
    const tiktokRegex = /(?:tiktok\.com)\/(@[a-zA-Z0-9_.-]+)\/video\/(\d+)/i;
    const tiktokMatch = targetUrl.match(tiktokRegex);
    const tiktokShortRegex = /(?:vm\.tiktok\.com|vt\.tiktok\.com)\/([a-zA-Z0-9]+)/i;
    const tiktokShortMatch = targetUrl.match(tiktokShortRegex);

    if (tiktokMatch || tiktokShortMatch) {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(targetUrl)}`;
      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const coverUrl = data.thumbnail_url;
        const author = data.author_name || 'TikTok Creator';

        if (coverUrl) {
          return {
            baseUrl: targetUrl,
            title: `TikTok by ${author}`,
            images: [
              {
                id: `tiktok_${Date.now()}_cover`,
                url: coverUrl,
                proxyUrl: `/api/proxy-image?url=${encodeURIComponent(coverUrl)}`,
                filename: `tiktok_${author.replace(/\s+/g, '_')}_cover`,
                extension: 'jpg',
                width: data.thumbnail_width || 1080,
                height: data.thumbnail_height || 1920,
                size: 0,
                mimeType: 'image/jpeg'
              }
            ]
          };
        }
      }
    }

    // 6. Pinterest PIN details
    const pinRegex = /(?:pinterest\.com|pin\.it)\/(?:pin\/(\d+)|([a-zA-Z0-9_-]+))/i;
    if (pinRegex.test(targetUrl)) {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });

      if (response.ok) {
        const html = await response.text();
        const imageUrls = new Set<string>();

        const metaRegex = /<meta\s+[^>]*?(?:property|name)\s*=\s*["']og:image["'][^>]*?content\s*=\s*["']([^"'>]+)/gi;
        let match;
        while ((match = metaRegex.exec(html)) !== null) {
          if (match[1]) imageUrls.add(match[1]);
        }

        const metaRegexRev = /<meta\s+[^>]*?content\s*=\s*["']([^"'>]+)["'][^>]*?(?:property|name)\s*=\s*["']og:image["']/gi;
        while ((match = metaRegexRev.exec(html)) !== null) {
          if (match[1]) imageUrls.add(match[1]);
        }

        const originalsRegex = /(https:\/\/i\.pinimg\.com\/originals\/[a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+)/gi;
        while ((match = originalsRegex.exec(html)) !== null) {
          imageUrls.add(match[1]);
        }

        const pinImgRegex = /(https:\/\/i\.pinimg\.com\/736x\/[a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+)/gi;
        while ((match = pinImgRegex.exec(html)) !== null) {
          imageUrls.add(match[1]);
        }

        const images = Array.from(imageUrls).map((url, index) => {
          const cleanUrl = url.replace(/&amp;/g, '&').trim();
          const ext = cleanUrl.split('.').pop()?.split('?')[0] || 'jpg';
          return {
            id: `pinterest_pin_${index}`,
            url: cleanUrl,
            proxyUrl: `/api/proxy-image?url=${encodeURIComponent(cleanUrl)}`,
            filename: `pinterest_pin_${index + 1}`,
            extension: ext,
            width: 0,
            height: 0,
            size: 0,
            mimeType: `image/${ext === 'png' ? 'png' : 'jpeg'}`
          };
        });

        if (images.length > 0) {
          return {
            baseUrl: targetUrl,
            title: 'Pinterest Pin',
            images
          };
        }
      }
    }

    // 7. Facebook Media
    const fbRegex = /(?:facebook\.com|fb\.watch)/i;
    if (fbRegex.test(targetUrl)) {
      const mUrl = targetUrl.replace('www.facebook.com', 'm.facebook.com');
      const response = await fetch(mUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });
      if (response.ok) {
        const html = await response.text();
        const imageUrls = new Set<string>();
        const metaRegex = /<meta\s+[^>]*?(?:property|name)\s*=\s*["']og:image["'][^>]*?content\s*=\s*["']([^"'>]+)/gi;
        let match;
        while ((match = metaRegex.exec(html)) !== null) {
          if (match[1]) imageUrls.add(match[1]);
        }
        const resolvedImages = Array.from(imageUrls).map((url, index) => {
          const cleanUrl = url.replace(/&amp;/g, '&').trim();
          return {
            id: `facebook_${Date.now()}_${index}`,
            url: cleanUrl,
            proxyUrl: `/api/proxy-image?url=${encodeURIComponent(cleanUrl)}`,
            filename: `facebook_image_${index + 1}`,
            extension: 'jpg',
            width: 0,
            height: 0,
            size: 0,
            mimeType: 'image/jpeg'
          };
        });
        if (resolvedImages.length > 0) {
          return {
            baseUrl: targetUrl,
            title: 'Facebook Media',
            images: resolvedImages
          };
        }
      }
    }

  } catch (err) {
    console.warn('Error in scrapeSpecialPlatforms helper:', err);
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));

  // Enable CORS headers for API endpoints
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
  });

  // API endpoint: Scrape images from a URL
  app.get('/api/scrape', async (req, res) => {
    const targetUrl = req.query.url as string;

    if (!targetUrl) {
      res.status(400).json({ error: 'URL parameter is required.' });
      return;
    }

    try {
      // Validate URL format
      let parsedBaseUrl: URL;
      try {
        parsedBaseUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
      } catch (err) {
        res.status(400).json({ error: 'Invalid URL format.' });
        return;
      }

      // Check for popular social platforms and scrape via specialized techniques
      const specialData = await scrapeSpecialPlatforms(parsedBaseUrl.href);
      if (specialData) {
        res.json(specialData);
        return;
      }

      const chromeHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cookie': 'gdpr_consent=true; consent=true; cookies.accepted=true; cookieconsent_status=allow; gdpr=accept; notice_gdpr_prefs=1; cookie-consent=true; accept-cookies=true;'
      };

      let html = '';
      let fetchSuccess = false;
      let errorDetails = '';

      const isValidHtml = (text: string): boolean => {
        if (!text || text.trim().length < 50) return false;
        const lower = text.toLowerCase().trim();
        if (lower.startsWith('{"error":') || lower.startsWith('{"message":')) return false;
        if (lower.startsWith('error:') || lower.startsWith('typeerror:')) return false;
        return true;
      };

      // Define standard proxy templates to rotate through on block
      const scraperPipeline = [
        {
          name: 'Direct Fetch (with Consent Simulation)',
          type: 'direct',
          fetchFn: async () => {
            const response = await fetch(parsedBaseUrl.href, {
              headers: chromeHeaders,
              redirect: 'follow'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
            return await response.text();
          }
        },
        {
          name: 'Direct Fetch (Minimal User-Agent)',
          type: 'direct',
          fetchFn: async () => {
            const response = await fetch(parsedBaseUrl.href, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
              },
              redirect: 'follow'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
            return await response.text();
          }
        },
        {
          name: 'CorsProxy.io (Dynamic Routing)',
          type: 'proxy',
          fetchFn: async () => {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(parsedBaseUrl.href)}`;
            const response = await fetch(proxyUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
          }
        },
        {
          name: 'CorsProxy.org Service',
          type: 'proxy',
          fetchFn: async () => {
            const proxyUrl = `https://corsproxy.org/?url=${encodeURIComponent(parsedBaseUrl.href)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
          }
        },
        {
          name: 'YaCDN Bypass Proxy',
          type: 'proxy',
          fetchFn: async () => {
            const proxyUrl = `https://yacdn.org/proxy/${parsedBaseUrl.href}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
          }
        },
        {
          name: 'CodeTabs Web Scraper Proxy',
          type: 'proxy',
          fetchFn: async () => {
            const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(parsedBaseUrl.href)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
          }
        },
        {
          name: 'AllOrigins JSON Proxy Wrapper',
          type: 'json',
          fetchFn: async () => {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(parsedBaseUrl.href)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data && typeof data.contents === 'string') {
              return data.contents;
            }
            throw new Error('AllOrigins returned empty content or invalid payload');
          }
        },
        {
          name: 'ThingProxy Resource Gateway',
          type: 'proxy',
          fetchFn: async () => {
            const proxyUrl = `https://thingproxy.freeboard.io/fetch/${parsedBaseUrl.href}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
          }
        }
      ];

      for (const step of scraperPipeline) {
        try {
          console.log(`[Scraper] Attempting: ${step.name}`);
          const content = await step.fetchFn();
          if (isValidHtml(content)) {
            html = content;
            fetchSuccess = true;
            console.log(`[Scraper] Success via ${step.name} (length: ${content.length})`);
            break;
          } else {
            console.warn(`[Scraper] ${step.name} returned invalid HTML payload`);
          }
        } catch (err: any) {
          console.warn(`[Scraper] Failed step ${step.name}: ${err.message}`);
          errorDetails += `[${step.name}: ${err.message}] `;
        }
      }

      if (!fetchSuccess) {
        res.status(403).json({ 
          error: `Failed to fetch target URL: ${errorDetails || 'All proxies blocked.'} Please verify the website URL or try another domain.` 
        });
        return;
      }
      const imageUrls = new Set<string>();

      // 1. Find standard img tags (src, data-src, data-lazy, etc.)
      const imgRegex = /<img\s+[^>]*?(?:src|data-src|data-lazy|data-original|srcset)\s*=\s*["']([^"'\s>]+)/gi;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        if (match[1]) imageUrls.add(match[1]);
      }

      // 2. Find srcset elements separately (to get multiple resolutions)
      const srcsetRegex = /(?:srcset|data-srcset)\s*=\s*["']([^"']+)/gi;
      while ((match = srcsetRegex.exec(html)) !== null) {
        const parts = match[1].split(',');
        for (const part of parts) {
          const urlPart = part.trim().split(/\s+/)[0];
          if (urlPart) imageUrls.add(urlPart);
        }
      }

      // 3. Find background images in CSS or style attributes
      const cssBgRegex = /url\(['"]?([^'"()]+)['"]?\)/gi;
      while ((match = cssBgRegex.exec(html)) !== null) {
        if (match[1] && !match[1].startsWith('data:')) {
          imageUrls.add(match[1]);
        }
      }

      // 4. Find link icons
      const linkIconRegex = /<link\s+[^>]*?rel\s*=\s*["'](?:shortcut\s+)?icon["'][^>]*?href\s*=\s*["']([^"'>]+)/gi;
      while ((match = linkIconRegex.exec(html)) !== null) {
        if (match[1]) imageUrls.add(match[1]);
      }

      // 5. Find meta og:image tags
      const metaImageRegex = /<meta\s+[^>]*?(?:property|name)\s*=\s*["']og:image["'][^>]*?content\s*=\s*["']([^"'>]+)/gi;
      while ((match = metaImageRegex.exec(html)) !== null) {
        if (match[1]) imageUrls.add(match[1]);
      }
      const metaImageRegexRev = /<meta\s+[^>]*?content\s*=\s*["']([^"'>]+)["'][^>]*?(?:property|name)\s*=\s*["']og:image["']/gi;
      while ((match = metaImageRegexRev.exec(html)) !== null) {
        if (match[1]) imageUrls.add(match[1]);
      }

      // 6. Generic high-resolution image URL extraction (handles JSON data, script blocks, lazy datasets)
      const genericImageRegex = /(?:"|')([^"'\s>]+?\.(?:jpg|jpeg|png|webp|avif|svg)(?:\?[^"'\s>]+?)?)(?:"|')/gi;
      while ((match = genericImageRegex.exec(html)) !== null) {
        if (match[1] && !match[1].startsWith('data:')) {
          imageUrls.add(match[1]);
        }
      }

      // Format and resolve all relative URLs
      const resolvedImages = Array.from(imageUrls)
        .map(url => {
          let cleanUrl = url.replace(/&amp;/g, '&').trim();
          try {
            // Check if it's already a data URI
            if (cleanUrl.startsWith('data:')) {
              return null;
            }
            const absoluteUrl = new URL(cleanUrl, parsedBaseUrl.href).href;
            
            // Extract a reasonable filename
            const urlPath = new URL(absoluteUrl).pathname;
            let filename = urlPath.substring(urlPath.lastIndexOf('/') + 1);
            if (!filename || filename.indexOf('.') === -1) {
              filename = `image_${Math.random().toString(36).substring(2, 7)}`;
            }

            // Extract extension
            let extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
            if (extension.includes('?')) {
              extension = extension.split('?')[0];
            }
            if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'avif'].includes(extension)) {
              extension = 'png'; // default fallback
            }

            // Strip extension for base filename
            let baseFilename = filename;
            if (filename.includes('.')) {
              baseFilename = filename.substring(0, filename.lastIndexOf('.'));
            }

            return {
              id: Math.random().toString(36).substring(2, 11),
              url: absoluteUrl,
              proxyUrl: `/api/proxy-image?url=${encodeURIComponent(absoluteUrl)}`,
              filename: baseFilename || 'image',
              extension: extension || 'png',
              width: 0, // Client side will compute
              height: 0, // Client side will compute
              size: 0, // Client side or HEAD request will fetch
              mimeType: `image/${extension === 'jpg' ? 'jpeg' : extension}`
            };
          } catch (err) {
            return null;
          }
        })
        .filter(Boolean);

      res.json({
        baseUrl: parsedBaseUrl.href,
        title: parsedBaseUrl.hostname,
        images: resolvedImages
      });
    } catch (error: any) {
      console.error('Scraping error:', error);
      res.status(500).json({ error: `Failed to scrape website: ${error.message}` });
    }
  });

  // API endpoint: CORS proxy for images
  app.get('/api/proxy-image', async (req, res) => {
    const imageUrl = req.query.url as string;

    if (!imageUrl) {
      res.status(400).json({ error: 'URL parameter is required.' });
      return;
    }

    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'image/*'
        }
      });

      if (!response.ok) {
        res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` });
        return;
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const contentLength = response.headers.get('content-length');

      res.setHeader('Content-Type', contentType);
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error('Image proxy error:', error);
      res.status(500).json({ error: `Image proxy failed: ${error.message}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
