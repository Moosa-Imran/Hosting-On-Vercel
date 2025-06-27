// File: api/trustpilot.js

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const targetURL = 'https://www.trustpilot.com/review/transcriptdownloader.com';
    const response = await fetch(targetURL);
    const html = await response.text();

    const dom = new JSDOM(html);
    const scriptTags = dom.window.document.querySelectorAll('script[type="application/ld+json"]');

    let rating = null;
    let reviewCount = null;

    for (const script of scriptTags) {
      try {
        const json = JSON.parse(script.textContent);
        const graph = json['@graph'];
        if (Array.isArray(graph)) {
          for (const item of graph) {
            if (item.aggregateRating) {
              rating = item.aggregateRating.ratingValue;
              reviewCount = item.aggregateRating.reviewCount;
              break;
            }
          }
        }
      } catch (e) {
        continue;
      }

      if (rating && reviewCount) break;
    }

    if (!rating || !reviewCount) {
      return res.status(500).json({ error: 'Rating not found' });
    }

    res.status(200).json({
      ratingValue: rating,
      reviewCount: reviewCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching or parsing Trustpilot page' });
  }
}
